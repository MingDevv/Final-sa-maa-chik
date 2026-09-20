import { z } from "zod";
import { documentService } from "@/server/services/document-service";
import { assertAdmin, handleApiError, ok } from "@/server/api-helpers";
import { updateDocumentSchema } from "@/lib/validation";

/** PATCH แก้เอกสาร (ชื่อ/หัวข้อ/สถานะ) */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertAdmin(req);
    const { id } = await params;
    const body = updateDocumentSchema.parse(await req.json());
    await documentService.updateDocument(id, body);
    return ok({ updated: true });
  } catch (error) {
    return handleApiError(error);
  }
}

/** DELETE ลบเอกสาร (ลบไฟล์ใน storage ด้วย) */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertAdmin(req);
    const { id } = await params;
    await documentService.deleteDocument(id);
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}

/** POST สร้างชุดฝึกฉบับร่างจากหัวข้อของเอกสาร — workflow ให้ผู้ดูแลเติมโจทย์จากเนื้อหาอ้างอิงเองแล้วเผยแพร่ */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertAdmin(req);
    const { id } = await params;
    const body = z
      .object({ adminNote: z.string().optional() })
      .parse(await req.json().catch(() => ({})));
    const result = await documentService.createDraftSetFromTopic({
      documentId: id,
      adminNote: body.adminNote,
    });
    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}
