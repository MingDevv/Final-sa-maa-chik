import { handleApiError, ok } from "@/server/api-helpers";
import { getSession } from "@/server/session";
import { reviewService } from "@/server/services/review-service";
import { reviewAnswerSchema } from "@/lib/validation";

/** POST ตอบข้อทบทวน → ตรวจ, เลื่อนกล่อง, ส่งเฉลยกลับ */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ cardId: string }> },
) {
  try {
    const { cardId } = await params;
    const body = reviewAnswerSchema.parse(await request.json());
    const session = await getSession();
    const result = await reviewService.answer(session.ownerKey, cardId, body);
    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}
