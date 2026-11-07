"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, HelpCircle, PartyPopper, RotateCcw, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { KatexText } from "@/components/katex-text";
import { cn } from "@/lib/utils";

export interface ReviewItem {
  cardId: string;
  box: number;
  confidentWrong: boolean;
  question: {
    id: string;
    type: "MCQ" | "SHORT_ANSWER";
    prompt: string;
    imageUrl: string | null;
    options: { key: string; text: string }[] | null;
  };
  subject: { code: string; name: string; color: string };
  setTitle: string;
}

interface Result {
  isCorrect: boolean;
  correctKeys: string[] | null;
  acceptedAnswer: string | null;
  explanation: string | null;
  next: { box: number; dueAt: string } | null;
}

const daysUntil = (iso: string) =>
  Math.max(1, Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000));

/** ทบทวนทีละข้อ: เลือกคำตอบ → กด "มั่นใจ" หรือ "เดา" → เห็นเฉลยทันที + รอบถัดไป */
export function ReviewRunner({ items }: { items: ReviewItem[] }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [sending, setSending] = useState(false);
  const [tally, setTally] = useState({ correct: 0, wrong: 0, mastered: 0 });

  const item = items[index];
  const done = index >= items.length;

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card p-10 text-center">
        <PartyPopper className="h-12 w-12 text-primary" aria-hidden />
        <h2 className="text-2xl font-bold">ทบทวนครบแล้ววันนี้!</h2>
        <p className="text-muted-foreground">
          ถูก {tally.correct} ข้อ · ยังพลาด {tally.wrong} ข้อ
          {tally.mastered > 0 ? ` · จำได้ขาดแล้ว ${tally.mastered} ข้อ` : ""}
        </p>
        <p className="max-w-md text-sm text-muted-foreground">
          ข้อที่ยังพลาดจะกลับมาพรุ่งนี้ ส่วนข้อที่ตอบถูกจะเว้นห่างออกไปเรื่อย ๆ — ทบทวนทุกวันวันละนิดได้ผลกว่าอ่านรวดเดียวก่อนสอบ
        </p>
        <Button asChild size="lg" className="h-11 rounded-xl">
          <Link href="/">กลับหน้าแรก</Link>
        </Button>
      </div>
    );
  }

  const q = item.question;
  const hasAnswer = q.type === "MCQ" ? selected.length > 0 : text.trim().length > 0;

  async function send(confident: boolean) {
    if (!hasAnswer || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/review/${item.cardId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          q.type === "MCQ" ? { selectedKeys: selected, confident } : { text, confident },
        ),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      const r = json.data as Result;
      setResult(r);
      setTally((t) => ({
        correct: t.correct + (r.isCorrect ? 1 : 0),
        wrong: t.wrong + (r.isCorrect ? 0 : 1),
        mastered: t.mastered + (r.next === null ? 1 : 0),
      }));
    } catch {
      toast.error("ส่งคำตอบไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setSending(false);
    }
  }

  function next() {
    setIndex((i) => i + 1);
    setSelected([]);
    setText("");
    setResult(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Progress value={(index / items.length) * 100} aria-label={`ทบทวนแล้ว ${index} จาก ${items.length} ข้อ`} />
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {index + 1} / {items.length}
        </span>
      </div>

      <article className="rounded-3xl border border-border bg-card p-5 md:p-7" aria-label={`ข้อทบทวน ${index + 1}`}>
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <span
            className="subject-icon rounded-full px-3 py-1 font-medium"
            style={{ "--sc": item.subject.color } as React.CSSProperties}
          >
            {item.subject.name}
          </span>
          <span className="text-muted-foreground">{item.setTitle}</span>
          {item.confidentWrong && (
            <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              ⚠ ข้ออันตราย: เคยมั่นใจแต่ผิด
            </span>
          )}
        </div>

        <div className="text-base leading-relaxed">
          <KatexText text={q.prompt} />
        </div>
        {q.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={q.imageUrl} alt="รูปประกอบโจทย์" className="mt-3 max-h-80 rounded-2xl border border-border object-contain" />
        )}

        {q.type === "MCQ" && q.options && (
          <div className="mt-5 flex flex-col gap-2" role="radiogroup" aria-label="ตัวเลือกคำตอบ">
            {q.options.map((opt) => {
              const isSel = selected.includes(opt.key);
              const isRight = result?.correctKeys?.includes(opt.key);
              return (
                <button
                  key={opt.key}
                  type="button"
                  role="radio"
                  aria-checked={isSel}
                  disabled={result !== null}
                  onClick={() => setSelected([opt.key])}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl border p-3 text-left text-sm transition-colors enabled:hover:bg-secondary/60",
                    isSel ? "border-primary bg-secondary" : "border-border",
                    result && isRight && "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40",
                    result && isSel && !isRight && "border-red-500 bg-red-50 dark:bg-red-950/40",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border font-medium",
                      isSel ? "border-primary bg-primary text-primary-foreground" : "border-border",
                    )}
                  >
                    {opt.key}
                  </span>
                  <span className="leading-relaxed">
                    <KatexText text={opt.text} />
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {q.type === "SHORT_ANSWER" && (
          <div className="mt-5">
            <label htmlFor={`rv-${item.cardId}`} className="text-sm text-muted-foreground">
              พิมพ์คำตอบ
            </label>
            <input
              id={`rv-${item.cardId}`}
              value={text}
              disabled={result !== null}
              onChange={(e) => setText(e.target.value)}
              className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm"
            />
          </div>
        )}

        {!result ? (
          <div className="mt-6 flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              {hasAnswer ? "ตอบแบบไหน? (บอกตามจริง ระบบจะจัดรอบทบทวนให้แม่นขึ้น)" : "เลือกคำตอบก่อน แล้วกดส่ง"}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="lg"
                className="h-11 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={!hasAnswer || sending}
                onClick={() => send(true)}
              >
                <ShieldCheck className="mr-1.5 h-4 w-4" aria-hidden /> ส่ง — มั่นใจ
              </Button>
              <Button
                size="lg"
                className="h-11 rounded-xl bg-amber-500 text-white hover:bg-amber-600"
                disabled={!hasAnswer || sending}
                onClick={() => send(false)}
              >
                <HelpCircle className="mr-1.5 h-4 w-4" aria-hidden /> ส่ง — เดา
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-3" aria-live="polite">
            <p
              className={cn(
                "flex items-center gap-2 text-lg font-semibold",
                result.isCorrect ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
              )}
            >
              {result.isCorrect ? (
                <CheckCircle2 className="h-6 w-6" aria-hidden />
              ) : (
                <XCircle className="h-6 w-6" aria-hidden />
              )}
              {result.isCorrect ? "ถูกต้อง!" : "ยังไม่ถูก"}
              {!result.isCorrect && result.acceptedAnswer && (
                <span className="text-base font-normal text-foreground">
                  — คำตอบคือ <KatexText text={result.acceptedAnswer} />
                </span>
              )}
            </p>
            {result.explanation && (
              <div className="rounded-2xl bg-muted/60 p-4 text-sm leading-relaxed">
                <p className="mb-1 font-medium">เฉลย / วิธีคิด</p>
                <KatexText text={result.explanation} />
              </div>
            )}
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <RotateCcw className="h-4 w-4" aria-hidden />
              {result.next === null
                ? "จำได้ขาดแล้ว 🎉 ข้อนี้ไม่ต้องทบทวนอีก"
                : `ข้อนี้จะกลับมาอีกใน ${daysUntil(result.next.dueAt)} วัน`}
            </p>
            <Button size="lg" className="h-11 self-start rounded-xl" onClick={next}>
              {index + 1 < items.length ? "ข้อต่อไป" : "ดูสรุป"}
            </Button>
          </div>
        )}
      </article>
    </div>
  );
}
