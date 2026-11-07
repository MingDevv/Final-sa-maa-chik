import { db } from "@/lib/db";
import { getStorage } from "@/server/storage";
import { checkMcqAnswer, checkShortAnswer } from "@/lib/exam/answer-checking";
import {
  daysUntilExam,
  endOfTodayBangkok,
  isCramMode,
  nextCard,
  type ReviewOutcome,
} from "@/lib/review/leitner";
import { localizedToString, type QuestionAnswer } from "@/lib/types";

type Owner = { userId?: string; guestSessionId?: string };

/** เงื่อนไข where ของเจ้าของบัตร (ไม่มี owner = ไม่เห็นอะไรเลย) */
const ownerWhere = (owner: Owner) =>
  owner.userId
    ? { userId: owner.userId }
    : owner.guestSessionId
      ? { guestSessionId: owner.guestSessionId }
      : null;

/** บัตรที่ยังใช้ได้: ข้อสอบต้องอยู่ในชุดที่เผยแพร่ และตรวจอัตโนมัติได้ */
const liveCard = {
  question: { type: { in: ["MCQ", "SHORT_ANSWER"] as ("MCQ" | "SHORT_ANSWER")[] }, set: { status: "PUBLISHED" as const } },
};

/** วันสอบที่ใกล้ที่สุดที่ยังไม่ผ่าน (จากรอบสอบที่ ACTIVE) — ใช้บีบรอบทบทวนช่วงใกล้สอบ */
export async function upcomingExamDate(now = new Date()): Promise<Date | null> {
  try {
    const terms = await db.examTerm.findMany({
      where: { status: "ACTIVE", examDate: { not: null } },
      select: { examDate: true },
    });
    const upcoming = terms
      .map((t) => t.examDate!)
      .filter((d) => (daysUntilExam(d, now) ?? -1) >= 0)
      .sort((a, b) => a.getTime() - b.getTime());
    return upcoming[0] ?? null;
  } catch {
    return null;
  }
}

async function applyOutcome(
  owner: Owner,
  questionId: string,
  outcome: ReviewOutcome,
  examDate: Date | null,
  now = new Date(),
) {
  const where = ownerWhere(owner);
  if (!where) return;
  const existing = await db.reviewCard.findFirst({ where: { ...where, questionId } });
  const next = nextCard(existing ? { box: existing.box } : null, outcome, now, examDate);

  if (next.action === "none") return;
  if (next.action === "graduate") {
    if (existing) await db.reviewCard.delete({ where: { id: existing.id } });
    return;
  }
  if (existing) {
    await db.reviewCard.update({
      where: { id: existing.id },
      data: {
        box: next.box,
        dueAt: next.dueAt,
        confidentWrong: next.confidentWrong,
        reviewCount: { increment: 1 },
        ...(next.lapse ? { lapses: { increment: 1 } } : {}),
      },
    });
  } else {
    await db.reviewCard.create({
      data: { ...where, questionId, box: next.box, dueAt: next.dueAt, confidentWrong: next.confidentWrong },
    });
  }
}

