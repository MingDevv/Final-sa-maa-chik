import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { ZodError } from "zod";

export const ok = <T>(data: T, init?: ResponseInit) =>
  NextResponse.json({ ok: true, data }, init);

export const fail = (message: string, status = 400, extra?: unknown) =>
  NextResponse.json({ ok: false, error: message, details: extra }, { status });

export const handleApiError = (error: unknown) => {
  if (error instanceof ZodError) {
    return fail("ข้อมูลที่ส่งมาไม่ถูกต้อง", 422, error.issues);
  }
  const message = error instanceof Error ? error.message : "UNKNOWN";
  if (message === "ATTEMPT_NOT_FOUND") return fail("ไม่พบรอบการทำข้อสอบ", 404);
  if (message === "FORBIDDEN") return fail("ไม่มีสิทธิ์เข้าถึงรายการนี้", 403);
  if (message === "NOT_FOUND") return fail("ไม่พบรายการ", 404);
  console.error("[api]", error);
  return fail("เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์", 500);
};

export const ADMIN_COOKIE = "fep_admin";

/** ค่า cookie แอดมิน = sha256(ADMIN_CODE) — ไม่เก็บรหัสดิบไว้ในเครื่องผู้ใช้ */
export const adminCookieValue = (): string =>
  createHash("sha256")
    .update(process.env.ADMIN_CODE ?? "Ming888")
    .digest("hex");

/** ตรวจว่า request เป็นผู้ดูแล: ผ่าน cookie จากหน้าล็อกอิน หรือ header x-admin-token */
export const isAdminRequest = (request: Request): boolean => {
  const expectedHash = adminCookieValue();
  const cookie = request.headers.get("cookie") ?? "";
  const hasCookie = cookie
    .split(";")
    .some((c) => c.trim().startsWith(`${ADMIN_COOKIE}=`) && c.trim().slice(ADMIN_COOKIE.length + 1) === expectedHash);
  if (hasCookie) return true;
  const required = process.env.ADMIN_TOKEN;
  if (!required) return false;
  const provided =
    request.headers.get("x-admin-token") ??
    request.headers.get("authorization")?.replace("Bearer ", "");
  return provided === required;
};

/**
 * การ์ดเข้าถึงส่วนผู้ดูแล — ต้องล็อกอินด้วยรหัส ADMIN_CODE (ค่าเริ่มต้น Ming888)
 * หรือส่ง header x-admin-token กรณีตั้ง ADMIN_TOKEN ไว้ (สำหรับ script/import)
 */
export const assertAdmin = (request: Request) => {
  if (!isAdminRequest(request)) throw new Error("FORBIDDEN");
};

export const searchParamsToObject = (url: string): Record<string, string> => {
  const sp = new URL(url).searchParams;
  const out: Record<string, string> = {};
  sp.forEach((v, k) => {
    if (v) out[k] = v;
  });
  return out;
};
