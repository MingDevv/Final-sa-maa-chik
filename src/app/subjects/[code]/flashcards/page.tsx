import { notFound } from "next/navigation";
import Link from "next/link";
import { BookOpen, ChevronRight, FileText, Home, Sparkles, Zap } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FlashcardDeck } from "@/components/flashcards/flashcard-deck";
import { subjectService } from "@/server/services/subject-service";
import { db } from "@/lib/db";
import { localizedToString } from "@/lib/types";

export const dynamic = "force-dynamic";

interface FlashcardPageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: FlashcardPageProps) {
  const { code } = await params;
  const decoded = decodeURIComponent(code);
  return {
    title: `แผ่นการ์ดท่องจำ Flashcards (${decoded}) | เตรียมสอบปลายภาค`,
    description: `ทบทวนไวยากรณ์และสูตรสำคัญด้วย Flashcards สำหรับวิชา ${decoded}`,
  };
}

export default async function FlashcardsPage({ params }: FlashcardPageProps) {
  const { code } = await params;
  const decodedCode = decodeURIComponent(code);

  // Fetch subject from DB or fallback
  let subject: {
    code: string;
    name: string;
    color: string;
  } | null = null;

  try {
    const found = await subjectService.getSubjectByCode(decodedCode);
    if (found) {
      subject = {
        code: found.code,
        name: found.name,
        color: found.color || "#7C3AED",
      };
    } else {
      const raw = await db.subject.findUnique({
        where: { code: decodedCode },
      });
      if (raw) {
        subject = {
          code: raw.code,
          name: localizedToString(raw.name),
          color: raw.color || "#7C3AED",
        };
      }
    }
  } catch (err) {
    console.warn("Could not query subject for flashcard page", err);
  }

  // If not found in DB, provide default fallback for english
  if (!subject) {
    if (decodedCode === "อ31101" || decodedCode.toLowerCase().includes("english")) {
      subject = {
        code: "อ31101",
        name: "ภาษาอังกฤษ 1",
        color: "#7C3AED",
      };
    } else {
      notFound();
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-12 pt-2">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
        >
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            <span>หน้าแรก</span>
          </Link>
          <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
          <Link
            href="/subjects"
            className="hover:text-foreground transition-colors"
          >
            วิชาเรียน
          </Link>
          <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
          <Link
            href={`/subjects/${encodeURIComponent(subject.code)}`}
            className="hover:text-foreground transition-colors font-medium text-foreground/80"
          >
            {subject.code}
          </Link>
          <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
          <span className="font-semibold text-foreground">
            Flashcards
          </span>
        </nav>

        <div className="self-start sm:self-auto">
          <BackButton
            fallbackHref={`/subjects/${encodeURIComponent(subject.code)}`}
            label={`กลับวิชา ${subject.code}`}
          />
        </div>
      </div>

      {/* Page Header */}
      <header className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card to-amber-500/5 p-6 shadow-sm dark:to-amber-500/10 md:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-amber-500/10 blur-3xl"
        />

        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-md"
              style={{ backgroundColor: subject.color }}
              aria-hidden
            >
              <Zap className="h-7 w-7 fill-white/20 text-white" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  แผ่นการ์ดท่องจำ (Flashcards)
                </h1>
                <Badge
                  variant="outline"
                  className="rounded-full border-amber-400 bg-amber-500/10 text-amber-700 dark:border-amber-600 dark:text-amber-300"
                >
                  <Sparkles className="mr-1 h-3 w-3" />
                  สูตร &amp; เทคนิคจำแม่น
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{subject.code} {subject.name}</span>{" "}
                • สรุปกระชับ พลิกจำสูตร กฎเหล็ก และจุดที่ข้อสอบชอบหลอก
              </p>
            </div>
          </div>

          {/* Quick Action Navigation links */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <Button asChild variant="outline" size="sm" className="rounded-xl gap-1.5">
              <Link href={`/study-guide/${encodeURIComponent(subject.code)}`}>
                <BookOpen className="h-4 w-4" />
                อ่านชีตสรุป
              </Link>
            </Button>
            <Button asChild size="sm" className="rounded-xl gap-1.5">
              <Link href={`/subjects/${encodeURIComponent(subject.code)}`}>
                <FileText className="h-4 w-4" />
                คลังข้อสอบวิชานี้
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Flashcard Interactive Deck */}
      <main className="w-full">
        <FlashcardDeck />
      </main>
    </div>
  );
}
