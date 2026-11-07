import Link from "next/link";
import { BrainCircuit, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/back-button";
import { ReviewRunner } from "@/components/review/review-runner";
import { getReadOnlySession } from "@/server/read-session";
import { reviewService } from "@/server/services/review-service";

export const dynamic = "force-dynamic";
export const metadata = { title: "ทบทวนวันนี้" };

export default async function ReviewPage() {
  const session = await getReadOnlySession();
  const [summary, items] = await Promise.all([
    reviewService.dueSummary(session.ownerKey),
    reviewService.listDue(session.ownerKey),
  ]);

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
          <h1 className="text-2xl font-bold">ทบทวนวันนี้</h1>
          <p className="text-sm text-muted-foreground">
            {summary.due > 0
              ? `ถึงรอบทบทวน ${summary.due} ข้อ${summary.dangerous > 0 ? ` · ข้ออันตราย ${summary.dangerous} ข้อ (ขึ้นก่อน)` : ""}`
              : "ทบทวนแบบเว้นระยะ: ข้อที่พลาดจะกลับมา 1 → 3 → 7 → 14 → 30 วัน"}
          </p>
        </div>
      </header>

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
