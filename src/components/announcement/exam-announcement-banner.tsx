"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Bell,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Flame,
  Pencil,
  PlayCircle,
  Video,
  X,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STORAGE_COLLAPSED_KEY = "exam_announcement_eng_collapsed_v1";
const STORAGE_DISMISSED_KEY = "exam_announcement_eng_dismissed_v1";

export function ExamAnnouncementBanner() {
  const [mounted, setMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const savedCollapsed = localStorage.getItem(STORAGE_COLLAPSED_KEY);
      if (savedCollapsed !== null) {
        setIsCollapsed(savedCollapsed === "true");
      }
      const savedDismissed = localStorage.getItem(STORAGE_DISMISSED_KEY);
      if (savedDismissed !== null) {
        setIsDismissed(savedDismissed === "true");
      }
    } catch {
      // fallback for private mode / storage unavailable
    }
  }, []);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_COLLAPSED_KEY, String(next));
      } catch {}
      return next;
    });
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem(STORAGE_DISMISSED_KEY, "true");
    } catch {}
  };

  const handleRestore = () => {
    setIsDismissed(false);
    setIsCollapsed(false);
    try {
      localStorage.removeItem(STORAGE_DISMISSED_KEY);
      localStorage.removeItem(STORAGE_COLLAPSED_KEY);
    } catch {}
  };

  // If dismissed, render a small, non-intrusive banner bar so the student can restore it anytime
  if (mounted && isDismissed) {
    return (
      <aside
        aria-label="การแจ้งเตือนสอบภาษาอังกฤษที่ถูกซ่อน"
        className="flex items-center justify-between gap-3 rounded-2xl border border-rose-300/60 bg-rose-50/80 px-4 py-2.5 text-xs text-rose-900 shadow-sm backdrop-blur-sm dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200"
      >
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          <span className="font-medium">
            📢 มีนัดหมายสอบภาษาอังกฤษ (คาบหน้าพรุ่งนี้! 20 ข้อ)
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRestore}
          className="h-7 rounded-xl px-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 hover:text-rose-900 dark:text-rose-300 dark:hover:bg-rose-900/60"
        >
          เปิดการแจ้งเตือนอีกครั้ง
        </Button>
      </aside>
    );
  }

  return (
    <>
      <section
        role="region"
        aria-label="ประกาศนัดหมายสอบภาษาอังกฤษ"
        className="relative overflow-hidden rounded-3xl border-2 border-rose-400/80 bg-gradient-to-br from-rose-50 via-amber-50/70 to-purple-50/80 p-5 shadow-[0_12px_36px_-12px_rgba(225,29,72,0.22)] transition-all dark:border-rose-800/80 dark:from-rose-950/40 dark:via-zinc-900 dark:to-purple-950/30 md:p-6"
      >
        {/* Subtle decorative glowing aura */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-rose-400/20 to-amber-400/20 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-gradient-to-tr from-purple-400/20 to-rose-400/10 blur-2xl"
        />

        {/* Header Bar */}
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-rose-600" />
            </span>
            <Badge
              variant="outline"
              className="border-rose-400 bg-rose-500/15 font-semibold text-rose-700 shadow-xs dark:border-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
            >
              <Flame className="mr-1 h-3.5 w-3.5 fill-rose-500 text-rose-500" />
              สำคัญมาก • สอบเก็บคะแนน 20 ข้อ
            </Badge>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              อ31101 ภาษาอังกฤษ 1
            </span>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCollapsed}
              className="h-8 rounded-xl px-2.5 text-xs text-muted-foreground hover:bg-white/60 hover:text-foreground dark:hover:bg-zinc-800"
              title={isCollapsed ? "ขยายรายละเอียด" : "ย่อการแจ้งเตือน"}
              aria-label={isCollapsed ? "ขยายรายละเอียด" : "ย่อการแจ้งเตือน"}
            >
              {isCollapsed ? (
                <>
                  <ChevronDown className="mr-1 h-3.5 w-3.5" /> ขยาย
                </>
              ) : (
                <>
                  <ChevronUp className="mr-1 h-3.5 w-3.5" /> ย่อ
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-8 w-8 rounded-xl text-muted-foreground hover:bg-rose-200/50 hover:text-rose-700 dark:hover:bg-rose-950"
              title="ปิดการแจ้งเตือนนี้"
              aria-label="ปิดการแจ้งเตือนนี้"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Headline */}
        <div className="relative mt-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
            📢 ประกาศนัดหมายสอบภาษาอังกฤษ (คาบหน้าพรุ่งนี้!)
          </h2>
        </div>

        {/* Collapsible Content Area */}
        {!isCollapsed && (
          <div className="relative mt-4 flex flex-col gap-4 pt-1 animate-in fade-in-50 duration-200">
            {/* Exam Information Boxes */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-2xl border border-border/80 bg-white/70 p-3.5 shadow-xs backdrop-blur-sm dark:bg-zinc-900/70">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">เนื้อหาที่ออกสอบ</p>
                  <p className="text-sm font-semibold text-foreground">
                    Future Simple Tense{" "}
                    <span className="font-normal text-muted-foreground">(will vs be going to)</span> &amp;{" "}
                    Future Continuous Tense
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-border/80 bg-white/70 p-3.5 shadow-xs backdrop-blur-sm dark:bg-zinc-900/70">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  <Pencil className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">สิ่งที่ต้องเตรียมเข้าห้องสอบ</p>
                  <p className="text-sm font-semibold text-foreground">
                    ✏️ ดินสอ 2B + ยางลบ (พร้อมฝนกระดาษคำตอบ)
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Action Buttons Grid */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {/* CTA 1: ทำแบบทดสอบ */}
              <Button
                asChild
                className="h-11 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 px-4 font-semibold text-white shadow-md transition-transform hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
              >
                <Link href="/subjects/อ31101">
                  <span className="mr-1 text-base">🎯</span> ทำแบบทดสอบ 20 ข้อ (จับเวลา)
                </Link>
              </Button>

              {/* CTA 2: ชีตสรุป */}
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-2xl border-rose-300 bg-white/80 px-4 font-semibold text-foreground shadow-xs backdrop-blur-sm hover:border-rose-400 hover:bg-rose-50 dark:border-rose-800 dark:bg-zinc-900/80 dark:hover:bg-rose-950/50"
              >
                <Link href="/study-guide/อ31101">
                  <span className="mr-1 text-base">📖</span> อ่านชีตสรุปสูตร &amp; หลักการใช้
                </Link>
              </Button>

              {/* CTA 3: Flashcards */}
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-2xl border-amber-300 bg-amber-50/60 px-4 font-semibold text-amber-900 shadow-xs backdrop-blur-sm hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-900/50"
              >
                <Link href="/subjects/อ31101/flashcards">
                  <Zap className="mr-1 h-4 w-4 text-amber-600 dark:text-amber-400" />
                  แผ่นการ์ดท่องจำ (Flashcards)
                </Link>
              </Button>

              {/* CTA 4: YouTube Modal */}
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsVideoModalOpen(true)}
                className="h-11 rounded-2xl border-purple-300 bg-purple-50/60 px-4 font-semibold text-purple-900 shadow-xs backdrop-blur-sm hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-200 dark:hover:bg-purple-900/50"
              >
                <Video className="mr-1 h-4 w-4 text-purple-600 dark:text-purple-400" />
                คลิปติว DLIT (YouTube)
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* DLIT Video Modal */}
      <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent className="max-w-2xl rounded-3xl p-6 sm:p-7">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300">
                <PlayCircle className="h-6 w-6" />
              </span>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  คลิปวิดีโอติวเข้ม DLIT ภาษาอังกฤษ ม.4
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  คัดสรรคลิปอธิบาย Future Tense สรุปชัดเจน เข้าใจง่าย ตรงประเด็นที่ออกสอบ
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-4 flex flex-col gap-5">
            {/* Video 1 */}
            <div className="rounded-2xl border border-border bg-muted/40 p-4 transition-all hover:border-rose-300 dark:hover:border-rose-800">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Badge variant="secondary" className="mb-1 rounded-full text-xs">
                    ตอนที่ 9 • DLIT
                  </Badge>
                  <h3 className="font-semibold text-foreground">
                    Going to &amp; Will Tense (Future Simple)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    เปรียบเทียบการใช้ will vs be going to อย่างละเอียด พร้อมตัวอย่างประโยค
                  </p>
                </div>
                <Button
                  asChild
                  size="sm"
                  className="mt-2 shrink-0 rounded-xl bg-red-600 hover:bg-red-700 sm:mt-0"
                >
                  <a
                    href="https://youtu.be/nxmv_e7cuZ0?si=1XL8LB2esr-7cjKF"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ดูบน YouTube <ExternalLink className="ml-1 h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
              <div className="mt-3 aspect-video w-full overflow-hidden rounded-xl border border-border/70 bg-black shadow-inner">
                <iframe
                  className="h-full w-full"
                  src="https://www.youtube.com/embed/nxmv_e7cuZ0"
                  title="Going to & Will Tense ตอนที่ 9 (DLIT)"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>

            {/* Video 2 */}
            <div className="rounded-2xl border border-border bg-muted/40 p-4 transition-all hover:border-rose-300 dark:hover:border-rose-800">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Badge variant="secondary" className="mb-1 rounded-full text-xs">
                    ตอนที่ 11 • DLIT
                  </Badge>
                  <h3 className="font-semibold text-foreground">
                    Future Continuous VS Future Perfect Tense
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    สรุปโครงสร้าง S + will be + V.ing และไทม์ไลน์เหตุการณ์ที่กำลังทำในอนาคต
                  </p>
                </div>
                <Button
                  asChild
                  size="sm"
                  className="mt-2 shrink-0 rounded-xl bg-red-600 hover:bg-red-700 sm:mt-0"
                >
                  <a
                    href="https://youtu.be/_dd1aPh9SoU?si=peP9Ls9vMiZOqgPN"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ดูบน YouTube <ExternalLink className="ml-1 h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
              <div className="mt-3 aspect-video w-full overflow-hidden rounded-xl border border-border/70 bg-black shadow-inner">
                <iframe
                  className="h-full w-full"
                  src="https://www.youtube.com/embed/_dd1aPh9SoU"
                  title="Future Continuous VS Future Perfect Tense ตอนที่ 11 (DLIT)"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
