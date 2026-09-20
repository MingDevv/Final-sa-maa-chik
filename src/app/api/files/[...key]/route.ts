import { getStorage } from "@/server/storage";
import { handleApiError } from "@/server/api-helpers";

/** GET เสิร์ฟไฟล์จาก local storage (documents/sketches) */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  try {
    const { key } = await params;
    const storageKey = key.map((seg) => decodeURIComponent(seg)).join("/");
    const buffer = await getStorage().read(storageKey);
    const ext = storageKey.split(".").pop()?.toLowerCase() ?? "";
    const mime =
      ext === "png" ? "image/png"
      : ext === "jpg" || ext === "jpeg" ? "image/jpeg"
      : ext === "webp" ? "image/webp"
      : ext === "gif" ? "image/gif"
      : ext === "pdf" ? "application/pdf"
      : "application/octet-stream";
    return new Response(new Uint8Array(buffer), {
      headers: { "Content-Type": mime, "Cache-Control": "private, max-age=300" },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
