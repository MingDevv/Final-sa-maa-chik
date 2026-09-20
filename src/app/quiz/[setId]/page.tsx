import { notFound } from "next/navigation";
import { QuizRunner } from "@/components/quiz/quiz-runner";
import { questionSetService } from "@/server/services/question-set-service";

export const dynamic = "force-dynamic";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ setId: string }>;
}) {
  const { setId } = await params;
  const set = await questionSetService.getForPlay(setId);
  if (!set) notFound();

  return (
    <QuizRunner
      set={{
        ...set,
        title: set.title.th,
        subjectName: set.subjectName.th,
        topicTitle: set.topicTitle?.th ?? null,
      }}
    />
  );
}
