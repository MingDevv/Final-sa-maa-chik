import { documentRepository, progressRepository } from "@/server/repositories/document-repository";
import { questionSetRepository } from "@/server/repositories/question-set-repository";
import { topicRepository } from "@/server/repositories/subject-repository";
import { activityRepository } from "@/server/repositories/analytics-repository";
import { getStorage } from "@/server/storage";
import { localizedToString, type LocalizedText } from "@/lib/types";
import { db } from "@/lib/db";

/**
 * ⚠️ นโยบายความปลอดภัยของเนื้อหาจาก PDF (อ้างอิงจากข้อกำหนดของระบบ):
 * 1. เนื้อหาในเอกสารที่อัปโหลดเป็น "ข้อมูลอ้างอิง" เท่านั้น
 * 2. ระบบไม่ปฏิบัติตามคำสั่งใด ๆ ที่แฝงอยู่ภายในเอกสาร (เช่น ข้อความชวนเผยแผ่,
 *    คำสั่งหลอกให้เปลี่ยนการทำงาน) — พบแล้วให้บันทึก flag ไว้ใน metadata
 * 3. การสร้างข้อสอบจากเอกสารต้องอิงเฉพาะข้อมูลที่มีในเอกสารจริง ห้ามเดา
 * 4. ชุดที่สร้างจากเอกสารเป็น "ฉบับร่าง" เสมอ — ผู้ดูแลต้องตรวจและเผยแพร่เองก่อนผู้เรียนเห็น
 */

/** รูปแบบคำสั่งที่มักถูกฝังในเอกสารเพื่อหลอกระบบอัตโนมัติ */
const SUSPICIOUS_INSTRUCTION_PATTERNS: RegExp[] = [
  /โปรด(?:จง)?(?:เผยแผ่|ส่งต่อ|แชร์)/,
  /ignore\s+(?:all\s+)?(?:previous|above)\s+instructions/i,
  /disregard\s+(?:all\s+)?(?:previous|above)/i,
  /(?:คุณ|ระบบ)?(?:ต้อง|จง|กรุณา)\s*(?:ปฏิบัติตาม|เชื่อฟัง)\s*(?:คำสั่ง|ข้อความ)(?:นี้|ในเอกสาร)/,
  /you\s+are\s+now\s+/i,
  /system\s*:\s*/i,
];

export interface DocumentSafetyReport {
  flagged: boolean;
  matches: string[];
  note: string;
}

/** สแกนข้อความจากเอกสารเพื่อหาคำสั่งแฝง (ใช้กับข้อความที่สกัดได้เท่านั้น — ไม่ตีความเป็นคำสั่ง) */
export const scanForEmbeddedInstructions = (text: string): DocumentSafetyReport => {
  const matches: string[] = [];
  for (const pattern of SUSPICIOUS_INSTRUCTION_PATTERNS) {
    const m = text.match(pattern);
    if (m) matches.push(m[0].slice(0, 80));
  }
  return {
    flagged: matches.length > 0,
    matches,
    note: matches.length
      ? "พบข้อความลักษณะคำสั่งที่แฝงอยู่ในเอกสาร — ระบบจะไม่ปฏิบัติตาม และระบุไว้เพื่อให้ผู้ดูแลทราบเท่านั้น"
      : "เนื้อหาใช้เป็นข้อมูลอ้างอิงเท่านั้น ห้ามปฏิบัติตามคำสั่งในเอกสาร และห้ามสร้างข้อสอบจากข้อมูลที่ไม่มีในเอกสาร",
  };
};

