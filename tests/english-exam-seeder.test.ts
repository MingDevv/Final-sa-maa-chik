import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";

describe("English Exam Database Seeding & Integrity", () => {
  it("Subject อ31101 ต้องมีอยู่ในระบบ และมีสถานะ PUBLISHED", async () => {
    const subject = await db.subject.findUnique({
      where: { code: "อ31101" },
    });
    expect(subject).not.toBeNull();
    expect(subject?.code).toBe("อ31101");
    expect(subject?.status).toBe("PUBLISHED");
  });

  it("ต้องมี StudyGuide บันทึกไว้สำหรับ อ31101 พร้อมเนื้อหา Markdown ครบถ้วน", async () => {
    const guide = await db.studyGuide.findFirst({
      where: { subject: { code: "อ31101" } },
    });
    expect(guide).not.toBeNull();
    expect(guide?.content.length).toBeGreaterThan(1000);
    expect(guide?.content).toContain("Future Continuous");
    expect(guide?.content).toContain("Will");
    expect(guide?.content).toContain("Be Going To");
  });

  it("ต้องมี QuestionSet สำหรับแนวข้อสอบเก็บคะแนน Future Tenses พร้อม 20 ข้อ", async () => {
    const qSet = await db.questionSet.findFirst({
      where: {
        subject: { code: "อ31101" },
        title: { path: ["th"], equals: "แนวข้อสอบเก็บคะแนน: Future Simple & Future Continuous Tense (20 ข้อ)" },
      },
      include: {
        questions: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    expect(qSet).not.toBeNull();
    expect(qSet?.difficulty).toBe("MEDIUM");
    expect(qSet?.recommendedMinutes).toBe(25);
    expect(qSet?.status).toBe("PUBLISHED");
    expect(qSet?.questions.length).toBe(20);

    for (const q of qSet!.questions) {
      expect(q.type).toBe("MCQ");
      expect(q.prompt.length).toBeGreaterThan(0);
      const options = q.options as Array<{ key: string; text: string }>;
      expect(options.length).toBe(4);
      const answer = q.answer as { kind?: string; correctKey?: string; correctKeys?: string[] };
      expect(answer.correctKey || (answer.correctKeys && answer.correctKeys.length > 0)).toBeTruthy();
      expect(q.explanation?.length).toBeGreaterThan(0);
    }
  });

  it("ต้องมี SourceDocuments 3 ไฟล์ PDF ที่มีสถานะ READY", async () => {
    const expectedKeys = [
      "will-be-going-to-key.pdf",
      "will-going-to-future-cont.pdf",
      "worksheet-future-tense.pdf",
    ];

    const docs = await db.sourceDocument.findMany({
      where: {
        subject: { code: "อ31101" },
        storageKey: { in: expectedKeys },
      },
    });

    expect(docs.length).toBe(3);
    for (const doc of docs) {
      expect(doc.status).toBe("READY");
      expect(doc.mimeType).toBe("application/pdf");
      expect(doc.sizeBytes).toBeGreaterThan(0);
    }
  });
});
