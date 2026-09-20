import { describe, expect, it } from "vitest";
import { computeStreak } from "@/server/services/analytics-service";

const iso = (d: string) => new Date(`${d}T00:00:00Z`).toISOString().slice(0, 10);

describe("computeStreak", () => {
  it("ไม่มีกิจกรรม → 0", () => {
    expect(computeStreak([], iso("2026-09-20"))).toBe(0);
  });

  it("ทำวันนี้ + เมื่อวานต่อเนื่อง → นับสองวัน", () => {
    expect(computeStreak([iso("2026-09-20"), iso("2026-09-19")], iso("2026-09-20"))).toBe(2);
  });

  it("วันนี้ยังไม่ทำ แต่เมื่อวานทำ → streak ยังไม่หาย", () => {
    expect(computeStreak([iso("2026-09-19"), iso("2026-09-18")], iso("2026-09-20"))).toBe(2);
  });

  it("เว้นวัน → นับเฉพาะช่วงต่อเนื่องล่าสุด", () => {
    expect(
      computeStreak(
        [iso("2026-09-20"), iso("2026-09-19"), iso("2026-09-17"), iso("2026-09-16")],
        iso("2026-09-20"),
      ),
    ).toBe(2);
  });
});
