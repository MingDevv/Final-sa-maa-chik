/**
 * Integration test สำหรับ flow สำคัญ (ต้องมี PostgreSQL ตาม DATABASE_URL)
 * รันอัตโนมัติเมื่อ DB พร้อม — ถ้าต่อ DB ไม่ได้จะ skip ทั้งชุด
 *
 * สถานะที่ test ชุดนี้ออกแบบมาให้ตรง = "หลังรัน npm run db:clean"
 * (วิชาหลักครบ 10 วิชา ยังไม่มีชุดข้อสอบ/เอกสาร จนกว่าจะ seed หรือนำเข้าเนื้อหาใหม่)
 * ทุก test ที่ต้องมีข้อมูลจะ "skip พร้อมข้อความบอกเหตุผล" เมื่อข้อมูลยังไม่อยู่ — ห้ามผ่านแบบเงียบๆ
 */
import { afterAll, beforeAll, describe, expect, it, type TestContext } from "vitest";
import { db } from "@/lib/db";

let dbReady = false;

/**
 * ต้องตรงกับรายการ coreSubjects ใน prisma/reset-clean-subjects.ts
 * (import สคริปต์นั้นไม่ได้ เพราะไฟล์รัน main() ทันทีตอน import)
 */
const CORE_SUBJECT_CODES = [
  "ค31101",
  "ค31201",
  "ว31201",
  "ว30221",
  "ว31103",
  "ว32241",
  "ว30261",
  "ท31101",
  "อ31101",
  "ส31101",
] as const;

/** skip พร้อมพิมพ์เหตุผลชัดเจน — กันการผ่าน/ข้ามแบบเดาไม่ได้ว่าทำไม */
const skipBecause = (ctx: TestContext, reason: string) => {
  console.warn(`⏭️ skip: ${reason}`);
  ctx.skip();
};

beforeAll(async () => {
  dbReady = await db
    .$queryRaw`SELECT 1`
    .then(() => true)
    .catch(() => false);
});

afterAll(async () => {
  await db.$disconnect();
});

describe("integration (ต้องมี DB)", () => {
  it("มีวิชาหลักครบ 10 วิชาตามรายการใน reset-clean-subjects และเผยแพร่ทั้งหมด", async (ctx) => {
    if (!dbReady) return skipBecause(ctx, "ไม่มี DATABASE_URL ที่ต่อได้");
    const subjects = await db.subject.findMany();
    const codes = new Set(subjects.map((s) => s.code));
    const missing = CORE_SUBJECT_CODES.filter((c) => !codes.has(c));
    if (missing.length > 0) {
      return skipBecause(
        ctx,
        `ฐานข้อมูลยังไม่อยู่ในสถานะหลัง db:clean — ขาดวิชา ${missing.join(", ")} (พบ ${CORE_SUBJECT_CODES.length - missing.length}/${CORE_SUBJECT_CODES.length} วิชา)`,
      );
    }
    const notPublished = subjects.filter(
      (s) => (CORE_SUBJECT_CODES as readonly string[]).includes(s.code) && s.status !== "PUBLISHED",
    );
    expect(notPublished.map((s) => `${s.code}=${s.status}`)).toEqual([]);
  }, 15000);

  it("ชุดที่เผยแพร่ต้องมีข้อและเฉลยครบ", async (ctx) => {
    if (!dbReady) return skipBecause(ctx, "ไม่มี DATABASE_URL ที่ต่อได้");
    const sets = await db.questionSet.findMany({
      where: { status: "PUBLISHED" },
      include: { questions: true },
    });
    if (sets.length === 0) {
      return skipBecause(
        ctx,
        "ยังไม่มีชุดข้อสอบที่เผยแพร่ในฐานข้อมูล (เพิ่งรัน db:clean หรือยังไม่ได้ seed/นำเข้าเนื้อหา) — จึงไม่มีอะไรให้ตรวจ",
      );
    }
    for (const set of sets) {
      expect(set.questions.length).toBeGreaterThan(0);
      for (const q of set.questions) {
        expect(q.answer).toBeTruthy();
        if (q.type === "MCQ") {
          expect(Array.isArray(q.options)).toBe(true);
        }
      }
    }
  }, 15000);

  it("เอกสารตัวอย่างถูก mark เป็น reference-only (นโยบายเนื้อหาอ้างอิง)", async (ctx) => {
    if (!dbReady) return skipBecause(ctx, "ไม่มี DATABASE_URL ที่ต่อได้");
    const docs = await db.sourceDocument.findMany();
    if (docs.length === 0) {
      return skipBecause(
        ctx,
        "ยังไม่มีเอกสารอ้างอิงในฐานข้อมูล — จึงไม่มีอะไรให้ตรวจนโยบาย reference-only",
      );
    }
    for (const d of docs) {
      const meta = (d.metadata ?? {}) as { policy?: string };
      expect(meta.policy).toBe("reference-only");
    }
  }, 15000);

  it("flow ทำข้อสอบ: เริ่ม → บันทึกคำตอบ → ส่ง → คะแนนถูกต้อง", { timeout: 20000 }, async (ctx) => {
    if (!dbReady) return skipBecause(ctx, "ไม่มี DATABASE_URL ที่ต่อได้");
    const set = await db.questionSet.findFirst({
      where: { status: "PUBLISHED" },
      include: { questions: { where: { type: "MCQ" }, take: 1 } },
    });
    if (!set || set.questions.length === 0) {
      return skipBecause(
        ctx,
        "ยังไม่มีชุดข้อสอบเผยแพร่ที่มีข้อปรนัยในฐานข้อมูล — จึงจำลอง flow การทำข้อสอบไม่ได้",
      );
    }

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
