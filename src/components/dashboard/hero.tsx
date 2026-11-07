import Link from "next/link";
import { CalendarDays, GraduationCap, NotebookPen, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

/** คำนวณข้อความนับถอยหลังจากวันสอบ (จากฐานข้อมูล) */
export const examCountdownText = (examDate: Date | null): string | null => {
  if (!examDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(examDate);
  exam.setHours(0, 0, 0, 0);
  const days = Math.round((exam.getTime() - today.getTime()) / 86400000);
  if (days < 0) return "ผ่านการสอบมาแล้ว — ฝึกซ้ำได้เรื่อย ๆ";
  if (days === 0) return "สอบวันนี้! สู้ ๆ";
  if (days === 1) return "พรุ่งนี้สอบแล้ว!";
  return `อีก ${days} วันก็สอบแล้ว`;
};

/** ปกหน้าแรก — พื้นแดงทึบเรียบ ๆ ไม่มีของลอย อ่านง่าย ปุ่มหลัก 1 ปุ่ม + ปุ่มรอง 1 ปุ่ม */
export function Hero({
  countdown,
  termName,
  subjectCount,
}: {
  countdown: string | null;
  termName: string;
  subjectCount: number;
}) {
  return (
    <section
      className="hero-red relative overflow-hidden rounded-3xl px-6 py-10 text-white md:px-12 md:py-14"
      aria-label="ปกเว็บ"
    >
      {/* ไอคอนหมวกใหญ่จาง ๆ มุมขวา — ตกแต่งอย่างเดียว ไม่ขยับ */}
      <GraduationCap
        className="pointer-events-none absolute -bottom-10 -right-6 h-64 w-64 rotate-[-12deg] text-white/10 md:h-80 md:w-80"
        aria-hidden
      />
      <div className="relative flex max-w-2xl flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1">
            <CalendarDays className="h-4 w-4" aria-hidden />
            {termName}
          </span>
          {countdown && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-semibold text-[#9f1239]">
              <Sparkles className="h-4 w-4" aria-hidden />
              {countdown}
            </span>
          )}
        </div>

        <h1 className="text-4xl font-bold leading-[1.15] tracking-tight md:text-5xl">
          พร้อมพิชิต
          <span className="block text-[#fecdd3]">ข้อสอบปลายภาค ม.4</span>
        </h1>

        <p className="max-w-xl text-base leading-relaxed text-white/90 md:text-lg">
          อ่านชีตสรุป ทำแนวข้อสอบตามขอบเขตจริง แล้วให้ระบบชี้จุดที่ควรทบทวน —{" "}
          {subjectCount} วิชาในที่เดียว
        </p>

        <div className="mt-2 flex flex-wrap gap-3">
          <Button
            asChild
            size="lg"
            className="h-12 rounded-xl bg-white px-6 text-base font-semibold text-[#9f1239] shadow-lg shadow-black/20 transition-transform hover:-translate-y-0.5 hover:bg-white focus-visible:outline-white motion-reduce:hover:translate-y-0"
          >
            <Link href="/subjects">
              <Play className="mr-1.5 h-4 w-4" aria-hidden /> เริ่มทำข้อสอบ
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            className="h-12 rounded-xl border border-white/50 bg-white/5 px-6 text-base font-medium text-white hover:bg-white/15 focus-visible:outline-white"
          >
            <Link href="/subjects">
              <NotebookPen className="mr-1.5 h-4 w-4" aria-hidden /> ชีตสรุปและชีท PDF
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
