/**
 * Seed ชุดข้อสอบวันที่ 2 — ผูก term "final-m4-day-2" เสมอ
 * - คณิตเพิ่มเติม 30 (เขียน 13) — publish
 * - เคมี 30/30 คะแนน — publish
 * - ดาราศาสตร์ 30 MCQ 5 ตัวเลือก + 4 อัตนัย (rubric) — publish
 * - สังคม 40 ตามสัดส่วน 8/6/8/10/8 — publish
 * - อังกฤษอ่าน-เขียน — DRAFT (รอยืนยันจำนวนข้อจากผู้ดูแล)
 * ทุกชุดมี metadata: sourceQuestionCount / actualQuestionCount / sourceFiles / coverageByTopic / reviewStatus
 * รัน: npm run seed:exams:day2
 */
import { PrismaClient } from "@prisma/client";
import type { ExamSetDef, ExamQ } from "./seed-exams/types";
import { chemExam } from "./seed-exams-day2/chem";
import { astroExam } from "./seed-exams-day2/astro";
import { socialExam } from "./seed-exams-day2/social";
import { mathDay2Exam } from "./seed-exams-day2/math";
import { englishExam } from "./seed-exams-day2/english";

const db = new PrismaClient();
const B = "\\\\";

type Day2Def = ExamSetDef & {
  publish: boolean;
  sourceQuestionCount: number | null; // null = ต้นทางไม่ระบุ (รอยืนยัน)
  sourceFiles: string[];
  coverageByTopic: string;
};

const EXAMS: Day2Def[] = [
  {
    ...mathDay2Exam,
    publish: true,
    sourceQuestionCount: 30,
    sourceFiles: ["แนวคณิตเพิ่มเติม/แนวคณิต.txt", "แนวคณิตเพิ่มเติม/The_Algebra_Blueprint.pdf"],
    coverageByTopic:
      "3.1-3.2 (4) · 3.3-3.5 (9) · 3.6-3.7 (7) · 3.8 (4) · 3.9 (6) · 3.10-3.11 (6) — เขียน 13 ข้อ",
  },
  {
    ...chemExam,
    publish: true,
    sourceQuestionCount: 30,
    sourceFiles: ["แนวเคมี/เคมี.jpg", "แนวเคมี/สรุปแนวสอบเคมีม4.pdf"],
    coverageByTopic:
      "ชื่อ-สูตรไอออนิก (4) · Born-Haber (4) · ละลาย/ตะกอน (4) · ชื่อโคเวเลนต์ (3) · Lewis-VSEPR (4) · พลังงานพันธะ (2) · ร่างตาข่าย (2) · โลหะ (2) · เปรียบเทียบสมบัติ (3) · IMF (2)",
  },
  {
    ...astroExam,
    publish: true,
    sourceQuestionCount: 34,
    sourceFiles: ["แนวดาราศาตร์/ดาราศาตร๋.jpg", "แนวดาราศาสตร์/สรุปแนวสอบดาราศาสตร์ม4.pdf"],
    coverageByTopic:
      "โครงสร้างโลก+ศัพท์ (8) · ทวีปเลื่อน Wegener (7) · seafloor spreading/plate tectonics (15 รวมอัตนัย) · อ่านภาพตัดขวาง (อัตนัย 1) — ปรนัย 30 (5 ตัวเลือก) + อัตนัย 4 (rubric)",
  },
  {
    ...socialExam,
    publish: true,
    sourceQuestionCount: 40,
    sourceFiles: [
      "แนวสังคม/แนวข้อสอบติวเข้มสังคม 31101.pdf",
      "แนวสังคม/5. พระไตรปิฎก.pdf",
      "แนวสังคม/7. พระไตรปิฏก .pdf",
      "แนวสังคม/8. การเจริญปัญญา.pdf",
      "แนวสังคม/9.หน้าที่ และมารยาทชาวพุทธ.pdf",
    ],
    coverageByTopic: "ไตรปิฎก-ไตรลักษณ์ 8 · สติปัฏฐาน/พรหมวิหาร 6 · โยนิโสมนสิการ 8 · หน้าที่ชาวพุทธ 10 · มารยาท 8",
  },
  {
    ...englishExam,
    publish: false, // ต้นทางยังไม่ระบุจำนวนข้อ → DRAFT รอยืนยัน
    sourceQuestionCount: null,
    sourceFiles: [
      "แนวอังกฤษอ่านเขียน/อังกฤษ (1).jpg",
      "แนวอังกฤษอ่านเขียน/อังกฤษ (2).jpg",
      "แนวอังกฤษอ่านเขียน/อังกฤษ (3).jpg",
      "แนวอังกฤษอ่านเขียน/อังกฤษ (4).jpg",
      "แนวอังกฤษอ่านเขียน/อังกฤษ (5).jpg",
      "แนวอังกฤษอ่านเขียน/อังกฤษ.png",
    ],
    coverageByTopic: "Vocab Unit 1 (5) · Unit 2 (5) · Unit 3 (6) · Unit 4 (4) · Reading (4) — รอผู้ดูแลยืนยันจำนวนข้อก่อน publish",
  },
];

