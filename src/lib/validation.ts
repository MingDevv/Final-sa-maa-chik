// Zod schemas — ตรวจความถูกต้องของ input ทุก API

import { z } from "zod";

export const localizedTextSchema = z.union([
  z.string().min(1),
  z.object({
    th: z.string().min(1),
    en: z.string().optional(),
  }),
]);

export const difficultySchema = z.enum(["EASY", "MEDIUM", "HARD"]);
export const contentStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
export const revealModeSchema = z.enum(["AFTER_EACH", "AFTER_SUBMIT"]);
export const attemptModeSchema = z.enum(["EXAM", "PRACTICE"]);
export const questionTypeSchema = z.enum(["MCQ", "SHORT_ANSWER", "WRITTEN"]);

export const mcqAnswerSchema = z.object({
  kind: z.literal("MCQ"),
  correctKeys: z.array(z.string().min(1)).min(1),
});

export const shortAnswerSchema = z.object({
  kind: z.literal("SHORT_ANSWER"),
  accepts: z.array(z.string().min(1)).min(1),
  normalize: z
    .object({
      ignoreCase: z.boolean().optional(),
      ignoreSpaces: z.boolean().optional(),
      numeric: z.boolean().optional(),
      stripUnits: z.boolean().optional(),
    })
    .optional(),
});

export const writtenAnswerSchema = z.object({
  kind: z.literal("WRITTEN"),
  finalAnswer: z.string().min(1),
  steps: z.array(z.string()).optional(),
});

export const questionAnswerSchema = z.discriminatedUnion("kind", [
  mcqAnswerSchema,
  shortAnswerSchema,
  writtenAnswerSchema,
]);

export const rubricItemSchema = z.object({
  description: z.string().min(1),
  points: z.number().int().min(0),
});

export const mcqOptionSchema = z.object({
  key: z.string().min(1),
  text: z.string().min(1),
});

// ---------- สร้าง/แก้ไขเนื้อหา (Admin) ----------

export const createSubjectSchema = z.object({
  code: z.string().min(1).max(20),
  name: localizedTextSchema,
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#9F1239"),
  icon: z.string().default("book"),
  sortOrder: z.number().int().default(0),
});

export const updateSubjectSchema = createSubjectSchema.partial();

export const createTopicSchema = z.object({
  subjectId: z.string().min(1),
  title: localizedTextSchema,
  description: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

export const updateTopicSchema = createTopicSchema.partial();

export const createQuestionSchema = z.object({
  type: questionTypeSchema,
  prompt: z.string().min(1),
  options: z.array(mcqOptionSchema).min(2).max(5).optional(),
  answer: questionAnswerSchema,
  explanation: z.string().optional(),
  rubric: z.array(rubricItemSchema).optional(),
  points: z.number().int().min(1).default(1),
  imageKey: z.string().optional(),
});

export const createQuestionSetSchema = z.object({
  title: localizedTextSchema,
  description: z.string().optional(),
  subjectId: z.string().min(1),
  topicId: z.string().optional().nullable(),
  termId: z.string().optional().nullable(),
  difficulty: difficultySchema.default("MEDIUM"),
  recommendedMinutes: z.number().int().min(1).max(300).default(30),
  shuffleQuestions: z.boolean().default(false),
  shuffleOptions: z.boolean().default(false),
  revealMode: revealModeSchema.default("AFTER_SUBMIT"),
  questions: z.array(createQuestionSchema).min(1),
});

export const updateQuestionSetSchema = z.object({
  title: localizedTextSchema.optional(),
  description: z.string().optional().nullable(),
  topicId: z.string().optional().nullable(),
  termId: z.string().optional().nullable(),
  difficulty: difficultySchema.optional(),
  recommendedMinutes: z.number().int().min(1).max(300).optional(),
  status: contentStatusSchema.optional(),
  shuffleQuestions: z.boolean().optional(),
  shuffleOptions: z.boolean().optional(),
  revealMode: revealModeSchema.optional(),
});

// ---------- การทำข้อสอบ ----------

export const startAttemptSchema = z.object({
  setId: z.string().min(1),
  mode: attemptModeSchema.default("EXAM"),
});

export const saveAnswerSchema = z.object({
  questionId: z.string().min(1),
  selectedKeys: z.array(z.string()).optional(),
  text: z.string().optional(),
  tex: z.string().optional(),
  finalAnswer: z.string().optional(),
  sketchKey: z.string().nullable().optional(),
  flagged: z.boolean().optional(),
  selfChecked: z.boolean().optional(),
});

export const submitAttemptSchema = z.object({
  durationSec: z.number().int().min(0).optional(),
});

// ---------- เอกสาร / การอ่าน ----------

export const createDocumentSchema = z.object({
  title: localizedTextSchema,
  subjectId: z.string().min(1),
  topicId: z.string().optional().nullable(),
  storageKey: z.string().min(1),
  mimeType: z.string().default("application/pdf"),
  sizeBytes: z.number().int().optional(),
  pageCount: z.number().int().optional(),
});

export const updateDocumentSchema = z.object({
  title: localizedTextSchema.optional(),
  topicId: z.string().optional().nullable(),
  status: z.enum(["PENDING", "PROCESSING", "READY", "FAILED", "ARCHIVED"]).optional(),
});

export const updateProgressSchema = z.object({
  lastPage: z.number().int().min(1).optional(),
  readSeconds: z.number().int().min(0).optional(),
});

export const createBookmarkSchema = z.object({
  page: z.number().int().min(1),
  label: z.string().optional(),
});

export const createHighlightSchema = z.object({
  page: z.number().int().min(1),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#E11D48"),
  note: z.string().optional(),
});

export const createNoteSchema = z.object({
  page: z.number().int().min(1),
  content: z.string().min(1),
});

// ---------- รอบสอบ (Admin) ----------

export const createExamTermSchema = z.object({
  name: localizedTextSchema,
  academicYear: z.string().min(1),
  semester: z.string().optional(),
  examDate: z.string().datetime().optional().nullable(),
  status: z.enum(["UPCOMING", "ACTIVE", "ARCHIVED"]).default("ACTIVE"),
});

// ---------- import/export ----------

export const importPayloadSchema = z.object({
  subjects: z.array(createSubjectSchema.extend({ topics: z.array(createTopicSchema.omit({ subjectId: true})).optional() })).optional(),
  questionSets: z.array(createQuestionSetSchema.extend({ subjectCode: z.string().optional(), topicTitle: z.string().optional() })).optional(),
});
