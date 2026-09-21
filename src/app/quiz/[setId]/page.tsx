import { notFound } from "next/navigation";
import { BookOpen, ChevronDown } from "lucide-react";
import { BackButton } from "@/components/back-button";
import Link from "next/link";
import { QuizRunner } from "@/components/quiz/quiz-runner";
import { MarkdownLite } from "@/components/study-guide/markdown-lite";
import { questionSetService } from "@/server/services/question-set-service";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ setId: string }>;
  searchParams: Promise<{ retry?: string }>;
}) {
  const { setId } = await params;
  const { retry: retrySessionId } = await searchParams;
  const set = await questionSetService.getForPlay(setId);
  if (!set) notFound();

  // โหมดฝึกซ้ำ: จำกัดเฉพาะข้อใน RetrySession (ข้อที่ผิด/ข้ามจาก attempt ต้นทาง)
  let retryQuestionIds: string[] | null = null;
  let retrySourceAttemptId: string | null = null;
  if (retrySessionId) {
    const rs = await db.retrySession.findUnique({ where: { id: retrySessionId } });
    if (rs) {
      retryQuestionIds = (rs.questionIds as string[]) ?? null;
      retrySourceAttemptId = rs.sourceAttemptId;
    }
  }

  // ชีตสรุปของวิชานี้ — แนะนำให้อ่านก่อนเริ่มทำ
  const guide = await db.studyGuide.findUnique({
    where: { subjectId: set.subjectId },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="-mb-2">
        <BackButton fallbackHref={`/subjects/${encodeURIComponent(set.subjectCode)}`} label="ย้อนกลับ" />
      </div>
      {guide && (
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
            <MarkdownLite content={guide.content} />
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
        retrySourceAttemptId={retrySourceAttemptId}
      />
    </div>
  );
}
