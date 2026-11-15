"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  HelpCircle,
  Lightbulb,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { KatexText } from "@/components/katex-text";
import { MarkdownLite } from "@/components/study-guide/markdown-lite";
import { ScratchPad } from "@/components/quiz/scratch-pad";
import { Whiteboard } from "@/components/quiz/whiteboard";
import { cn } from "@/lib/utils";

interface PlayQuestion {
  id: string;
  type: "MCQ" | "SHORT_ANSWER" | "WRITTEN";
  prompt: string;
  imageUrl: string | null;
  options: { key: string; text: string }[] | null;
  points: number;
}
interface PlaySet {
  id: string;
  title: string;
  description: string | null;
  subjectName: string;
  subjectCode: string;
  subjectColor: string;
  topicTitle: string | null;
  difficulty: string;
  recommendedMinutes: number;
  revealMode: "AFTER_EACH" | "AFTER_SUBMIT";
  questions: PlayQuestion[];
}

interface AnswerState {
  selectedKeys?: string[];
  text?: string;
  tex?: string;
  finalAnswer?: string;
  sketchKey?: string | null;
  flagged?: boolean;
  confidence?: "SURE" | "GUESS" | null;
}

interface FeedbackState {
  isCorrect: boolean;
  correctKey?: string | null;
  finalAnswer?: string | null;
  explanation?: string | null;
}

