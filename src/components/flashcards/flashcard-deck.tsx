"use client";

import * as React from "react";
import {
  BookOpen,
  Check,
  CheckCircle,
  CheckCircle2,
  RotateCw,
  ArrowLeft,
  ArrowRight,
  Zap,
  Lightbulb,
  Volume2,
  Shuffle,
  RotateCcw,
  Sparkles,
  HelpCircle,
  GraduationCap,
} from "lucide-react";
import {
  ENGLISH_FUTURE_FLASHCARDS,
  type Flashcard,
  type FlashcardCategory,
} from "@/data/english-future-flashcards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "final_prep_mastered_flashcards_v1";

const CATEGORIES: { label: string; value: FlashcardCategory | "All" }[] = [
  { label: "ทั้งหมด (All)", value: "All" },
  { label: "Will vs Going To", value: "Will vs Going To" },
  { label: "Future Continuous", value: "Future Continuous" },
  { label: "Formula (สูตร)", value: "Formula" },
  { label: "Exam Trick (กับดักสอบ)", value: "Exam Trick" },
];

const CATEGORY_STYLES: Record<
  FlashcardCategory,
  { badge: string; borderAccent: string; bgSoft: string }
> = {
  "Will vs Going To": {
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
    borderAccent: "border-l-amber-500",
    bgSoft: "bg-amber-500/5",
  },
  "Future Continuous": {
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    borderAccent: "border-l-emerald-500",
    bgSoft: "bg-emerald-500/5",
  },
  Formula: {
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30",
    borderAccent: "border-l-blue-500",
    bgSoft: "bg-blue-500/5",
  },
  "Exam Trick": {
    badge: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
    borderAccent: "border-l-rose-500",
    bgSoft: "bg-rose-500/5",
  },
};

interface FlashcardDeckProps {
  initialCards?: Flashcard[];
  className?: string;
}

