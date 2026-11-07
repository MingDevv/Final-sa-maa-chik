import Link from "next/link";
import { CalendarDays, NotebookPen, Play, Sparkles } from "lucide-react";
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
      className="rounded-3xl bg-[#9f1239] px-6 py-9 text-white md:px-10 md:py-12 dark:bg-[#4c0519]"
      aria-label="ปกเว็บ"
    >
      <div className="flex max-w-2xl flex-col gap-4">
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

        <h1 className="text-3xl font-bold leading-tight md:text-4xl">
          พร้อมพิชิตข้อสอบปลายภาค ม.4
        </h1>

        <p className="text-base leading-relaxed text-white/85">
          อ่านชีตสรุป ทำแนวข้อสอบตามขอบเขตจริง แล้วให้ระบบชี้จุดที่ควรทบทวน —{" "}
          {subjectCount} วิชาในที่เดียว
        </p>

        <div className="mt-2 flex flex-wrap gap-3">
          <Button
            asChild
            size="lg"
            className="h-11 rounded-xl bg-white px-5 font-semibold text-[#9f1239] hover:bg-white/90 focus-visible:outline-white"
          >
            <Link href="/subjects">
              <Play className="mr-1.5 h-4 w-4" aria-hidden /> เริ่มทำข้อสอบ
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            className="h-11 rounded-xl border border-white/40 bg-transparent px-5 font-medium text-white hover:bg-white/10 focus-visible:outline-white"
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
