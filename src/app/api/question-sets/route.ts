import { questionSetService } from "@/server/services/question-set-service";
import { handleApiError, ok, searchParamsToObject } from "@/server/api-helpers";

export async function GET(request: Request) {
  try {
    const p = searchParamsToObject(request.url);
    const sets = await questionSetService.listPublished({
      subjectId: p.subjectId,
      topicId: p.topicId,
      difficulty: p.difficulty as never,
    });
    return ok(sets);
  } catch (error) {
    return handleApiError(error);
  }
}
