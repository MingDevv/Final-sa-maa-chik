import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { attemptService } from "@/server/services/attempt-service";
import { getReadOnlySession } from "@/server/read-session";
import { localizedToString } from "@/lib/types";
import { ResultView } from "@/components/quiz/result-view";

export const dynamic = "force-dynamic";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ setId: string; attemptId: string }>;
}) {
  const { setId, attemptId } = await params;
  const [attempt, session] = await Promise.all([
    attemptService.getAttempt(attemptId),
    getReadOnlySession(),
  ]);
  if (!attempt || attempt.setId !== setId) notFound();
  // เจ้าของเท่านั้น
  const owns =
    attempt.userId != null
      ? attempt.userId === session.userId
      : attempt.guestSessionId === session.guestSessionId;
  if (!owns) notFound();

  const review = attempt.set.questions.map((q) => {
    const submitted = attempt.answers.find((a) => a.questionId === q.id);
    const answer = q.answer as {
      kind?: string;
      correctKeys?: string[];
      accepts?: string[];
      finalAnswer?: string;
      steps?: string[];
    };
    const submittedPayload = (submitted?.answer ?? {}) as {
      selectedKeys?: string[];
      text?: string;
      tex?: string;
      finalAnswer?: string;
    };
    const hasContent =
      (submittedPayload.selectedKeys?.length ?? 0) > 0 ||
      Boolean(submittedPayload.text?.trim()) ||
      Boolean(submittedPayload.finalAnswer?.trim());
    let status: "correct" | "incorrect" | "skipped" | "self-check" = "skipped";
    if (submitted?.selfChecked === true) status = "correct";
    else if (submitted?.selfChecked === false && submitted?.isCorrect === false) status = "incorrect";
    else if (hasContent) status = q.type === "WRITTEN" ? "self-check" : submitted?.isCorrect ? "correct" : "incorrect";

    return {
      questionId: q.id,
      type: q.type,
      prompt: q.prompt,
      points: q.points,
      options: (q.options as { key: string; text: string }[] | null) ?? null,
      correctKeys: answer.kind === "MCQ" ? (answer.correctKeys ?? []) : [],
      accepts: answer.kind === "SHORT_ANSWER" ? (answer.accepts ?? []) : [],
      finalAnswer: answer.kind === "WRITTEN" ? (answer.finalAnswer ?? "") : "",
      steps: answer.kind === "WRITTEN" ? (answer.steps ?? []) : [],
      explanation: q.explanation ?? "",
      rubric: (q.rubric as { description: string; points: number }[] | null) ?? null,
      submittedSelectedKeys: submittedPayload.selectedKeys ?? [],
      submittedText: submittedPayload.text ?? "",
      submittedTex: submittedPayload.tex ?? "",
      submittedFinalAnswer: submittedPayload.finalAnswer ?? "",
      selfChecked: submitted?.selfChecked ?? null,
      status,
    };
  });

  const score = (attempt.score as { earned: number; total: number; percent: number } | null) ?? {
    earned: 0,
    total: 0,
    percent: 0,
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="rounded-xl">
          <Link href={`/subjects`}>
            <ArrowLeft className="h-4 w-4" aria-hidden /> กลับหน้าวิชา
          </Link>
        </Button>
        <h1 className="text-xl font-semibold">ผลการทำ: {localizedToString(attempt.set.title)}</h1>
      </div>

      <ResultView
        setId={setId}
        attemptId={attemptId}
        score={score}
        durationSec={attempt.durationSec ?? 0}
        review={review}
      />
    </div>
  );
}
