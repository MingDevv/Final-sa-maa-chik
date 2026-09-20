import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { assertAdmin, handleApiError, ok } from "@/server/api-helpers";
import { asLocalizedText } from "@/lib/types";

/** cast ค่าที่จะเก็บลงคอลัมน์ JSON ให้พิมพ์ถูกต้อง */
const asJson = (v: unknown): Prisma.InputJsonValue => v as Prisma.InputJsonValue;

/**
 * Export/Import เนื้อหาเป็น JSON เพื่อย้ายข้อมูลระหว่างระบบ
 * Export: วิชา + หัวข้อ + ชุดข้อสอบ (พร้อมโจทย์และเฉลย)
 * Import: สร้าง/อัปเดตตามรหัสวิชา (subject code) และรหัสชุด (id ถ้ามี)
 */

interface ImportPayload {
  subjects?: Array<{
    code: string;
    name: unknown;
    color?: string;
    icon?: string;
    sortOrder?: number;
    topics?: Array<{ title: unknown; description?: string; sortOrder?: number }>;
  }>;
  questionSets?: Array<{
    id?: string;
    subjectCode?: string;
    subjectId?: string;
    title: unknown;
    description?: string;
    topicId?: string | null;
    termId?: string | null;
    difficulty?: "EASY" | "MEDIUM" | "HARD";
    recommendedMinutes?: number;
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
    revealMode?: "AFTER_EACH" | "AFTER_SUBMIT";
    questions: Array<{
      type: "MCQ" | "SHORT_ANSWER" | "WRITTEN";
      prompt: string;
      options?: unknown;
      answer: unknown;
      explanation?: string;
      rubric?: unknown;
      points?: number;
    }>;
  }>;
}

/** GET ส่งออกเนื้อหาทั้งหมดเป็นไฟล์ JSON */
export async function GET(req: Request) {
  try {
    assertAdmin(req);
    const [subjects, topics, sets] = await Promise.all([
      db.subject.findMany({ orderBy: { sortOrder: "asc" } }),
      db.topic.findMany({ orderBy: { sortOrder: "asc" } }),
      db.questionSet.findMany({ include: { questions: { orderBy: { sortOrder: "asc" } }, subject: { select: { code: true } } } }),
    ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      version: 1,
      subjects: subjects.map((s) => ({
        code: s.code,
        name: s.name,
        color: s.color,
        icon: s.icon,
        sortOrder: s.sortOrder,
        topics: topics
          .filter((t) => t.subjectId === s.id)
          .map((t) => ({ title: t.title, description: t.description, sortOrder: t.sortOrder })),
      })),
      questionSets: sets.map((set) => ({
        subjectCode: set.subject.code,
        title: set.title,
        description: set.description,
        difficulty: set.difficulty,
        recommendedMinutes: set.recommendedMinutes,
        shuffleQuestions: set.shuffleQuestions,
        shuffleOptions: set.shuffleOptions,
        revealMode: set.revealMode,
        questions: set.questions.map((q) => ({
          type: q.type,
          prompt: q.prompt,
          options: q.options,
          answer: q.answer,
          explanation: q.explanation,
          rubric: q.rubric,
          points: q.points,
        })),
      })),
    };

    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="final-exam-prep-export.json"',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/** POST นำเข้าเนื้อหาจาก JSON */
export async function POST(req: Request) {
  try {
    assertAdmin(req);
    const body = (await req.json()) as ImportPayload;
    const imported = { subjects: 0, topics: 0, sets: 0 };

    for (const s of body.subjects ?? []) {
      const name = asLocalizedText(s.name);
      if (!name.th) continue;
      const existing = await db.subject.findUnique({ where: { code: s.code } });
      const subject = existing
        ? await db.subject.update({
            where: { code: s.code },
            data: { name: asJson(name), color: s.color ?? existing.color, icon: s.icon ?? existing.icon },
          })
        : await db.subject.create({
            data: {
              code: s.code,
              name: asJson(name),
              color: s.color ?? "#9F1239",
              icon: s.icon ?? "book",
              sortOrder: s.sortOrder ?? 99,
            },
          });
      imported.subjects += 1;

      let order = 0;
      for (const t of s.topics ?? []) {
        const title = asLocalizedText(t.title);
        if (!title.th) continue;
        await db.topic.create({
          data: {
            subjectId: subject.id,
            title: asJson(title),
            description: t.description,
            sortOrder: t.sortOrder ?? order++,
          },
        });
        imported.topics += 1;
      }
    }

    for (const set of body.questionSets ?? []) {
      let subjectId = set.subjectId ?? null;
      if (!subjectId && set.subjectCode) {
        const subject = await db.subject.findUnique({ where: { code: set.subjectCode } });
        subjectId = subject?.id ?? null;
      }
      if (!subjectId) continue;
      const created = await db.questionSet.create({
        data: {
          title: asJson(set.title),
          description: set.description,
          subjectId,
          topicId: set.topicId ?? null,
          termId: set.termId ?? null,
          difficulty: set.difficulty ?? "MEDIUM",
          recommendedMinutes: set.recommendedMinutes ?? 30,
          shuffleQuestions: set.shuffleQuestions ?? false,
          shuffleOptions: set.shuffleOptions ?? false,
          revealMode: set.revealMode ?? "AFTER_SUBMIT",
          status: "DRAFT",
          questions: {
            create: set.questions.map((q, i) => ({
              type: q.type,
              prompt: q.prompt,
              options: q.options === undefined ? undefined : asJson(q.options),
              answer: asJson(q.answer),
              explanation: q.explanation,
              rubric: q.rubric === undefined ? undefined : asJson(q.rubric),
              points: q.points ?? 1,
              sortOrder: i,
            })),
          },
        },
      });
      imported.sets += 1;
      void created;
    }

    return ok(imported);
  } catch (error) {
    return handleApiError(error);
  }
}
