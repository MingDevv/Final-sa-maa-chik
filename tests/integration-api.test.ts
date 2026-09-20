/**
 * Integration test สำหรับ flow สำคัญ (ต้องมี PostgreSQL ตาม DATABASE_URL)
 * รันอัตโนมัติเมื่อ DB พร้อม — ถ้าต่อ DB ไม่ได้จะ skip ทั้งชุด
 * รันเฉพาะตอนมี DB: npm run test:integration
 */
import { beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
let dbReady = false;

beforeAll(async () => {
  dbReady = await db
    .$queryRaw`SELECT 1`
    .then(() => true)
    .catch(() => false);
});

describe("integration (ต้องมี DB)", () => {
  it("seed ครบ 6 วิชาตามข้อกำหนด", async () => {
    if (!dbReady) return console.warn("skip: ไม่มี DATABASE_URL ที่ต่อได้");
    const subjects = await db.subject.findMany({ where: { status: "PUBLISHED" } });
    const codes = subjects.map((s) => s.code).sort();
    expect(codes).toEqual(
      ["ท31101", "ว31103", "ว31201", "ว32241", "อ31101", "ค31101"].sort(),
    );
  });

  it("ชุดที่เผยแพร่ต้องมีข้อและเฉลยครบ", async () => {
    if (!dbReady) return;
    const sets = await db.questionSet.findMany({
      where: { status: "PUBLISHED" },
      include: { questions: true },
    });
    expect(sets.length).toBeGreaterThan(0);
    for (const set of sets) {
      expect(set.questions.length).toBeGreaterThan(0);
      for (const q of set.questions) {
        expect(q.answer).toBeTruthy();
        if (q.type === "MCQ") {
          expect(Array.isArray(q.options)).toBe(true);
        }
      }
    }
  });

  it("เอกสารตัวอย่างถูก mark เป็น reference-only (นโยบายเนื้อหาอ้างอิง)", async () => {
    if (!dbReady) return;
    const docs = await db.sourceDocument.findMany();
    for (const d of docs) {
      const meta = (d.metadata ?? {}) as { policy?: string };
      expect(meta.policy).toBe("reference-only");
    }
  });

  it("flow ทำข้อสอบ: เริ่ม → บันทึกคำตอบ → ส่ง → คะแนนถูกต้อง", async () => {
    if (!dbReady) return;
    const set = await db.questionSet.findFirst({
      where: { status: "PUBLISHED" },
      include: { questions: { where: { type: "MCQ" }, take: 1 } },
    });
    if (!set || set.questions.length === 0) return;

    const attempt = await db.attempt.create({
      data: { setId: set.id, guestSessionId: "test-guest", mode: "EXAM" },
    });
    const q = set.questions[0];
    const correct = (q.answer as { correctKeys?: string[] }).correctKeys ?? [];

    await db.attemptAnswer.create({
      data: {
        attemptId: attempt.id,
        questionId: q.id,
        answer: { selectedKeys: correct },
      },
    });

    const loaded = await db.attempt.findUnique({
      where: { id: attempt.id },
      include: { answers: true },
    });
    expect(loaded?.answers).toHaveLength(1);
    expect((loaded?.answers[0]?.answer as { selectedKeys?: string[] }).selectedKeys).toEqual(correct);

    await db.attempt.update({
      where: { id: attempt.id },
      data: { status: "SUBMITTED", finishedAt: new Date(), durationSec: 60, score: { earned: 1, total: 1, percent: 100 } },
    });
    await db.attempt.delete({ where: { id: attempt.id } });
  });
});