export function FlashcardDeck({
  initialCards = ENGLISH_FUTURE_FLASHCARDS,
  className,
}: FlashcardDeckProps) {
  const [cards, setCards] = React.useState<Flashcard[]>(initialCards);
  const [selectedCategory, setSelectedCategory] = React.useState<FlashcardCategory | "All">("All");
  const [showOnlyUnmastered, setShowOnlyUnmastered] = React.useState(false);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isFlipped, setIsFlipped] = React.useState(false);
  const [masteredIds, setMasteredIds] = React.useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const [isShuffled, setIsShuffled] = React.useState(false);

  // Load mastered cards from localStorage
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setMasteredIds(parsed);
        }
      }
    } catch (e) {
      console.warn("Could not read mastered flashcards from localStorage", e);
    }
  }, []);

  // Save mastered cards to localStorage
  const saveMasteredIds = React.useCallback((ids: string[]) => {
    setMasteredIds(ids);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch (e) {
      console.warn("Could not save mastered flashcards to localStorage", e);
    }
  }, []);

  // Filtered cards list
  const filteredCards = React.useMemo(() => {
    return cards.filter((card) => {
      const matchesCategory =
        selectedCategory === "All" || card.category === selectedCategory;
      const isMastered = masteredIds.includes(card.id);
      const matchesMasteredFilter = !showOnlyUnmastered || !isMastered;
      return matchesCategory && matchesMasteredFilter;
    });
  }, [cards, selectedCategory, showOnlyUnmastered, masteredIds]);

  // Ensure currentIndex stays within bounds when filter changes
  React.useEffect(() => {
    if (currentIndex >= filteredCards.length) {
      setCurrentIndex(Math.max(0, filteredCards.length - 1));
    }
    setIsFlipped(false);
  }, [filteredCards.length, currentIndex]);

  const currentCard = filteredCards[currentIndex];
  const isCurrentMastered = currentCard ? masteredIds.includes(currentCard.id) : false;

  // Flip card
  const handleFlip = React.useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  // Previous card
  const handlePrev = React.useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : filteredCards.length - 1));
  }, [filteredCards.length]);

  // Next card
  const handleNext = React.useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev < filteredCards.length - 1 ? prev + 1 : 0));
  }, [filteredCards.length]);

  // Toggle mastered
  const handleToggleMastered = React.useCallback(() => {
    if (!currentCard) return;
    const isMastered = masteredIds.includes(currentCard.id);
    const updated = isMastered
      ? masteredIds.filter((id) => id !== currentCard.id)
      : [...masteredIds, currentCard.id];
    saveMasteredIds(updated);
  }, [currentCard, masteredIds, saveMasteredIds]);

  // Shuffle cards
  const handleShuffle = React.useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex(0);
    if (isShuffled) {
      setCards(initialCards);
      setIsShuffled(false);
    } else {
      const shuffled = [...cards].sort(() => Math.random() - 0.5);
      setCards(shuffled);
      setIsShuffled(true);
    }
  }, [cards, initialCards, isShuffled]);

  // Reset mastered progress
  const handleResetMastered = React.useCallback(() => {
    if (window.confirm("ต้องการรีเซ็ตสถานะการท่องจำทั้งหมดใช่หรือไม่?")) {
      saveMasteredIds([]);
    }
  }, [saveMasteredIds]);

  // Text to speech for English sentences
  const speakEnglish = React.useCallback(
    (text: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

      try {
        window.speechSynthesis.cancel();
        setIsSpeaking(true);
        const cleanText = text.replace(/[*_#/[\]]/g, " ").trim();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = "en-US";
        utterance.rate = 0.88;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error("Audio playback error", err);
        setIsSpeaking(false);
      }
    },
    []
  );

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.code === "Space" || e.key === "Enter") {
        e.preventDefault();
        handleFlip();
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        handlePrev();
      } else if (e.key.toLowerCase() === "m") {
        e.preventDefault();
        handleToggleMastered();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleFlip, handleNext, handlePrev, handleToggleMastered]);

  // Overall mastery calculation
  const totalCardsCount = initialCards.length;
  const totalMasteredCount = initialCards.filter((c) =>
    masteredIds.includes(c.id)
  ).length;
  const masteryPercentage = Math.round((totalMasteredCount / totalCardsCount) * 100);

  // รองรับ Swipe ท่าทางปัดนิ้วซ้าย-ขวาบนจอมือถือ
  const touchStartX = React.useRef<number | null>(null);
  const touchStartY = React.useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    const diffY = touchStartY.current - e.changedTouches[0].clientY;
    touchStartX.current = null;
    touchStartY.current = null;

    // ตรวจสอบว่าเป็นการปัดแนวนอนชัดเจน (เกิน 45px และไม่อิงแกนตั้ง)
    if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        handleNext(); // ปัดซ้าย -> การ์ดถัดไป
      } else {
        handlePrev(); // ปัดขวา -> การ์ดก่อนหน้า
      }
    }
  };

  // Category counts for pill badges
  const categoryCounts = React.useMemo(() => {
    const map: Record<string, number> = { All: initialCards.length };
    initialCards.forEach((c) => {
      map[c.category] = (map[c.category] || 0) + 1;
    });
    return map;
  }, [initialCards]);

  const currentStyles = currentCard
    ? CATEGORY_STYLES[currentCard.category]
    : CATEGORY_STYLES["Formula"];

  return (
    <div className={cn("mx-auto flex w-full max-w-4xl flex-col gap-6", className)}>
      {/* Header Banner */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Flashcards & Cram Cards
              </h2>
              <Badge variant="outline" className="border-primary/30 text-primary text-xs">
                Future Tense
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              การ์ดสรุปสูตร & ทริคลับเตรียมสอบ 20 ข้อคาบหน้า ทบทวนจำขึ้นใจ!
            </p>
          </div>
        </div>

        {/* Mastered Progress Widget */}
        <div className="flex flex-col gap-1.5 rounded-xl border border-border/80 bg-muted/40 p-3 sm:min-w-[210px]">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              จำได้แล้ว
            </span>
            <span className="font-semibold text-foreground">
              {totalMasteredCount} / {totalCardsCount} ({masteryPercentage}%)
            </span>
          </div>
          <Progress value={masteryPercentage} className="h-2 bg-muted-foreground/20" />
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{totalCardsCount - totalMasteredCount} ใบที่เหลือ</span>
            {totalMasteredCount > 0 && (
              <button
                type="button"
                onClick={handleResetMastered}
                className="hover:underline hover:text-destructive transition-colors text-[10px]"
                title="รีเซ็ตสถานะการท่องจำ"
              >
                รีเซ็ต
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Pills & Filters */}
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            หมวดหมู่ (Category)
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShuffle}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                isShuffled
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              title="สุ่มลำดับการ์ด"
            >
              <Shuffle className="h-3 w-3" />
              <span>{isShuffled ? "กำลังสุ่มลำดับ" : "สลับการ์ด (Shuffle)"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowOnlyUnmastered((prev) => !prev);
                setCurrentIndex(0);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                showOnlyUnmastered
                  ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold"
                  : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Sparkles className="h-3 w-3" />
              <span>เฉพาะที่ยังไม่แม่น</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => {
            const count = categoryCounts[cat.value] || 0;
            const isSelected = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.value);
                  setCurrentIndex(0);
                  setIsFlipped(false);
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all active:scale-95",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                    : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground hover:bg-muted/60"
                )}
              >
                <span>{cat.label}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 text-[10px] font-semibold",
                    isSelected
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Flashcard Container */}
      {filteredCards.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border bg-card/60 p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold text-foreground">
              ยอดเยี่ยมมาก! ไม่มีบัตรคงค้างในหมวดหมู่นี้
            </h3>
            <p className="text-sm text-muted-foreground">
              คุณท่องจำการ์ดในหมวดนี้ครบถ้วนแล้ว หรือลองปิดตัวกรอง &quot;เฉพาะที่ยังไม่แม่น&quot;
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setShowOnlyUnmastered(false);
              setSelectedCategory("All");
            }}
          >
            <RotateCcw className="mr-1.5 h-4 w-4" /> ดูการ์ดทั้งหมดอีกครั้ง
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Card Top Sub-Bar: Counter & Mastered Indicator */}
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">
                การ์ดใบที่ {currentIndex + 1} จาก {filteredCards.length}
              </span>
              <span className="text-muted-foreground/60">•</span>
              <span className="hidden sm:inline">
                {isFlipped ? "ด้านหลัง (คำอธิบาย & ทริค)" : "ด้านหน้า (คำถาม / จุดเน้น)"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isCurrentMastered ? (
                <Badge
                  variant="outline"
                  className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1 font-semibold text-[11px]"
                >
                  <CheckCircle className="h-3 w-3" /> ท่องจำแล้ว
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground text-[11px]">
                  ยังไม่ได้บันทึก
                </Badge>
              )}
            </div>
          </div>

          {/* 3D Flip Card Container */}
          <div
            className="group relative w-full cursor-pointer select-none"
            style={{ perspective: "1200px" }}
            onClick={handleFlip}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            role="button"
            tabIndex={0}
            aria-label={`Flashcard: ${currentCard.title}. กด Spacebar เพื่อพลิกการ์ด (บนมือถือปัดซ้ายขวาได้)`}
          >
            <div
              className="relative w-full rounded-3xl transition-transform duration-500 ease-out"
              style={{
                transformStyle: "preserve-3d",
                transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                minHeight: "440px",
              }}
            >
              {/* ==================== FRONT OF CARD ==================== */}
              <div
                className={cn(
                  "absolute inset-0 flex flex-col justify-between rounded-3xl border-2 bg-card p-6 shadow-md transition-shadow hover:shadow-lg sm:p-8",
                  currentStyles.borderAccent,
                  isCurrentMastered ? "border-emerald-500/30 ring-1 ring-emerald-500/20" : "border-border"
                )}
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
              >
                {/* Front Header */}
                <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={cn("font-medium", currentStyles.badge)}>
                      {currentCard.category}
                    </Badge>
                    {currentCard.front.badge && (
                      <Badge variant="secondary" className="text-[11px]">
                        {currentCard.front.badge}
                      </Badge>
                    )}
                  </div>

                  <span className="text-xs font-mono font-medium text-muted-foreground">
                    #{currentCard.id.replace("fc-", "")}
                  </span>
                </div>

                {/* Front Main Body */}
                <div className="my-auto flex flex-col items-center justify-center gap-4 py-8 text-center">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <HelpCircle className="h-6 w-6" />
                  </span>

                  <h3 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl sm:leading-snug">
                    {currentCard.front.prompt}
                  </h3>

                  {currentCard.front.subtext && (
                    <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
                      {currentCard.front.subtext}
                    </p>
                  )}
                </div>

                {/* Front Footer Helper */}
                <div className="flex items-center justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5 text-primary font-medium">
                    <RotateCw className="h-3.5 w-3.5 animate-spin-reverse" />
                    <span>คลิกการ์ดหรือกด Space เพื่อดูเฉลย</span>
                  </div>

                  <span className="hidden sm:inline-block text-[11px]">
                    ปุ่มลัด: ← ก่อนหน้า • → ถัดไป • M จำได้แล้ว
                  </span>
                </div>
              </div>

              {/* ==================== BACK OF CARD ==================== */}
              <div
                className={cn(
                  "absolute inset-0 flex flex-col justify-between overflow-y-auto rounded-3xl border-2 bg-card p-6 shadow-md transition-shadow hover:shadow-lg sm:p-8",
                  currentStyles.borderAccent,
                  isCurrentMastered ? "border-emerald-500/30 ring-1 ring-emerald-500/20" : "border-border"
                )}
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                {/* Back Header */}
                <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn("font-medium", currentStyles.badge)}>
                        {currentCard.category}
                      </Badge>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Check className="h-3 w-3" /> เฉลย & หลักการ
                      </span>
                    </div>
                    <h4 className="mt-1 text-base font-bold text-foreground sm:text-lg">
                      {currentCard.title}
                    </h4>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFlip();
                    }}
                    className="h-8 gap-1 rounded-full text-xs text-muted-foreground hover:text-foreground"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    <span>พลิกกลับ</span>
                  </Button>
                </div>

                {/* Back Content Scrollable Area */}
                <div className="my-3 flex flex-col gap-4 text-sm leading-relaxed text-foreground">
                  {/* Formula Callout */}
                  {currentCard.back.formula && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3 sm:p-3.5">
                      <Zap className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                          โครงสร้างสูตร (Formula)
                        </span>
                        <span className="font-mono text-sm font-bold text-foreground sm:text-base">
                          {currentCard.back.formula}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Rule Details */}
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      หลักไวยากรณ์ (Grammar Rule)
                    </span>
                    <p className="whitespace-pre-line text-sm text-foreground/90 sm:text-base">
                      {currentCard.back.rule}
                    </p>
                  </div>

                  {/* Keywords Pills */}
                  {currentCard.back.keywords.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        คีย์เวิร์ดสังเกต (Keywords & Signals)
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {currentCard.back.keywords.map((kw, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center rounded-lg border border-border/80 bg-muted/60 px-2 py-0.5 font-mono text-xs font-medium text-foreground"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Example & Audio */}
                  <div className="rounded-xl border border-border bg-muted/30 p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        ประโยคตัวอย่าง (Example)
                      </span>

                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={(e) => speakEnglish(currentCard.back.example, e)}
                        className={cn(
                          "h-7 gap-1 rounded-full text-xs font-medium transition-colors",
                          isSpeaking
                            ? "bg-primary/20 text-primary"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                        title="ฟังเสียงอ่านออกเสียงภาษาอังกฤษ"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                        <span>ฟังเสียง</span>
                      </Button>
                    </div>

                    <p className="mt-1 font-medium text-foreground sm:text-base">
                      &quot;{currentCard.back.example}&quot;
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                      แปลว่า: {currentCard.back.thaiMeaning}
                    </p>
                  </div>

                  {/* High Yield Exam Tip */}
                  {currentCard.back.examTip && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-900 dark:text-amber-200">
                      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                      <div className="flex flex-col gap-0.5 text-xs sm:text-sm">
                        <span className="font-bold text-amber-800 dark:text-amber-300">
                          ทริคลับ & กับดักข้อสอบ (Exam Tip)
                        </span>
                        <p className="whitespace-pre-line leading-relaxed">
                          {currentCard.back.examTip}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Back Footer */}
                <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
                  <span className="text-[11px]">คลิกการ์ดเพื่อกลับไปดูคำถาม</span>
                  <div className="flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5 text-primary" />
                    <span>พร้อมลุย 20 ข้อ!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Control Toolbar */}
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            {/* Previous & Next Buttons */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrev}
                className="flex-1 sm:flex-none h-10 px-4 rounded-xl"
                aria-label="การ์ดก่อนหน้า"
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" /> ก่อนหน้า
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleNext}
                className="flex-1 sm:flex-none h-10 px-4 rounded-xl"
                aria-label="การ์ดถัดไป"
              >
                ถัดไป <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>

            {/* Central Flip Button */}
            <div className="flex justify-center">
              <Button
                type="button"
                onClick={handleFlip}
                className="w-full sm:w-auto h-11 px-6 rounded-xl font-semibold shadow-sm gap-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <RotateCw className="h-4 w-4" />
                <span>{isFlipped ? "พลิกกลับด้านหน้า (Show Front)" : "พลิกดูคำตอบ (Flip Card)"}</span>
              </Button>
            </div>

            {/* Mastered Toggle Button */}
            <div className="flex items-center justify-end">
              <Button
                type="button"
                variant={isCurrentMastered ? "default" : "outline"}
                onClick={handleToggleMastered}
                className={cn(
                  "w-full sm:w-auto h-10 px-4 rounded-xl font-medium gap-1.5 text-xs sm:text-sm transition-all",
                  isCurrentMastered
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
                    : "border-border hover:border-emerald-500/50 hover:text-emerald-600"
                )}
              >
                <CheckCircle className="h-4 w-4" />
                <span>{isCurrentMastered ? "ท่องจำได้แล้ว ✓" : "ทำเครื่องหมายว่าจำได้แล้ว"}</span>
              </Button>
            </div>
          </div>

          {/* Desktop Keyboard Shortcuts Legend */}
          <div className="hidden sm:flex items-center justify-center gap-4 text-xs text-muted-foreground/80 py-1">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                Space
              </kbd>{" "}
              พลิกการ์ด
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                ←
              </kbd>
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                →
              </kbd>{" "}
              เปลี่ยนการ์ด
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                M
              </kbd>{" "}
              จำได้แล้ว
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
