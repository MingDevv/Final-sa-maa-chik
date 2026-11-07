import { describe, expect, it } from "vitest";
import { daysUntilExam, endOfTodayBangkok, intervalDays, isCramMode, nextCard } from "@/lib/review/leitner";

const now = new Date("2026-11-07T03:00:00Z");
const days = (d: Date) => Math.round((d.getTime() - now.getTime()) / 86_400_000);

describe("Leitner spaced repetition", () => {
  it("ตอบผิดครั้งแรก → สร้างบัตรกล่อง 1 ทบทวนพรุ่งนี้", () => {
    const r = nextCard(null, { correct: false, confident: null }, now);
    expect(r).toMatchObject({ action: "upsert", box: 1, confidentWrong: false, lapse: false });
    if (r.action === "upsert") expect(days(r.dueAt)).toBe(1);
  });

  it("มั่นใจแต่ผิด → ติดธงข้ออันตราย", () => {
    const r = nextCard(null, { correct: false, confident: true }, now);
    expect(r).toMatchObject({ action: "upsert", box: 1, confidentWrong: true });
  });

  it("ผิดซ้ำตอนทบทวน → กลับกล่อง 1 และนับ lapse", () => {
    const r = nextCard({ box: 4 }, { correct: false, confident: false }, now);
    expect(r).toMatchObject({ action: "upsert", box: 1, lapse: true });
  });

  it("ถูกและมั่นใจตั้งแต่แรก → ไม่ต้องมีบัตร", () => {
    expect(nextCard(null, { correct: true, confident: true }, now)).toEqual({ action: "none" });
    expect(nextCard(null, { correct: true, confident: null }, now)).toEqual({ action: "none" });
  });

  it("ถูกแต่เดา → สร้างบัตรทบทวนพรุ่งนี้ (กันฟลุค)", () => {
    const r = nextCard(null, { correct: true, confident: false }, now);
    expect(r).toMatchObject({ action: "upsert", box: 1 });
  });

  it("ถูกและมั่นใจ → ขึ้นกล่อง เว้นระยะ 3 → 7 → 14 → 30 วัน", () => {
    const expected = [3, 7, 14, 30];
    for (let box = 1; box <= 4; box++) {
      const r = nextCard({ box }, { correct: true, confident: true }, now);
      expect(r.action).toBe("upsert");
      if (r.action === "upsert") {
        expect(r.box).toBe(box + 1);
        expect(days(r.dueAt)).toBe(expected[box - 1]);
      }
    }
  });

  it("ผ่านกล่อง 5 → จำได้แล้ว (graduate)", () => {
    expect(nextCard({ box: 5 }, { correct: true, confident: true }, now)).toEqual({ action: "graduate" });
  });

  it("สิ้นวันตามเวลาไทย", () => {
    // 03:00Z = 10:00 น. ไทย → สิ้นวันไทย = 16:59:59.999Z
    expect(endOfTodayBangkok(now).toISOString()).toBe("2026-11-07T16:59:59.999Z");
  });
});

describe("โหมดใกล้สอบ (≤ 14 วัน)", () => {
  // now = 7 พ.ย. 10:00 น. ไทย
  const examIn = (n: number) => new Date(now.getTime() + n * 86_400_000);

  it("นับวันถึงสอบตามปฏิทินไทย และเปิดโหมดเฉพาะ 0–14 วัน", () => {
    expect(daysUntilExam(examIn(7), now)).toBe(7);
    expect(isCramMode(examIn(7), now)).toBe(true);
    expect(isCramMode(examIn(20), now)).toBe(false);
    expect(isCramMode(examIn(-1), now)).toBe(false);
    expect(isCramMode(null, now)).toBe(false);
  });

  it("เหลือ 7 วัน: รอบบีบเป็น 1 → 1 → 2 → 2 → 3 และไม่เลยวันก่อนสอบ", () => {
    expect([1, 2, 3, 4, 5].map((b) => intervalDays(b, examIn(7), now))).toEqual([1, 1, 2, 2, 3]);
    // เหลือ 3 วัน → ช้าสุดคือวันก่อนสอบ (อีก 2 วัน)
    expect([1, 2, 3, 4, 5].map((b) => intervalDays(b, examIn(3), now))).toEqual([1, 1, 2, 2, 2]);
  });

  it("ไม่ได้ตั้งวันสอบ หรือสอบอีกนาน → ใช้รอบปกติ", () => {
    expect(intervalDays(5, null, now)).toBe(30);
    expect(intervalDays(3, examIn(40), now)).toBe(7);
  });

  it("ผิดตอนเหลือ 7 วัน → กลับมาพรุ่งนี้", () => {
    const r = nextCard({ box: 3 }, { correct: false, confident: true }, now, examIn(7));
    expect(r).toMatchObject({ action: "upsert", box: 1, confidentWrong: true });
    if (r.action === "upsert") expect(days(r.dueAt)).toBe(1);
  });

  it("พรุ่งนี้สอบ: ผิด → ทำซ้ำวันนี้เลย, ถูกและมั่นใจ → ผ่าน", () => {
    const wrong = nextCard({ box: 2 }, { correct: false, confident: false }, now, examIn(1));
    expect(wrong.action).toBe("upsert");
    if (wrong.action === "upsert") expect(days(wrong.dueAt)).toBe(0);
    expect(nextCard({ box: 2 }, { correct: true, confident: true }, now, examIn(1))).toEqual({ action: "graduate" });
  });
});
