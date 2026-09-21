import { db } from "@/lib/db";
import { handleApiError, ok } from "@/server/api-helpers";
import { localizedToString } from "@/lib/types";

/** GET /api/archive — รอบสอบที่ ARCHIVED พร้อมวิชาและชุดข้อสอบของแต่ละรอบ */
export async function GET() {
  try {
    const terms = await db.examTerm.findMany({
      where: { status: "ARCHIVED" },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { questionSets: true } },
      },
    });
    const subjects = await db.subject.findMany({
      where: { status: "ARCHIVED" },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { questionSets: true } } },
    });
    return ok({
      terms: terms.map((t) => ({
        id: t.id,
        name: localizedToString(t.name),
        academicYear: t.academicYear,
        examDate: t.examDate,
        questionSetCount: t._count.questionSets,
      })),
      subjects: subjects.map((s) => ({
        id: s.id,
        code: s.code,
        name: localizedToString(s.name),
        color: s.color,
        icon: s.icon,
        questionSetCount: s._count.questionSets,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
