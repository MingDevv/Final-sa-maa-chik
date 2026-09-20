// ประเภทข้อมูลกลางของระบบ — รองรับหลายภาษาในอนาคตผ่าน LocalizedText

/** ข้อความหลายภาษา: th เป็นภาษาหลัก */
export type LocalizedText = { th: string; en?: string };

export const asLocalizedText = (value: unknown): LocalizedText => {
  if (typeof value === "string") return { th: value };
  if (value && typeof value === "object" && "th" in value) {
    const v = value as { th?: unknown; en?: unknown };
    return { th: String(v.th ?? ""), en: v.en ? String(v.en) : undefined };
  }
  return { th: "" };
};

export const localizedToString = (
  value: LocalizedText | unknown,
  locale: "th" | "en" = "th",
): string => {
  const lt = asLocalizedText(value);
  if (locale === "en" && lt.en) return lt.en;
  return lt.th;
};

export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type QuestionType = "MCQ" | "SHORT_ANSWER" | "WRITTEN";
export type ContentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type RevealMode = "AFTER_EACH" | "AFTER_SUBMIT";
export type AttemptMode = "EXAM" | "PRACTICE";

export interface McqOption {
  key: string; // "A" | "B" | ...
  text: string; // รองรับ LaTeX ในรูป $...$
}

/** เฉลยของแต่ละประเภทคำถาม */
export type QuestionAnswer =
  | { kind: "MCQ"; correctKeys: string[] } // รองรับหลายตัวเลือกถูก
  | {
      kind: "SHORT_ANSWER";
      accepts: string[]; // คำตอบที่ยอมรับ (ตัวแรกคือคำตอบมาตรฐาน)
      normalize?: {
        ignoreCase?: boolean;
        ignoreSpaces?: boolean;
        numeric?: boolean; // เทียบค่าตัวเลข (1.0 == 1)
        stripUnits?: boolean;
      };
    }
  | {
      kind: "WRITTEN";
      finalAnswer: string; // คำตอบสุดท้าย (แสดงในเฉลย)
      steps?: string[]; // แนววิธีคิดแบบเป็นขั้นตอน
    };

export interface RubricItem {
  description: string;
  points: number;
}

export interface McqStat {
  totalCount: number;
  wrongCount: number;
}

/** ตัวเลือกที่ส่งให้ client ทำข้อสอบ — ตัด isCorrect ออกเสมอ */
export interface SafeQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  imageUrl: string | null;
  options: McqOption[] | null;
  points: number;
  sortOrder: number;
  rubric: RubricItem[] | null;
  hasSketch: boolean;
}

export interface SafeQuestionSet {
  id: string;
  title: LocalizedText;
  description: string | null;
  subjectId: string;
  subjectCode: string;
  subjectName: LocalizedText;
  subjectColor: string;
  topicId: string | null;
  topicTitle: LocalizedText | null;
  difficulty: Difficulty;
  recommendedMinutes: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  revealMode: RevealMode;
  questions: SafeQuestion[];
}

export interface AnswerPayload {
  questionId: string;
  selectedKeys?: string[];
  text?: string;
  tex?: string;
  finalAnswer?: string;
  sketchKey?: string | null;
  flagged?: boolean;
}

export interface ScoredAnswer {
  questionId: string;
  status: "correct" | "incorrect" | "skipped" | "self-check";
  earned: number;
  points: number;
}

export interface AttemptScore {
  earned: number;
  total: number;
  percent: number;
}
