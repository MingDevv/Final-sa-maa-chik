import { z } from "zod";
import {
  difficultySchema,
  localizedTextSchema,
  mcqOptionSchema,
  questionAnswerSchema,
  questionTypeSchema,
  revealModeSchema,
  rubricItemSchema,
} from "@/lib/validation";

/**
 * ตรวจ JSON นำเข้าข้อสอบ "ก่อน" บันทึก — ถ้าผิดแม้แต่ข้อเดียวจะไม่บันทึกอะไรเลย
 * และบอกเป็นภาษาไทยว่าผิดที่ชุดไหน ข้อไหน (มักเกิดจาก JSON ที่ AI แต่งมา)
 */

const importQuestionSchema = z.object({
  type: questionTypeSchema,
  prompt: z.string().trim().min(1),
  options: z.array(mcqOptionSchema).optional().nullable(),
  answer: questionAnswerSchema,
  explanation: z.string().optional().nullable(),
  rubric: z.array(rubricItemSchema).optional().nullable(),
  points: z.number().int().min(1).max(100).optional().nullable(),
});

const importSetSchema = z.object({
  subjectCode: z.string().trim().min(1).optional(),
  subjectId: z.string().min(1).optional(),
  title: localizedTextSchema,
  description: z.string().optional().nullable(),
  topicTitle: z.string().trim().min(1).optional().nullable(),
  topicId: z.string().optional().nullable(),
  termId: z.string().optional().nullable(),
  difficulty: difficultySchema.optional(),
  recommendedMinutes: z.number().int().min(1).max(300).optional(),
  shuffleQuestions: z.boolean().optional(),
  shuffleOptions: z.boolean().optional(),
  revealMode: revealModeSchema.optional(),
  questions: z.array(importQuestionSchema).min(1, "ต้องมีอย่างน้อย 1 ข้อ"),
});

const importSubjectSchema = z.object({
  code: z.string().trim().min(1),
  name: localizedTextSchema,
  color: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().int().optional(),
  topics: z
    .array(
      z.object({
        title: localizedTextSchema,
        description: z.string().optional().nullable(),
        sortOrder: z.number().int().optional(),
      }),
    )
    .optional(),
});

export const importPayloadSchema = z.object({
  subjects: z.array(importSubjectSchema).optional(),
  questionSets: z.array(importSetSchema).optional(),
});

export type ImportPayload = z.infer<typeof importPayloadSchema>;
export type ImportSet = z.infer<typeof importSetSchema>;

const FIELD_TH: Record<string, string> = {
  prompt: "โจทย์",
  options: "ตัวเลือก",
  answer: "เฉลย",
  correctKeys: "เฉลย (correctKeys)",
  accepts: "คำตอบที่ยอมรับ (accepts)",
  kind: "ชนิดเฉลย (kind)",
  type: "ชนิดข้อ (type)",
  title: "ชื่อชุด",
  questions: "รายการข้อ",
  subjectCode: "รหัสวิชา",
  key: "ตัวอักษรตัวเลือก",
  text: "ข้อความตัวเลือก",
  points: "คะแนน",
};

const titleOf = (t: unknown) =>
  typeof t === "string" ? t : t && typeof t === "object" && "th" in t ? String((t as { th: unknown }).th) : "";

/** แปลง path ของ zod เป็นข้อความไทย เช่น "ชุดที่ 1 ข้อ 3: เฉลย" */
function describePath(path: PropertyKey[], raw: unknown): string {
  const parts: string[] = [];
  for (let i = 0; i < path.length; i++) {
    const p = path[i];
    const next = path[i + 1];
    if (p === "questionSets" && typeof next === "number") {
      const sets = (raw as { questionSets?: unknown[] })?.questionSets;
      const name = titleOf((sets?.[next] as { title?: unknown })?.title);
      parts.push(`ชุดที่ ${next + 1}${name ? ` "${name}"` : ""}`);
      i++;
    } else if (p === "questions" && typeof next === "number") {
      parts.push(`ข้อ ${next + 1}`);
      i++;
    } else if (p === "subjects" && typeof next === "number") {
      parts.push(`วิชาที่ ${next + 1}`);
      i++;
    } else if (typeof p === "string") {
      parts.push(FIELD_TH[p] ?? p);
    }
  }
  return parts.join(" › ");
}

