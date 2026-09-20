import { subjectService } from "@/server/services/subject-service";
import { assertAdmin, handleApiError, ok } from "@/server/api-helpers";
import { updateSubjectSchema } from "@/lib/validation";

/** PATCH แก้ไขวิชา */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertAdmin(req);
    const { id } = await params;
    const body = updateSubjectSchema.parse(await req.json());
    await subjectService.updateSubject(id, body);
    return ok({ updated: true });
  } catch (error) {
    return handleApiError(error);
  }
}

/** DELETE เก็บวิชาเข้าถาวร (archive ไม่ลบจริง) */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertAdmin(req);
    const { id } = await params;
    await subjectService.archiveSubject(id);
    return ok({ archived: true });
  } catch (error) {
    return handleApiError(error);
  }
}
