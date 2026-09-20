import { questionSetRepository } from "@/server/repositories/question-set-repository";
import { assertAdmin, handleApiError, ok } from "@/server/api-helpers";
import { updateQuestionSetSchema } from "@/lib/validation";

/** GET รายละเอียดเต็มชุดข้อสอบ (รวมเฉลย) สำหรับหน้าผู้ดูแลแก้ไข/พรีวิว */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertAdmin(req);
    const { id } = await params;
    const set = await questionSetRepository.findById(id);
    if (!set) return handleApiError(new Error("NOT_FOUND"));
    return ok({
      id: set.id,
      title: set.title,
      description: set.description,
      subjectId: set.subjectId,
      subjectCode: set.subject.code,
      topicId: set.topicId,
      termId: set.termId,
      difficulty: set.difficulty,
      recommendedMinutes: set.recommendedMinutes,
      status: set.status,
      version: set.version,
      shuffleQuestions: set.shuffleQuestions,
      shuffleOptions: set.shuffleOptions,
      revealMode: set.revealMode,
      questions: set.questions.map((q) => ({
        id: q.id,
        type: q.type,
        prompt: q.prompt,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation,
        rubric: q.rubric,
        points: q.points,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/** PATCH แก้เมทาดาทา / เปลี่ยนสถานะ (publish / archive) */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertAdmin(req);
    const { id } = await params;
    const body = updateQuestionSetSchema.parse(await req.json());
    const update: Record<string, unknown> = { ...body };
    if (body.status) {
      // ทุกครั้งที่เผยแพร่หลังแก้ไข เพิ่มเวอร์ชัน (versioning แยกตามรอบสอบด้วย termId)
      update.version = { increment: 1 };
    }
    await questionSetRepository.updateMeta(id, update);
    return ok({ updated: true });
  } catch (error) {
    return handleApiError(error);
  }
}

/** DELETE ลบชุดข้อสอบ (เฉพาะฉบับร่าง — เผยแพร่แล้วให้ archive แทน) */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertAdmin(req);
    const { id } = await params;
    const set = await questionSetRepository.findById(id);
    if (!set) return handleApiError(new Error("NOT_FOUND"));
    if (set.status === "PUBLISHED") {
      await questionSetRepository.archive(id);
      return ok({ archived: true });
    }
    await questionSetRepository.delete(id);
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
