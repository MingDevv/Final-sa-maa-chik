import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const GUEST_COOKIE = "fep_guest";

/** สร้าง guest session cookie ให้ทุกผู้เยี่ยมชม (ใช้ผูกความคืบหน้าแบบไม่ต้องสมัครสมาชิก) */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  if (!request.cookies.get(GUEST_COOKIE)) {
    const id = `g_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
    response.cookies.set(GUEST_COOKIE, id, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|pdf.worker.min.mjs).*)"],
};
