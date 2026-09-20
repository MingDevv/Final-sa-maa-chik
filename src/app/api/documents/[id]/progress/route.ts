import { documentService } from "@/server/services/document-service";
import { handleApiError, ok } from "@/server/api-helpers";
import { getSession } from "@/server/session";
import { updateProgressSchema } from "@/lib/validation";

/** GET ตำแหน่งหน้าล่าสุด */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const progress = await documentService.getProgress(session.ownerKey, id);
    return ok(progress ?? { lastPage: 1, readSeconds: 0 });
  } catch (error) {
    return handleApiError(error);
  }
}

/** PATCH บันทึกหน้าล่าสุด / เวลาอ่านเพิ่ม */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = updateProgressSchema.parse(await request.json());
    const session = await getSession();
    await documentService.saveProgress(session.ownerKey, id, body);
    return ok({ saved: true });
  } catch (error) {
    return handleApiError(error);
  }
}
