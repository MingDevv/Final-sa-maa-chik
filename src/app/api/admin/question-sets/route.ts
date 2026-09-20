import { questionSetService } from "@/server/services/question-set-service";
import { questionSetRepository, questionRepository } from "@/server/repositories/question-set-repository";
import { assertAdmin, handleApiError, ok, searchParamsToObject } from "@/server/api-helpers";
import { createQuestionSchema, createQuestionSetSchema } from "@/lib/validation";

/** GET รายการชุดข้อสอบทั้งหมดสำหรับผู้ดูแล */
export async function GET(req: Request) {
  try {
    assertAdmin(req);
    const p = searchParamsToObject(req.url);
    const sets = await questionSetService.listForAdmin({
      subjectId: p.subjectId,
      status: p.status as never,
    });
    return ok(sets);
  } catch (error) {
    return handleApiError(error);
  }
}

/** POST สร้างชุดข้อสอบใหม่พร้อมโจทย์ */
export async function POST(req: Request) {
  try {
    assertAdmin(req);
    const body = createQuestionSetSchema.parse(await req.json());
    const created = await questionSetRepository.create({
      title: body.title,
      description: body.description,
      subjectId: body.subjectId,
      topicId: body.topicId ?? null,
      termId: body.termId ?? null,
      difficulty: body.difficulty,
      recommendedMinutes: body.recommendedMinutes,
      shuffleQuestions: body.shuffleQuestions,
      shuffleOptions: body.shuffleOptions,
      revealMode: body.revealMode,
      status: "DRAFT",
      questions: body.questions.map((q) => ({
        type: q.type,
        prompt: q.prompt,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation,
        rubric: q.rubric,
        points: q.points,
        imageKey: q.imageKey,
      })),
    });
    return ok({ id: created.id, questionCount: created.questions.length });
  } catch (error) {
    return handleApiError(error);
  }
}

/** PUT เพิ่มโจทย์เข้าชุดที่มีอยู่ */
export async function PUT(req: Request) {
  try {
    assertAdmin(req);
    const body = await req.json();
    const { setId } = body as { setId?: string };
    if (!setId) return handleApiError(new Error("NOT_FOUND"));
    const q = createQuestionSchema.parse(body);
    const count = await questionSetService.countDraftQuestions(setId);
    const created = await questionRepository.create(setId, {
      type: q.type,
      prompt: q.prompt,
      options: q.options,
      answer: q.answer,
      explanation: q.explanation,
      rubric: q.rubric,
      points: q.points,
      imageKey: q.imageKey,
    }, count);
    return ok({ id: created.id });
  } catch (error) {
    return handleApiError(error);
  }
}
