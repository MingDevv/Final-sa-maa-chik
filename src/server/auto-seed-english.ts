import { db } from "@/lib/db";
import { ENGLISH_FUTURE_STUDY_GUIDE_MD } from "@/data/english-future-study-guide";
import { ENGLISH_FUTURE_QUESTIONS_DATA } from "@/data/english-future-questions";
import ENGLISH_FUTURE_APPLIED_DATA from "@/data/english-future-applied-questions.json";
import ENGLISH_FUTURE_SET3_DATA from "@/data/english-future-set3-questions.json";

export const ENGLISH_SUBJECT_CODE = "อ31101";
export const ENGLISH_QUESTION_SET_ID = "cmwhdrreg0006xj05df2kb4ke";

let isSeeding = false;
let hasSeededSuccessfully = false;

/**
 * ฟังก์ชันรับประกันว่าข้อมูลวิชาภาษาอังกฤษ (ชีตสรุป + ข้อสอบ 20 ข้อ + เอกสาร PDF)
 * จะถูกบันทึกและพร้อมใช้งานในฐานข้อมูลทันที แม้รันบน Vercel Production
 */
export async function ensureEnglishContent(): Promise<void> {
  if (hasSeededSuccessfully || isSeeding) return;
  isSeeding = true;

  try {
    // 1. ตรวจสอบ/สร้างรายวิชา อ31101
    let englishSubject = await db.subject.findUnique({
      where: { code: ENGLISH_SUBJECT_CODE },
    });

    if (!englishSubject) {
      englishSubject = await db.subject.create({
        data: {
          code: ENGLISH_SUBJECT_CODE,
          name: { th: "ภาษาอังกฤษ", en: "English" },
          color: "#7C3AED",
          icon: "languages",
          sortOrder: 8,
          status: "PUBLISHED",
        },
      });
    }

    // 2. ตรวจสอบ/อัปเดตชีตสรุปก่อนสอบ (Study Guide)
    const existingGuide = await db.studyGuide.findUnique({
      where: { subjectId: englishSubject.id },
    });

    if (!existingGuide) {
      await db.studyGuide.create({
        data: {
          subjectId: englishSubject.id,
          content: ENGLISH_FUTURE_STUDY_GUIDE_MD,
        },
      });
    }

    // 3. ตรวจสอบ/สร้าง Topic
    let topic = await db.topic.findFirst({
      where: { subjectId: englishSubject.id },
    });

    if (!topic) {
      topic = await db.topic.create({
        data: {
          subjectId: englishSubject.id,
          title: {
            th: "Future Tenses (Will, Be Going To, Future Continuous)",
            en: "Future Tenses",
          },
          sortOrder: 1,
          status: "PUBLISHED",
        },
      });
    }

    // 4. ตรวจสอบ/สร้าง QuestionSet 20 ข้อ
    let questionSet = await db.questionSet.findUnique({
      where: { id: ENGLISH_QUESTION_SET_ID },
      include: { _count: { select: { questions: true } } },
    });

    if (!questionSet) {
      // ลองค้นหาตามชื่อ/วิชา
      questionSet = await db.questionSet.findFirst({
        where: { subjectId: englishSubject.id, status: "PUBLISHED" },
        include: { _count: { select: { questions: true } } },
      });
    }

    if (!questionSet || questionSet._count.questions < 20) {
      const targetId = questionSet?.id || ENGLISH_QUESTION_SET_ID;

      if (!questionSet) {
        questionSet = await db.questionSet.create({
          data: {
            id: targetId,
            title: ENGLISH_FUTURE_QUESTIONS_DATA.title as never,
            description: ENGLISH_FUTURE_QUESTIONS_DATA.description,
            subjectId: englishSubject.id,
            topicId: topic.id,
            difficulty: "MEDIUM",
            recommendedMinutes: 25,
            status: "PUBLISHED",
            revealMode: "AFTER_SUBMIT",
          },
          include: { _count: { select: { questions: true } } },
        });
      }

      // ลบข้อเดิมที่อาจมีไม่ครบแล้วสร้างใหม่ให้ครบ 20 ข้อ
      await db.question.deleteMany({ where: { setId: questionSet.id } });

      for (const q of ENGLISH_FUTURE_QUESTIONS_DATA.questions) {
        await db.question.create({
          data: {
            setId: questionSet.id,
            type: "MCQ",
            prompt: q.prompt,
            options: q.options as never,
            answer: {
              kind: "MCQ",
              correctKeys: [q.answer.correctKey],
              correctKey: q.answer.correctKey,
            },
            explanation: q.explanation,
            points: 1,
            sortOrder: q.sortOrder,
          },
        });
      }
    }

    // 5. ลงทะเบียนเอกสาร PDF 3 ไฟล์ใน SourceDocument
    const pdfDocs = [
      {
        storageKey: "static/worksheet-future-tense.pdf",
        title: { th: "ใบงานแบบฝึกหัด Future Tenses 20 ข้อ (PDF)", en: "English Worksheet: Future Tenses" },
      },
      {
        storageKey: "static/will-going-to-future-cont.pdf",
        title: { th: "ชีทสรุป Will / Going to + Future Continuous Tense (PDF)", en: "Will / Going to + Future Continuous Summary" },
      },
      {
        storageKey: "static/will-be-going-to-key.pdf",
        title: { th: "WILL & BE GOING TO with Key (PDF)", en: "Will & Be Going To with Key" },
      },
    ];

    for (const doc of pdfDocs) {
      const existing = await db.sourceDocument.findFirst({
        where: { subjectId: englishSubject.id, storageKey: doc.storageKey },
      });
      if (!existing) {
        await db.sourceDocument.create({
          data: {
            subjectId: englishSubject.id,
            topicId: topic.id,
            storageKey: doc.storageKey,
            title: doc.title as never,
            status: "READY",
            mimeType: "application/pdf",
          },
        });
      }
    }

    // 6. ชุดที่ 2, 3 — สร้าง/อัปเดตตาม version ในไฟล์ JSON ไม่แตะชุดที่ 1
    await ensureExtraEnglishSets(englishSubject.id, topic.id);

    hasSeededSuccessfully = true;
  } catch (error) {
    console.warn("[auto-seed-english] Seeding encountered warning:", error);
  } finally {
    isSeeding = false;
  }
}

