import { z } from "zod";
import { db } from "@/lib/db";
import { assertAdmin, handleApiError, ok } from "@/server/api-helpers";
import { createExamTermSchema } from "@/lib/validation";
import { localizedToString } from "@/lib/types";

/** GET รอบสอบทั้งหมด */
export async function GET(req: Request) {
  try {
    assertAdmin(req);
    const terms = await db.examTerm.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { questionSets: true } } },
    });
    return ok(
      terms.map((t) => ({
        id: t.id,
        name: localizedToString(t.name),
        academicYear: t.academicYear,
        semester: t.semester,
        examDate: t.examDate,
        status: t.status,
        questionSetCount: t._count.questionSets,
      })),
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/** POST สร้างรอบสอบใหม่ */
export async function POST(req: Request) {
  try {
    assertAdmin(req);
    const body = createExamTermSchema.parse(await req.json());
    const created = await db.examTerm.create({
      data: {
        name: body.name,
        academicYear: body.academicYear,
        semester: body.semester,
        examDate: body.examDate ? new Date(body.examDate) : null,
        status: body.status,
      },
    });
    return ok({ id: created.id });
  } catch (error) {
    return handleApiError(error);
  }
}

/** PATCH เปลี่ยนสถานะรอบสอบ */
export async function PATCH(req: Request) {
  try {
    assertAdmin(req);
    const body = z
      .object({
        id: z.string().min(1),
        status: z.enum(["UPCOMING", "ACTIVE", "ARCHIVED"]),
      })
      .parse(await req.json());
    await db.examTerm.update({ where: { id: body.id }, data: { status: body.status } });
    return ok({ updated: true });
  } catch (error) {
    return handleApiError(error);
  }
}
