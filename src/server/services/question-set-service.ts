import { getStorage } from "@/server/storage";
import { localizedToString, type SafeQuestion, type SafeQuestionSet } from "@/lib/types";
import type { QuestionRow, QuestionSetRow } from "@/server/repositories/question-set-repository";
import { questionSetRepository } from "@/server/repositories/question-set-repository";
import { shuffle } from "@/lib/exam/answer-checking";
import type { McqOption, QuestionAnswer } from "@/lib/types";

/** แปลง Question → SafeQuestion: ตัดเฉลย/คำอธิบายออกทั้งหมดก่อนส่งให้ client */
export const toSafeQuestion = (
  q: QuestionRow,
  optionOrder?: string[] | null,
): SafeQuestion => {
  let options: McqOption[] | null = null;
  if (q.type === "MCQ" && Array.isArray(q.options)) {
    const raw = q.options as unknown as McqOption[];
    options = optionOrder
      ? optionOrder
          .map((k) => raw.find((o) => o.key === k))
          .filter((o): o is McqOption => Boolean(o))
      : raw;
  }
  return {
    id: q.id,
    type: q.type,
    prompt: q.prompt,
    imageUrl: q.imageKey ? getStorage().getUrl(q.imageKey) : null,
    options,
    points: q.points,
    sortOrder: q.sortOrder,
    rubric: (q.rubric as never) ?? null,
    hasSketch: q.type === "WRITTEN",
  };
};

export const toSafeSet = (
  set: QuestionSetRow,
  opts: { applyShuffle: boolean },
): SafeQuestionSet => {
  let questions = set.questions;
  const optionOrders = new Map<string, string[] | null>();

  if (opts.applyShuffle) {
    questions = shuffle(questions);
    if (set.shuffleOptions) {
      for (const q of questions) {
        if (q.type === "MCQ" && Array.isArray(q.options)) {
          const keys = (q.options as unknown as McqOption[]).map((o) => o.key);
          optionOrders.set(q.id, shuffle(keys));
        }
      }
    }
  }

  return {
    id: set.id,
    title: set.title as never,
    description: set.description,
    subjectId: set.subjectId,
    subjectCode: set.subject.code,
    subjectName: set.subject.name as never,
    subjectColor: set.subject.color,
    topicId: set.topicId,
    topicTitle: set.topic ? (set.topic.title as never) : null,
    difficulty: set.difficulty,
    recommendedMinutes: set.recommendedMinutes,
    shuffleQuestions: set.shuffleQuestions,
    shuffleOptions: set.shuffleOptions,
    revealMode: set.revealMode,
    questions: questions.map((q) => toSafeQuestion(q, optionOrders.get(q.id))),
  };
};

export const questionSetService = {
  async listPublished(filters: {
    subjectId?: string;
    topicId?: string;
    difficulty?: "EASY" | "MEDIUM" | "HARD";
  }) {
    const rows = await questionSetRepository.list({
      ...filters,
      status: "PUBLISHED",
    });
    return rows.map((s) => ({
      id: s.id,
      title: localizedToString(s.title),
      description: s.description,
      subjectCode: s.subject.code,
      subjectName: localizedToString(s.subject.name),
      subjectColor: s.subject.color,
      topicId: s.topicId,
      topicTitle: s.topic ? localizedToString(s.topic.title) : null,
      difficulty: s.difficulty,
      recommendedMinutes: s.recommendedMinutes,
      questionCount: s._count.questions,
      status: s.status,
      updatedAt: s.updatedAt,
    }));
  },

  async listForAdmin(filters: { subjectId?: string; status?: string }) {
    const rows = await questionSetRepository.list(filters as never);
    return rows.map((s) => ({
      id: s.id,
      title: localizedToString(s.title),
      subjectCode: s.subject.code,
      topicTitle: s.topic ? localizedToString(s.topic.title) : null,
      difficulty: s.difficulty,
      questionCount: s._count.questions,
      status: s.status,
      version: s.version,
      updatedAt: s.updatedAt,
    }));
  },

  /** ดึงชุดข้อสอบสำหรับทำ (เฉลยถูกตัดออก) — สุ่มลำดับตามการตั้งค่า */
  async getForPlay(setId: string): Promise<SafeQuestionSet | null> {
    const set = await questionSetRepository.findById(setId);
    if (!set || set.status !== "PUBLISHED") return null;
    return toSafeSet(set, { applyShuffle: true });
  },

  async getById(setId: string) {
    return questionSetRepository.findById(setId);
  },

  async countDraftQuestions(setId: string) {
    const set = await questionSetRepository.findById(setId);
    return set?.questions.length ?? 0;
  },
};

export const parseQuestionAnswer = (raw: unknown): QuestionAnswer =>
  raw as QuestionAnswer;