const formatClock = (sec: number) => {
  const s = Math.max(0, sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`
    : `${m}:${String(ss).padStart(2, "0")}`;
};

/** หน้าทำข้อสอบ: โหมดฝึกซ้อมเฉลยทันที vs โหมดสอบจริง, autosave แบบ debounce, ปักธง, จำตำแหน่งข้อ, ส่งคำตอบ */
export function QuizRunner({
  set,
  retrySessionId,
  retrySourceAttemptId,
  initialMode = "PRACTICE",
  explanationsMap,
}: {
  set: PlaySet;
  retrySessionId?: string | null;
  retrySourceAttemptId?: string | null;
  initialMode?: "EXAM" | "PRACTICE";
  explanationsMap?: Record<string, { correctKey: string; explanation: string }>;
}) {
  const router = useRouter();
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [quizMode, setQuizMode] = useState<"EXAM" | "PRACTICE">(initialMode);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [revealedFeedback, setRevealedFeedback] = useState<Record<string, FeedbackState>>({});
  const [current, setCurrent] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [perQuestionCorrect, setPerQuestionCorrect] = useState<Record<string, boolean>>({});
  const hydratedRef = useRef(false);
  // ภาพกระดานที่ยังไม่ได้อัปโหลด — จะส่งตอนกด "ส่งคำตอบ" ครั้งเดียว (ไม่หน่วงตอนเขียน)
  const pendingSketches = useRef<Record<string, string>>({});
  // คิว autosave แบบ debounce ต่อข้อ (ลด request ตอนพิมพ์)
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const pendingPatches = useRef<Record<string, AnswerState>>({});
  const attemptIdRef = useRef<string | null>(null);
  const q = set.questions[current];

  // สลับโหมดการทำข้อสอบ (ฝึกซ้อม vs สอบจริง)
  const handleModeChange = (newMode: "EXAM" | "PRACTICE") => {
    setQuizMode(newMode);
    toast.success(
      newMode === "PRACTICE"
        ? "💡 โหมดฝึกซ้อม: ตอบปุ๊บรู้ผลทันที พร้อมคำอธิบายจุดหลอกข้อต่อข้อ"
        : "🎯 โหมดสอบจริง: จับเวลา ซ่อนเฉลยระหว่างทำ รวมคะแนนเมื่อส่ง"
    );
    if (attemptIdRef.current && q) {
      void fetch(`/api/attempts/${attemptIdRef.current}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: q.id, mode: newMode }),
      }).catch(() => undefined);
    }
  };

  // เริ่ม/กลับมาทำ attempt — ลองซ้ำอัตโนมัติเมื่อเครือข่าย/เซิร์ฟเวอร์ขัดข้องชั่วคราว
  useEffect(() => {
    let cancelled = false;
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    (async () => {
      let id: string | null = null;
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          const res = await fetch("/api/attempts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              setId: set.id,
              mode: quizMode,
              retrySessionId: retrySessionId ?? null,
            }),
          });
          const json = await res.json();
          if (cancelled) return;
          if (json.ok) {
            id = json.data.attemptId as string;
            break;
          }
          if (res.status >= 500 && attempt < 3) {
            await delay(700 * (attempt + 1));
            continue;
          }
          toast.error(json.error ?? "เริ่มข้อสอบไม่สำเร็จ");
          return;
        } catch {
          if (attempt < 3) {
            await delay(700 * (attempt + 1));
            continue;
          }
          if (!cancelled) toast.error("เครือข่ายขัดข้อง — รีเฟรชหน้าเพื่อลองใหม่");
          return;
        }
      }
      if (cancelled || !id) return;
      attemptIdRef.current = id;
      setAttemptId(id);

      // ส่งคำตอบที่ผู้ใช้ตอบค้างไว้ระหว่างรอเชื่อมต่อ (ถ้ามี)
      const queued = Object.entries(pendingPatches.current);
      for (const [qid, patch] of queued) {
        delete pendingPatches.current[qid];
        fetch(`/api/attempts/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId: qid, mode: quizMode, ...patch }),
        }).catch(() => undefined);
      }

      // ดึงคำตอบที่ autosave ไว้ (ทำต่อจากที่ค้าง)
      const r2 = await fetch(`/api/attempts/${id}`);
      const j2 = await r2.json();
      if (j2.ok && !hydratedRef.current) {
        hydratedRef.current = true;
        if (j2.data.mode) {
          setQuizMode(j2.data.mode);
        }
        const saved: Record<string, AnswerState> = {};
        const savedFeedback: Record<string, FeedbackState> = {};
        for (const a of j2.data.answers ?? []) {
          const ans = (a.answer ?? {}) as AnswerState;
          if (Object.keys(ans).length > 0 || a.flagged || a.confidence) {
            saved[a.questionId] = {
              selectedKeys: ans.selectedKeys,
              text: ans.text,
              tex: ans.tex,
              finalAnswer: ans.finalAnswer,
              sketchKey: a.sketchKey,
              flagged: a.flagged,
              confidence: a.confidence,
            };
          }
          if (a.isCorrect !== undefined && a.isCorrect !== null) {
            setPerQuestionCorrect((prev) => ({ ...prev, [a.questionId]: a.isCorrect }));
            savedFeedback[a.questionId] = {
              isCorrect: a.isCorrect,
              correctKey: a.correctKey,
              finalAnswer: a.finalAnswer,
              explanation: a.explanation,
            };
          }
        }
        if (Object.keys(saved).length > 0) setAnswers(saved);
        if (Object.keys(savedFeedback).length > 0) setRevealedFeedback(savedFeedback);

        // กลับไปข้อที่ทำค้าง
        try {
          const savedIdx = Number(localStorage.getItem(`fep_idx:${set.id}`));
          if (Number.isFinite(savedIdx) && savedIdx > 0 && savedIdx < set.questions.length) {
            setCurrent(savedIdx);
          }
        } catch {
          /* localStorage ใช้ไม่ได้ — ข้าม */
        }
        const startedAt = j2.data.startedAt ? new Date(j2.data.startedAt).getTime() : Date.now();
        const usedSec = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
        setElapsed(usedSec);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set.id]);

  // จำตำแหน่งข้อปัจจุบัน
  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      localStorage.setItem(`fep_idx:${set.id}`, String(current));
    } catch {
      /* ข้าม */
    }
  }, [current, set.id]);

  // ตัวจับเวลา
  useEffect(() => {
    const t = setInterval(() => {
      setElapsed((s) => s + 1);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  /** อัปโหลดภาพกระดานที่ค้างไว้ */
  async function flushPendingSketches() {
    const entries = Object.entries(pendingSketches.current);
    await Promise.all(
      entries.map(async ([questionId, dataUrl]) => {
        try {
          const blob = await (await fetch(dataUrl)).blob();
          const form = new FormData();
          form.append("file", new File([blob], "sketch.png", { type: "image/png" }));
          const up = await fetch("/api/uploads", { method: "POST", body: form });
          const upJson = await up.json();
          if (upJson.ok) {
            delete pendingSketches.current[questionId];
            await fetch(`/api/attempts/${attemptIdRef.current}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ questionId, sketchKey: upJson.data.key }),
            });
          }
        } catch {
          // อัปโหลดไม่สำเร็จ
        }
      }),
    );
  }

  const submit = useCallback(
    async (auto = false) => {
      if (submitting) return;
      if (!attemptId) {
        toast.error("กำลังเชื่อมต่อเซิร์ฟเวอร์ — รอสักครู่แล้วกดส่งอีกครั้ง");
        return;
      }
      if (!auto) {
        const unanswered = set.questions.filter((qq) => {
          const a = answers[qq.id];
          const has =
            a &&
            ((a.selectedKeys?.length ?? 0) > 0 ||
              Boolean(a.text?.trim()) ||
              Boolean(a.finalAnswer?.trim()));
          return !has;
        });
        if (unanswered.length > 0 && !confirmSubmit) {
          setConfirmSubmit(true);
          return;
        }
      }
      setSubmitting(true);
      setConfirmSubmit(false);
      try {
        await flushPendingSketches();
        await Promise.all(
          Object.keys(pendingPatches.current).map((qid) => {
            const merged = pendingPatches.current[qid];
            delete pendingPatches.current[qid];
            return fetch(`/api/attempts/${attemptId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ questionId: qid, mode: quizMode, ...merged }),
            }).catch(() => undefined);
          }),
        );
        const res = await fetch(`/api/attempts/${attemptId}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ durationSec: elapsed }),
        });
        const json = await res.json();
        if (json.ok) {
          router.push(`/quiz/${set.id}/result/${attemptId}`);
        } else {
          toast.error(json.error ?? "ส่งคำตอบไม่สำเร็จ");
          setSubmitting(false);
        }
      } catch {
        toast.error("เครือข่ายขัดข้อง ลองส่งอีกครั้ง");
        setSubmitting(false);
      }
    },
    [attemptId, submitting, set.questions, answers, confirmSubmit, elapsed, router, set.id, quizMode],
  );

  const saveAnswer = useCallback(
    (questionId: string, patch: AnswerState, immediate = true) => {
      setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], ...patch } }));

      // ในโหมดฝึกซ้อม หรือ revealMode === AFTER_EACH: ถ้ามี explanationsMap ให้เฉลยทันที (0ms latency)
      const isPractice = quizMode === "PRACTICE" || set.revealMode === "AFTER_EACH";
      if (isPractice && patch.selectedKeys && patch.selectedKeys.length > 0) {
        const selectedKey = patch.selectedKeys[0];
        const local = explanationsMap?.[questionId];
        if (local) {
          const isRight = local.correctKey === selectedKey;
          setPerQuestionCorrect((prev) => ({ ...prev, [questionId]: isRight }));
          setRevealedFeedback((prev) => ({
            ...prev,
            [questionId]: {
              isCorrect: isRight,
              correctKey: local.correctKey,
              explanation: local.explanation,
            },
          }));
        }
      }

      pendingPatches.current[questionId] = {
        ...(pendingPatches.current[questionId] ?? {}),
        ...patch,
      };

      const send = async () => {
        const id = attemptIdRef.current;
        if (!id) return;
        const merged = pendingPatches.current[questionId];
        if (!merged) return;
        delete pendingPatches.current[questionId];
        try {
          const res = await fetch(`/api/attempts/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ questionId, mode: quizMode, ...merged }),
          });
          const json = await res.json();
          if (json.ok && json.data) {
            if (json.data.isCorrect !== null && json.data.isCorrect !== undefined) {
              setPerQuestionCorrect((prev) => ({ ...prev, [questionId]: json.data.isCorrect }));
              setRevealedFeedback((prev) => ({
                ...prev,
                [questionId]: {
                  isCorrect: json.data.isCorrect,
                  correctKey: json.data.correctKey ?? prev[questionId]?.correctKey,
                  finalAnswer: json.data.finalAnswer ?? prev[questionId]?.finalAnswer,
                  explanation: json.data.explanation ?? prev[questionId]?.explanation,
                },
              }));
            }
          }
        } catch {
          // autosave ล้มเหลวชั่วคราว
        }
      };

      const timer = saveTimers.current[questionId];
      if (timer) clearTimeout(timer);
      if (immediate) {
        delete saveTimers.current[questionId];
        void send();
      } else {
        saveTimers.current[questionId] = setTimeout(send, 500);
      }
    },
    [quizMode, set.revealMode, explanationsMap],
  );

  const answeredCount = useMemo(
    () =>
      set.questions.filter((qq) => {
        const a = answers[qq.id];
        return (
          a &&
          ((a.selectedKeys?.length ?? 0) > 0 ||
            Boolean(a.text?.trim()) ||
            Boolean(a.finalAnswer?.trim()))
        );
      }).length,
    [set.questions, answers],
  );

  // คีย์ลัดสำหรับการทำข้อสอบแบบลื่นไหล: 1-4 หรือ A-D ตอบข้อสอบ, ลูกศร ซ้าย-ขวา เลื่อนข้อ, F ปักธง
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        confirmSubmit
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrent((c) => Math.max(0, c - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setCurrent((c) => Math.min(set.questions.length - 1, c + 1));
      }

      if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        if (q) {
          const flagged = answers[q.id]?.flagged ?? false;
          saveAnswer(q.id, { flagged: !flagged });
        }
      }

      if (q && q.type === "MCQ" && q.options) {
        const keyMap: Record<string, number> = {
          "1": 0, "a": 0, "A": 0,
          "2": 1, "b": 1, "B": 1,
          "3": 2, "c": 2, "C": 2,
          "4": 3, "d": 3, "D": 3,
        };
        const optIndex = keyMap[e.key];
        if (optIndex !== undefined && optIndex < q.options.length) {
          e.preventDefault();
          const targetOpt = q.options[optIndex];
          saveAnswer(q.id, { selectedKeys: [targetOpt.key] });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [q, set.questions.length, answers, saveAnswer, confirmSubmit]);

  if (!q) return null;

  const isPractice = quizMode === "PRACTICE" || set.revealMode === "AFTER_EACH";
  const feedback = revealedFeedback[q.id];

  return (
    <div className="flex flex-col gap-4">
      {/* แถบหัว: ชื่อชุด + ตัวสลับโหมดฝึกซ้อม/สอบจริง + ตัวจับเวลา + ความคืบหน้า */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border bg-card p-4 shadow-soft">
        <div className="flex-1 min-w-[240px]">
          <h1 className="text-base font-semibold md:text-lg">{set.title}</h1>
          {retrySourceAttemptId && (
            <a
              href={`/quiz/${set.id}/result/${retrySourceAttemptId}`}
              className="text-xs text-purple-brand underline underline-offset-2 hover:text-foreground"
              target="_blank"
              rel="noreferrer"
            >
              เปิดดูผลรอบเดิม (read-only)
            </a>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            {set.subjectCode} {set.subjectName}
            {set.topicTitle ? ` · ${set.topicTitle}` : ""} · ข้อ {current + 1} จาก {set.questions.length}
          </p>
        </div>

        {/* ตัวเลือกโหมด: ฝึกซ้อมเฉลยทันที vs สอบจริง */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-2xl bg-muted/80 p-1 border border-border/70 shadow-2xs">
            <button
              type="button"
              onClick={() => handleModeChange("PRACTICE")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                quizMode === "PRACTICE"
                  ? "bg-primary text-primary-foreground shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>โหมดฝึกซ้อม (เฉลยทันที)</span>
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("EXAM")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                quizMode === "EXAM"
                  ? "bg-card text-foreground shadow-2xs font-bold border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>โหมดสอบจริง</span>
            </button>
          </div>

          <Badge
            variant="secondary"
            className="rounded-full font-mono text-sm px-3 py-1 shadow-2xs"
            title="เวลาที่ใช้ไป"
            aria-live="off"
          >
            <Clock className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            <span>{formatClock(elapsed)}</span>
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Progress
          value={(answeredCount / set.questions.length) * 100}
          aria-label={`ทำแล้ว ${answeredCount} จาก ${set.questions.length} ข้อ`}
        />
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          ตอบแล้ว {answeredCount}/{set.questions.length}
        </span>
      </div>

      {/* โจทย์ */}
      <article className="rounded-3xl border border-border bg-card p-5 shadow-soft" aria-label={`ข้อ ${current + 1}`}>
        <div className="mb-3 flex items-start justify-between gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-secondary font-semibold text-wine dark:text-primary">
            {current + 1}
          </span>
          <div className="flex items-center gap-2">
            {isPractice && feedback && (
              <Badge
                variant="outline"
                className={cn(
                  "font-semibold text-xs",
                  feedback.isCorrect
                    ? "border-emerald-600 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                )}
              >
                {feedback.isCorrect ? "✓ ถูกต้อง" : "✗ ยังไม่ถูก"}
              </Badge>
            )}
            <Button
              variant={q && answers[q.id]?.flagged ? "default" : "outline"}
              size="sm"
              className="rounded-2xl"
              aria-pressed={Boolean(answers[q.id]?.flagged)}
              onClick={() => saveAnswer(q.id, { flagged: !answers[q.id]?.flagged })}
            >
              <Flag className="mr-1 h-4 w-4" aria-hidden />
              {answers[q.id]?.flagged ? "ปักธงอยู่" : "ยังไม่แน่ใจ"}
            </Button>
          </div>
        </div>

        <div className="text-[15px] leading-relaxed">
          <KatexText text={q.prompt} />
        </div>

        {q.imageUrl && (
          <img
            src={q.imageUrl}
            alt="รูปประกอบโจทย์"
            className="mt-3 max-h-80 rounded-2xl border border-border object-contain"
          />
        )}

        {/* กระดาษทด */}
        <div className="mt-3">
          <ScratchPad setId={set.id} questionId={q.id} />
        </div>

        {/* ตัวเลือก MCQ พร้อมเฉลยทันทีในโหมดฝึกซ้อม */}
        {q.type === "MCQ" && q.options && (
          <div className="mt-4 flex flex-col gap-2.5" role="radiogroup" aria-label="ตัวเลือกคำตอบ">
            {q.options.map((opt) => {
              const selected = answers[q.id]?.selectedKeys?.includes(opt.key) ?? false;
              const isAnswered = isPractice && feedback !== undefined;
              const isRight = isAnswered && feedback.isCorrect && selected;
              const isWrong = isAnswered && !feedback.isCorrect && selected;
              const isTargetCorrect = isAnswered && opt.key === feedback.correctKey;

              return (
                <button
                  key={opt.key}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => saveAnswer(q.id, { selectedKeys: [opt.key] })}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl border p-3.5 text-left text-sm transition-all hover:bg-secondary/60 focus-visible:outline-2 focus-visible:outline-ring cursor-pointer select-none",
                    selected && !isAnswered && "border-wine bg-soft-pink/50 dark:border-primary dark:bg-secondary",
                    !selected && !isAnswered && "border-border",
                    // ไฮไลต์เฉลยในโหมดฝึกซ้อม
                    isRight && "border-emerald-600 bg-emerald-500/15 text-emerald-950 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-100 ring-2 ring-emerald-500/20 font-medium",
                    isWrong && "border-rose-500 bg-rose-500/15 text-rose-950 dark:border-rose-500 dark:bg-rose-950/40 dark:text-rose-100 ring-2 ring-rose-500/20 font-medium",
                    !selected && isTargetCorrect && "border-emerald-500/80 border-dashed bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 font-medium",
                    isAnswered && !selected && !isTargetCorrect && "opacity-60 border-border"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border font-bold text-xs transition-colors",
                      selected && !isAnswered && "border-wine bg-wine text-white dark:border-primary dark:bg-primary",
                      !selected && !isAnswered && "border-border bg-card",
                      isRight && "border-emerald-600 bg-emerald-600 text-white",
                      isWrong && "border-rose-500 bg-rose-500 text-white",
                      !selected && isTargetCorrect && "border-emerald-600 text-emerald-700 dark:text-emerald-300 font-extrabold bg-emerald-100/60 dark:bg-emerald-950/60"
                    )}
                  >
                    {isRight ? "✓" : isWrong ? "✗" : opt.key}
                  </span>
                  <span className="flex-1 leading-relaxed pt-0.5">
                    <KatexText text={opt.text} />
                  </span>
                  {isRight && (
                    <span className="shrink-0 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      ✓ ตอบถูก
                    </span>
                  )}
                  {isWrong && (
                    <span className="shrink-0 text-xs font-semibold text-rose-600 dark:text-rose-400">
                      ✗ ตอบผิด
                    </span>
                  )}
                  {!selected && isTargetCorrect && (
                    <span className="shrink-0 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      คำตอบที่ถูก
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* กล่องเฉลยละเอียดและวิเคราะห์จุดหลอก (Instant Feedback Card) */}
        {isPractice && feedback && (
          <div
            className={cn(
              "mt-5 rounded-3xl border-2 p-5 shadow-soft transition-all animate-fade-up",
              feedback.isCorrect
                ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20"
                : "border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/20"
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-card border border-border text-base shadow-2xs">
                  {feedback.isCorrect ? "🎉" : "💡"}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    {feedback.isCorrect
                      ? "ยอดเยี่ยมมาก! ตอบถูกต้อง"
                      : `ยังไม่ถูกต้อง — คำตอบที่ถูกต้องคือข้อ ${feedback.correctKey ?? ""}`}
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    {feedback.isCorrect
                      ? "เข้าใจโครงสร้างและคีย์เวิร์ดของประโยคนี้อย่างแม่นยำ"
                      : "สังเกตเหตุผลและคำอธิบายไวยากรณ์ด้านล่างเพื่อแก้จุดหลอก"}
                  </p>
                </div>
              </div>

              <Badge
                variant="outline"
                className={cn(
                  "font-semibold text-xs px-2.5 py-1",
                  feedback.isCorrect
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                )}
              >
                {feedback.isCorrect ? "+1 คะแนน" : "วิเคราะห์ทำความเข้าใจ"}
              </Badge>
            </div>

            {feedback.explanation && (
              <div className="mt-3.5 space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                  คำอธิบายเฉลยและจุดสังเกต (Grammar Breakdown):
                </span>
                <div className="rounded-2xl border border-border/80 bg-card p-4 text-sm leading-relaxed shadow-2xs">
                  <MarkdownLite content={feedback.explanation} />
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40">
              <span className="text-xs text-muted-foreground">
                ลองเลือกข้ออื่นเพื่อฝึก หรือกดข้อถัดไป
              </span>
              {current < set.questions.length - 1 ? (
                <Button
                  size="sm"
                  onClick={() => setCurrent((c) => Math.min(set.questions.length - 1, c + 1))}
                  className="rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  ข้อถัดไป ({current + 2}/{set.questions.length}) <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => submit()}
                  className="rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  ส่งตรวจคะแนนรวมทั้งชุด <Send className="ml-1 h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* เติมคำตอบ */}
        {q.type === "SHORT_ANSWER" && (
          <div className="mt-4 flex flex-col gap-2">
            <label htmlFor={`ans-${q.id}`} className="text-sm text-muted-foreground">
              พิมพ์คำตอบ (รองรับตัวเลข หน่วย และ LaTeX ในรูป $...$)
            </label>
            <input
              id={`ans-${q.id}`}
              type="text"
              value={answers[q.id]?.text ?? ""}
              onChange={(e) => saveAnswer(q.id, { text: e.target.value })}
              className="w-full rounded-2xl border border-input bg-background px-4 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-ring"
              placeholder="พิมพ์คำตอบที่ต้องการ..."
            />
            {isPractice && feedback && (
              <div className="mt-2 text-xs">
                {feedback.isCorrect ? (
                  <span className="font-semibold text-emerald-600">✓ คำตอบถูกต้อง</span>
                ) : (
                  <span className="text-rose-600">
                    เฉลยที่ถูกต้อง: <strong>{feedback.finalAnswer}</strong>
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* ข้อเขียน */}
        {q.type === "WRITTEN" && (
          <div className="mt-4 flex flex-col gap-3">
            <Whiteboard
              storageKey={`${set.id}:${q.id}`}
              onChange={(dataUrl) => {
                if (dataUrl) pendingSketches.current[q.id] = dataUrl;
              }}
            />
            <div>
              <label htmlFor={`tex-${q.id}`} className="text-sm text-muted-foreground">
                พิมพ์สมการ LaTeX เพิ่มเติม (ถ้ามี)
              </label>
              <input
                id={`tex-${q.id}`}
                type="text"
                value={answers[q.id]?.tex ?? ""}
                onChange={(e) => saveAnswer(q.id, { tex: e.target.value })}
                className="mt-1 w-full rounded-2xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-ring font-mono"
              />
            </div>
            <div>
              <label htmlFor={`final-${q.id}`} className="text-sm font-medium">
                คำตอบสุดท้าย
              </label>
              <input
                id={`final-${q.id}`}
                type="text"
                value={answers[q.id]?.finalAnswer ?? ""}
                onChange={(e) => saveAnswer(q.id, { finalAnswer: e.target.value })}
                className="mt-1 w-full rounded-2xl border border-input bg-background px-4 py-2.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-ring"
              />
            </div>
          </div>
        )}

        {/* ความมั่นใจ */}
        {Boolean(
          answers[q.id]?.selectedKeys?.length ||
            answers[q.id]?.text?.trim() ||
            answers[q.id]?.finalAnswer?.trim(),
        ) && (
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
            <span className="text-xs text-muted-foreground">ความมั่นใจ:</span>
            {[
              { v: "SURE" as const, label: "มั่นใจ", icon: <ShieldCheck className="mr-1 h-3.5 w-3.5" /> },
              { v: "GUESS" as const, label: "เดา / ยังลังเล", icon: <HelpCircle className="mr-1 h-3.5 w-3.5" /> },
            ].map((c) => {
              const on = answers[q.id]?.confidence === c.v;
              return (
                <button
                  key={c.v}
                  type="button"
                  aria-pressed={on}
                  onClick={() => saveAnswer(q.id, { confidence: on ? null : c.v })}
                  className={cn(
                    "inline-flex h-9 items-center rounded-xl border px-3 text-xs font-medium transition-colors cursor-pointer",
                    on
                      ? c.v === "SURE"
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-amber-500 bg-amber-500 text-white"
                      : "border-border bg-card hover:bg-secondary",
                  )}
                >
                  {c.icon}
                  {c.label}
                </button>
              );
            })}
          </div>
        )}
      </article>

      {/* ปุ่มเลื่อนข้อ + ส่ง */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          className="rounded-2xl"
          disabled={current === 0}
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden /> ข้อก่อน
        </Button>

        <div className="flex max-w-full flex-nowrap gap-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:justify-center sm:overflow-visible" role="tablist" aria-label="เลือกข้อ">
          {set.questions.map((qq, i) => {
            const answered =
              answers[qq.id] &&
              ((answers[qq.id].selectedKeys?.length ?? 0) > 0 ||
                Boolean(answers[qq.id].text?.trim()) ||
                Boolean(answers[qq.id].finalAnswer?.trim()));
            const qFeedback = revealedFeedback[qq.id];

            return (
              <button
                key={qq.id}
                type="button"
                role="tab"
                aria-selected={i === current}
                aria-label={`ข้อ ${i + 1}${answered ? " (ตอบแล้ว)" : ""}${answers[qq.id]?.flagged ? " (ปักธง)" : ""}`}
                onClick={() => setCurrent(i)}
                className={cn(
                  "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-xs font-medium transition-all cursor-pointer",
                  i === current && "ring-2 ring-primary ring-offset-1 font-bold",
                  !answered && !answers[qq.id]?.flagged && "border-border bg-card hover:bg-secondary",
                  answered && !isPractice && "border-wine bg-soft-pink text-wine dark:border-primary dark:bg-secondary dark:text-primary",
                  answered && isPractice && qFeedback?.isCorrect === true && "border-emerald-600 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-bold",
                  answered && isPractice && qFeedback?.isCorrect === false && "border-rose-500 bg-rose-500/15 text-rose-800 dark:text-rose-300 font-bold",
                  answered && isPractice && !qFeedback && "border-wine bg-soft-pink text-wine dark:border-primary dark:bg-secondary dark:text-primary",
                  answers[qq.id]?.flagged && "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300",
                )}
              >
                {i + 1}
                {isPractice && qFeedback && (
                  <span
                    className={cn(
                      "absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border border-background shadow-xs",
                      qFeedback.isCorrect ? "bg-emerald-500" : "bg-rose-500"
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>

        {current < set.questions.length - 1 ? (
          <Button className="rounded-2xl" onClick={() => setCurrent((c) => Math.min(set.questions.length - 1, c + 1))}>
            ข้อถัดไป <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
        ) : (
          <Button className="rounded-2xl" disabled={submitting} onClick={() => submit()}>
            <Send className="mr-1 h-4 w-4" aria-hidden />
            {submitting ? "กำลังส่ง..." : "ส่งคำตอบ"}
          </Button>
        )}
      </div>

      <div className="hidden sm:flex items-center justify-center gap-3 text-xs text-muted-foreground/75 py-0.5">
        <span>⚡ <strong>คีย์ลัดสะดวกรวดเร็ว:</strong> กด <strong>A/B/C/D</strong> หรือ <strong>1/2/3/4</strong> เลือกคำตอบ • <strong>← / →</strong> เลื่อนข้อ • <strong>F</strong> ปักธงทบทวน</span>
      </div>

      {current === set.questions.length - 1 && (
        <Button variant="secondary" className="self-end rounded-2xl" disabled={submitting} onClick={() => submit()}>
          <Send className="mr-1 h-4 w-4" aria-hidden /> ส่งคำตอบทั้งชุด
        </Button>
      )}

      <Dialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden />
              ยังตอบไม่ครบทุกข้อ
            </DialogTitle>
            <DialogDescription>
              คุณตอบ {answeredCount} จาก {set.questions.length} ข้อ — ต้องการส่งคำตอบตอนนี้เลยหรือไม่?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-2xl" onClick={() => setConfirmSubmit(false)}>
              กลับไปตรวจอีกครั้ง
            </Button>
            <Button className="rounded-2xl" disabled={submitting} onClick={() => submit(true)}>
              ส่งคำตอบเลย
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
