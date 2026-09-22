import { z } from "zod";
import { db } from "@/lib/db";
import { handleApiError, ok } from "@/server/api-helpers";
import { getSession } from "@/server/session";

const schema = z.object({ attemptId: z.string().min(1) });

/**
 * POST /api/retry — สร้าง RetrySession จากข้อที่ผิด/ข้ามของ attempt ต้นทาง (immutable)
 * แล้วเปิด attempt ใหม่โหมดฝึกที่แสดงเฉพาะข้อเหล่านั้น
 */
export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const session = await getSession();
    const owner = session.ownerKey;

    const source = await db.attempt.findUnique({
      where: { id: body.attemptId },
      include: { set: { include: { questions: true } }, answers: true },
    });
    if (!source) return handleApiError(new Error("ATTEMPT_NOT_FOUND"));

    const match = source.userId
      ? source.userId === owner.userId
      : source.guestSessionId === owner.guestSessionId;
    if (!match) return handleApiError(new Error("FORBIDDEN"));

    // รวบรวม questionId ที่ผิดหรือข้าม (อิงคำตอบของ attempt ต้นทาง)
    const wrongIds: string[] = [];
    for (const q of source.set.questions) {
      const a = source.answers.find((x) => x.questionId === q.id);
      const ans = (a?.answer ?? {}) as { selectedKeys?: string[]; text?: string; finalAnswer?: string };
      const has = (ans.selectedKeys?.length ?? 0) > 0 || Boolean(ans.text?.trim()) || Boolean(ans.finalAnswer?.trim());
      if (q.type === "WRITTEN") continue; // ข้อเขียนตรวจเอง ไม่เข้า retry อัตโนมัติ
      if (!has || a?.isCorrect === false) wrongIds.push(q.id);
    }
    if (wrongIds.length === 0) {
      return ok({ retrySessionId: null, attemptId: null, message: "ไม่มีข้อผิดหรือข้าม — เยี่ยมมาก!" });
    }

    const retrySession = await db.retrySession.create({
      data: {
        sourceAttemptId: source.id,
        questionIds: wrongIds,
        ownerUserId: owner.userId ?? null,
        ownerGuestId: owner.guestSessionId ?? null,
      },
    });

    // ปิด attempt IN_PROGRESS เดิมของ set นี้ (ถ้ามี) กันซ้อน
    const stale = await db.attempt.findFirst({
      where: {
        setId: source.setId,
        status: "IN_PROGRESS",
        userId: owner.userId ?? null,
        guestSessionId: owner.guestSessionId ?? null,
      },
    });
    if (stale) {
      await db.attempt.update({ where: { id: stale.id }, data: { status: "ABANDONED" } });
    }

    const attempt = await db.attempt.create({
      data: {
        setId: source.setId,
        userId: owner.userId ?? null,
        guestSessionId: owner.guestSessionId ?? null,
        mode: "PRACTICE",
        retrySessionId: retrySession.id,
      },
    });

    return ok({ retrySessionId: retrySession.id, attemptId: attempt.id, wrongCount: wrongIds.length });
  } catch (error) {
    return handleApiError(error);
  }
}
