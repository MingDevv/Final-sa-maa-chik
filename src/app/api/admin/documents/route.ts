import { documentService } from "@/server/services/document-service";
import { analyticsService } from "@/server/services/analytics-service";
import { assertAdmin, handleApiError, ok } from "@/server/api-helpers";
import { localizedTextSchema } from "@/lib/validation";

/** GET รายการเอกสารทั้งหมด + สถิติข้อที่ผิดบ่อย */
export async function GET(req: Request) {
  try {
    assertAdmin(req);
    const [documents, hardest] = await Promise.all([
      documentService.listAll(),
      analyticsService.hardestQuestions(10),
    ]);
    return ok({ documents, hardest });
  } catch (error) {
    return handleApiError(error);
  }
}

/** POST อัปโหลด PDF (multipart/form-data: file, title, subjectId, topicId?, pageCount?) */
export async function POST(req: Request) {
  try {
    assertAdmin(req);
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return handleApiError(new Error("ไม่พบไฟล์ที่อัปโหลด"));
    }
    if (file.size > 50 * 1024 * 1024) {
      return handleApiError(new Error("ไฟล์ใหญ่เกิน 50MB"));
    }
    const title = localizedTextSchema.parse(JSON.parse(String(form.get("title") ?? "")));
    const subjectId = String(form.get("subjectId") ?? "");
    const topicIdRaw = form.get("topicId");
    const pageCountRaw = form.get("pageCount");
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await documentService.createFromUpload({
      title,
      subjectId,
      topicId: topicIdRaw && topicIdRaw !== "" ? String(topicIdRaw) : null,
      buffer,
      fileName: file.name,
      mimeType: file.type || "application/pdf",
      pageCount: pageCountRaw ? Number(pageCountRaw) : undefined,
    });
    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}
