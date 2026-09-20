import { subjectService } from "@/server/services/subject-service";
import { handleApiError, ok } from "@/server/api-helpers";

export async function GET() {
  try {
    const subjects = await subjectService.listSubjects();
    return ok(subjects);
  } catch (error) {
    return handleApiError(error);
  }
}
