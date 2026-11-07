import { handleApiError, ok } from "@/server/api-helpers";
import { getSession } from "@/server/session";
import { reviewService } from "@/server/services/review-service";

/** GET สรุปและรายการข้อที่ต้องทบทวนวันนี้ของผู้ใช้คนนี้ */
export async function GET() {
  try {
    const session = await getSession();
    const [summary, items] = await Promise.all([
      reviewService.dueSummary(session.ownerKey),
      reviewService.listDue(session.ownerKey),
    ]);
    return ok({ summary, items });
  } catch (error) {
    return handleApiError(error);
  }
}
