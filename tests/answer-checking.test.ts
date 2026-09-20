import { describe, expect, it } from "vitest";
import {
  checkMcqAnswer,
  checkShortAnswer,
  normalizeShortAnswer,
  shuffle,
} from "@/lib/exam/answer-checking";

describe("normalizeShortAnswer", () => {
  it("ตัดช่องว่างเกินและ trim", () => {
    expect(normalizeShortAnswer("  สวัสดี   โลก  ")).toBe("สวัสดี   โลก");
    expect(normalizeShortAnswer("abc", { ignoreSpaces: true })).toBe("abc");
    expect(normalizeShortAnswer("a b c", { ignoreSpaces: true })).toBe("abc");
  });

  it("ignoreCase ตัดตัวพิมพ์ใหญ่เล็ก", () => {
    expect(normalizeShortAnswer("Metaphase", { ignoreCase: true })).toBe("metaphase");
  });

  it("numeric เทียบค่าตัวเลข (1.0 == 1, มี comma)", () => {
    expect(normalizeShortAnswer("1.0", { numeric: true })).toBe("1");
    expect(normalizeShortAnswer("1,200", { numeric: true })).toBe("1200");
    expect(normalizeShortAnswer("0.5", { numeric: true })).toBe("0.5");
    expect(normalizeShortAnswer("1/2", { numeric: true })).toBe("0.5");
  });

  it("stripUnits ตัดหน่วยท้ายคำตอบ", () => {
    expect(normalizeShortAnswer("400 J", { stripUnits: true })).toBe("400");
    expect(normalizeShortAnswer("9.8 เมตร/วินาที", { stripUnits: true })).toBe("9.8");
    expect(normalizeShortAnswer("3 m/s^2", { stripUnits: true })).toBe("3");
  });

  it("ตัด LaTeX wrapper พื้นฐาน", () => {
    // \frac{1}{2} ถูกแปลงเป็นเศษส่วนแล้วเทียบค่าเป็น 0.5
    expect(
      normalizeShortAnswer("$\\frac{1}{2}$", { numeric: true, ignoreSpaces: true }),
    ).toBe("0.5");
    expect(normalizeShortAnswer("\\text{เท็จ, จริง}", { ignoreSpaces: true })).toBe(
      "เท็จ,จริง",
    );
  });
});

describe("checkShortAnswer", () => {
  const answer = {
    kind: "SHORT_ANSWER" as const,
    accepts: ["400", "สี่ร้อย"],
    normalize: { numeric: true, stripUnits: true },
  };

  it("ยอมรับรูปแบบที่ค่าเท่ากัน", () => {
    expect(checkShortAnswer("400", answer)).toBe(true);
    expect(checkShortAnswer("400.0", answer)).toBe(true);
    expect(checkShortAnswer("400 J", answer)).toBe(true);
  });

  it("ปฏิเสธคำตอบที่ไม่ตรง", () => {
    expect(checkShortAnswer("401", answer)).toBe(false);
    expect(checkShortAnswer("", answer)).toBe(false);
    expect(checkShortAnswer("   ", answer)).toBe(false);
  });

  it("รองรับ ignoreCase กับคำตอบภาษาอังกฤษ", () => {
    const ans = {
      kind: "SHORT_ANSWER" as const,
      accepts: ["Metaphase"],
      normalize: { ignoreCase: true },
    };
    expect(checkShortAnswer("METAPHASE", ans)).toBe(true);
  });
});

describe("checkMcqAnswer", () => {
  const answer = { kind: "MCQ" as const, correctKeys: ["C"] };

  it("ถูกเมื่อเลือกตรง", () => {
    expect(checkMcqAnswer(["C"], answer)).toBe(true);
  });

  it("ผิดเมื่อเลือกคนละข้อ", () => {
    expect(checkMcqAnswer(["A"], answer)).toBe(false);
    expect(checkMcqAnswer([], answer)).toBe(false);
    expect(checkMcqAnswer(["C", "A"], answer)).toBe(false);
  });

  it("รองรับหลายตัวเลือกถูกพร้อมกัน (ไม่สนลำดับ)", () => {
    const multi = { kind: "MCQ" as const, correctKeys: ["A", "C"] };
    expect(checkMcqAnswer(["C", "A"], multi)).toBe(true);
    expect(checkMcqAnswer(["A"], multi)).toBe(false);
  });
});

describe("shuffle", () => {
  it("คืน permutation เดียวกัน (ไม่เพิ่ม/หาย/แก้ต้นฉบับ)", () => {
    const src = [1, 2, 3, 4, 5];
    const copy = [...src];
    const out = shuffle(src);
    expect([...out].sort((a, b) => a - b)).toEqual(copy);
    expect(src).toEqual(copy); // ไม่แก้ array เดิม
  });

  it("ใช้ rng คงที่ได้ผลเดิม (deterministic)", () => {
    let seed = 42;
    const rng = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    const a = shuffle([1, 2, 3, 4, 5, 6], rng);
    seed = 42;
    const b = shuffle([1, 2, 3, 4, 5, 6], rng);
    expect(a).toEqual(b);
  });
});
