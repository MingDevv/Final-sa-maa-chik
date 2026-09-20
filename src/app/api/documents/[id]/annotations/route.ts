import { z } from "zod";
import { documentService } from "@/server/services/document-service";
import { progressRepository } from "@/server/repositories/document-repository";
import { handleApiError, ok } from "@/server/api-helpers";
import { getSession } from "@/server/session";

const createSchema = z.object({
  bookmark: z
    .object({ page: z.number().int().min(1), label: z.string().optional() })
    .optional(),
  highlight: z
    .object({
      page: z.number().int().min(1),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#E11D48"),
      note: z.string().optional().nullable(), // client ส่ง null มาได้ (ไม่มีโน้ต)
    })
    .optional(),
  note: z
    .object({ page: z.number().int().min(1), content: z.string().min(1) })
    .optional(),
  remove: z
    .object({
      type: z.enum(["bookmark", "highlight", "note"]),
      id: z.string().min(1),
    })
    .optional(),
});

/** GET ป้ายบุ๊กมาร์ก/ไฮไลต์/โน้ตทั้งหมดของเอกสาร (ของผู้ใช้ปัจจุบัน) */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const data = await documentService.listAnnotations(session.ownerKey, id);
    return ok(data);
  } catch (error) {
    return handleApiError(error);
  }
}

/** POST เพิ่ม/ลบ annotation รายการ */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = createSchema.parse(await request.json());
    const session = await getSession();
    const owner = session.ownerKey;

    if (body.bookmark) {
      const created = await progressRepository.addBookmark(
        owner, id, body.bookmark.page, body.bookmark.label,
      );
      return ok(created);
    }
    if (body.highlight) {
      const created = await progressRepository.addHighlight(
        owner, id, body.highlight.page, body.highlight.color, body.highlight.note ?? undefined,
      );
      return ok(created);
    }
    if (body.note) {
      const created = await progressRepository.addNote(owner, id, body.note.page, body.note.content);
      return ok(created);
    }
    if (body.remove) {
      if (body.remove.type === "bookmark") await progressRepository.removeBookmark(owner, body.remove.id);
      else if (body.remove.type === "highlight") await progressRepository.removeHighlight(owner, body.remove.id);
      else await progressRepository.removeNote(owner, body.remove.id);
      return ok({ removed: true });
    }
    return handleApiError(new Error("ไม่มีรายการที่ส่งมา"));
  } catch (error) {
    return handleApiError(error);
  }
}

/** PATCH แก้โน้ต */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await params;
    const body = z
      .object({ noteId: z.string().min(1), content: z.string().min(1) })
      .parse(await request.json());
    const session = await getSession();
    await progressRepository.updateNote(session.ownerKey, body.noteId, body.content);
    return ok({ updated: true });
  } catch (error) {
    return handleApiError(error);
  }
}
