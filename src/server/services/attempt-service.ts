import { attemptRepository, questionStatRepository } from "@/server/repositories/attempt-repository";
import { questionSetRepository } from "@/server/repositories/question-set-repository";
import { weakTopicRepository, activityRepository } from "@/server/repositories/analytics-repository";
import { checkMcqAnswer, checkShortAnswer } from "@/lib/exam/answer-checking";
import type { AttemptScore, ScoredAnswer } from "@/lib/types";
import type { AttemptRow } from "@/server/repositories/attempt-repository";
import type { Prisma } from "@prisma/client";

export interface SubmitResult {
  score: AttemptScore;
  perQuestion: ScoredAnswer[];
  weakTopics: Array<{ subjectId: string; topicId: string; total: number; wrong: number }>;
}

/**
 * ตรวจคำตอบทั้งชุด (pure logic เรียกผ่าน scoring core)
 * - MCQ / SHORT_ANSWER ตรวจอัตโนมัติ
 * - WRITTEN ให้สถานะ "self-check": ไม่อ้างว่าตรวจได้แม่นยำเสมอ ผู้ใช้ติ๊กตรวจเองตาม rubric
 */
export const scoreAttemptAnswers = (attempt: AttemptRow): {
  score: AttemptScore;
  perQuestion: ScoredAnswer[];
  weakTopics: Array<{ subjectId: string; topicId: string; total: number; wrong: number }>;
} => {
  const perQuestion: ScoredAnswer[] = [];
  const topicAgg = new Map<string, { subjectId: string; total: number; wrong: number }>();

  for (const q of attempt.set.questions) {
    const submitted = attempt.answers.find((a) => a.questionId === q.id);
    const answered =
      submitted &&
      submitted.answer &&
      Object.keys(submitted.answer as object).length > 0;
    const answer = q.answer as never;

    let status: ScoredAnswer["status"] = "skipped";
    let isCorrect: boolean | null = null;

    if (answered) {
      const a = submitted.answer as {
        selectedKeys?: string[];
        text?: string;
        finalAnswer?: string;
      };
      const hasContent =
        (a.selectedKeys?.length ?? 0) > 0 ||
        Boolean(a.text?.trim()) ||
        Boolean(a.finalAnswer?.trim());
      if (hasContent) {
        if (q.type === "MCQ") {
          isCorrect = checkMcqAnswer(a.selectedKeys ?? [], answer);
          status = isCorrect ? "correct" : "incorrect";
        } else if (q.type === "SHORT_ANSWER") {
          isCorrect = checkShortAnswer(a.text ?? "", answer);
          status = isCorrect ? "correct" : "incorrect";
        } else {
          // ข้อเขียน: รอผู้ใช้ตรวจเอง
          isCorrect = null;
          status = "self-check";
        }
      }
    }

    const earned =
      status === "correct" ? q.points : status === "self-check" ? 0 : 0;
    perQuestion.push({
      questionId: q.id,
      status,
      earned,
      points: q.points,
    });

    // นับสถิติเฉพาะข้อที่ตรวจอัตโนมัติได้ (MCQ / SHORT_ANSWER)
    if (status !== "self-check") {
      const topicId = attempt.set.topicId ?? "no-topic";
      const agg = topicAgg.get(topicId) ?? {
        subjectId: attempt.set.subjectId,
        total: 0,
        wrong: 0,
      };
      agg.total += 1;
      if (status === "incorrect") agg.wrong += 1;
      topicAgg.set(topicId, agg);
    }
  }

  const total = attempt.set.questions.reduce((sum, q) => sum + q.points, 0);
  const earned = perQuestion.reduce((sum, p) => sum + p.earned, 0);
  const autoGraded = perQuestion.filter((p) => p.status !== "self-check");
  const autoTotal = autoGraded.reduce((sum, p) => sum + p.points, 0);
  const autoEarned = autoGraded.reduce((sum, p) => sum + p.earned, 0);

  return {
    score: {
      earned,
      total,
      // เปอร์เซ็นต์คิดเฉพาะข้อที่ตรวจอัตโนมัติได้ (ข้อเขียนแสดงแยกว่าต้องตรวจเอง)
      percent: autoTotal > 0 ? Math.round((autoEarned / autoTotal) * 100) : earned === total && total > 0 ? 100 : 0,
    },
    perQuestion,
    weakTopics: [...topicAgg.entries()].map(([topicId, v]) => ({
      topicId,
      subjectId: v.subjectId,
      total: v.total,
      wrong: v.wrong,
    })),
  };
};

/** ตรวจว่า attempt เป็นของเซสชันปัจจุบัน (throw ถ้าไม่ใช่) */
function assertOwner(
  attempt: AttemptRow | null,
  owner: { userId?: string; guestSessionId?: string },
): asserts attempt is AttemptRow {
  if (!attempt) throw new Error("ATTEMPT_NOT_FOUND");
  const match = attempt.userId
    ? attempt.userId === owner.userId
    : attempt.guestSessionId === owner.guestSessionId;
  if (!match) throw new Error("FORBIDDEN");
}

