import { handleApiError, ok } from "@/server/api-helpers";
import { getSession } from "@/server/session";
import { reviewService } from "@/server/services/review-service";

/** GET สรุปและรายการข้อที่ต้องทบทวนวันนี้ของผู้ใช้คนนี้ */
export async function GET(request: Request) {
  const all = new URL(request.url).searchParams.get("all") === "1";
  try {
    const session = await getSession();
    const [summary, items] = await Promise.all([
      reviewService.dueSummary(session.ownerKey),
      reviewService.listDue(session.ownerKey, { all }),
    ]);
    return ok({ summary, items });
  } catch (error) {
    return handleApiError(error);
  }
}
