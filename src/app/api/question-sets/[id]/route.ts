import { questionSetService } from "@/server/services/question-set-service";
import { handleApiError, ok } from "@/server/api-helpers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const set = await questionSetService.getForPlay(id);
    if (!set) return handleApiError(new Error("NOT_FOUND"));
    return ok(set);
  } catch (error) {
    return handleApiError(error);
  }
}
