import Link from "next/link";
import { BrainCircuit, Flame, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/back-button";
import { ReviewRunner } from "@/components/review/review-runner";
import { getReadOnlySession } from "@/server/read-session";
import { reviewService } from "@/server/services/review-service";

export const dynamic = "force-dynamic";
export const metadata = { title: "ทบทวนวันนี้" };

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ all?: string }>;
}) {
  const all = (await searchParams).all === "1";
  const session = await getReadOnlySession();
  const [summary, items] = await Promise.all([
    reviewService.dueSummary(session.ownerKey),
    reviewService.listDue(session.ownerKey, { all }),
  ]);
  const left = summary.examDaysLeft;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="-mb-2">
        <BackButton fallbackHref="/" label="ย้อนกลับหน้าแรก" />
      </div>

      <header className="flex items-center gap-4">
        <span className="brand-tile flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl">
          <BrainCircuit className="h-7 w-7" aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-bold">{all ? "ติวทุกข้อก่อนสอบ" : "ทบทวนวันนี้"}</h1>
          <p className="text-sm text-muted-foreground">
            {all
              ? `ทวนทุกข้อในคิว ${items.length} ข้อ — ข้ออันตรายก่อน แล้วไล่จากข้อที่ยังจำไม่แม่น`
              : summary.due > 0
              ? `ถึงรอบทบทวน ${summary.due} ข้อ${summary.dangerous > 0 ? ` · ข้ออันตราย ${summary.dangerous} ข้อ (ขึ้นก่อน)` : ""}`
              : "ทบทวนแบบเว้นระยะ: ข้อที่พลาดจะกลับมา 1 → 3 → 7 → 14 → 30 วัน"}
          </p>
        </div>
      </header>

      {/* โหมดใกล้สอบ: นับถอยหลัง + ทางลัดติวทุกข้อ */}
      {summary.cram && left !== null && (
        <section className="cta-fire flex flex-col gap-3 rounded-3xl p-5 text-white sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Flame className="h-8 w-8 shrink-0" aria-hidden />
            <div>
              <p className="text-lg font-bold">
                {left === 0 ? "สอบวันนี้! ทวนข้ออันตรายรอบสุดท้าย" : left === 1 ? "พรุ่งนี้สอบ — วันนี้คือรอบสุดท้าย" : `อีก ${left} วันสอบ`}
              </p>
              <p className="text-sm text-white/90">
                โหมดใกล้สอบ: รอบทบทวนบีบเหลือ 1 → 1 → 2 → 2 → 3 วัน และจะไม่นัดเลยวันก่อนสอบ
              </p>
            </div>
          </div>
          {summary.total > 0 && (
            <Link
              href={all ? "/review" : "/review?all=1"}
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-white px-5 font-semibold text-[#be123c]"
            >
              {all ? "กลับไปทำเฉพาะที่ถึงรอบ" : `ติวทุกข้อในคิว (${summary.total})`}
            </Link>
          )}
        </section>
      )}

      {items.length > 0 ? (
        <ReviewRunner items={items} />
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-card p-10 text-center">
          <Sparkles className="h-10 w-10 text-primary" aria-hidden />
          <h2 className="text-xl font-semibold">วันนี้ไม่มีข้อต้องทบทวน</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            {summary.total > 0
              ? `มีอีก ${summary.total} ข้อรอรอบถัดไป — กลับมาพรุ่งนี้นะ`
              : "ลองทำข้อสอบสักชุด ข้อที่ผิดหรือเดาถูกจะถูกส่งมาที่นี่ให้ทบทวนตามรอบโดยอัตโนมัติ"}
          </p>
          <Button asChild size="lg" className="h-11 rounded-xl">
            <Link href="/subjects">ไปทำข้อสอบ</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
