import { subjectService } from "@/server/services/subject-service";
import { handleApiError, ok } from "@/server/api-helpers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    const decoded = decodeURIComponent(code);
    const subject = await subjectService.getSubjectByCode(decoded);
    if (!subject) return handleApiError(new Error("NOT_FOUND"));
    return ok(subject);
  } catch (error) {
    return handleApiError(error);
  }
}
