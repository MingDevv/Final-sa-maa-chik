"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Circle,
  CircleX,
  Clock,
  HelpCircle,
  PencilLine,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KatexText } from "@/components/katex-text";
import { cn } from "@/lib/utils";

interface ReviewItem {
  questionId: string;
  type: "MCQ" | "SHORT_ANSWER" | "WRITTEN";
  prompt: string;
  points: number;
  options: { key: string; text: string }[] | null;
  correctKeys: string[];
  accepts: string[];
  finalAnswer: string;
  steps: string[];
  explanation: string;
  rubric: { description: string; points: number }[] | null;
  submittedSelectedKeys: string[];
  submittedText: string;
  submittedTex: string;
  submittedFinalAnswer: string;
  selfChecked: boolean | null;
  status: "correct" | "incorrect" | "skipped" | "self-check";
}

const statusMeta: Record<
  ReviewItem["status"],
  { label: string; className: string; icon: React.ReactNode }
> = {
  correct: {
    label: "ถูก",
    className: "text-green-700 dark:text-green-400",
    icon: <CheckCircle2 className="h-4 w-4" aria-hidden />,
  },
  incorrect: {
    label: "ผิด",
    className: "text-red-600 dark:text-red-400",
    icon: <CircleX className="h-4 w-4" aria-hidden />,
  },
  skipped: {
    label: "ข้าม",
    className: "text-muted-foreground",
    icon: <Circle className="h-4 w-4" aria-hidden />,
  },
  "self-check": {
    label: "รอตรวจเอง",
    className: "text-amber-600 dark:text-amber-400",
    icon: <HelpCircle className="h-4 w-4" aria-hidden />,
  },
};