/**
 * ชุดข้อสอบอังกฤษเพิ่มเติม (ชุดที่ 2, 3, ...) — id คงที่ ห้ามมีคำว่า "english"
 * เพราะหน้า quiz มี fallback ของชุดที่ 1 ที่จับคำนั้น
 * แก้เนื้อหาในไฟล์ JSON แล้วเพิ่ม "version" → เว็บจะแทนข้อเก่าให้เองครั้งถัดไปที่มีคนเปิดหน้าวิชา
 */
type ExtraSetData = {
  version: number;
  title: { th: string; en?: string };
  description: string;
  recommendedMinutes: number;
  questions: Array<{
    prompt: string;
    options: Array<{ key: string; text: string }>;
    answer: { correctKey: string };
    explanation: string;
    points: number;
    sortOrder: number;
  }>;
};

export const ENGLISH_EXTRA_SETS: Array<{ id: string; data: ExtraSetData }> = [
  { id: "future-applied-set-2", data: ENGLISH_FUTURE_APPLIED_DATA },
  { id: "future-practice-set-3", data: ENGLISH_FUTURE_SET3_DATA },
];

function questionRows(setId: string, data: ExtraSetData) {
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

export async function ensureExtraEnglishSets(subjectId: string, topicId: string | null): Promise<void> {
  for (const { id, data } of ENGLISH_EXTRA_SETS) {
    try {
      const existing = await db.questionSet.findFirst({
        where: { OR: [{ id }, { subjectId, title: { path: ["th"], equals: data.title.th } }] },
        include: { _count: { select: { questions: true } } },
      });
      if (existing && existing.version >= data.version && existing._count.questions === data.questions.length) {
        continue;
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
              difficulty: "MEDIUM",
              recommendedMinutes: data.recommendedMinutes,
              status: "PUBLISHED",
              revealMode: "AFTER_SUBMIT",
              shuffleQuestions: false,
              shuffleOptions: false,
            },
          });
          await tx.question.createMany({ data: questionRows(id, data) });
        });
        continue;
      }

      // มีอยู่แล้วแต่เวอร์ชันเก่า → แทนข้อทั้งหมด (updateMany ล็อกแถวไว้ instance อื่นจะได้ไม่ทำซ้ำ)
      await db.$transaction(async (tx) => {
        const claimed = await tx.questionSet.updateMany({
          where: { id: existing.id, version: existing.version },
          data: { title: data.title as never, description: data.description, version: data.version },
        });
        if (claimed.count === 0) return;
        await tx.question.deleteMany({ where: { setId: existing.id } });
        await tx.question.createMany({ data: questionRows(existing.id, data) });
      });
    } catch (error) {
      // อีก instance อาจสร้างไปพร้อมกันแล้ว (id ชน) — ไม่เป็นไร
      console.warn(`[auto-seed-english] extra set ${id}:`, error);
    }
  }
}

/** Fallback ชุดข้อสอบ 20 ข้อสำหรับแสดงผลหน้ารายวิชา */
export function getEnglishQuestionSetFallback() {
  return [
    {
      id: ENGLISH_QUESTION_SET_ID,
      title: "แนวข้อสอบเก็บคะแนน: Future Simple & Future Continuous Tense (20 ข้อ)",
      topicId: "topic-english-future",
      topicTitle: "Future Tenses (Will, Be Going To, Future Continuous)",
      difficulty: "MEDIUM" as const,
      recommendedMinutes: 25,
      questionCount: 20,
    },
  ];
}

/** Fallback รายการเอกสารชีท PDF 3 เล่ม */
export function getEnglishDocumentsFallback() {
  return [
    {
      id: "doc-worksheet-future-tense",
      title: "ใบงานแบบฝึกหัด Future Tenses 20 ข้อ (PDF)",
      subjectId: "subject-english",
      topicId: null,
      storageKey: "static/worksheet-future-tense.pdf",
      pageCount: 1,
    },
    {
      id: "doc-will-going-to-future-cont",
      title: "ชีทสรุป Will / Going to + Future Continuous Tense (PDF)",
      subjectId: "subject-english",
      topicId: null,
      storageKey: "static/will-going-to-future-cont.pdf",
      pageCount: 19,
    },
    {
      id: "doc-will-be-going-to-key",
      title: "WILL & BE GOING TO with Key (PDF)",
      subjectId: "subject-english",
      topicId: null,
      storageKey: "static/will-be-going-to-key.pdf",
      pageCount: 3,
    },
  ];
}
