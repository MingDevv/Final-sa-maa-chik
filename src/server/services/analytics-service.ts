import { activityRepository, weakTopicRepository } from "@/server/repositories/analytics-repository";
import { attemptRepository } from "@/server/repositories/attempt-repository";
import { db } from "@/lib/db";

export interface DashboardSummary {
  totalQuestionsDone: number;
  totalStudyMinutes: number;
  currentStreak: number;
  quizzesTaken: number;
  averagePercent: number;
  activeDays: number;
}

/** คำนวณ streak จากวันที่มีกิจกรรม (pure logic — test ได้) */
export const computeStreak = (activeDates: string[], today: string): number => {
  const set = new Set(activeDates);
  if (set.size === 0) return 0;
  const toDay = (iso: string) => iso.slice(0, 10);
  let cursor = new Date(`${toDay(today)}T00:00:00Z`);
  // ถ้าวันนี้ยังไม่มีกิจกรรม ให้เริ่มนับจากเมื่อวาน (streak ยังไม่หาย)
  if (!set.has(toDay(cursor.toISOString().slice(0, 10)))) {
    cursor = new Date(cursor.getTime() - 86400000);
  }
  let streak = 0;
  while (set.has(toDay(cursor.toISOString().slice(0, 10)))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - 86400000);
  }
  return streak;
};

export const analyticsService = {
  async dashboard(owner: { userId?: string; guestSessionId?: string }): Promise<DashboardSummary> {
    const [activities, attempts] = await Promise.all([
      activityRepository.recentDays(owner, 60),
      attemptRepository.listRecentByOwner(owner, 50),
    ]);

    const totalQuestionsDone = activities.reduce((s, a) => s + a.questionsDone, 0);
    const totalStudyMinutes = Math.round(
      activities.reduce((s, a) => s + a.quizSeconds + a.readSeconds, 0) / 60,
    );

    const activeDates = activities
      .filter((a) => a.questionsDone > 0 || a.quizSeconds > 0 || a.readSeconds > 0)
      .map((a) => new Date(a.date).toISOString().slice(0, 10));
    const streak = computeStreak(activeDates, new Date().toISOString());

    const scored = attempts.filter((a) => a.score);
    const averagePercent = scored.length
      ? Math.round(
          scored.reduce((s, a) => s + ((a.score as { percent?: number }).percent ?? 0), 0) /
            scored.length,
        )
      : 0;

    return {
      totalQuestionsDone,
      totalStudyMinutes,
      currentStreak: streak,
      quizzesTaken: attempts.length,
      averagePercent,
      activeDays: activeDates.length,
    };
  },

  async weakTopics(owner: { userId?: string; guestSessionId?: string }) {
    const rows = await weakTopicRepository.listWeakest(owner, 5);
    return rows.map((w) => ({
      id: w.id,
      subjectCode: w.subject.code,
      subjectName: w.subject.name as never,
      subjectColor: w.subject.color,
      topicId: w.topicId,
      topicTitle: w.topic.title as never,
      accuracy: Math.round(w.accuracy * 100),
      wrongCount: w.wrongCount,
      totalCount: w.totalCount,
    }));
  },

  async recentAttempts(owner: { userId?: string; guestSessionId?: string }) {
    const rows = await attemptRepository.listRecentByOwner(owner, 8);
    return rows.map((a) => ({
      id: a.id,
      setId: a.setId,
      setTitle: a.set.title as never,
      subjectCode: a.set.subject.code,
      subjectName: a.set.subject.name as never,
      subjectColor: a.set.subject.color,
      score: a.score as { earned: number; total: number; percent: number } | null,
      durationSec: a.durationSec,
      finishedAt: a.finishedAt,
    }));
  },

  /** หัวข้อที่ผิดบ่อยที่สุด (ทุกผู้ใช้รวมกัน) — ใช้ในหน้า admin ดูสถิติ */
  async hardestQuestions(limit = 10) {
    const rows = await db.questionStat.findMany({
      orderBy: [{ wrongCount: "desc" }],
      take: limit,
      include: {
        question: {
          select: {
            id: true,
            prompt: true,
            type: true,
            set: { select: { title: true, subject: { select: { code: true, name: true } } } },
          },
        },
      },
      where: { totalCount: { gte: 1 } },
    });
    return rows.map((r) => ({
      questionId: r.questionId,
      prompt: r.question.prompt,
      type: r.question.type,
      setTitle: r.question.set.title,
      subjectCode: r.question.set.subject.code,
      subjectName: r.question.set.subject.name,
      totalCount: r.totalCount,
      wrongCount: r.wrongCount,
      wrongRate: r.totalCount > 0 ? Math.round((r.wrongCount / r.totalCount) * 100) : 0,
    }));
  },
};
