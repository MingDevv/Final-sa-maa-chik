import { analyticsService } from "@/server/services/analytics-service";
import { handleApiError, ok } from "@/server/api-helpers";
import { getSession } from "@/server/session";

/** GET สรุปสำหรับ Dashboard: ความคืบหน้า, streak, จุดอ่อน, ผลล่าสุด */
export async function GET() {
  try {
    const session = await getSession();
    const [summary, weakTopics, recent] = await Promise.all([
      analyticsService.dashboard(session.ownerKey),
      analyticsService.weakTopics(session.ownerKey),
      analyticsService.recentAttempts(session.ownerKey),
    ]);
    return ok({ summary, weakTopics, recent });
  } catch (error) {
    return handleApiError(error);
  }
}
