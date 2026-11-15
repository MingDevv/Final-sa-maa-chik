import { describe, expect, it } from "vitest";
import {
  ENGLISH_FUTURE_FLASHCARDS,
  type FlashcardCategory,
} from "@/data/english-future-flashcards";

describe("English Future Flashcards & Cram Cards Dataset", () => {
  it("มี flashcards ระหว่าง 12 ถึง 16 ใบ (ปัจจุบันมี 14 ใบ)", () => {
    expect(ENGLISH_FUTURE_FLASHCARDS.length).toBeGreaterThanOrEqual(12);
    expect(ENGLISH_FUTURE_FLASHCARDS.length).toBeLessThanOrEqual(16);
    expect(ENGLISH_FUTURE_FLASHCARDS.length).toBe(14);
  });

  it("ทุกใบมี id ที่ไม่ซ้ำกัน และมีฟิลด์ครบถ้วน", () => {
    const ids = new Set<string>();
    const validCategories: FlashcardCategory[] = [
      "Formula",
      "Will vs Going To",
      "Future Continuous",
      "Exam Trick",
      "Checklist",
    ];

    for (const card of ENGLISH_FUTURE_FLASHCARDS) {
      expect(ids.has(card.id)).toBe(false);
      ids.add(card.id);

      expect(card.title.trim().length).toBeGreaterThan(0);
      expect(validCategories).toContain(card.category);

      // Front checks
      expect(card.front.prompt.trim().length).toBeGreaterThan(0);

      // Back checks
      expect(card.back.rule.trim().length).toBeGreaterThan(0);
      expect(Array.isArray(card.back.keywords)).toBe(true);
      expect(card.back.keywords.length).toBeGreaterThan(0);
      expect(card.back.example.trim().length).toBeGreaterThan(0);
      expect(card.back.thaiMeaning.trim().length).toBeGreaterThan(0);
    }
  });

  describe("ความครอบคลุม 12 หัวข้อสำคัญที่ต้องมี", () => {
    it("1) Will: Formula & Spontaneous decisions (ตัดสินใจทันทีขณะพูด)", () => {
      const card = ENGLISH_FUTURE_FLASHCARDS.find((c) => c.id === "fc-will-spontaneous");
      expect(card).toBeDefined();
      expect(card?.back.rule).toContain("ขณะที่พูดทันที");
      expect(card?.back.example.toLowerCase()).toContain("will");
    });

    it("2) Will: Offers & Promises (ข้อเสนอ คำสัญญา)", () => {
      const card = ENGLISH_FUTURE_FLASHCARDS.find((c) => c.id === "fc-will-offers-promises");
      expect(card).toBeDefined();
      expect(card?.back.rule.toLowerCase()).toContain("promises");
      expect(card?.back.keywords).toContain("promise");
    });

    it("3) Will: Predictions without evidence (I think, I believe, perhaps)", () => {
      const card = ENGLISH_FUTURE_FLASHCARDS.find((c) => c.id === "fc-will-predictions");
      expect(card).toBeDefined();
      expect(card?.back.keywords).toContain("I think");
      expect(card?.back.keywords).toContain("perhaps");
    });

    it("4) Be Going To: Formula & Prior plans (วางแผนไว้ล่วงหน้า)", () => {
      const card = ENGLISH_FUTURE_FLASHCARDS.find((c) => c.id === "fc-goingto-prior-plan");
      expect(card).toBeDefined();
      expect(card?.back.formula).toContain("is/am/are + going to");
      expect(card?.back.rule).toContain("ล่วงหน้า");
    });

    it("5) Be Going To: Predictions with present evidence (Look at those dark clouds)", () => {
      const card = ENGLISH_FUTURE_FLASHCARDS.find((c) => c.id === "fc-goingto-present-evidence");
      expect(card).toBeDefined();
      expect(card?.back.keywords).toContain("dark clouds");
      expect(card?.back.example).toContain("Look at those dark clouds!");
    });

    it("6) Future Continuous: Formula (S + will be + V-ing) & Concept", () => {
      const card = ENGLISH_FUTURE_FLASHCARDS.find((c) => c.id === "fc-future-continuous-formula");
      expect(card).toBeDefined();
      expect(card?.back.formula).toContain("will be + V-ing");
      expect(card?.back.rule).toContain("กำลังดำเนินอยู่");
    });

    it("7) Future Continuous Time Markers (At 8 p.m., This time tomorrow)", () => {
      const card = ENGLISH_FUTURE_FLASHCARDS.find((c) => c.id === "fc-future-continuous-time-markers");
      expect(card).toBeDefined();
      expect(card?.back.keywords).toContain("At 8 p.m. tonight");
      expect(card?.back.keywords).toContain("This time tomorrow");
    });

    it("8) Future Continuous vs Future Simple contrast", () => {
      const card = ENGLISH_FUTURE_FLASHCARDS.find((c) => c.id === "fc-simple-vs-continuous");
      expect(card).toBeDefined();
      expect(card?.front.prompt).toContain("VS");
      expect(card?.back.examTip).toContain("Don't call me then");
    });

    it("9) Stative Verbs warning: know, like, understand, want ห้ามใช้ Continuous", () => {
      const card = ENGLISH_FUTURE_FLASHCARDS.find((c) => c.id === "fc-stative-verbs-warning");
      expect(card).toBeDefined();
      expect(card?.back.keywords).toContain("know");
      expect(card?.back.keywords).toContain("understand");
      expect(card?.back.rule).toContain("Stative Verbs");
    });

    it("10) Interrupted actions in future: will be V-ing WHEN S + V.1", () => {
      const card = ENGLISH_FUTURE_FLASHCARDS.find((c) => c.id === "fc-future-continuous-interrupted");
      expect(card).toBeDefined();
      expect(card?.back.formula).toContain("WHEN + S + V.1");
      expect(card?.back.examTip).toContain("หลัง When / While");
    });

    it("11) Common trap: baby is going to cry vs baby is crying", () => {
      const card = ENGLISH_FUTURE_FLASHCARDS.find((c) => c.id === "fc-trap-going-to-vs-present-cont");
      expect(card).toBeDefined();
      expect(card?.front.prompt).toContain("baby is crying");
      expect(card?.front.prompt).toContain("baby is going to cry");
    });

    it("12) 2B Pencil & Exam Checklist: 20 ข้อ พรุ่งนี้คาบหน้า พกดินสอ 2B ยางลบ", () => {
      const card = ENGLISH_FUTURE_FLASHCARDS.find((c) => c.id === "fc-exam-day-checklist");
      expect(card).toBeDefined();
      expect(card?.back.formula).toContain("20 ข้อ");
      expect(card?.back.formula).toContain("ดินสอ 2B");
      expect(card?.back.keywords).toContain("ดินสอ 2B");
      expect(card?.back.keywords).toContain("ยางลบ");
    });
  });
});
