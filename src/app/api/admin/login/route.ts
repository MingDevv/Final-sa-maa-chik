import { NextResponse } from "next/server";
import { z } from "zod";
import { ADMIN_COOKIE, adminCookieValue, fail } from "@/server/api-helpers";

const schema = z.object({ code: z.string().min(1) });

/** POST ล็อกอินผู้ดูแลด้วยรหัส ADMIN_CODE จาก .env → ติด cookie 30 วัน (ถ้าไม่ตั้ง ADMIN_CODE จะล็อกอินไม่ได้) */
export async function POST(request: Request) {
  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success) return fail("กรุณาใส่รหัสผู้ดูแล", 422);

  const expected = process.env.ADMIN_CODE;
  if (!expected) {
    return fail("ยังไม่ได้ตั้งค่า ADMIN_CODE ในไฟล์ .env — การล็อกอินผู้ดูแลถูกปิดอยู่", 503);
  }
  if (body.data.code !== expected) {
    return fail("รหัสผู้ดูแลไม่ถูกต้อง", 401);
  }

  const response = NextResponse.json({ ok: true, data: { loggedIn: true } });
  response.cookies.set(ADMIN_COOKIE, adminCookieValue(), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return response;
}

/** DELETE ออกจากระบบผู้ดูแล */
export async function DELETE() {
  const response = NextResponse.json({ ok: true, data: { loggedIn: false } });
  response.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, maxAge: 0, path: "/" });
  return response;
}
