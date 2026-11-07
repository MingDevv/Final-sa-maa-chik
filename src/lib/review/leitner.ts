/**
 * ระบบทบทวนแบบเว้นระยะ (Leitner box) — pure logic ทดสอบได้
 *
 * หลักการ (spacing effect, Cepeda et al. 2006): ทบทวนเว้นระยะห่างขึ้นเรื่อย ๆ จำได้นานกว่าอ่านรวดเดียว
 * - ตอบผิด → กลับกล่อง 1 (ทบทวนพรุ่งนี้)
 * - ตอบถูกแต่ "เดา" → ยังไม่นับว่าจำได้ อยู่กล่องเดิม/กล่อง 1 (ทบทวนพรุ่งนี้)
 * - ตอบถูกและมั่นใจ → ขึ้นกล่องถัดไป เว้นนานขึ้น 1 → 3 → 7 → 14 → 30 วัน
 * - ผ่านกล่อง 5 ด้วยความมั่นใจ → "จำได้แล้ว" เลิกทบทวน
 *
 * โหมดใกล้สอบ (เหลือ ≤ 14 วัน): ส่วนใหญ่อ่านกันแค่ ~7 วันก่อนสอบ รอบ 14/30 วันจึงไม่มีประโยชน์
 * → บีบรอบเป็น 1 → 1 → 2 → 2 → 3 วัน และไม่นัดเลยวันก่อนสอบ (วันก่อนสอบ = รอบสุดท้าย)
 * → ถ้าพรุ่งนี้/วันนี้สอบ: ข้อที่ผิดให้ทำซ้ำวันนี้เลย ข้อที่ถูกและมั่นใจ = ผ่าน
 */

export const BOX_INTERVAL_DAYS = [1, 3, 7, 14, 30] as const;
export const MAX_BOX = BOX_INTERVAL_DAYS.length;
export const CRAM_INTERVAL_DAYS = [1, 1, 2, 2, 3] as const;
export const CRAM_WINDOW_DAYS = 14;

const DAY = 86_400_000;
const BKK = 7 * 3_600_000;
/** เลขวันตามปฏิทินไทย (ใช้นับ "อีกกี่วันสอบ" แบบไม่สนชั่วโมง) */
const bkkDay = (d: Date) => Math.floor((d.getTime() + BKK) / DAY);

/** อีกกี่วันจะสอบ (0 = วันนี้, 1 = พรุ่งนี้, ติดลบ = สอบไปแล้ว, null = ไม่ได้ตั้งวันสอบ) */
export const daysUntilExam = (examDate: Date | null | undefined, now: Date = new Date()): number | null =>
  examDate ? bkkDay(examDate) - bkkDay(now) : null;

/** อยู่ในโหมดใกล้สอบไหม */
export const isCramMode = (examDate: Date | null | undefined, now: Date = new Date()) => {
  const left = daysUntilExam(examDate, now);
  return left !== null && left >= 0 && left <= CRAM_WINDOW_DAYS;
};

/** ระยะห่าง (วัน) ของกล่องนี้ — 0 = ทบทวนซ้ำวันนี้เลย */
export const intervalDays = (box: number, examDate: Date | null | undefined, now: Date = new Date()): number => {
  const normal = BOX_INTERVAL_DAYS[box - 1];
  if (!isCramMode(examDate, now)) return normal;
  const left = daysUntilExam(examDate, now)!;
  const latest = left - 1; // ทบทวนได้ช้าสุดคือวันก่อนสอบ
  if (latest < 1) return 0;
  return Math.min(CRAM_INTERVAL_DAYS[box - 1], latest);
};

export type ReviewOutcome = {
  correct: boolean;
  /** true = มั่นใจ, false = เดา, null = ไม่ได้บอก (ถือว่ามั่นใจถ้าตอบถูก) */
  confident: boolean | null;
};

export type CardState = { box: number } | null;

export type NextCard =
  | { action: "upsert"; box: number; dueAt: Date; confidentWrong: boolean; lapse: boolean }
  | { action: "graduate" } // จำได้แล้ว ลบบัตรทิ้ง
  | { action: "none" }; // ไม่ต้องสร้างบัตร (ถูกและมั่นใจตั้งแต่แรก)

const addDays = (from: Date, days: number) => new Date(from.getTime() + days * 86_400_000);

/** คำนวณสถานะบัตรถัดไปจากผลการตอบ */
export const nextCard = (
  card: CardState,
  outcome: ReviewOutcome,
  now: Date = new Date(),
  examDate: Date | null = null,
): NextCard => {
  const sure = outcome.confident !== false;
  const due = (box: number) => addDays(now, intervalDays(box, examDate, now));

  if (!outcome.correct) {
    return {
      action: "upsert",
      box: 1,
      dueAt: due(1),
      confidentWrong: outcome.confident === true,
      lapse: card !== null,
    };
  }

  // ตอบถูกแต่เดา: ยังไม่น่าไว้ใจ — ถ้ายังไม่มีบัตรก็สร้าง ถ้ามีแล้วอยู่กล่องเดิม
  if (!sure) {
    const box = card?.box ?? 1;
    return {
      action: "upsert",
      box,
      dueAt: due(1),
      confidentWrong: false,
      lapse: false,
    };
  }

  // ตอบถูกและมั่นใจ
  if (!card) return { action: "none" };
  if (card.box >= MAX_BOX) return { action: "graduate" };
  // พรุ่งนี้/วันนี้สอบ และตอบถูกอย่างมั่นใจแล้ว → ผ่าน ไม่ต้องวนอีก
  if (intervalDays(card.box + 1, examDate, now) === 0) return { action: "graduate" };
  const box = card.box + 1;
  return {
    action: "upsert",
    box,
    dueAt: due(box),
    confidentWrong: false,
    lapse: false,
  };
};

/** สิ้นวันนี้ (เวลาไทย) — ข้อที่ dueAt ก่อนเวลานี้ถือว่า "ต้องทบทวนวันนี้" */
export const endOfTodayBangkok = (now: Date = new Date()): Date => {
  const bkk = new Date(now.getTime() + 7 * 3_600_000);
  bkk.setUTCHours(23, 59, 59, 999);
  return new Date(bkk.getTime() - 7 * 3_600_000);
};
