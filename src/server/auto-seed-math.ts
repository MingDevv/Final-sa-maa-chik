import { db } from "@/lib/db";
import {
  MATH_RELATIONS_GUIDE_TITLE,
  MATH_RELATIONS_STUDY_GUIDE_MD,
} from "@/data/math-relations-study-guide";
import MATH_RELATIONS_SET1 from "@/data/math-relations-set1-questions.json";
import MATH_RELATIONS_SET2 from "@/data/math-relations-set2-questions.json";

/**
 * คณิตศาสตร์ บทที่ 1 ความสัมพันธ์ (1.1–1.6) — ชีตสรุป + ข้อสอบ 2 ชุด ลงวิชา ค31201
 * เว็บสร้าง/อัปเดตเองตอนมีคนเปิดหน้าแรก/หน้าวิชา/ชีตสรุป/ข้อสอบ (รันบน Vercel ได้โดยไม่ต้องต่อ DB เอง)
 * แก้ข้อสอบ: แก้ไฟล์ JSON แล้วเพิ่ม "version" | แก้ชีต: แก้ไฟล์ .ts ได้เลย (อัปเดตเฉพาะชีตที่ขึ้นต้นด้วยหัวข้อเดียวกัน)
 */
export const MATH_SUBJECT_CODE = "ค31201";
export const MATH_SET_ID_PREFIX = "math-relations-";

type SetData = {
  version: number;
  title: { th: string; en?: string };
  description: string;
  recommendedMinutes: number;
  difficulty: string;
  questions: Array<{
    prompt: string;
    options: Array<{ key: string; text: string }>;
    answer: { correctKey: string };
    explanation: string;
    points: number;
    sortOrder: number;
  }>;
};

export const MATH_RELATIONS_SETS: Array<{ id: string; data: SetData }> = [
  { id: "math-relations-set-1", data: MATH_RELATIONS_SET1 },
  { id: "math-relations-set-2", data: MATH_RELATIONS_SET2 },
];

const GUIDE_HEADING = `# ${MATH_RELATIONS_GUIDE_TITLE}`;
const TOPIC_TITLE_TH = "ความสัมพันธ์ (คู่อันดับ → ตัวผกผัน)";

let isSeeding = false;
let hasSeededSuccessfully = false;

export function isMathRelationsSetId(setId: string): boolean {
  return setId.startsWith(MATH_SET_ID_PREFIX);
}

export async function ensureMathRelationsContent(): Promise<void> {
  if (hasSeededSuccessfully || isSeeding) return;
  isSeeding = true;
  try {
    const subject = await db.subject.findUnique({
      where: { code: MATH_SUBJECT_CODE },
      include: { studyGuide: true },
    });
    if (!subject) return; // ยังไม่มีวิชา (เช่น DB ใหม่เอี่ยม) — ไม่สร้างวิชาเอง

    // ชีตสรุป: สร้างถ้ายังไม่มี / อัปเดตถ้าเป็นชีตของเราเองแต่เนื้อหาเก่า (ไม่ทับชีตที่แอดมินเขียนเรื่องอื่น)
    const guide = subject.studyGuide;
    if (!guide || !guide.content.trim()) {
      await db.studyGuide.upsert({
        where: { subjectId: subject.id },
        create: { subjectId: subject.id, content: MATH_RELATIONS_STUDY_GUIDE_MD },
        update: { content: MATH_RELATIONS_STUDY_GUIDE_MD },
      });
    } else if (guide.content.startsWith(GUIDE_HEADING) && guide.content !== MATH_RELATIONS_STUDY_GUIDE_MD) {
      await db.studyGuide.update({
        where: { subjectId: subject.id },
        data: { content: MATH_RELATIONS_STUDY_GUIDE_MD },
      });
    }

    // หาหัวข้อของเรา (ถ้ามีซ้ำจากการ seed พร้อมกันหลาย instance → เก็บอันแรก ย้ายชุดข้อสอบมา แล้วลบที่ซ้ำ)
    const topics = await db.topic.findMany({
      where: { subjectId: subject.id, title: { path: ["th"], equals: TOPIC_TITLE_TH } },
      orderBy: { createdAt: "asc" },
    });
    let topic = topics[0] ?? null;
    if (topic && topics.length > 1) {
      const dupIds = topics.slice(1).map((t) => t.id);
      await db.questionSet.updateMany({ where: { topicId: { in: dupIds } }, data: { topicId: topic.id } });
      await db.sourceDocument.updateMany({ where: { topicId: { in: dupIds } }, data: { topicId: topic.id } });
      await db.topic.deleteMany({ where: { id: { in: dupIds } } });
    }
    if (!topic) {
      topic = await db.topic.create({
        data: {
          subjectId: subject.id,
          title: { th: TOPIC_TITLE_TH, en: "Relations" },
          sortOrder: 1,
          status: "PUBLISHED",
        },
      });
    }

    // สร้างชุดท้ายก่อน → ชุดที่ 1 มี updatedAt ใหม่สุด ขึ้นบนสุดในหน้าวิชา (เรียง updatedAt desc)
    for (const { id, data } of [...MATH_RELATIONS_SETS].reverse()) {
      await ensureSet(id, data, subject.id, topic.id);
    }
    hasSeededSuccessfully = true;
  } catch (error) {
    console.warn("[auto-seed-math] Seeding encountered warning:", error);
  } finally {
    isSeeding = false;
  }
}