const KEY = ["A", "B", "C", "D", "E"];

const toQuestionData = (q: ExamQ, index: number) => {
  const base = {
    prompt: q.prompt,
    explanation: q.explanation,
    points: q.points ?? 1,
    sortOrder: index,
  };
  if (q.type === "WRITTEN") {
    const ans = q.answer as { finalAnswer: string; steps: string[] };
    return {
      ...base,
      type: "WRITTEN" as const,
      answer: ans as never,
      rubric: (q.rubric ?? null) as never,
    };
  }
  const options = (q.options ?? []).map((text, i) => ({ key: KEY[i], text }));
  const correct = (Array.isArray(q.answer) ? q.answer : [q.answer as number]).map((i) => KEY[i]);
  return {
    ...base,
    type: "MCQ" as const,
    options: options as never,
    answer: { kind: "MCQ", correctKeys: correct } as never,
  };
};

async function main() {
  console.log("seed-exams-day2: เริ่ม...");
  const term = await db.examTerm.findUnique({ where: { id: "final-m4-day-2" } });
  if (!term) {
    console.error("ไม่พบ term final-m4-day-2 — รัน npm run seed:day2 ก่อน");
    process.exit(1);
  }

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

    const actualCount = def.questions.length;
    const isApproved =
      def.publish && (def.sourceQuestionCount === null || actualCount === def.sourceQuestionCount);
    const metadata = {
      sourceQuestionCount: def.sourceQuestionCount,
      actualQuestionCount: actualCount,
      sourceFiles: def.sourceFiles,
      coverageByTopic: def.coverageByTopic,
      reviewStatus: isApproved ? "approved" : "awaiting-review",
      reviewedBy: isApproved ? "audit-gate" : null,
      reviewedAt: isApproved ? new Date().toISOString() : null,
      needsConfirmation: def.sourceQuestionCount === null,
    };

    // ตรวจจำนวนตามแผน: ถ้าต้นทางระบุจำนวน ต้องตรงก่อน publish
    if (def.publish && def.sourceQuestionCount !== null && actualCount !== def.sourceQuestionCount) {
      console.error(
        `  ⛔ ${def.title}: actual ${actualCount} ≠ source ${def.sourceQuestionCount} — ตั้งเป็น DRAFT`,
      );
    }
    const status: "PUBLISHED" | "DRAFT" =
      def.publish && (def.sourceQuestionCount === null || actualCount === def.sourceQuestionCount)
        ? "PUBLISHED"
        : "DRAFT";

    const created = await db.questionSet.create({
      data: {
        title: lt(def.title),
        description: def.description,
        subjectId: subject.id,
        topicId: topic?.id ?? null,
        termId: term.id, // ผูก term วันที่ 2 เสมอ
        difficulty: def.difficulty,
        recommendedMinutes: def.minutes,
        shuffleQuestions: true,
        shuffleOptions: true,
        revealMode: "AFTER_SUBMIT",
        status,
        metadata: metadata as never,
        questions: {
          create: def.questions.map((q, i) => toQuestionData(q, i)),
        },
      },
    });
    console.log(
      `  สร้างชุด: ${def.title} — ${actualCount} ข้อ [${status}] (id=${created.id})`,
    );
  }
  console.log("seed-exams-day2: เสร็จสิ้น");
}

const lt = (th: string, en?: string) => ({ th, ...(en ? { en } : {}) });

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
void B;
