import { attemptService } from "@/server/services/attempt-service";
import { handleApiError, ok } from "@/server/api-helpers";
import { getSession } from "@/server/session";
import { submitAttemptSchema } from "@/lib/validation";
import { localizedToString } from "@/lib/types";
import { parseQuestionAnswer } from "@/server/services/question-set-service";

/** POST ส่งข้อสอบ → ตรวจ คิดคะแนน บันทึกจุดอ่อน แล้วคืนผลพร้อมเฉลย */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = submitAttemptSchema.parse(await request.json().catch(() => ({})));
    const session = await getSession();

    const result = await attemptService.submit({
      attemptId: id,
      owner: session.ownerKey,
      durationSec: body.durationSec,
    });
    if (!result) return handleApiError(new Error("ATTEMPT_NOT_FOUND"));

    // เฉลยเต็ม: โจทย์ + เฉลย + คำอธิบาย + แนววิธีคิด
    const attempt = await attemptService.getAttempt(id);
    const review = attempt!.set.questions.map((q) => {
      const answer = parseQuestionAnswer(q.answer);
      const submitted = attempt!.answers.find((a) => a.questionId === q.id);
      const per = result.perQuestion.find((p) => p.questionId === q.id)!;
      return {
        questionId: q.id,
        type: q.type,
        prompt: q.prompt,
        points: q.points,
        options: q.options,
        correctKeys: answer.kind === "MCQ" ? answer.correctKeys : undefined,
        accepts: answer.kind === "SHORT_ANSWER" ? answer.accepts : undefined,
        finalAnswer: answer.kind === "WRITTEN" ? answer.finalAnswer : undefined,
        steps: answer.kind === "WRITTEN" ? (answer.steps ?? null) : null,
        explanation: q.explanation,
        rubric: q.rubric,
        submitted: submitted?.answer ?? null,
        status: per.status,
        earned: per.earned,
        selfChecked: submitted?.selfChecked ?? false,
      };
    });

    return ok({
      attemptId: id,
      score: result.score,
      durationSec: attempt!.durationSec,
      setStatus: attempt!.set.status,
      setTitle: localizedToString(attempt!.set.title),
      subjectName: localizedToString(attempt!.set.subject.name),
      subjectCode: attempt!.set.subject.code,
      review,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
