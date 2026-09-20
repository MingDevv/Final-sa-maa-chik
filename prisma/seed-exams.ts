/**
 * Seed ชุดข้อสอบฝึก "แนวข้อสอบปลายภาค" ครบทุกวิชาตามขอบเขตที่ประกาศ
 * - ฟิสิกส์ 20 ข้อ | วิทย์ชีวภาพ 50 ข้อ | ชีววิทยา 30 ข้อ
 * - ไทย 30 ข้อ | อังกฤษ 30 ข้อ | คณิตพื้นฐาน 20 ข้อ | คณิตเพิ่มเติม บทที่ 3 30 ข้อ
 * รัน: npm run seed:exams
 *
 * หมายเหตุความโปร่งใส: โจทย์ชุดนี้ "เรียบเรียงใหม่" ตามหัวข้อขอบเขตที่ประกาศ
 * (ไม่ใช่ข้อสอบจริง และไม่คัดลอกจากเอกสารต้นฉบับ)
 */
import { PrismaClient } from "@prisma/client";
import { localizedToString } from "../src/lib/types";
import type { ExamSetDef, ExamQ } from "./seed-exams/types";
import { physicsExam } from "./seed-exams/physics";
import { mathBasicExam } from "./seed-exams/math-basic";
import { mathAdvancedExam } from "./seed-exams/math-advanced";
import { biosciExam } from "./seed-exams/biosci";
import { biologyExam } from "./seed-exams/biology";
import { thaiExam } from "./seed-exams/thai";
import { englishExam } from "./seed-exams/english";

const db = new PrismaClient();

const EXAMS: ExamSetDef[] = [
  physicsExam,
  biosciExam,
  biologyExam,
  thaiExam,
  englishExam,
  mathBasicExam,
  mathAdvancedExam,
];

const KEY = ["A", "B", "C", "D", "E"];

/** แปลง ExamQ → ข้อมูลสร้าง Question ใน DB */
const toQuestionData = (q: ExamQ, index: number) => {
  const points = q.points ?? 1;
  const base = {
    prompt: q.prompt,
    explanation: q.explanation,
    points,
    sortOrder: index,
  };

  if (q.type === "SHORT_ANSWER") {
    const ans = q.answer as { accepts: string[]; normalize?: Record<string, boolean> };
    return { ...base, type: "SHORT_ANSWER" as const, answer: ans as never };
  }
  if (q.type === "WRITTEN") {
    const ans = q.answer as { finalAnswer: string; steps: string[] };
    return {
      ...base,
      type: "WRITTEN" as const,
      answer: ans as never,
      rubric: (q.rubric ?? null) as never,
    };
  }

  // MCQ (ค่าเริ่มต้น) — แนบตัวอักษร A–E ให้ตัวเลือกอัตโนมัติ
  const options = (q.options ?? []).map((text, i) => ({ key: KEY[i], text }));
  const correct = (Array.isArray(q.answer) ? q.answer : [q.answer as number]).map(
    (i) => KEY[i],
  );
  return {
    ...base,
    type: "MCQ" as const,
    options: options as never,
    answer: { kind: "MCQ", correctKeys: correct } as never,
  };
};

async function main() {
  console.log("seed-exams: เริ่ม...");

  const term = await db.examTerm.findFirst({ where: { status: "ACTIVE" } });

  for (const def of EXAMS) {
    const subject = await db.subject.findUnique({ where: { code: def.subjectCode } });
    if (!subject) {
      console.log(`  ข้าม ${def.title} (ไม่พบวิชา ${def.subjectCode})`);
      continue;
    }

    const existing = await db.questionSet.findFirst({
      where: { subjectId: subject.id, title: { path: ["th"], equals: def.title } },
    });
    if (existing) {
      console.log(`  มีอยู่แล้ว: ${def.title} (${existing.id})`);
      continue;
    }

    const topic = def.topicName
      ? await db.topic.findFirst({
          where: { subjectId: subject.id, title: { path: ["th"], equals: def.topicName } },
        })
      : null;

    const created = await db.questionSet.create({
      data: {
        title: { th: def.title },
        description: def.description,
        subjectId: subject.id,
        topicId: topic?.id ?? null,
        termId: term?.id ?? null,
        difficulty: def.difficulty,
        recommendedMinutes: def.minutes,
        shuffleQuestions: true,
        shuffleOptions: true,
        revealMode: "AFTER_SUBMIT",
        status: "PUBLISHED",
        questions: {
          create: def.questions.map((q, i) => toQuestionData(q, i)),
        },
      },
    });

    console.log(
      `  สร้างชุด: ${def.title} — ${def.questions.length} ข้อ (id=${created.id})`,
    );
  }

  // สรุปจำนวนชุด/ข้อที่เผยแพร่
  const publishedSets = await db.questionSet.findMany({
    where: { status: "PUBLISHED" },
    select: { title: true, _count: { select: { questions: true } } },
  });
  for (const s of publishedSets) {
    console.log(`  [สรุป] ${localizedToString(s.title)} — ${s._count.questions} ข้อ`);
  }
  console.log("seed-exams: เสร็จสิ้น");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
