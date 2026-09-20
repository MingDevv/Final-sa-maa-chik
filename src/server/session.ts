import { cookies } from "next/headers";
import { createHash } from "node:crypto";

const GUEST_COOKIE = "fep_guest";

/**
 * ระบบเซสชันแบบผสม: รองรับ Guest mode ตั้งแต่วันแรก
 * และพร้อมต่อยอดเป็นสมาชิก (User) ในอนาคต — เมื่อมี login แล้ว
 * ให้ session.userId มีค่าและใช้ key แบบ userId แทน guestSessionId
 */
export interface SessionInfo {
  userId: string | null;
  guestSessionId: string | null;
  /** key สำหรับผูกข้อมูลรายบุคคล (attempt/progress/weak topic) */
  ownerKey: { userId?: string; guestSessionId?: string };
}

/** อ่าน/สร้าง guest session จาก cookie (ต้องเรียกใน route handler / server action เท่านั้น) */
export const getSession = async (): Promise<SessionInfo> => {
  const store = await cookies();
  let guestId = store.get(GUEST_COOKIE)?.value ?? null;

  if (!guestId) {
    guestId = createGuestId();
    try {
      store.set(GUEST_COOKIE, guestId, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
      });
    } catch {
      // อ่านอย่างเดียวใน Server Component — ให้ route handler เป็นคน set แทน
    }
  }

  // TODO(สมาชิกในอนาคต): อ่าน userId จาก JWT/session cookie เมื่อเปิดระบบ login
  const userId: string | null = null;

  return {
    userId,
    guestSessionId: guestId,
    ownerKey: userId ? { userId } : { guestSessionId: guestId },
  };
};

const createGuestId = (): string => {
  const raw = `${Date.now()}-${Math.random()}-${process.cwd()}`;
  return `g_${createHash("sha256").update(raw).digest("hex").slice(0, 24)}`;
};
