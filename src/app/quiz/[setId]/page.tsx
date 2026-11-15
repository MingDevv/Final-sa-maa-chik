import { notFound } from "next/navigation";
import { BookOpen, ChevronDown } from "lucide-react";
import { BackButton } from "@/components/back-button";
import Link from "next/link";
import { QuizRunner } from "@/components/quiz/quiz-runner";
import { MarkdownLite } from "@/components/study-guide/markdown-lite";
import { questionSetService } from "@/server/services/question-set-service";
import { db } from "@/lib/db";
import { getSession } from "@/server/session";
import {
  ensureEnglishContent,
  ENGLISH_QUESTION_SET_ID,
  ENGLISH_SUBJECT_CODE,
} from "@/server/auto-seed-english";
import { ENGLISH_FUTURE_QUESTIONS_DATA } from "@/data/english-future-questions";
import { ENGLISH_FUTURE_STUDY_GUIDE_MD } from "@/data/english-future-study-guide";
import type { SafeQuestionSet } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ setId: string }>;
  searchParams: Promise<{ retry?: string; mode?: string }>;
}) {
  const { setId } = await params;
  const { retry: retrySessionId, mode: rawMode } = await searchParams;
  const initialMode = rawMode === "EXAM" ? "EXAM" : "PRACTICE";
  const session = await getSession();

  if (setId === ENGLISH_QUESTION_SET_ID || setId.includes("english")) {
    await ensureEnglishContent();
  }

  let set = await questionSetService.getForPlay(setId);

  // ถ้ายังไม่เจอใน DB แต่เป็นชุดข้อสอบภาษาอังกฤษ ให้ auto-seed แล้วลองใหม่
  if (!set && (setId === ENGLISH_QUESTION_SET_ID || setId.includes("english"))) {
    await ensureEnglishContent();
    set = await questionSetService.getForPlay(setId);
  }

  // Fallback สร้าง SafeQuestionSet โดยตรงจากชุดข้อมูลภาษาอังกฤษ 20 ข้อ
  if (!set && (setId === ENGLISH_QUESTION_SET_ID || setId.includes("english"))) {
    const fallbackSet: SafeQuestionSet = {
      id: ENGLISH_QUESTION_SET_ID,
      title: ENGLISH_FUTURE_QUESTIONS_DATA.title,
      description: ENGLISH_FUTURE_QUESTIONS_DATA.description,
      subjectId: "cmw60il60000kxjkmlkuxk82p",
      subjectCode: ENGLISH_SUBJECT_CODE,
      subjectName: { th: "ภาษาอังกฤษ", en: "English" },
      subjectColor: "#3b82f6",
      topicId: "topic-english-future",
      topicTitle: { th: "Future Tenses", en: "Future Tenses" },
      difficulty: "MEDIUM",
      recommendedMinutes: 25,
      shuffleQuestions: false,
      shuffleOptions: false,
      revealMode: "AFTER_SUBMIT",
      questions: ENGLISH_FUTURE_QUESTIONS_DATA.questions.map((q, idx) => ({
        id: `q-english-${idx + 1}`,
        type: "MCQ" as const,
        prompt: q.prompt,
        imageUrl: null,
        options: q.options.map((opt) => ({ key: opt.key, text: opt.text })),
        points: 1,
        sortOrder: q.sortOrder,
        rubric: null,
        hasSketch: false,
      })),
    };
    set = fallbackSet;
  }

  if (!set) notFound();

  // โหมดฝึกซ้ำ: ตรวจสิทธิ์เจ้าของและจำกัดเฉพาะข้อใน RetrySession (ข้อที่ผิด/ข้ามจาก attempt ต้นทาง)
  let retryQuestionIds: string[] | null = null;
  let retrySourceAttemptId: string | null = null;
  if (retrySessionId) {
    const rs = await db.retrySession.findUnique({ where: { id: retrySessionId } });
    if (!rs) {
      notFound();
    }
    const isOwner = session.userId
      ? rs.ownerUserId === session.userId
      : rs.ownerGuestId === session.guestSessionId;
    if (!isOwner) {
      notFound();
    }
    retryQuestionIds = (rs.questionIds as string[]) ?? null;
    retrySourceAttemptId = rs.sourceAttemptId;
  }

  // ชีตสรุปของวิชานี้ — แนะนำให้อ่านก่อนเริ่มทำ
  let guideContent: string | null = null;
  try {
    const guide = await db.studyGuide.findUnique({
      where: { subjectId: set.subjectId },
    });
    guideContent = guide?.content ?? null;
  } catch {
    // ignore
  }

  if (!guideContent && set.subjectCode === ENGLISH_SUBJECT_CODE) {
    guideContent = ENGLISH_FUTURE_STUDY_GUIDE_MD;
  }

  // สร้าง explanationsMap สำหรับโหมดฝึกซ้อมเฉลยทันที (Instant Feedback)
  const explanationsMap: Record<string, { correctKey: string; explanation: string }> = {};

  // โหมดฝึก: ส่งเฉลยข้อปรนัย (คำตอบเดียว) มากับหน้าเลย → กดแล้วเฉลยขึ้นทันที ไม่ต้องรอ server
  // (เปิดแบบโหมดสอบจะไม่ส่งเฉลยมา)
  if (initialMode === "PRACTICE" && set) {
    try {
      const rows = await db.question.findMany({
        where: { setId: set.id, type: "MCQ" },
        select: { id: true, answer: true, explanation: true },
      });
      for (const r of rows) {
        const a = (r.answer ?? {}) as { correctKey?: string; correctKeys?: string[] };
        const keys = a.correctKeys ?? (a.correctKey ? [a.correctKey] : []);
        if (keys.length === 1) {
          explanationsMap[r.id] = { correctKey: keys[0], explanation: r.explanation ?? "" };
        }
      }
    } catch {
      // ไม่มีก็ไม่เป็นไร — จะไปเช็กกับ server แทน
    }
  }
  if (setId === ENGLISH_QUESTION_SET_ID || setId.includes("english")) {
    ENGLISH_FUTURE_QUESTIONS_DATA.questions.forEach((q, idx) => {
      explanationsMap[`q-english-${idx + 1}`] = {
        correctKey: q.answer.correctKey,
        explanation: q.explanation,
      };
    });
    if (set && set.questions) {
      set.questions.forEach((sq) => {
        const item = ENGLISH_FUTURE_QUESTIONS_DATA.questions.find(
          (eq) => eq.sortOrder === sq.sortOrder || eq.prompt.trim() === sq.prompt.trim()
        );
        if (item) {
          explanationsMap[sq.id] = {
            correctKey: item.answer.correctKey,
            explanation: item.explanation,
          };
        }
      });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="-mb-2">
        <BackButton fallbackHref={`/subjects/${encodeURIComponent(set.subjectCode)}`} label="ย้อนกลับ" />
      </div>
      {guideContent && (
        <details className="group rounded-3xl border border-border bg-card shadow-soft">
          <summary className="flex cursor-pointer items-center gap-2 px-5 py-3 text-sm font-semibold text-wine focus-visible:outline-2 focus-visible:outline-ring dark:text-primary">
            <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
            <span className="min-w-0">ชีตสรุปก่อนทำ — มีสูตรครบ</span>
            <Link
              href={`/study-guide/${encodeURIComponent(set.subjectCode)}`}
              className="ml-auto shrink-0 whitespace-nowrap text-xs font-normal text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              เปิดเต็มจอ
            </Link>
            <ChevronDown
              className="h-4 w-4 transition-transform group-open:rotate-180"
              aria-hidden
            />
          </summary>
          <div className="max-h-[60vh] overflow-y-auto border-t border-border px-5 py-4">
            <MarkdownLite content={guideContent} />
          </div>
        </details>
      )}

      <QuizRunner
        set={{
          ...set,
          title: retryQuestionIds ? `ฝึกซ้ำเฉพาะข้อที่ผิด/ข้าม (${retryQuestionIds.length} ข้อ) — ${set.title.th}` : set.title.th,
          subjectName: set.subjectName.th,
          topicTitle: set.topicTitle?.th ?? null,
          questions: retryQuestionIds
            ? set.questions.filter((q) => retryQuestionIds.includes(q.id))
            : set.questions,
        }}
        retrySessionId={retrySessionId}
        retrySourceAttemptId={retrySourceAttemptId}
        initialMode={initialMode}
        explanationsMap={explanationsMap}
      />
    </div>
  );
}
