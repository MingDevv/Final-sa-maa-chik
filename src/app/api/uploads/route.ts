import { getStorage } from "@/server/storage";
import { fail, handleApiError, ok } from "@/server/api-helpers";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

/** POST อัปโหลดรูปภาพ (ภาพจากกระดานเขียน / รูปประกอบข้อสอบ) multipart: file */
export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("รูปแบบคำขอไม่ถูกต้อง (ต้องเป็น multipart/form-data)", 400);
  }
  try {
    const file = form.get("file");
    if (!(file instanceof File)) return fail("ไม่พบไฟล์ที่อัปโหลด", 400);
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return fail("รองรับเฉพาะไฟล์ภาพ PNG/JPEG/WEBP/GIF", 400);
    }
    if (file.size > 5 * 1024 * 1024) {
      return fail("รูปใหญ่เกิน 5MB", 400);
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const stored = await getStorage().save(buffer, {
      prefix: "sketches",
      mimeType: file.type,
      fileName: file.name || "sketch.png",
    });
    return ok({ key: stored.key, url: getStorage().getUrl(stored.key) });
  } catch (error) {
    return handleApiError(error);
  }
}
