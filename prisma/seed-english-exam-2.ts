// Seed ชุดข้อสอบภาษาอังกฤษชุดที่ 2 (แนวประยุกต์) — เพิ่มเป็นชุดใหม่ ไม่แตะชุดเดิม
// รัน: npm run seed:english2  (รันซ้ำได้ จะลบข้อเก่าของชุดนี้แล้วใส่ใหม่)
import fs from "node:fs";
import path from "node:path";
import { db } from "../src/lib/db";

interface QuestionSetFile {
  title: { th: string; en?: string };
  description?: string;
  recommendedMinutes?: number;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  questions: Array<{
    prompt: string;
    options: Array<{ key: string; text: string }>;
    answer: { correctKey: string };
    explanation: string;
    points?: number;
    sortOrder?: number;
  }>;
}

async function main() {
  const file = path.resolve(__dirname, "../src/data/english-future-applied-questions.json");
  const data: QuestionSetFile = JSON.parse(fs.readFileSync(file, "utf-8"));

  const subject = await db.subject.findUnique({ where: { code: "อ31101" } });
  if (!subject) throw new Error("ยังไม่มีวิชา อ31101 — รัน npm run seed:english ก่อน");

  const topic = await db.topic.findFirst({ where: { subjectId: subject.id }, orderBy: { sortOrder: "asc" } });
  const term = await db.examTerm.findFirst({ where: { status: "ACTIVE" } });

  const setData = {
    title: data.title,
    description: data.description,
    subjectId: subject.id,
    topicId: topic?.id ?? null,
    termId: term?.id ?? null,
    difficulty: data.difficulty ?? "MEDIUM",
    recommendedMinutes: data.recommendedMinutes ?? 25,
    status: "PUBLISHED" as const,
    revealMode: "AFTER_SUBMIT" as const,
    shuffleQuestions: false,
    shuffleOptions: false,
  };

  const existing = await db.questionSet.findFirst({
    where: { subjectId: subject.id, title: { path: ["th"], equals: data.title.th } },
  });

  const set = existing
    ? await db.questionSet.update({ where: { id: existing.id }, data: setData })
    : await db.questionSet.create({ data: setData });

  await db.$transaction([
    db.question.deleteMany({ where: { setId: set.id } }),
    ...data.questions.map((q, i) =>
      db.question.create({
        data: {
          setId: set.id,
          type: "MCQ",
          prompt: q.prompt,
          options: q.options,
          answer: { kind: "MCQ", correctKeys: [q.answer.correctKey], correctKey: q.answer.correctKey },
          explanation: q.explanation,
          points: q.points ?? 1,
          sortOrder: q.sortOrder ?? i + 1,
        },
      }),
    ),
  ]);

  const count = await db.question.count({ where: { setId: set.id } });
  console.log(`✅ ${data.title.th}\n   QuestionSet ID: ${set.id} — ${count} ข้อ`);
}

main()
  .catch((err) => {
    console.error("❌ Seed ไม่สำเร็จ:", err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
