import { cookies } from "next/headers";

export interface SessionInfo {
  userId: string | null;
  guestSessionId: string | null;
  ownerKey: { userId?: string; guestSessionId?: string };
}

/** อ่านเซสชันแบบ read-only (ปลอดภัยใน Server Component) */
export const getReadOnlySession = async (): Promise<SessionInfo> => {
  const store = await cookies();
  const guestId = store.get("fep_guest")?.value ?? null;
  // TODO(สมาชิกในอนาคต): อ่าน userId จาก session เมื่อเปิดระบบ login
  return {
    userId: null,
    guestSessionId: guestId,
    ownerKey: guestId ? { guestSessionId: guestId } : {},
  };
};