const formatClock = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m} นาที ${s} วินาที`;
};

/** หน้าผลลัพธ์: คะแนน, เฉลยพร้อมคำอธิบาย, แนววิธีคิดข้อคำนวณ, ตรวจข้อเขียนเอง, ฝึกข้อผิดซ้ำ */
export function ResultView({
  setId,
  attemptId,
  score,
  durationSec,
  review: initialReview,
}: {
  setId: string;
  attemptId: string;
  score: { earned: number; total: number; percent: number };
  durationSec: number;
  review: ReviewItem[];
}) {
  const router = useRouter();
  const [review, setReview] = useState(initialReview);
  const [checking, setChecking] = useState<string | null>(null);

  const wrongIds = useMemo(
    () =>
      review
        .filter((r) => r.status === "incorrect" || r.status === "skipped")
        .map((r) => r.questionId),
    [review],
  );
  const pendingSelfCheck = review.filter(
    (r) => r.type === "WRITTEN" && r.status === "self-check",
  ).length;
  const autoTotal = review
    .filter((r) => r.type !== "WRITTEN")
    .reduce((s, r) => s + r.points, 0);
  const autoEarned = review
    .filter((r) => r.type !== "WRITTEN" && r.status === "correct")
    .reduce((s, r) => s + r.points, 0);

  const selfCheck = async (questionId: string, correct: boolean) => {
    setChecking(questionId);
    try {
      const res = await fetch(`/api/attempts/${attemptId}/self-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, correct }),
      });
      const json = await res.json();
      if (json.ok) {
        setReview((prev) =>
          prev.map((r) =>
            r.questionId === questionId
              ? { ...r, selfChecked: correct, status: correct ? "correct" : "incorrect" }
              : r,
          ),
        );
        toast.success(correct ? "บันทึกว่าทำถูกแล้ว" : "บันทึกว่ายังไม่ผ่าน — เดี๋ยวลองใหม่นะ");
      } else {
        toast.error(json.error ?? "บันทึกไม่สำเร็จ");
      }
    } finally {
      setChecking(null);
    }
  };

  const retryWrong = async () => {
    // สร้างชุดใหม่จากเดิมเพื่อ "ฝึกข้อที่ผิดอีกครั้ง" (attempt ใหม่ของชุดเดียวกัน)
    toast.info("เริ่มชุดฝึกใหม่จากชุดเดิม — ลองทำใหม่ทั้งชุด แล้วเทียบกับข้อที่พลาดครั้งก่อน");
    router.push(`/quiz/${setId}`);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* สรุปคะแนน */}
      <Card className="rounded-3xl shadow-soft">
        <CardContent className="flex flex-wrap items-center gap-6 p-6">
          <div className="flex flex-col">
            <span className="text-4xl font-bold text-wine dark:text-primary">
              {score.percent}%
            </span>
            <span className="text-sm text-muted-foreground">
              คะแนนอัตโนมัติ {autoEarned}/{autoTotal}
              {review.some((r) => r.type === "WRITTEN") && " (ข้อเขียนตรวจเองแยก)"}
            </span>
          </div>
          <div className="flex flex-col gap-1 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" aria-hidden /> ใช้เวลา {formatClock(durationSec)}
            </span>
            <span className="flex flex-wrap gap-3">
              <span className="flex items-center gap-1 text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" aria-hidden /> ถูก{" "}
                {review.filter((r) => r.status === "correct").length}
              </span>
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <CircleX className="h-4 w-4" aria-hidden /> ผิด{" "}
                {review.filter((r) => r.status === "incorrect").length}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Circle className="h-4 w-4" aria-hidden /> ข้าม{" "}
                {review.filter((r) => r.status === "skipped").length}
              </span>
            </span>
          </div>
          <div className="ml-auto flex flex-col gap-2">
            {wrongIds.length > 0 && (
              <Button className="rounded-2xl" onClick={retryWrong}>
                <RotateCcw className="mr-1 h-4 w-4" aria-hidden /> ฝึกข้อที่ผิดอีกครั้ง ({wrongIds.length})
              </Button>
            )}
            {pendingSelfCheck > 0 && (
              <Badge variant="secondary" className="rounded-full">
                <PencilLine className="mr-1 h-3.5 w-3.5" aria-hidden />
                มีข้อเขียนรอตรวจ {pendingSelfCheck} ข้อ
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* เฉลยรายข้อ */}
      <h2 className="text-lg font-semibold">เฉลยและคำอธิบาย</h2>
      {review.map((r, idx) => {
        const meta = statusMeta[r.status];
        return (
          <Card key={r.questionId} className="rounded-3xl shadow-soft">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="flex items-start gap-3 text-sm font-normal">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-secondary font-semibold text-wine dark:text-primary">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">
                    <KatexText text={r.prompt} />
                  </span>
                </CardTitle>
                <span className={cn("flex shrink-0 items-center gap-1 text-xs font-medium", meta.className)}>
                  {meta.icon} {meta.label}
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              {/* คำตอบที่ส่ง */}
              <div className="rounded-2xl bg-muted/60 p-3">
                <p className="mb-1 text-xs font-medium text-muted-foreground">คำตอบของคุณ</p>
                {r.type === "MCQ" && (
                  <div className="flex flex-wrap gap-1.5">
                    {r.submittedSelectedKeys.length === 0 ? (
                      <span className="text-muted-foreground">ไม่ได้ตอบ</span>
                    ) : (
                      r.options
                        ?.filter((o) => r.submittedSelectedKeys.includes(o.key))
                        .map((o) => (
                          <Badge key={o.key} variant="outline" className="rounded-full">
                            {o.key}. <KatexText text={o.text} />
                          </Badge>
                        ))
                    )}
                  </div>
                )}
                {r.type === "SHORT_ANSWER" && (
                  <p>
                    {r.submittedText || <span className="text-muted-foreground">ไม่ได้ตอบ</span>}
                  </p>
                )}
                {r.type === "WRITTEN" && (
                  <div className="flex flex-col gap-1">
                    <p>
                      <span className="font-medium">คำตอบสุดท้าย: </span>
                      {r.submittedFinalAnswer ? (
                        <KatexText text={r.submittedFinalAnswer} />
                      ) : (
                        <span className="text-muted-foreground">ไม่ได้เขียน</span>
                      )}
                    </p>
                    {r.submittedTex && (
                      <p className="text-xs text-muted-foreground">
                        สมการ: <KatexText text={`$${r.submittedTex}$`} />
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      ภาพกระดานเขียนถูกบันทึกไว้กับคำตอบของคุณแล้ว
                    </p>
                  </div>
                )}
              </div>

              {/* เฉลย */}
              <div className="rounded-2xl border border-green-200 bg-green-50/60 p-3 dark:border-green-900 dark:bg-green-950/30">
                <p className="mb-1 text-xs font-medium text-green-800 dark:text-green-300">เฉลย</p>
                {r.type === "MCQ" &&
                  r.options
                    ?.filter((o) => r.correctKeys.includes(o.key))
                    .map((o) => (
                      <p key={o.key}>
                        <span className="font-semibold">{o.key}.</span>{" "}
                        <KatexText text={o.text} />
                      </p>
                    ))}
                {r.type === "SHORT_ANSWER" && (
                  <p>
                    ตอบ <span className="font-semibold"><KatexText text={r.accepts[0] ?? ""} /></span>
                    {r.accepts.length > 1 && (
                      <span className="text-xs text-muted-foreground">
                        {" "}(ยอมรับรูปแบบอื่นด้วย: {r.accepts.slice(1).join(", ")})
                      </span>
                    )}
                  </p>
                )}
                {r.type === "WRITTEN" && (
                  <p>
                    คำตอบสุดท้าย: <span className="font-semibold"><KatexText text={r.finalAnswer} /></span>
                  </p>
                )}
                {r.explanation && (
                  <p className="mt-2 leading-relaxed text-foreground/90">
                    <KatexText text={r.explanation} />
                  </p>
                )}
              </div>

              {/* แนววิธีคิดข้อคำนวณ (ข้อเขียน) */}
              {r.type === "WRITTEN" && r.steps.length > 0 && (
                <div className="rounded-2xl border border-purple-200 bg-lavender/50 p-3 dark:border-purple-900 dark:bg-secondary/40">
                  <p className="mb-1 text-xs font-medium text-purple-800 dark:text-purple-300">
                    แนววิธีคิดแบบเป็นขั้นตอน
                  </p>
                  <ol className="ml-4 list-decimal space-y-1 leading-relaxed">
                    {r.steps.map((s, i) => (
                      <li key={i}>
                        <KatexText text={s} />
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* rubric + ตรวจเอง */}
              {r.type === "WRITTEN" && (
                <div className="rounded-2xl border border-border p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Rubric — ตรวจวิธีทำของคุณเองตามเกณฑ์ แล้วติ๊กยืนยัน
                  </p>
                  <ul className="mb-3 space-y-1 text-xs">
                    {(r.rubric ?? []).map((item, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="font-semibold text-wine dark:text-primary">{item.points} คะแนน</span>
                        <span>{item.description}</span>
                      </li>
                    ))}
                    {(!r.rubric || r.rubric.length === 0) && (
                      <li className="text-muted-foreground">ไม่ได้ระบุ rubric สำหรับข้อนี้</li>
                    )}
                  </ul>
                  {r.selfChecked === null ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="rounded-2xl"
                        disabled={checking === r.questionId}
                        onClick={() => selfCheck(r.questionId, true)}
                      >
                        <CheckCircle2 className="mr-1 h-4 w-4" aria-hidden /> ทำถูกต้องตาม rubric
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-2xl"
                        disabled={checking === r.questionId}
                        onClick={() => selfCheck(r.questionId, false)}
                      >
                        ยังไม่ผ่าน จะลองใหม่
                      </Button>
                    </div>
                  ) : (
                    <p className={cn("text-sm font-medium", meta.className)}>
                      {r.selfChecked
                        ? "คุณยืนยันว่าทำถูกต้องแล้ว"
                        : "คุณระบุว่ายังไม่ผ่าน — กลับไปดูแนววิธีคิดแล้วลองใหม่ได้เลย"}
                    </p>
                  )}
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    ระบบไม่อ้างว่าตรวจข้อเขียนได้แม่นยำเสมอ จึงให้คุณตรวจกับเฉลยและ rubric เอง
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