export const attemptService = {
  async start(input: {
    setId: string;
    mode: "EXAM" | "PRACTICE";
    owner: { userId?: string; guestSessionId?: string };
  }) {
    const set = await questionSetRepository.findById(input.setId);
    if (!set || set.status !== "PUBLISHED") return null;

    // ถ้ามี attempt ค้างอยู่ให้กลับไปทำต่อ
    const existing = await attemptRepository.findLastActive(input.setId, input.owner);
    if (existing) return existing.id;

    const created = await attemptRepository.create({
      setId: input.setId,
      userId: input.owner.userId ?? null,
      guestSessionId: input.owner.guestSessionId ?? null,
      mode: input.mode,
    });
    return created.id;
  },

  async saveAnswer(input: {
    attemptId: string;
    owner: { userId?: string; guestSessionId?: string };
    data: {
      questionId: string;
      selectedKeys?: string[];
      text?: string;
      tex?: string;
      finalAnswer?: string;
      sketchKey?: string | null;
      flagged?: boolean;
      selfChecked?: boolean;
    };
  }) {
    const attempt = await attemptRepository.findById(input.attemptId);
    assertOwner(attempt, input.owner);

    const { questionId, ...rest } = input.data;
    const answerPayload: Prisma.InputJsonValue = {
      ...(rest.selectedKeys !== undefined ? { selectedKeys: rest.selectedKeys } : {}),
      ...(rest.text !== undefined ? { text: rest.text } : {}),
      ...(rest.tex !== undefined ? { tex: rest.tex } : {}),
      ...(rest.finalAnswer !== undefined ? { finalAnswer: rest.finalAnswer } : {}),
    };

    await attemptRepository.saveAnswer(input.attemptId, questionId, {
      answer: answerPayload,
      sketchKey: rest.sketchKey,
      flagged: rest.flagged,
      selfChecked: rest.selfChecked,
    });

    // โหมดฝึก (เฉลยทันที): ตรวจข้ออัตโนมัติให้ด้วย — โหลดใหม่หลังบันทึกเพื่อให้เห็นคำตอบล่าสุด
    const q = attempt.set.questions.find((x) => x.id === questionId);
    if (q && q.type !== "WRITTEN") {
      const fresh = await attemptRepository.findById(input.attemptId);
      const { perQuestion } = scoreAttemptAnswers(fresh ?? attempt);
      const p = perQuestion.find((x) => x.questionId === questionId);
      if (p) {
        await attemptRepository.saveAnswer(input.attemptId, questionId, {
          isCorrect: p.status === "correct",
        });
      }
      return { isCorrect: p?.status === "correct" };
    }
    return { isCorrect: null };
  },

  async submit(input: {
    attemptId: string;
    owner: { userId?: string; guestSessionId?: string };
    durationSec?: number;
  }): Promise<SubmitResult | null> {
    const attempt = await attemptRepository.findById(input.attemptId);
    assertOwner(attempt, input.owner);

    const result = scoreAttemptAnswers(attempt);
    const durationSec =
      input.durationSec ??
      Math.round((Date.now() - attempt.startedAt.getTime()) / 1000);

    await attemptRepository.submit(input.attemptId, {
      finishedAt: new Date(),
      durationSec,
      score: result.score as unknown as Prisma.InputJsonValue,
    });

    // บันทึกสถิติรายข้อ + จุดอ่อน + กิจกรรมรายวัน
    for (const p of result.perQuestion) {
      if (p.status === "self-check") continue;
      await questionStatRepository.increment(p.questionId, {
        total: 1,
        wrong: p.status === "incorrect" ? 1 : 0,
      });
    }
    for (const w of result.weakTopics) {
      if (w.topicId === "no-topic") continue;
      await weakTopicRepository.record(input.owner, w);
    }
    await activityRepository.recordToday(input.owner, {
      quizSeconds: durationSec,
      questionsDone: result.perQuestion.filter((p) => p.status !== "skipped").length,
    });

    return result;
  },

  async selfCheck(input: {
    attemptId: string;
    questionId: string;
    correct: boolean;
  }) {
    // ผู้ใช้ติ๊กตรวจข้อเขียนเอง — บันทึกผลและอัปเดตคะแนนรวม
    const attempt = await attemptRepository.findById(input.attemptId);
    if (!attempt) return null;
    const q = attempt.set.questions.find((x) => x.id === input.questionId);
    if (!q || q.type !== "WRITTEN") return null;

    await attemptRepository.saveAnswer(input.attemptId, input.questionId, {
      selfChecked: true,
      isCorrect: input.correct,
    });

    const saved = await attemptRepository.findById(input.attemptId);
    if (!saved) return null;
    const result = scoreAttemptAnswers(saved);
    // คะแนนข้อเขียนนับเฉพาะที่ผู้ใช้ยืนยันว่าถูก
    const writtenEarned = saved.answers
      .filter((a) => a.selfChecked && a.isCorrect)
      .reduce((sum, a) => {
        const qq = saved.set.questions.find((x) => x.id === a.questionId);
        return sum + (qq?.points ?? 0);
      }, 0);

    const score = {
      earned: result.score.earned + writtenEarned,
      total: result.score.total,
      percent: result.score.total > 0
        ? Math.round(((result.score.earned + writtenEarned) / result.score.total) * 100)
        : 0,
    };
    await attemptRepository.submit(input.attemptId, {
      finishedAt: attempt.finishedAt ?? new Date(),
      durationSec: attempt.durationSec ?? 0,
      score: score as unknown as Prisma.InputJsonValue,
    });
    return { score };
  },

  async getAttempt(attemptId: string) {
    return attemptRepository.findById(attemptId);
  },

};
