import { attemptService } from "@/server/services/attempt-service";
import { handleApiError, ok } from "@/server/api-helpers";
import { getSession } from "@/server/session";
import { saveAnswerSchema } from "@/lib/validation";

/** GET สถานะ attempt (คำตอบที่เคย autosave) — ใช้กลับมาทำต่อ */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const attempt = await attemptService.getAttempt(id);
    if (!attempt) return handleApiError(new Error("ATTEMPT_NOT_FOUND"));
    return ok({
      id: attempt.id,
      status: attempt.status,
      startedAt: attempt.startedAt,
      score: attempt.score,
      durationSec: attempt.durationSec,
      answers: attempt.answers.map((a) => ({
        questionId: a.questionId,
        answer: a.answer,
        flagged: a.flagged,
        selfChecked: a.selfChecked,
        isCorrect: a.isCorrect,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/** PATCH autosave คำตอบรายข้อ (ทุกครั้งที่เปลี่ยนคำตอบ/ปักธง) */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = saveAnswerSchema.parse(await request.json());
    const session = await getSession();
    const result = await attemptService.saveAnswer({
      attemptId: id,
      owner: session.ownerKey,
      data: body,
    });
    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}
