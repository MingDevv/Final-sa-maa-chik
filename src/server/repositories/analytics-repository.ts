import { db } from "@/lib/db";

export const weakTopicRepository = {
  /** อัปเดตสถิติจุดอ่อนของหัวข้อ (upsert ต่อ owner+topic) */
  async record(
    owner: { userId?: string; guestSessionId?: string },
    data: { subjectId: string; topicId: string; total: number; wrong: number },
  ) {
    const where = owner.userId
      ? { userId_topicId: { userId: owner.userId, topicId: data.topicId } }
      : { guestSessionId_topicId: { guestSessionId: owner.guestSessionId!, topicId: data.topicId } };
    const base = owner.userId
      ? { userId: owner.userId, subjectId: data.subjectId, topicId: data.topicId }
      : { guestSessionId: owner.guestSessionId, subjectId: data.subjectId, topicId: data.topicId };

    const existing = await db.weakTopic.findFirst({
      where: {
        topicId: data.topicId,
        userId: owner.userId ?? null,
        guestSessionId: owner.guestSessionId ?? null,
      },
    });

    const totalCount = (existing?.totalCount ?? 0) + data.total;
    const wrongCount = (existing?.wrongCount ?? 0) + data.wrong;

    return db.weakTopic.upsert({
      where,
      create: {
        ...base,
        totalCount,
        wrongCount,
        accuracy: totalCount > 0 ? (totalCount - wrongCount) / totalCount : 1,
        lastSeenAt: new Date(),
      },
      update: {
        totalCount,
        wrongCount,
        accuracy: totalCount > 0 ? (totalCount - wrongCount) / totalCount : 1,
        lastSeenAt: new Date(),
      },
    });
  },

  async listWeakest(
    owner: { userId?: string; guestSessionId?: string },
    take = 5,
  ) {
    return db.weakTopic.findMany({
      where: {
        userId: owner.userId ?? null,
        guestSessionId: owner.guestSessionId ?? null,
        totalCount: { gt: 0 },
      },
      orderBy: [{ accuracy: "asc" }, { lastSeenAt: "desc" }],
      take,
      include: {
        subject: { select: { code: true, name: true, color: true } },
        topic: { select: { title: true } },
      },
    });
  },

  async findWrongQuestions(
    owner: { userId?: string; guestSessionId?: string },
    attemptId: string,
  ) {
    // รวม questionId ที่ตอบผิดใน attempt — ใช้สร้างชุด "ฝึกข้อที่ผิดอีกครั้ง"
    const attempt = await db.attempt.findUnique({
      where: { id: attemptId },
      include: { answers: { where: { isCorrect: false } } },
    });
    return attempt?.answers.map((a) => a.questionId) ?? [];
  },
};

export const activityRepository = {
  async recordToday(
    owner: { userId?: string; guestSessionId?: string },
    delta: { quizSeconds?: number; readSeconds?: number; questionsDone?: number },
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const where = owner.userId
      ? { userId_date: { userId: owner.userId, date: today } }
      : { guestSessionId_date: { guestSessionId: owner.guestSessionId!, date: today } };
    const base = owner.userId
      ? { userId: owner.userId, date: today }
      : { guestSessionId: owner.guestSessionId, date: today };
    return db.dailyActivity.upsert({
      where,
      create: {
        ...base,
        quizSeconds: delta.quizSeconds ?? 0,
        readSeconds: delta.readSeconds ?? 0,
        questionsDone: delta.questionsDone ?? 0,
      },
      update: {
        ...(delta.quizSeconds ? { quizSeconds: { increment: delta.quizSeconds } } : {}),
        ...(delta.readSeconds ? { readSeconds: { increment: delta.readSeconds } } : {}),
        ...(delta.questionsDone ? { questionsDone: { increment: delta.questionsDone } } : {}),
      },
    });
  },

  async recentDays(owner: { userId?: string; guestSessionId?: string }, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);
    return db.dailyActivity.findMany({
      where: {
        date: { gte: since },
        userId: owner.userId ?? null,
        guestSessionId: owner.guestSessionId ?? null,
      },
      orderBy: { date: "asc" },
    });
  },
};
