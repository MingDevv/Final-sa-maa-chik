"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Send,
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

/** หน้าทำข้อสอบ: จับเวลา, autosave แบบ debounce, ปักธง, จำตำแหน่งข้อ, ส่งคำตอบ */
export function QuizRunner({ set }: { set: PlaySet }) {
  const router = useRouter();
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [current, setCurrent] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(set.recommendedMinutes * 60);
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

  // เริ่ม/กลับมาทำ attempt
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setId: set.id, mode: "EXAM" }),
      });
      const json = await res.json();
      if (cancelled) return; // StrictMode ยิงซ้ำ — เงียบไว้ ไม่ใช่ความผิดพลาดจริง
      if (!json.ok) {
        toast.error(json.error ?? "เริ่มข้อสอบไม่สำเร็จ");
        return;
      }
      const id = json.data.attemptId as string;
      attemptIdRef.current = id;
      setAttemptId(id);
      // ดึงคำตอบที่ autosave ไว้ (ทำต่อจากที่ค้าง) — เงียบ ๆ ไม่เด้ง toast รบกวน
      const r2 = await fetch(`/api/attempts/${id}`);
      const j2 = await r2.json();
      if (j2.ok && !hydratedRef.current) {
        hydratedRef.current = true;
        const saved: Record<string, AnswerState> = {};
        for (const a of j2.data.answers ?? []) {
          const ans = (a.answer ?? {}) as AnswerState;
          if (Object.keys(ans).length > 0 || a.flagged) {
            saved[a.questionId] = {
              selectedKeys: ans.selectedKeys,
              text: ans.text,
              tex: ans.tex,
              finalAnswer: ans.finalAnswer,
              flagged: a.flagged || undefined,
            };
          }
        }
        if (Object.keys(saved).length > 0) setAnswers(saved);

        // กลับไปข้อที่ทำค้าง + ตั้งเวลาให้ต่อเนื่องจากเวลาที่เริ่มจริง
        try {
          const savedIdx = Number(localStorage.getItem(`fep_idx:${set.id}`));
          if (Number.isFinite(savedIdx) && savedIdx > 0 && savedIdx < set.questions.length) {
            setCurrent(savedIdx);
          }
        } catch {
          /* localStorage ใช้ไม่ได้ — ข้าม */
        }
        const startedAt = j2.data.startedAt ? new Date(j2.data.startedAt).getTime() : Date.now();
        const total = set.recommendedMinutes * 60;
        const usedSec = Math.floor((Date.now() - startedAt) / 1000);
        setElapsed(Math.min(usedSec, total));
        setSecondsLeft(Math.max(0, total - usedSec));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [set.id]);

  // จำตำแหน่งข้อปัจจุบัน — เริ่มบันทึกหลัง hydrate เท่านั้น (กันทับค่าที่เคยจำไว้ตอน mount)
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
      setSecondsLeft((s) => s - 1);
      setElapsed((s) => s + 1);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  /** อัปโหลดภาพกระดานที่ค้างไว้ (เรียกก่อนส่งคำตอบครั้งเดียว — ไม่หน่วงตอนเขียน) */
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
          // อัปโหลดไม่สำเร็จ — คำตอบสุดท้ายยังส่งได้ปกติ
        }
      }),
    );
  }

  const submit = useCallback(
    async (auto = false) => {
      if (!attemptId || submitting) return;
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
        // ส่งภาพกระดานที่ค้างก่อน (ถ้ามี) แล้วค่อยส่งข้อสอบ
        await flushPendingSketches();
        // กันคำตอบที่ยังค้างใน debounce (พิมพ์เสร็จปุ๊บส่งเลยปั๊บ)
        await Promise.all(
          Object.keys(pendingPatches.current).map((qid) => {
            const merged = pendingPatches.current[qid];
            delete pendingPatches.current[qid];
            return fetch(`/api/attempts/${attemptId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ questionId: qid, ...merged }),
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
    [attemptId, submitting, set.questions, answers, confirmSubmit, elapsed, router, set.id],
  );

  // หมดเวลาส่งอัตโนมัติ
  useEffect(() => {
    if (secondsLeft <= 0 && attemptId && !submitting) {
      toast.warning("หมดเวลา! ระบบส่งคำตอบให้อัตโนมัติ");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- ต้องส่งคำตอบทันทีเมื่อหมดเวลา
      void submit(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, attemptId, submitting]);

  const saveAnswer = useCallback(
    (questionId: string, patch: AnswerState, immediate = true) => {
      // อัปเดต UI ทันที (ลื่นไหล) แล้วค่อยส่งบันทึกเบื้องหลัง
      setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], ...patch } }));

      // รวม patch ล่าสุดไว้ตลอด (ตัวถัดไปทับตัวก่อน)
      pendingPatches.current[questionId] = {
        ...(pendingPatches.current[questionId] ?? {}),
        ...patch,
      };

      const send = async () => {
        const merged = pendingPatches.current[questionId];
        delete pendingPatches.current[questionId];
        const id = attemptIdRef.current;
        if (!id || !merged) return;
        try {
          const res = await fetch(`/api/attempts/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ questionId, ...merged }),
          });
          const json = await res.json();
          if (json.ok && json.data?.isCorrect === true) {
            setPerQuestionCorrect((prev) => ({ ...prev, [questionId]: true }));
          } else if (json.ok && json.data?.isCorrect === false) {
            setPerQuestionCorrect((prev) => ({ ...prev, [questionId]: false }));
          }
        } catch {
          // autosave ล้มเหลวชั่วคราว — คำตอบยังอยู่ใน state และจะพยายามบันทึกใหม่เมื่อแก้
        }
      };

      const timer = saveTimers.current[questionId];
      if (timer) clearTimeout(timer);
      if (immediate) {
        // MCQ/ปักธง/ยืนยัน — ส่งทันที
        delete saveTimers.current[questionId];
        void send();
      } else {
        // พิมพ์ข้อความ — รอให้พิมพ์จบช่วง (500ms) ค่อยส่งรวมครั้งเดียว
        saveTimers.current[questionId] = setTimeout(send, 500);
      }
    },
    [],
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

  if (!q) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* แถบหัว: ชื่อชุด + เวลา + ความคืบหน้า */}
      <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-border bg-card p-4 shadow-soft">
        <div className="flex-1">
          <h1 className="text-base font-semibold md:text-lg">{set.title}</h1>
          <p className="text-xs text-muted-foreground">
            {set.subjectCode} {set.subjectName}
            {set.topicTitle ? ` · ${set.topicTitle}` : ""} · ข้อ {current + 1} จาก {set.questions.length}
          </p>
        </div>
        <Badge
          variant={secondsLeft < 60 ? "destructive" : "secondary"}
          className="rounded-full font-mono text-sm"
          aria-live="off"
        >
          <Clock className="mr-1 h-4 w-4" aria-hidden />
          {formatClock(secondsLeft)}
        </Badge>
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

        <div className="text-[15px] leading-relaxed">
          <KatexText text={q.prompt} />
        </div>

        {q.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={q.imageUrl}
            alt="รูปประกอบโจทย์"
            className="mt-3 max-h-80 rounded-2xl border border-border object-contain"
          />
        )}

        {/* ตัวเลือก MCQ */}
        {q.type === "MCQ" && q.options && (
          <div className="mt-4 flex flex-col gap-2" role="radiogroup" aria-label="ตัวเลือกคำตอบ">
            {q.options.map((opt) => {
              const selected = answers[q.id]?.selectedKeys?.includes(opt.key) ?? false;
              const reveal = set.revealMode === "AFTER_EACH" && perQuestionCorrect[q.id] !== undefined;
              const isRight = perQuestionCorrect[q.id] === true && selected;
              const isWrong = perQuestionCorrect[q.id] === false && selected;
              return (
                <button
                  key={opt.key}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => saveAnswer(q.id, { selectedKeys: [opt.key] })}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl border p-3 text-left text-sm transition-colors hover:bg-secondary/60 focus-visible:outline-2 focus-visible:outline-ring",
                    selected ? "border-wine bg-soft-pink/50 dark:border-primary dark:bg-secondary" : "border-border",
                    reveal && isRight && "border-green-600 bg-green-50 dark:bg-green-950/40",
                    reveal && isWrong && "border-red-500 bg-red-50 dark:bg-red-950/40",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border font-medium",
                      selected ? "border-wine bg-wine text-white dark:border-primary dark:bg-primary" : "border-border",
                    )}
                  >
                    {opt.key}
                  </span>
                  <span className="leading-relaxed">
                    <KatexText text={opt.text} />
                  </span>
                </button>
              );
            })}
            {set.revealMode === "AFTER_EACH" && perQuestionCorrect[q.id] !== undefined && (
              <p
                className={cn(
                  "text-sm font-medium",
                  perQuestionCorrect[q.id] ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400",
                )}
                aria-live="polite"
              >
                {perQuestionCorrect[q.id] ? "✓ ถูกต้อง!" : "✗ ยังไม่ถูก ลองคิดใหม่นะ"}
              </p>
            )}
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
              placeholder="เช่น 9.8 m/s^2 หรือ $\\frac{1}{2}$"
            />
          </div>
        )}

        {/* ข้อเขียน: กระดานเขียน + LaTeX + คำตอบสุดท้าย */}
        {q.type === "WRITTEN" && (
          <div className="mt-4 flex flex-col gap-3">
            <Whiteboard
              storageKey={`${set.id}:${q.id}`}
              onChange={(dataUrl) => {
                // เก็บภาพไว้ในหน่วยความจำก่อน — จะอัปโหลดครั้งเดียวตอนกดส่งคำตอบ (ไม่หน่วงตอนเขียน)
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
                className="mt-1 w-full rounded-2xl border border-input bg-background px-4 py-2 text-sm font-mono focus-visible:outline-2 focus-visible:outline-ring"
                placeholder="\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}"
              />
              {answers[q.id]?.tex && (
                <div className="mt-1 rounded-2xl bg-muted/60 p-2 text-sm">
                  พรีวิว: <KatexText text={`$${answers[q.id]?.tex}$`} />
                </div>
              )}
            </div>
            <div>
              <label htmlFor={`final-${q.id}`} className="text-sm font-medium text-wine dark:text-primary">
                คำตอบสุดท้าย *
              </label>
              <input
                id={`final-${q.id}`}
                type="text"
                value={answers[q.id]?.finalAnswer ?? ""}
                onChange={(e) => saveAnswer(q.id, { finalAnswer: e.target.value })}
                className="mt-1 w-full rounded-2xl border-2 border-wine/40 bg-background px-4 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-ring dark:border-primary/50"
                placeholder="เขียนคำตอบสุดท้ายแยกจากวิธีทำ"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              ร่างบนกระดานถูกบันทึกอัตโนมัติในเครื่องของคุณ ปิดหน้าแล้วกลับมาใหม่ก็ยังอยู่
              (ข้อเขียนจะให้คุณตรวจกับเฉลยและ rubric เองหลังส่ง)
            </p>
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
            return (
              <button
                key={qq.id}
                type="button"
                role="tab"
                aria-selected={i === current}
                aria-label={`ข้อ ${i + 1}${answered ? " (ตอบแล้ว)" : ""}${answers[qq.id]?.flagged ? " (ปักธง)" : ""}`}
                onClick={() => setCurrent(i)}
                className={cn(
                  "relative h-8 w-8 shrink-0 rounded-xl border text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring",
                  i === current
                    ? "border-wine bg-wine text-white dark:border-primary dark:bg-primary"
                    : answered
                      ? "border-transparent bg-secondary text-wine dark:text-primary"
                      : "border-border text-muted-foreground",
                )}
              >
                {i + 1}
                {answers[qq.id]?.flagged && (
                  <span
                    className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-card"
                    aria-hidden
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
