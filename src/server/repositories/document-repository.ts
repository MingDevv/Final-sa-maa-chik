import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export const asJson = (v: unknown): Prisma.InputJsonValue =>
  v as Prisma.InputJsonValue;

export const documentRepository = {
  async listBySubject(subjectId: string, onlyReady: boolean) {
    return db.sourceDocument.findMany({
      where: { subjectId, ...(onlyReady ? { status: "READY" } : {}) },
      orderBy: { createdAt: "desc" },
      include: { topic: { select: { title: true } } },
    });
  },

  async listAll() {
    return db.sourceDocument.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        subject: { select: { code: true, name: true } },
        topic: { select: { title: true } },
      },
    });
  },

  async findById(id: string) {
    return db.sourceDocument.findUnique({
      where: { id },
      include: {
        subject: { select: { id: true, code: true, name: true, color: true } },
        topic: true,
      },
    });
  },

  async findByKey(storageKey: string) {
    return db.sourceDocument.findFirst({ where: { storageKey } });
  },

  async create(data: {
    title: unknown;
    subjectId: string;
    topicId?: string | null;
    storageKey: string;
    mimeType: string;
    sizeBytes?: number;
    pageCount?: number;
    status?: "PENDING" | "PROCESSING" | "READY" | "FAILED" | "ARCHIVED";
  }) {
    return db.sourceDocument.create({
      data: { ...data, title: asJson(data.title) },
    });
  },

  async update(id: string, data: Record<string, unknown>) {
    return db.sourceDocument.update({ where: { id }, data });
  },

  async archive(id: string) {
    return db.sourceDocument.update({ where: { id }, data: { status: "ARCHIVED" } });
  },

  async delete(id: string) {
    return db.sourceDocument.delete({ where: { id } });
  },
};

export const progressRepository = {
  async upsertProgress(
    owner: { userId?: string; guestSessionId?: string },
    documentId: string,
    data: { lastPage?: number; readSeconds?: number },
  ) {
    const where = owner.userId
      ? { userId_documentId: { userId: owner.userId, documentId } }
      : { guestSessionId_documentId: { guestSessionId: owner.guestSessionId!, documentId } };
    const base = owner.userId
      ? { userId: owner.userId, documentId }
      : { guestSessionId: owner.guestSessionId!, documentId };
    return db.studyProgress.upsert({
      where,
      create: { ...base, lastPage: data.lastPage ?? 1, readSeconds: data.readSeconds ?? 0 },
      update: {
        ...(data.lastPage !== undefined ? { lastPage: data.lastPage } : {}),
        ...(data.readSeconds !== undefined ? { readSeconds: { increment: data.readSeconds } } : {}),
      },
    });
  },

  async getProgress(owner: { userId?: string; guestSessionId?: string }, documentId: string) {
    return db.studyProgress.findFirst({
      where: {
        documentId,
        userId: owner.userId ?? null,
        guestSessionId: owner.guestSessionId ?? null,
      },
    });
  },

  async listBookmarks(owner: { userId?: string; guestSessionId?: string }, documentId: string) {
    return db.bookmark.findMany({
      where: {
        documentId,
        userId: owner.userId ?? null,
        guestSessionId: owner.guestSessionId ?? null,
      },
      orderBy: [{ page: "asc" }],
    });
  },

  async addBookmark(
    owner: { userId?: string; guestSessionId?: string },
    documentId: string,
    page: number,
    label?: string,
  ) {
    return db.bookmark.create({
      data: {
        documentId,
        page,
        label,
        userId: owner.userId ?? null,
        guestSessionId: owner.guestSessionId ?? null,
      },
    });
  },

  async removeBookmark(owner: { userId?: string; guestSessionId?: string }, id: string) {
    return db.bookmark.deleteMany({
      where: {
        id,
        userId: owner.userId ?? null,
        guestSessionId: owner.guestSessionId ?? null,
      },
    });
  },

  async listHighlights(owner: { userId?: string; guestSessionId?: string }, documentId: string) {
    return db.highlight.findMany({
      where: {
        documentId,
        userId: owner.userId ?? null,
        guestSessionId: owner.guestSessionId ?? null,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async addHighlight(
    owner: { userId?: string; guestSessionId?: string },
    documentId: string,
    page: number,
    color: string,
    note?: string,
  ) {
    return db.highlight.create({
      data: {
        documentId,
        page,
        color,
        note,
        userId: owner.userId ?? null,
        guestSessionId: owner.guestSessionId ?? null,
      },
    });
  },

  async removeHighlight(owner: { userId?: string; guestSessionId?: string }, id: string) {
    return db.highlight.deleteMany({
      where: {
        id,
        userId: owner.userId ?? null,
        guestSessionId: owner.guestSessionId ?? null,
      },
    });
  },

  async listNotes(owner: { userId?: string; guestSessionId?: string }, documentId: string) {
    return db.note.findMany({
      where: {
        documentId,
        userId: owner.userId ?? null,
        guestSessionId: owner.guestSessionId ?? null,
      },
      orderBy: { updatedAt: "desc" },
    });
  },

  async addNote(
    owner: { userId?: string; guestSessionId?: string },
    documentId: string,
    page: number,
    content: string,
  ) {
    return db.note.create({
      data: {
        documentId,
        page,
        content,
        userId: owner.userId ?? null,
        guestSessionId: owner.guestSessionId ?? null,
      },
    });
  },

  async updateNote(owner: { userId?: string; guestSessionId?: string }, id: string, content: string) {
    return db.note.updateMany({
      where: {
        id,
        userId: owner.userId ?? null,
        guestSessionId: owner.guestSessionId ?? null,
      },
      data: { content },
    });
  },

  async removeNote(owner: { userId?: string; guestSessionId?: string }, id: string) {
    return db.note.deleteMany({
      where: {
        id,
        userId: owner.userId ?? null,
        guestSessionId: owner.guestSessionId ?? null,
      },
    });
  },
};