export const reviewService = {
  /** หลังส่งข้อสอบ: ข้อที่ผิด / ถูกแต่เดา → เข้าคิวทบทวน */
  async recordFromAttempt(owner: Owner, items: Array<{ questionId: string } & ReviewOutcome>) {
    const examDate = await upcomingExamDate();
    for (const item of items) {
      await applyOutcome(owner, item.questionId, item, examDate);
    }
  },

  /** จำนวนข้อที่ต้องทบทวนวันนี้ + ข้ออันตราย (มั่นใจแต่ผิด) */
  async dueSummary(owner: Owner) {
    const examDate = await upcomingExamDate();
    const exam = { examDaysLeft: daysUntilExam(examDate), cram: isCramMode(examDate) };
    const where = ownerWhere(owner);
    if (!where) return { due: 0, dangerous: 0, total: 0, ...exam };
    const today = endOfTodayBangkok();
    const [due, dangerous, total] = await Promise.all([
      db.reviewCard.count({ where: { ...where, ...liveCard, dueAt: { lte: today } } }),
      db.reviewCard.count({ where: { ...where, ...liveCard, dueAt: { lte: today }, confidentWrong: true } }),
      db.reviewCard.count({ where: { ...where, ...liveCard } }),
    ]);
    return { due, dangerous, total, ...exam };
  },

  /** รายการข้อที่ถึงรอบทบทวน — ข้ออันตรายก่อน แล้วเรียงตามที่ค้างนานสุด (ไม่ส่งเฉลยออกไป) */
  async listDue(owner: Owner, opts: { all?: boolean; limit?: number } = {}) {
    const where = ownerWhere(owner);
    if (!where) return [];
    // all = ติวก่อนสอบ: ทบทวนทุกข้อในคิว (ไม่รอรอบ) เริ่มจากข้ออันตราย → กล่องต่ำ (ยังจำไม่ได้)
    const cards = await db.reviewCard.findMany({
      where: { ...where, ...liveCard, ...(opts.all ? {} : { dueAt: { lte: endOfTodayBangkok() } }) },
      orderBy: opts.all
        ? [{ confidentWrong: "desc" }, { box: "asc" }, { dueAt: "asc" }]
        : [{ confidentWrong: "desc" }, { dueAt: "asc" }],
      take: opts.limit ?? (opts.all ? 60 : 30),
      include: {
        question: {
          include: { set: { include: { subject: { select: { code: true, name: true, color: true } } } } },
        },
      },
    });
    const storage = getStorage();
    return cards.map((c) => ({
      cardId: c.id,
      box: c.box,
      confidentWrong: c.confidentWrong,
      question: {
        id: c.question.id,
        type: c.question.type as "MCQ" | "SHORT_ANSWER",
        prompt: c.question.prompt,
        imageUrl: c.question.imageKey ? storage.getUrl(c.question.imageKey) : null,
        options: (c.question.options as { key: string; text: string }[] | null)?.map((o) => ({
          key: o.key,
          text: o.text,
        })) ?? null,
      },
      subject: {
        code: c.question.set.subject.code,
        name: localizedToString(c.question.set.subject.name),
        color: c.question.set.subject.color,
      },
      setTitle: localizedToString(c.question.set.title),
    }));
  },

  /** ตอบข้อทบทวน: ตรวจ → เลื่อนกล่อง → ส่งเฉลยกลับ */
  async answer(
    owner: Owner,
    cardId: string,
    input: { selectedKeys?: string[]; text?: string; confident: boolean },
  ) {
    const where = ownerWhere(owner);
    if (!where) throw new Error("FORBIDDEN");
    const card = await db.reviewCard.findFirst({
      where: { id: cardId, ...where },
      include: { question: true },
    });
    if (!card) throw new Error("NOT_FOUND");

    const q = card.question;
    const answer = q.answer as unknown as QuestionAnswer;
    let isCorrect = false;
    if (q.type === "MCQ" && answer.kind === "MCQ") {
      isCorrect = checkMcqAnswer(input.selectedKeys ?? [], answer);
    } else if (q.type === "SHORT_ANSWER" && answer.kind === "SHORT_ANSWER") {
      isCorrect = checkShortAnswer(input.text ?? "", answer);
    } else {
      throw new Error("NOT_FOUND");
    }

    await applyOutcome(owner, q.id, { correct: isCorrect, confident: input.confident }, await upcomingExamDate());
    const after = await db.reviewCard.findUnique({ where: { id: card.id }, select: { box: true, dueAt: true } });

    return {
      isCorrect,
      correctKeys: answer.kind === "MCQ" ? answer.correctKeys : null,
      acceptedAnswer: answer.kind === "SHORT_ANSWER" ? answer.accepts[0] ?? null : null,
      explanation: q.explanation,
      // null = จำได้แล้ว (เลิกทบทวน)
      next: after ? { box: after.box, dueAt: after.dueAt } : null,
    };
  },
};
