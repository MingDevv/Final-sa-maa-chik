import { localizedToString, type LocalizedText } from "@/lib/types";
import type { SubjectWithStats } from "@/server/repositories/subject-repository";
import {
  subjectRepository,
  topicRepository,
} from "@/server/repositories/subject-repository";
import type { Topic } from "@prisma/client";

export interface SubjectDto {
  id: string;
  code: string;
  name: string;
  nameEn: string | null;
  color: string;
  icon: string;
  topicCount: number;
  documentCount: number;
  questionSetCount: number;
}

export const toSubjectDto = (s: SubjectWithStats): SubjectDto => ({
  id: s.id,
  code: s.code,
  name: localizedToString(s.name),
  nameEn: (s.name as LocalizedText)?.en ?? null,
  color: s.color,
  icon: s.icon,
  topicCount: s.topicCount,
  documentCount: s.documentCount,
  questionSetCount: s.publishedSetCount,
});

export interface TopicDto {
  id: string;
  subjectId: string;
  title: string;
  description: string | null;
  sortOrder: number;
}

export const toTopicDto = (t: Topic): TopicDto => ({
  id: t.id,
  subjectId: t.subjectId,
  title: localizedToString(t.title),
  description: t.description,
  sortOrder: t.sortOrder,
});

export const subjectService = {
  /** รายวิชาที่เผยแพร่ทั้งหมด — UI ดึงจาก DB เสมอ ไม่ hard-code */
  async listSubjects(): Promise<SubjectDto[]> {
    const rows = await subjectRepository.listPublished();
    return rows.map(toSubjectDto);
  },

  async listAllSubjects() {
    const rows = await subjectRepository.listAll();
    return rows.map((s) => ({
      id: s.id,
      code: s.code,
      name: localizedToString(s.name),
      color: s.color,
      icon: s.icon,
      sortOrder: s.sortOrder,
      status: s.status,
      topicCount: s._count.topics,
      documentCount: s._count.documents,
      questionSetCount: s._count.questionSets,
    }));
  },

  async getSubjectByCode(code: string) {
    const subject = await subjectRepository.findByCode(code);
    if (!subject || subject.status !== "PUBLISHED") return null;
    const topics = subject.topics
      .filter((t) => t.status === "PUBLISHED")
      .map(toTopicDto);
    return {
      id: subject.id,
      code: subject.code,
      name: localizedToString(subject.name),
      nameEn: (subject.name as LocalizedText)?.en ?? null,
      color: subject.color,
      icon: subject.icon,
      topics,
    };
  },

  async createSubject(input: {
    code: string;
    name: LocalizedText | string;
    color: string;
    icon: string;
    sortOrder: number;
  }) {
    const created = await subjectRepository.create(input);
    return { id: created.id };
  },

  async updateSubject(id: string, data: Record<string, unknown>) {
    await subjectRepository.update(id, data);
  },

  async archiveSubject(id: string) {
    await subjectRepository.archive(id);
  },

  async createTopic(input: {
    subjectId: string;
    title: LocalizedText | string;
    description?: string;
    sortOrder: number;
  }) {
    const created = await topicRepository.create(input);
    return { id: created.id };
  },
};