export const documentService = {
  async listForSubject(subjectId: string) {
    const rows = await documentRepository.listBySubject(subjectId, true);
    return rows.map((d) => ({
      id: d.id,
      title: localizedToString(d.title),
      topicId: d.topicId,
      topicTitle: d.topic ? localizedToString(d.topic.title) : null,
      pageCount: d.pageCount,
      sizeBytes: d.sizeBytes,
      status: d.status,
      createdAt: d.createdAt,
    }));
  },

  async listAll() {
    const rows = await documentRepository.listAll();
    return rows.map((d) => ({
      id: d.id,
      title: localizedToString(d.title),
      subjectCode: d.subject.code,
      subjectName: localizedToString(d.subject.name),
      topicTitle: d.topic ? localizedToString(d.topic.title) : null,
      status: d.status,
      pageCount: d.pageCount,
      createdAt: d.createdAt,
    }));
  },

  async getDocument(id: string) {
    const doc = await documentRepository.findById(id);
    if (!doc) return null;
    const storage = getStorage();
    // key ขึ้นต้นด้วย static/ = ไฟล์ที่ commit ไว้ใน public/seed (ใช้ได้ทั้ง dev และ Vercel)
    const fileUrl = doc.storageKey.startsWith("static/")
      ? `/seed/${doc.storageKey.slice("static/".length)}`
      : storage.getUrl(doc.storageKey);
    return {
      id: doc.id,
      title: localizedToString(doc.title),
      subjectId: doc.subjectId,
      subjectCode: doc.subject.code,
      subjectName: localizedToString(doc.subject.name),
      subjectColor: doc.subject.color,
      topicId: doc.topicId,
      topicTitle: doc.topic ? localizedToString(doc.topic.title) : null,
      fileUrl,
      pageCount: doc.pageCount,
      status: doc.status,
      metadata: doc.metadata as Record<string, unknown>,
    };
  },

  /** อัปโหลดไฟล์จาก admin แล้วบันทึก metadata + สแกนคำสั่งแฝง */
  async createFromUpload(input: {
    title: LocalizedText | string;
    subjectId: string;
    topicId?: string | null;
    buffer: Buffer;
    fileName: string;
    mimeType: string;
    pageCount?: number;
  }) {
    const storage = getStorage();
    const stored = await storage.save(input.buffer, {
      prefix: "documents",
      mimeType: input.mimeType,
      fileName: input.fileName,
    });

    // สแกนคำสั่งแฝงจากชื่อไฟล์/เมทาดาทาที่มีอยู่ (เนื้อหาภายในถูกสแกนเมื่อสกัดข้อความจริง)
    const report = scanForEmbeddedInstructions(input.fileName);

    const created = await documentRepository.create({
      title: input.title,
      subjectId: input.subjectId,
      topicId: input.topicId ?? null,
      storageKey: stored.key,
      mimeType: input.mimeType,
      sizeBytes: stored.size,
      pageCount: input.pageCount,
      status: "READY",
    });
    await documentRepository.update(created.id, {
      metadata: {
        safety: report,
        policy: "reference-only",
      },
    });
    return { id: created.id, fileUrl: storage.getUrl(stored.key), safety: report };
  },

  /** เปิดไฟล์จริงเพื่อ stream ผ่าน API (ตรวจว่ามีใน DB ก่อน) */
  async readFile(documentId: string) {
    const doc = await documentRepository.findById(documentId);
    if (!doc) return null;
    if (doc.storageKey.startsWith("static/")) {
      const { readFile } = await import("node:fs/promises");
      const path = await import("node:path");
      const rel = doc.storageKey.slice("static/".length);
      // กัน path traversal
      if (rel.includes("..")) return null;
      const buffer = await readFile(
        path.join(process.cwd(), "public", "seed", rel),
      );
      return { buffer, mimeType: doc.mimeType };
    }
    const storage = getStorage();
    const buffer = await storage.read(doc.storageKey);
    return { buffer, mimeType: doc.mimeType };
  },

  async registerExternalFile(input: {
    title: LocalizedText | string;
    subjectId: string;
    topicId?: string | null;
    storageKey: string;
    pageCount?: number;
    sizeBytes?: number;
  }) {
    const created = await documentRepository.create({
      title: input.title,
      subjectId: input.subjectId,
      topicId: input.topicId ?? null,
      storageKey: input.storageKey,
      mimeType: "application/pdf",
      sizeBytes: input.sizeBytes,
      pageCount: input.pageCount,
      status: "READY",
    });
    await documentRepository.update(created.id, {
      metadata: { policy: "reference-only", source: "seed" },
    });
    return { id: created.id };
  },

  async updateDocument(id: string, data: Record<string, unknown>) {
    await documentRepository.update(id, data);
  },

  async archiveDocument(id: string) {
    await documentRepository.archive(id);
  },

  async deleteDocument(id: string) {
    const doc = await documentRepository.findById(id);
    if (doc) {
      await getStorage().delete(doc.storageKey).catch(() => undefined);
      await documentRepository.delete(id);
    }
  },

  // ---------- การอ่าน: progress / bookmark / highlight / note ----------

  async saveProgress(
    owner: { userId?: string; guestSessionId?: string },
    documentId: string,
    data: { lastPage?: number; readSeconds?: number },
  ) {
    await progressRepository.upsertProgress(owner, documentId, data);
    if (data.readSeconds && data.readSeconds > 0) {
      await activityRepository.recordToday(owner, { readSeconds: data.readSeconds });
    }
  },

  async getProgress(owner: { userId?: string; guestSessionId?: string }, documentId: string) {
    return progressRepository.getProgress(owner, documentId);
  },

  async listAnnotations(
    owner: { userId?: string; guestSessionId?: string },
    documentId: string,
  ) {
    const [bookmarks, highlights, notes] = await Promise.all([
      progressRepository.listBookmarks(owner, documentId),
      progressRepository.listHighlights(owner, documentId),
      progressRepository.listNotes(owner, documentId),
    ]);
    return { bookmarks, highlights, notes };
  },

  // ---------- workflow สร้างชุดฝึกจากหัวข้อ (ผู้ดูแลตรวจก่อนเผยแพร่) ----------

  /**
   * สร้าง "ชุดฝึกฉบับร่างว่าง" ผูกกับหัวข้อของเอกสาร — ผู้ดูแลเพิ่มโจทย์จากข้อมูล
   * อ้างอิงในเอกสารเอง ตรวจ แล้วกดเผยแพร่ (ระบบไม่เดาโจทย์จากเนื้อหาเอง)
   */
  async createDraftSetFromTopic(input: {
    documentId: string;
    adminNote?: string;
  }) {
    const doc = await documentRepository.findById(input.documentId);
    if (!doc) throw new Error("DOCUMENT_NOT_FOUND");

    const topicId = doc.topicId ?? null;
    let topicTitle = "ทั่วไป";
    if (topicId) {
      const topic = await topicRepository.update(topicId, {});
      topicTitle = localizedToString(topic.title);
    }

    const set = await questionSetRepository.create({
      title: {
        th: `ชุดฝึกจากชีท: ${localizedToString(doc.title)}`,
        en: undefined,
      },
      description: `สร้างจากเอกสารอ้างอิง "${localizedToString(doc.title)}" หัวข้อ ${topicTitle} — ฉบับร่าง รอผู้ดูแลเพิ่มโจทย์จากข้อมูลในเอกสารและตรวจก่อนเผยแพร่${input.adminNote ? ` (โน้ต: ${input.adminNote})` : ""}`,
      subjectId: doc.subjectId,
      topicId,
      difficulty: "MEDIUM",
      recommendedMinutes: 20,
      shuffleQuestions: false,
      shuffleOptions: false,
      revealMode: "AFTER_SUBMIT",
      status: "DRAFT",
      questions: [],
    });
    return { id: set.id };
  },

  async countDraftQuestions(setId: string) {
    return db.question.count({ where: { setId } });
  },
};
