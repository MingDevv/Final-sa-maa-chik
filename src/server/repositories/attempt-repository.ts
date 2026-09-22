import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type AttemptRow = Prisma.AttemptGetPayload<{
  include: {
    set: { include: { subject: true; topic: true; questions: { orderBy: { sortOrder: "asc" } } } };
    answers: true;
    retrySession: true;
  };
}>;

export const attemptRepository = {
  async create(data: {
    setId: string;
    userId?: string | null;
    guestSessionId?: string | null;
    mode: "EXAM" | "PRACTICE";
    retrySessionId?: string | null;
  }) {
    return db.attempt.create({
      data: {
        setId: data.setId,
        userId: data.userId ?? null,
        guestSessionId: data.guestSessionId ?? null,
        mode: data.mode,
        retrySessionId: data.retrySessionId ?? null,
      },
    });
  },

  async findById(id: string): Promise<AttemptRow | null> {
    return db.attempt.findUnique({
      where: { id },
      include: {
        set: {
          include: {
            subject: true,
            topic: true,
            questions: { orderBy: { sortOrder: "asc" } },
          },
        },
        answers: true,
        retrySession: true,
      },
    });
  },

  async saveAnswer(
    attemptId: string,
    questionId: string,
    data: {
      answer?: unknown;
      sketchKey?: string | null;
      flagged?: boolean;
      selfChecked?: boolean;
      isCorrect?: boolean | null;
    },
  ) {
    const { answer, ...rest } = data;
    return db.attemptAnswer.upsert({
      where: { attemptId_questionId: { attemptId, questionId } },
      create: {
        attemptId,
        questionId,
        answer: (answer ?? {}) as Prisma.InputJsonValue,
        ...rest,
        flagged: rest.flagged ?? false,
      },
      update: {
        ...(answer !== undefined ? { answer: answer as Prisma.InputJsonValue } : {}),
        ...rest,
      },
    });
  },

  async submit(id: string, data: { finishedAt: Date; durationSec: number; score: unknown }) {
    return db.attempt.update({
      where: { id },
      data: {
        status: "SUBMITTED",
        finishedAt: data.finishedAt,
        durationSec: data.durationSec,
        score: data.score as Prisma.InputJsonValue,
      },
    });
  },

  async abandon(id: string) {
    return db.attempt.update({ where: { id }, data: { status: "ABANDONED" } });
  },

  async findLastActive(
    setId: string,
    owner: { userId?: string; guestSessionId?: string },
    retrySessionId?: string | null,
  ) {
    return db.attempt.findFirst({
      where: {
        setId,
        status: "IN_PROGRESS",
        userId: owner.userId ?? null,
        guestSessionId: owner.guestSessionId ?? null,
        retrySessionId: retrySessionId ?? null,
      },
      orderBy: { startedAt: "desc" },
    });
  },

  async listRecentByOwner(owner: { userId?: string; guestSessionId?: string }, take = 20) {
    return db.attempt.findMany({
      where: {
        status: "SUBMITTED",
        userId: owner.userId ?? null,
        guestSessionId: owner.guestSessionId ?? null,
      },
      orderBy: { finishedAt: "desc" },
      take,
      include: {
        set: { include: { subject: { select: { code: true, name: true, color: true } } } },
      },
    });
  },
};

export const questionStatRepository = {
  async increment(
    questionId: string,
    delta: { total: number; wrong: number },
  ) {
    return db.questionStat.upsert({
      where: { questionId },
      create: { questionId, totalCount: delta.total, wrongCount: delta.wrong },
      update: {
        totalCount: { increment: delta.total },
        wrongCount: { increment: delta.wrong },
      },
    });
  },
};
