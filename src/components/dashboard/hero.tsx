import Link from "next/link";
import { BookOpen, CalendarDays, NotebookPen, Play, Sparkles } from "lucide-react";
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

/** ปกหน้าแรก — แถบไล่เฉดแดงไวน์-ม่วง พร้อมวงกลมลอยและปุ่มลัด */
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
      className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-wine via-coral to-purple-brand px-6 py-10 text-white shadow-soft-lg md:px-12 md:py-14"
      aria-label="ปกเว็บ"
    >
      {/* วงกลมตกแต่งลอย */}
      <div
        className="animate-float pointer-events-none absolute -right-10 -top-14 h-48 w-48 rounded-full bg-white/15 blur-sm"
        aria-hidden
      />
      <div
        className="animate-float-slow pointer-events-none absolute -bottom-16 right-32 h-40 w-40 rounded-full bg-lavender/30 blur-md"
        aria-hidden
      />
      <div
        className="animate-float-slow pointer-events-none absolute left-1/3 top-6 h-16 w-16 rounded-full bg-soft-pink/25 blur-sm"
        aria-hidden
      />

      <div className="relative flex flex-col gap-4">
        <div className="animate-fade-up flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 font-medium backdrop-blur-sm">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
            {termName}
          </span>
          {countdown && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 font-semibold text-wine shadow-soft">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {countdown}
            </span>
          )}
        </div>

        <h1 className="animate-fade-up-delay-1 max-w-xl text-2xl font-bold leading-snug md:text-4xl">
          พร้อมพิชิตข้อสอบ
          <span className="block text-soft-pink">ปลายภาค ม.4 กันหรือยัง?</span>
        </h1>

        <p className="animate-fade-up-delay-1 max-w-lg text-sm leading-relaxed text-white/85 md:text-base">
          อ่านชีตสรุปทุกวิชา ลองทำแนวข้อสอบตามขอบเขตจริง แล้วให้ระบบชี้จุดอ่อนให้ซ้อมซ้ำแบบตรงจุด —{" "}
          {subjectCount} วิชาครบในที่เดียว
        </p>

        <div className="animate-fade-up-delay-2 mt-1 flex flex-wrap gap-2.5">
          <Button
            asChild
            size="lg"
            className="rounded-2xl bg-white font-semibold text-wine shadow-soft hover:bg-soft-pink focus-visible:outline-white"
          >
            <Link href="/subjects">
              <Play className="mr-1.5 h-4 w-4" aria-hidden /> เริ่มทำข้อสอบ
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            className="rounded-2xl border border-white/50 bg-white/10 font-medium text-white backdrop-blur-sm hover:bg-white/20 focus-visible:outline-white"
          >
            <Link href="/study-guide/ว31201">
              <NotebookPen className="mr-1.5 h-4 w-4" aria-hidden /> ชีตสรุปก่อนสอบ
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            className="rounded-2xl border border-white/30 bg-transparent font-medium text-white/90 hover:bg-white/15 focus-visible:outline-white"
          >
            <Link href="/subjects">
              <BookOpen className="mr-1.5 h-4 w-4" aria-hidden /> อ่านชีท PDF
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
