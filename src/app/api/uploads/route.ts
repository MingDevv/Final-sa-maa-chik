import { getStorage } from "@/server/storage";
import { handleApiError, ok } from "@/server/api-helpers";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

/** POST อัปโหลดรูปภาพ (ภาพจากกระดานเขียน / รูปประกอบข้อสอบ) multipart: file */
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return handleApiError(new Error("ไม่พบไฟล์"));
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return handleApiError(new Error("รองรับเฉพาะไฟล์ภาพ PNG/JPEG/WEBP/GIF"));
    }
    if (file.size > 5 * 1024 * 1024) {
      return handleApiError(new Error("รูปใหญ่เกิน 5MB"));
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
