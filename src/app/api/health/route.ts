import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/health — ใช้ตรวจว่า deployment พร้อมใช้หรือไม่
 * โดยเฉพาะหลัง deploy บน Vercel: ถ้า { database: "ok" } แปลว่า DATABASE_URL ถูกต้องและต่อได้
 */
export async function GET() {
  let database: "ok" | "unreachable" | "not-configured" = "ok";
  let hint: string | undefined;

  if (!process.env.DATABASE_URL) {
    database = "not-configured";
    hint = "ยังไม่ได้ตั้งค่า DATABASE_URL — เพิ่ม Environment Variable ใน Vercel (Settings → Environment Variables)";
  } else {
    try {
      await db.$queryRaw`SELECT 1`;
    } catch {
      database = "unreachable";
      hint =
        "ต่อฐานข้อมูลไม่ได้ — ตรวจว่า DATABASE_URL ถูกต้อง และรัน migration แล้ว (npx prisma migrate deploy)";
    }
  }

  return NextResponse.json(
    {
      ok: database === "ok",
      app: "Final-sa-maa-chik",
      database,
      ...(hint ? { hint } : {}),
      time: new Date().toISOString(),
    },
    { status: 200 },
  );
}
