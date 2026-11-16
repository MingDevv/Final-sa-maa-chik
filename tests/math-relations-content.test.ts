import { describe, expect, it } from "vitest";
import katex from "katex";
import { MATH_RELATIONS_FLASHCARDS, MATH_RELATIONS_FLASHCARD_CATEGORIES } from "@/data/math-relations-flashcards";
import { MATH_RELATIONS_STUDY_GUIDE_MD, MATH_RELATIONS_GUIDE_TITLE } from "@/data/math-relations-study-guide";
import SET1 from "@/data/math-relations-set1-questions.json";
import SET2 from "@/data/math-relations-set2-questions.json";
import { getFlashcardDeck } from "@/data/flashcard-decks";

/** ดึงสูตร $...$ ทั้งหมดแล้วลองเรนเดอร์ด้วย KaTeX แบบ strict — สูตรพังจะ throw */
function expectLatexOk(text: string) {
  for (const m of text.matchAll(/\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g)) {
    const tex = m[1] ?? m[2];
    expect(() => katex.renderToString(tex, { throwOnError: true }), tex).not.toThrow();
  }
}

describe("คณิต ความสัมพันธ์ — ชีต ข้อสอบ แฟลชการ์ด", () => {
  it("ชีตสรุปขึ้นต้นด้วยหัวข้อที่ seeder ใช้เช็ค และสูตรเรนเดอร์ได้ทุกตัว", () => {
    expect(MATH_RELATIONS_STUDY_GUIDE_MD.startsWith(`# ${MATH_RELATIONS_GUIDE_TITLE}`)).toBe(true);
    expectLatexOk(MATH_RELATIONS_STUDY_GUIDE_MD);
  });

  it("ตารางในชีตไม่มี | ในสูตร (จะตัดช่องตาราง)", () => {
    for (const line of MATH_RELATIONS_STUDY_GUIDE_MD.split("\n")) {
      if (!/^\|(.+)\|$/.test(line.trim())) continue;
      for (const m of line.matchAll(/\$([^$]+)\$/g)) expect(m[1], line).not.toContain("|");
    }
  });

  it.each([
    ["ชุดที่ 1", SET1],
    ["ชุดที่ 2", SET2],
  ])("%s: 20 ข้อ ตัวเลือก A–D เฉลยมีจริง กระจายข้อละ 5", (_name, set) => {
    expect(set.questions).toHaveLength(20);
    const counts: Record<string, number> = {};
    for (const q of set.questions) {
      expect(q.options.map((o) => o.key)).toEqual(["A", "B", "C", "D"]);
      expect(new Set(q.options.map((o) => o.text)).size).toBe(4);
      counts[q.answer.correctKey] = (counts[q.answer.correctKey] ?? 0) + 1;
      expectLatexOk(q.prompt);
      expectLatexOk(q.explanation);
      q.options.forEach((o) => expectLatexOk(o.text));
    }
    expect(counts).toEqual({ A: 5, B: 5, C: 5, D: 5 });
  });

  it("แฟลชการ์ด: id ไม่ซ้ำ หมวดมีในตัวกรอง สูตรเรนเดอร์ได้", () => {
    const ids = MATH_RELATIONS_FLASHCARDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    const cats = new Set(MATH_RELATIONS_FLASHCARD_CATEGORIES.map((c) => c.value));
    for (const c of MATH_RELATIONS_FLASHCARDS) {
      expect(cats.has(c.category), c.id).toBe(true);
      const b = c.back;
      [c.title, c.front.prompt, c.front.subtext ?? "", b.rule, b.formula ?? "", b.example, b.examTip ?? "", ...b.keywords].forEach(expectLatexOk);
    }
  });

  it("แต่ละวิชาได้เด็คของตัวเอง วิชาที่ไม่มีการ์ดได้ null", () => {
    expect(getFlashcardDeck("ค31201")?.cards).toBe(MATH_RELATIONS_FLASHCARDS);
    expect(getFlashcardDeck("อ31101")?.variant).toBe("english");
    expect(getFlashcardDeck("ค31101")).toBeNull();
  });
});
