import { describe, expect, it } from "vitest";
import { endOfTodayBangkok, nextCard } from "@/lib/review/leitner";

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
