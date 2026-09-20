import { z } from "zod";
import { attemptService } from "@/server/services/attempt-service";
import { handleApiError, ok } from "@/server/api-helpers";
import { getSession } from "@/server/session";

const schema = z.object({
  questionId: z.string().min(1),
  correct: z.boolean(),
});

/** POST ผู้ใช้ติ๊กตรวจข้อเขียนด้วยตนเองตาม rubric */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = schema.parse(await request.json());
    const session = await getSession();
    const result = await attemptService.selfCheck({
      attemptId: id,
      questionId: body.questionId,
      correct: body.correct,
      owner: session.ownerKey,
    });
    if (!result) return handleApiError(new Error("NOT_FOUND"));
    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}
