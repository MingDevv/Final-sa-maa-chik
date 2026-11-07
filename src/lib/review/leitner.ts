/**
 * ระบบทบทวนแบบเว้นระยะ (Leitner box) — pure logic ทดสอบได้
 *
 * หลักการ (spacing effect, Cepeda et al. 2006): ทบทวนเว้นระยะห่างขึ้นเรื่อย ๆ จำได้นานกว่าอ่านรวดเดียว
 * - ตอบผิด → กลับกล่อง 1 (ทบทวนพรุ่งนี้)
 * - ตอบถูกแต่ "เดา" → ยังไม่นับว่าจำได้ อยู่กล่องเดิม/กล่อง 1 (ทบทวนพรุ่งนี้)
 * - ตอบถูกและมั่นใจ → ขึ้นกล่องถัดไป เว้นนานขึ้น 1 → 3 → 7 → 14 → 30 วัน
 * - ผ่านกล่อง 5 ด้วยความมั่นใจ → "จำได้แล้ว" เลิกทบทวน
 */

export const BOX_INTERVAL_DAYS = [1, 3, 7, 14, 30] as const;
export const MAX_BOX = BOX_INTERVAL_DAYS.length;

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
export const nextCard = (card: CardState, outcome: ReviewOutcome, now: Date = new Date()): NextCard => {
  const sure = outcome.confident !== false;

  if (!outcome.correct) {
    return {
      action: "upsert",
      box: 1,
      dueAt: addDays(now, BOX_INTERVAL_DAYS[0]),
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
      dueAt: addDays(now, BOX_INTERVAL_DAYS[0]),
      confidentWrong: false,
      lapse: false,
    };
  }

  // ตอบถูกและมั่นใจ
  if (!card) return { action: "none" };
  if (card.box >= MAX_BOX) return { action: "graduate" };
  const box = card.box + 1;
  return {
    action: "upsert",
    box,
    dueAt: addDays(now, BOX_INTERVAL_DAYS[box - 1]),
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
