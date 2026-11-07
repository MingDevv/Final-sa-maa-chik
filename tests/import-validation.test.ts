import { describe, expect, it } from "vitest";
import { validateImport } from "@/lib/exam/import-validation";

const q = (over: Record<string, unknown> = {}) => ({
  type: "MCQ",
  prompt: "1+1 = ?",
  options: [{ key: "A", text: "2" }, { key: "B", text: "3" }],
  answer: { kind: "MCQ", correctKeys: ["A"] },
  ...over,
});
const payload = (questions: unknown[], set: Record<string, unknown> = {}) => ({
  questionSets: [{ title: { th: "ชุดทดสอบ" }, subjectCode: "ว31201", topicTitle: "แรง", questions, ...set }],
});

describe("ตรวจ JSON นำเข้าข้อสอบ", () => {
  it("JSON ถูกต้องตามแม่แบบ → ผ่าน และเก็บ topicTitle ไว้", () => {
    const r = validateImport(payload([q()]));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.questionSets?.[0].topicTitle).toBe("แรง");
  });

  it("ลืม kind ในเฉลย → ไม่ผ่าน บอกชุดและข้อ", () => {
    const r = validateImport(payload([q(), q({ answer: { correctKeys: ["A"] } })]));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toMatch(/ชุดที่ 1 "ชุดทดสอบ" › ข้อ 2 › เฉลย/);
  });

  it("เฉลยเป็นตัวเลือกที่ไม่มีอยู่ → ไม่ผ่าน", () => {
    const r = validateImport(payload([q({ answer: { kind: "MCQ", correctKeys: ["E"] } })]));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toContain("เฉลย E ไม่มีอยู่ในตัวเลือก (มี A, B)");
  });

  it("ชนิดข้อไม่ตรงกับชนิดเฉลย → ไม่ผ่าน", () => {
    const r = validateImport(payload([q({ type: "SHORT_ANSWER" })]));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toContain("ไม่ตรงกับชนิดเฉลย");
  });

  it("ปรนัยไม่มีตัวเลือก / ตัวเลือกซ้ำ → ไม่ผ่าน", () => {
    expect(validateImport(payload([q({ options: undefined })])).ok).toBe(false);
    const dup = validateImport(payload([q({ options: [{ key: "A", text: "1" }, { key: "A", text: "2" }] })]));
    expect(dup.ok).toBe(false);
  });

  it("ไม่มีรหัสวิชา / ไม่มีข้อเลย / ไฟล์ว่าง → ไม่ผ่าน", () => {
    expect(validateImport(payload([q()], { subjectCode: undefined })).ok).toBe(false);
    expect(validateImport(payload([])).ok).toBe(false);
    expect(validateImport({}).ok).toBe(false);
  });

  it("คำตอบสั้นแบบถูกต้อง → ผ่าน", () => {
    const r = validateImport(
      payload([{ type: "SHORT_ANSWER", prompt: "g = ?", answer: { kind: "SHORT_ANSWER", accepts: ["9.8"] } }]),
    );
    expect(r.ok).toBe(true);
  });
});

describe("รายงานครบในรอบเดียว", () => {
  it("มีทั้งข้อโครงสร้างผิดและข้อเฉลยผิด → บอกทั้งสองจุด", () => {
    const r = validateImport(
      payload([q({ answer: { kind: "MCQ", correctKeys: ["E"] } }), q({ answer: { correctKeys: ["A"] } })]),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors).toHaveLength(2);
      expect(r.errors.some((e) => e.includes("ข้อ 1") && e.includes("เฉลย E"))).toBe(true);
      expect(r.errors.some((e) => e.includes("ข้อ 2") && e.includes("kind"))).toBe(true);
    }
  });
});
