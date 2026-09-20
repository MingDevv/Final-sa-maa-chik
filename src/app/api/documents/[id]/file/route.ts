import { documentService } from "@/server/services/document-service";
import { handleApiError } from "@/server/api-helpers";

/** GET stream ไฟล์ PDF ของเอกสาร */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const file = await documentService.readFile(id);
    if (!file) return handleApiError(new Error("NOT_FOUND"));
    return new Response(new Uint8Array(file.buffer), {
      headers: {
        "Content-Type": file.mimeType,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
