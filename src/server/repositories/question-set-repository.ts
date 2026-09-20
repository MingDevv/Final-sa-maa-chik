import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/** cast ค่าที่จะเก็บลงคอลัมน์ JSON ให้พิมพ์ถูกต้อง */
export const asJson = (v: unknown): Prisma.InputJsonValue =>
  v as Prisma.InputJsonValue;

export type QuestionRow = Prisma.QuestionGetPayload<object>;
export type QuestionSetRow = Prisma.QuestionSetGetPayload<{
  include: { subject: true; topic: true; term: true; questions: true };
}>;

export interface QuestionSetFilters {
  subjectId?: string;
  topicId?: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

export const questionSetRepository = {
  async list(filters: QuestionSetFilters) {
    return db.questionSet.findMany({
      where: {
        subjectId: filters.subjectId,
        topicId: filters.topicId,
        difficulty: filters.difficulty,
        status: filters.status,
      },
      orderBy: { updatedAt: "desc" },
      include: {
        subject: { select: { code: true, name: true, color: true } },
        topic: { select: { title: true } },
        _count: { select: { questions: true } },
      },
    });
  },

  async findById(id: string): Promise<QuestionSetRow | null> {
    return db.questionSet.findUnique({
      where: { id },
      include: {
        subject: true,
        topic: true,
        term: true,
        questions: { orderBy: { sortOrder: "asc" } },
      },
    });
  },

  async create(data: {
    title: unknown;
    description?: string;
    subjectId: string;
    topicId?: string | null;
    termId?: string | null;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    recommendedMinutes: number;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    revealMode: "AFTER_EACH" | "AFTER_SUBMIT";
    status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    questions: Array<{
      type: "MCQ" | "SHORT_ANSWER" | "WRITTEN";
      prompt: string;
      options?: unknown;
      answer: unknown;
      explanation?: string;
      rubric?: unknown;
      points: number;
      imageKey?: string;
    }>;
  }) {
    const { questions, ...meta } = data;
    return db.questionSet.create({
      data: {
        ...meta,
        title: asJson(meta.title),
        status: meta.status ?? "DRAFT",
        questions: {
          create: questions.map((q, i) => ({
            ...q,
            options: q.options === undefined ? undefined : asJson(q.options),
            answer: asJson(q.answer),
            rubric: q.rubric === undefined ? undefined : asJson(q.rubric),
            sortOrder: i,
          })),
        },
      },
      include: { questions: true },
    });
  },

  async updateMeta(id: string, data: Record<string, unknown>) {
    return db.questionSet.update({ where: { id }, data });
  },

  async archive(id: string) {
    return db.questionSet.update({ where: { id }, data: { status: "ARCHIVED" } });
  },

  async publish(id: string) {
    return db.questionSet.update({ where: { id }, data: { status: "PUBLISHED" } });
  },

  async delete(id: string) {
    return db.questionSet.delete({ where: { id } });
  },
};

export const questionRepository = {
  async create(setId: string, data: Record<string, unknown>, sortOrder: number) {
    return db.question.create({
      data: {
        setId,
        type: data.type as "MCQ" | "SHORT_ANSWER" | "WRITTEN",
        prompt: data.prompt as string,
        options: data.options === undefined ? undefined : asJson(data.options),
        answer: asJson(data.answer),
        explanation: data.explanation as string | undefined,
        rubric: data.rubric === undefined ? undefined : asJson(data.rubric),
        points: (data.points as number) ?? 1,
        imageKey: data.imageKey as string | undefined,
        sortOrder,
      },
    });
  },

  async delete(id: string) {
    return db.question.delete({ where: { id } });
  },
};
