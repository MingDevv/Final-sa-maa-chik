// Logic การตรวจคำตอบ — pure functions, ไม่พึ่ง DB (unit test ได้)
// ใช้ร่วมกันทั้ง server (scoring) และ client (แสดงผลลัพธ์เบื้องต้น)

import type { QuestionAnswer } from "@/lib/types";

export type NormalizeOptions = {
  ignoreCase?: boolean;
  ignoreSpaces?: boolean;
  numeric?: boolean;
  stripUnits?: boolean;
};

/** ตัดช่องว่าง/ตัวพิมพ์/หน่วย/LaTeX ที่ไม่จำเป็นออกก่อนเทียบคำตอบสั้น */
export const normalizeShortAnswer = (
  raw: string,
  opts: NormalizeOptions = {},
): string => {
  let s = (raw ?? "").trim();

  // ตัด LaTeX wrapper พื้นฐานที่ไม่มีผลต่อความหมาย
  s = s
    .replace(/\\left|\\right/g, "")
    .replace(/\$|\\%/g, "")
    .replace(/\\d?frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, "($1)/($2)")
    .replace(/\\text\s*\{([^}]*)\}/g, "$1")
    .replace(/\\mathrm\s*\{([^}]*)\}/g, "$1")
    .replace(/[{}]/g, "");

  if (opts.stripUnits) {
    // ตัดหน่วยท้ายคำตอบแบบพบบ่อย (เช่น "12 m/s^2", "12 เมตร/วินาที")
    s = s.replace(
      /\s*(?:m\/s\^?2|m\/s|km\/h|cm|m|kg|g|N|J|W|s|rad|°|เมตร|เมตร\/วินาที|เมตรต่อวินาที|เมตร\/วินาที\^?2|กิโลเมตร\/ชั่วโมง|เซนติเมตร|นิวตัน|จูล|วัตต์|วินาที|กรัม|กิโลกรัม|โมล|M)\s*$/i,
      "",
    );
  }

  if (opts.ignoreSpaces) s = s.replace(/\s+/g, "");

  if (opts.numeric) {
    // แปลงเลขให้เทียบค่าได้: "1.0" == "1", "1,200" == "1200", "(1)/(2)" → เทียบค่า
    const compact = s
      .replace(/,/g, "")
      .replace(/\s+/g, "")
      .replace(/\(([-\d./]+)\)/g, "$1");
    const num = Number(compact);
    if (Number.isFinite(num) && compact !== "" && /\d/.test(compact)) {
      return String(num);
    }
    // เศษส่วน a/b → เทียบค่า
    const frac = compact.match(/^(-?\d+)\/(\d+)$/);
    if (frac) {
      const v = Number(frac[1]) / Number(frac[2]);
      if (Number.isFinite(v)) return String(v);
    }
  }

  if (opts.ignoreCase) s = s.toLowerCase();
  return s.trim();
};

export type ShortAnswerAnswer = Extract<QuestionAnswer, { kind: "SHORT_ANSWER" }>;

/** ตรวจคำตอบสั้น เทียบกับทุกคำตอบที่ยอมรับ */
export const checkShortAnswer = (
  submitted: string,
  answer: ShortAnswerAnswer,
): boolean => {
  const opts = answer.normalize ?? {};
  const norm = normalizeShortAnswer(submitted, opts);
  if (norm === "") return false;
  return answer.accepts.some(
    (a) => normalizeShortAnswer(a, opts) === norm && norm !== "",
  );
};

export type McqAnswer = Extract<QuestionAnswer, { kind: "MCQ" }>;

/** ตรวจพหุตัวเลือก: เลือกครบและตรงชุดกันเป๊ะ (เผื่อ multiple correct) */
export const checkMcqAnswer = (
  selectedKeys: string[],
  answer: McqAnswer,
): boolean => {
  const a = [...new Set(selectedKeys)].sort();
  const b = [...new Set(answer.correctKeys)].sort();
  if (a.length !== b.length) return false;
  return a.every((k, i) => k === b[i]);
};

/** shuffle แบบ Fisher-Yates (สำหรับสุ่มลำดับข้อ/ตัวเลือก) */
export const shuffle = <T>(items: T[], rng: () => number = Math.random): T[] => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};
