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
}: {
  params: Promise<{ setId: string }>;
}) {
  const { setId } = await params;
  const set = await questionSetService.getForPlay(setId);
  if (!set) notFound();

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
            <BookOpen className="h-4 w-4" aria-hidden />
            ชีตสรุปก่อนทำ (แนะนำให้อ่านก่อนเริ่ม — มีสูตรครบ)
            <Link
              href={`/study-guide/${encodeURIComponent(set.subjectCode)}`}
              className="ml-auto text-xs font-normal text-muted-foreground underline underline-offset-2 hover:text-foreground"
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
          title: set.title.th,
          subjectName: set.subjectName.th,
          topicTitle: set.topicTitle?.th ?? null,
        }}
      />
    </div>
  );
}
