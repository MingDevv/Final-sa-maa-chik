"use client";

import { useEffect, useState } from "react";
import { Calculator, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Whiteboard } from "@/components/quiz/whiteboard";
import { cn } from "@/lib/utils";

/**
 * กระดาษทดสำหรับข้อคำนวณ (คณิต/ฟิสิกส์) — กดปุ่มเปิด/ปิด เพิ่มหน้าได้
 * แต่ละหน้า autosave ลง localStorage ของเครื่องผู้ใช้ (Whiteboard จัดการให้)
 */
export function ScratchPad({
  setId,
  questionId,
}: {
  setId: string;
  questionId: string;
}) {
  const listKey = `fep_scratch_pages:${setId}:${questionId}`;
  const [open, setOpen] = useState(false);
  const [pages, setPages] = useState<number[]>([1]);
  const [active, setActive] = useState(1);

  // โหลดรายการหน้ากระดาษที่เคยเพิ่มไว้
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- โหลดรายการหน้าที่เคยเพิ่มไว้จาก localStorage
      const saved = localStorage.getItem(listKey);
      if (saved) {
        const arr = JSON.parse(saved) as number[];
        if (Array.isArray(arr) && arr.length > 0) {
          setPages(arr);
          setActive(arr[arr.length - 1]);
        }
      }
    } catch {
      /* ข้าม */
    }
  }, [listKey]);

  const persistPages = (next: number[]) => {
    setPages(next);
    try {
      localStorage.setItem(listKey, JSON.stringify(next));
    } catch {
      /* ข้าม */
    }
  };

  const addPage = () => {
    const next = Math.max(...pages) + 1;
    persistPages([...pages, next]);
    setActive(next);
  };

  const removePage = (page: number) => {
    if (pages.length === 1) return; // ต้องเหลืออย่างน้อย 1 หน้า
    const next = pages.filter((p) => p !== page);
    persistPages(next);
    if (active === page) setActive(next[next.length - 1]);
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant={open ? "default" : "outline"}
        size="sm"
        className="self-start rounded-2xl"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Calculator className="mr-1.5 h-4 w-4" aria-hidden />
        {open ? "ปิดกระดาษทด" : "กระดาษทด"}
      </Button>

      {open && (
        <div className="rounded-3xl border border-border bg-card p-3 shadow-soft">
          {/* แท็บเลือกหน้ากระดาษ */}
          <div className="mb-2 flex flex-wrap items-center gap-1.5" role="tablist" aria-label="หน้ากระดาษทด">
            {pages.map((p) => (
              <button
                key={p}
                type="button"
                role="tab"
                aria-selected={active === p}
                onClick={() => setActive(p)}
                className={cn(
                  "group relative rounded-xl border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring",
                  active === p
                    ? "border-wine bg-wine text-white dark:border-primary dark:bg-primary"
                    : "border-border text-muted-foreground hover:bg-secondary",
                )}
              >
                ก.{p}
                {pages.length > 1 && (
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`ลบหน้า ก.${p}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      removePage(p);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        removePage(p);
                      }
                    }}
                    className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center rounded-full bg-destructive text-white group-hover:flex"
                  >
                    <X className="h-2.5 w-2.5" aria-hidden />
                  </span>
                )}
              </button>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 rounded-xl px-2 text-xs"
              onClick={addPage}
              aria-label="เพิ่มกระดาษทด"
            >
              <Plus className="mr-0.5 h-3.5 w-3.5" aria-hidden /> เพิ่มกระดาษ
            </Button>
          </div>

          <Whiteboard
            key={active}
            storageKey={`fep_scratch:${setId}:${questionId}:${active}`}
            className="min-h-[240px]"
          />

          <p className="mt-1.5 text-[11px] text-muted-foreground">
            กระดาษทดบันทึกอัตโนมัติในเครื่องของคุณ — ปิดหน้าแล้วกลับมายังอยู่ (ไม่ถูกส่งไปกับคำตอบ)
          </p>
        </div>
      )}
    </div>
  );
}
