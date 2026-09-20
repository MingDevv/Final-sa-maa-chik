import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/** cast ค่าที่จะเก็บลงคอลัมน์ JSON ให้พิมพ์ถูกต้อง */
export const asJson = (v: unknown): Prisma.InputJsonValue =>
  v as Prisma.InputJsonValue;

export interface SubjectWithStats {
  id: string;
  code: string;
  name: Prisma.JsonValue;
  color: string;
  icon: string;
  sortOrder: number;
  status: string;
  topicCount: number;
  documentCount: number;
  publishedSetCount: number;
}

export const subjectRepository = {
  async listPublished(): Promise<SubjectWithStats[]> {
    const subjects = await db.subject.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: {
            topics: { where: { status: "PUBLISHED" } },
            documents: { where: { status: "READY" } },
            questionSets: { where: { status: "PUBLISHED" } },
          },
        },
      },
    });
    return subjects.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      color: s.color,
      icon: s.icon,
      sortOrder: s.sortOrder,
      status: s.status,
      topicCount: s._count.topics ?? 0,
      documentCount: s._count.documents ?? 0,
      publishedSetCount: s._count.questionSets ?? 0,
    }));
  },

  async listAll() {
    return db.subject.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { topics: true, documents: true, questionSets: true } } },
    });
  },

  async findByCode(code: string) {
    return db.subject.findUnique({
      where: { code },
      include: { topics: { orderBy: { sortOrder: "asc" } } },
    });
  },

  async findById(id: string) {
    return db.subject.findUnique({ where: { id } });
  },

  async create(data: {
    code: string;
    name: unknown;
    color: string;
    icon: string;
    sortOrder: number;
  }) {
    return db.subject.create({
      data: { ...data, name: asJson(data.name) },
    });
  },

  async update(id: string, data: Record<string, unknown>) {
    return db.subject.update({ where: { id }, data });
  },

  async archive(id: string) {
    return db.subject.update({ where: { id }, data: { status: "ARCHIVED" } });
  },
};

export const topicRepository = {
  async create(data: { subjectId: string; title: unknown; description?: string; sortOrder: number }) {
    return db.topic.create({
      data: { ...data, title: asJson(data.title) },
    });
  },

  async update(id: string, data: Record<string, unknown>) {
    return db.topic.update({ where: { id }, data });
  },

  async archive(id: string) {
    return db.topic.update({ where: { id }, data: { status: "ARCHIVED" } });
  },

  async listBySubject(subjectId: string) {
    return db.topic.findMany({
      where: { subjectId, status: "PUBLISHED" },
      orderBy: { sortOrder: "asc" },
    });
  },

  async listAllBySubject(subjectId: string) {
    return db.topic.findMany({ where: { subjectId }, orderBy: { sortOrder: "asc" } });
  },
};