/** แปลข้อความ error ของ zod (v4) เป็นภาษาไทยที่คนทำข้อสอบเข้าใจ */
function messageTh(iss: z.core.$ZodIssue): string {
  const last = iss.path[iss.path.length - 1];
  switch (iss.code) {
    case "invalid_value":
      return `ค่าไม่ถูกต้อง ต้องเป็นหนึ่งใน ${iss.values.map((v) => `"${String(v)}"`).join(", ")}`;
    case "invalid_type":
      return /received undefined/.test(iss.message) ? "ขาดหายไป (ต้องใส่)" : `ชนิดข้อมูลผิด (ต้องเป็น ${iss.expected})`;
    case "invalid_union":
      if (last === "kind" || last === "answer")
        return 'ต้องใส่ "kind" เป็น "MCQ", "SHORT_ANSWER" หรือ "WRITTEN" ให้ตรงกับชนิดข้อ';
      if (last === "title" || last === "name") return 'ต้องเป็นข้อความ หรือ {"th": "..."}';
      return "รูปแบบไม่ถูกต้อง";
    case "too_small":
      return Number(iss.minimum) <= 1 ? "ต้องไม่ว่าง" : `น้อยเกินไป (อย่างน้อย ${String(iss.minimum)})`;
    case "too_big":
      return `มากเกินไป (ไม่เกิน ${String(iss.maximum)})`;
    default:
      return iss.message;
  }
}

type ImportQuestion = z.infer<typeof importQuestionSchema>;

/** ตรวจความสอดคล้องของข้อเดียว (ชนิดข้อ↔ชนิดเฉลย, ตัวเลือก, เฉลยต้องอยู่ในตัวเลือก) */
function checkQuestion(q: ImportQuestion, at: string): string[] {
  if (q.type !== q.answer.kind) return [`${at}: ชนิดข้อ (${q.type}) ไม่ตรงกับชนิดเฉลย (${q.answer.kind})`];
  const errs: string[] = [];
  if (q.type === "MCQ" && q.answer.kind === "MCQ") {
    const opts = q.options ?? [];
    if (opts.length < 2) return [`${at}: ข้อปรนัยต้องมีตัวเลือกอย่างน้อย 2 ตัว`];
    const keys = opts.map((o) => o.key);
    const dup = keys.find((k, i) => keys.indexOf(k) !== i);
    if (dup) errs.push(`${at}: ตัวเลือก "${dup}" ซ้ำกัน`);
    const missing = q.answer.correctKeys.filter((k) => !keys.includes(k));
    if (missing.length) errs.push(`${at}: เฉลย ${missing.join(", ")} ไม่มีอยู่ในตัวเลือก (มี ${keys.join(", ")})`);
  }
  return errs;
}

export type ImportCheck =
  | { ok: true; data: ImportPayload }
  | { ok: false; errors: string[] };

/** ตรวจโครงสร้าง + ความสอดคล้องของแต่ละข้อ (pure — ไม่แตะฐานข้อมูล) */
export function validateImport(raw: unknown): ImportCheck {
  const parsed = importPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((iss) => {
      const where = describePath(iss.path, raw);
      return `${where || "ไฟล์"}: ${messageTh(iss)}`;
    });
    // รายงานปัญหาเชิงเนื้อหาของข้อที่ "โครงสร้างถูก" ด้วย จะได้แก้ครบในรอบเดียว
    const rawSets = (raw as { questionSets?: unknown })?.questionSets;
    if (Array.isArray(rawSets)) {
      rawSets.forEach((set, si) => {
        const qs = (set as { questions?: unknown })?.questions;
        if (!Array.isArray(qs)) return;
        const label = `ชุดที่ ${si + 1} "${titleOf((set as { title?: unknown })?.title)}"`;
        qs.forEach((q, qi) => {
          const one = importQuestionSchema.safeParse(q);
          if (one.success) errors.push(...checkQuestion(one.data, `${label} ข้อ ${qi + 1}`));
        });
      });
    }
    return { ok: false, errors: errors.slice(0, 15) };
  }

  const data = parsed.data;
  const errors: string[] = [];
  if (!data.subjects?.length && !data.questionSets?.length) {
    errors.push('ไม่พบข้อมูลให้นำเข้า — ต้องมี "questionSets" หรือ "subjects"');
  }

  data.questionSets?.forEach((set, si) => {
    const setLabel = `ชุดที่ ${si + 1} "${titleOf(set.title)}"`;
    if (!set.subjectCode && !set.subjectId) errors.push(`${setLabel}: ไม่ได้ระบุรหัสวิชา (subjectCode)`);
    set.questions.forEach((q, qi) => errors.push(...checkQuestion(q, `${setLabel} ข้อ ${qi + 1}`)));
  });

  if (errors.length) return { ok: false, errors: errors.slice(0, 15) };
  return { ok: true, data };
}
