import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { assertAdmin, fail, handleApiError, ok } from "@/server/api-helpers";
import { validateImport } from "@/lib/exam/import-validation";
import { asLocalizedText } from "@/lib/types";

/** cast ค่าที่จะเก็บลงคอลัมน์ JSON ให้พิมพ์ถูกต้อง */
const asJson = (v: unknown): Prisma.InputJsonValue => v as Prisma.InputJsonValue;

/**
 * Export/Import เนื้อหาเป็น JSON เพื่อย้ายข้อมูลระหว่างระบบ
 * Export: วิชา + หัวข้อ + ชุดข้อสอบ (พร้อมโจทย์และเฉลย)
 * Import: สร้าง/อัปเดตตามรหัสวิชา (subject code) และรหัสชุด (id ถ้ามี)
 */

/** GET ส่งออกเนื้อหาทั้งหมดเป็นไฟล์ JSON */
export async function GET(req: Request) {
  try {
    assertAdmin(req);
    const [subjects, topics, sets] = await Promise.all([
      db.subject.findMany({ orderBy: { sortOrder: "asc" } }),
      db.topic.findMany({ orderBy: { sortOrder: "asc" } }),
      db.questionSet.findMany({
        include: {
          questions: { orderBy: { sortOrder: "asc" } },
          subject: { select: { code: true } },
          topic: { select: { title: true } },
        },
      }),
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
        // ส่งชื่อบท (ไม่ใช่ id) เพื่อให้นำเข้าอีกระบบแล้วผูกบทถูก
        topicTitle: set.topic ? asLocalizedText(set.topic.title).th : undefined,
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

/** หาบทในวิชาจากชื่อ (ภาษาไทย) — ไม่มีก็สร้างใหม่ ใช้ cache กันสร้างซ้ำในไฟล์เดียวกัน */
async function resolveTopic(
  tx: Prisma.TransactionClient,
  cache: Map<string, string>,
  subjectId: string,
  title: string,
  counter: { created: number },
): Promise<string> {
  const key = `${subjectId}::${title.trim()}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const topics = await tx.topic.findMany({ where: { subjectId }, select: { id: true, title: true, sortOrder: true } });
  const found = topics.find((t) => asLocalizedText(t.title).th.trim() === title.trim());
  const id =
    found?.id ??
    (
      await tx.topic.create({
        data: {
          subjectId,
          title: asJson({ th: title.trim() }),
          sortOrder: topics.reduce((m, t) => Math.max(m, t.sortOrder), -1) + 1,
        },
      })
    ).id;
  if (!found) counter.created += 1;
  cache.set(key, id);
  return id;
}

/**
 * POST นำเข้าเนื้อหาจาก JSON
 * 1) ตรวจทั้งไฟล์ก่อน — ผิดแม้ข้อเดียว ไม่บันทึกอะไรเลย และบอกว่าผิดตรงไหน
 * 2) บันทึกทั้งหมดใน transaction เดียว (สำเร็จทั้งหมด หรือไม่บันทึกเลย)
 * 3) topicTitle → ผูก/สร้างบทให้เอง (ระบบ "จุดอ่อนรายบท" ต้องใช้)
 */
export async function POST(req: Request) {
  try {
    assertAdmin(req);
    const check = validateImport(await req.json().catch(() => null));
    if (!check.ok) {
      return fail(`ไฟล์ยังไม่ถูกต้อง ${check.errors.length} จุด — ยังไม่ได้บันทึกอะไร`, 422, check.errors);
    }
    const body = check.data;

    // รหัสวิชาที่ชุดข้อสอบอ้างถึงต้องมีอยู่จริง (หรืออยู่ใน subjects ของไฟล์นี้)
    const fileCodes = new Set((body.subjects ?? []).map((s) => s.code));
    const wantCodes = [...new Set((body.questionSets ?? []).map((s) => s.subjectCode).filter(Boolean) as string[])];
    const known = new Set(
      (await db.subject.findMany({ where: { code: { in: wantCodes } }, select: { code: true } })).map((s) => s.code),
    );
    const unknown = wantCodes.filter((c) => !known.has(c) && !fileCodes.has(c));
    if (unknown.length) {
      return fail(`ไม่พบรหัสวิชา ${unknown.join(", ")} ในระบบ — ยังไม่ได้บันทึกอะไร`, 422, [
        `รหัสวิชาที่มีในระบบดูได้ที่แท็บ "วิชา" (เช่น ว31201)`,
      ]);
    }

    const imported = await db.$transaction(
      async (tx) => {
        const count = { subjects: 0, topics: { created: 0 }, sets: 0 };
        const topicCache = new Map<string, string>();

        for (const s of body.subjects ?? []) {
          const name = asLocalizedText(s.name);
          const existing = await tx.subject.findUnique({ where: { code: s.code } });
          const subject = existing
            ? await tx.subject.update({
                where: { code: s.code },
                data: { name: asJson(name), color: s.color ?? existing.color, icon: s.icon ?? existing.icon },
              })
            : await tx.subject.create({
                data: {
                  code: s.code,
                  name: asJson(name),
                  color: s.color ?? "#9F1239",
                  icon: s.icon ?? "book",
                  sortOrder: s.sortOrder ?? 99,
                },
              });
          count.subjects += 1;
          for (const t of s.topics ?? []) {
            await resolveTopic(tx, topicCache, subject.id, asLocalizedText(t.title).th, count.topics);
          }
        }

        for (const set of body.questionSets ?? []) {
          const subject = set.subjectCode
            ? await tx.subject.findUnique({ where: { code: set.subjectCode } })
            : await tx.subject.findUnique({ where: { id: set.subjectId! } });
          if (!subject) throw new Error("NOT_FOUND");

          // บท: ใช้ชื่อบทก่อน / topicId ใช้ได้เฉพาะถ้าเป็นบทของวิชานี้ในระบบนี้จริง
          let topicId: string | null = null;
          if (set.topicTitle) {
            topicId = await resolveTopic(tx, topicCache, subject.id, set.topicTitle, count.topics);
          } else if (set.topicId) {
            const t = await tx.topic.findFirst({ where: { id: set.topicId, subjectId: subject.id } });
            topicId = t?.id ?? null;
          }
          const termOk = set.termId ? await tx.examTerm.findUnique({ where: { id: set.termId } }) : null;

          await tx.questionSet.create({
            data: {
              title: asJson(asLocalizedText(set.title)),
              description: set.description ?? undefined,
              subjectId: subject.id,
              topicId,
              termId: termOk?.id ?? null,
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
                  options: q.options ? asJson(q.options) : undefined,
                  answer: asJson(q.answer),
                  explanation: q.explanation ?? undefined,
                  rubric: q.rubric ? asJson(q.rubric) : undefined,
                  points: q.points ?? 1,
                  sortOrder: i,
                })),
              },
            },
          });
          count.sets += 1;
        }
        return { subjects: count.subjects, topics: count.topics.created, sets: count.sets };
      },
      { timeout: 60_000 },
    );

    return ok(imported);
  } catch (error) {
    return handleApiError(error);
  }
}