function questionRows(setId: string, data: SetData) {
  return data.questions.map((q) => ({
    setId,
    type: "MCQ" as const,
    prompt: q.prompt,
    options: q.options as never,
    answer: { kind: "MCQ", correctKeys: [q.answer.correctKey], correctKey: q.answer.correctKey },
    explanation: q.explanation,
    points: q.points,
    sortOrder: q.sortOrder,
  }));
}

function difficultyOf(data: SetData) {
  return data.difficulty === "HARD" || data.difficulty === "EASY" ? data.difficulty : "MEDIUM";
}

async function ensureSet(id: string, data: SetData, subjectId: string, topicId: string) {
  try {
    const existing = await db.questionSet.findUnique({
      where: { id },
      include: { _count: { select: { questions: true } } },
    });
    if (existing && existing.version >= data.version && existing._count.questions === data.questions.length) {
      return;
    }

    if (!existing) {
      const term = await db.examTerm.findFirst({ where: { status: "ACTIVE" } });
      await db.$transaction(async (tx) => {
        await tx.questionSet.create({
          data: {
            id,
            title: data.title as never,
            description: data.description,
            version: data.version,
            subjectId,
            topicId,
            termId: term?.id ?? null,
            difficulty: difficultyOf(data),
            recommendedMinutes: data.recommendedMinutes,
            status: "PUBLISHED",
            revealMode: "AFTER_SUBMIT",
            shuffleQuestions: false,
            shuffleOptions: false,
          },
        });
        await tx.question.createMany({ data: questionRows(id, data) });
      });
      return;
    }

    // เวอร์ชันเก่า → แทนข้อทั้งหมด (updateMany ล็อกแถวไว้ instance อื่นจะได้ไม่ทำซ้ำ)
    await db.$transaction(async (tx) => {
      const claimed = await tx.questionSet.updateMany({
        where: { id, version: existing.version },
        data: {
          title: data.title as never,
          description: data.description,
          version: data.version,
          difficulty: difficultyOf(data),
          recommendedMinutes: data.recommendedMinutes,
        },
      });
      if (claimed.count === 0) return;
      await tx.question.deleteMany({ where: { setId: id } });
      await tx.question.createMany({ data: questionRows(id, data) });
    });
  } catch (error) {
    // อีก instance อาจสร้างไปพร้อมกันแล้ว (id ชน) — ไม่เป็นไร
    console.warn(`[auto-seed-math] set ${id}:`, error);
  }
}
