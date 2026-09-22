import { attemptService } from "@/server/services/attempt-service";
import { handleApiError, ok } from "@/server/api-helpers";
import { getSession } from "@/server/session";
import { startAttemptSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = startAttemptSchema.parse(await request.json());
    const session = await getSession();
    const attemptId = await attemptService.start({
      setId: body.setId,
      mode: body.mode,
      owner: session.ownerKey,
      retrySessionId: body.retrySessionId,
    });
    if (!attemptId) return handleApiError(new Error("NOT_FOUND"));
    return ok({ attemptId });
  } catch (error) {
    return handleApiError(error);
  }
}
