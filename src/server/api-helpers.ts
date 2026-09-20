import { NextResponse } from "next/server";
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

/**
 * การ์ดเข้าถึงส่วนผู้ดูแล: ตั้ง ADMIN_TOKEN ใน .env เพื่อบังคับส่ง header x-admin-token
 * (ช่วงพัฒนาถ้าไม่ตั้งจะอนุญาต — อย่าใช้แบบนี้บน production)
 * เมื่อเปิดระบบสมาชิกในอนาคต จะเช็ค role=ADMIN จาก session แทน
 */
export const assertAdmin = (request: Request) => {
  const required = process.env.ADMIN_TOKEN;
  if (!required) return; // dev mode
  const provided =
    request.headers.get("x-admin-token") ?? request.headers.get("authorization")?.replace("Bearer ", "");
  if (provided !== required) throw new Error("FORBIDDEN");
};

export const searchParamsToObject = (url: string): Record<string, string> => {
  const sp = new URL(url).searchParams;
  const out: Record<string, string> = {};
  sp.forEach((v, k) => {
    if (v) out[k] = v;
  });
  return out;
};
