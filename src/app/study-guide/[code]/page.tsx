import { notFound } from "next/navigation";
import { NotebookPen, PlayCircle, Zap } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { db } from "@/lib/db";
import { localizedToString } from "@/lib/types";
import { MarkdownLite } from "@/components/study-guide/markdown-lite";
import { PrintGuideButton } from "@/components/study-guide/print-button";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ensureEnglishContent,
  ENGLISH_SUBJECT_CODE,
  ENGLISH_QUESTION_SET_ID,
} from "@/server/auto-seed-english";
import { ensureMathRelationsContent, MATH_SUBJECT_CODE } from "@/server/auto-seed-math";
import { ENGLISH_FUTURE_STUDY_GUIDE_MD } from "@/data/english-future-study-guide";

export const dynamic = "force-dynamic";

/** หน้าชีตสรุปก่อนสอบของแต่ละวิชา — เนื้อหาจากฐานข้อมูล (ตาราง study_guides) */
export default async function StudyGuidePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const decodedCode = decodeURIComponent(code);

  if (decodedCode === ENGLISH_SUBJECT_CODE) {
    await ensureEnglishContent();
  }
  if (decodedCode === MATH_SUBJECT_CODE) {
    await ensureMathRelationsContent();
  }

  let subject = await db.subject.findUnique({
    where: { code: decodedCode },
    include: { studyGuide: true },
  });

  // ถ้าเป็นวิชาอังกฤษแล้ว DB ยังไม่มีข้อมูล ให้สร้าง/ดึงข้อมูล fallback
  if (!subject && decodedCode === ENGLISH_SUBJECT_CODE) {
    await ensureEnglishContent();
    subject = await db.subject.findUnique({
      where: { code: decodedCode },
      include: { studyGuide: true },
    });
  }

  if (!subject) notFound();

  // กำหนดเนื้อหาชีตสรุป (ถ้า DB ยังไม่มี ให้ fallback ไปที่ไฟล์ชุดข้อมูลที่แพ็กเกจไว้ทันที)
  let content = subject.studyGuide?.content;
  if (!content && decodedCode === ENGLISH_SUBJECT_CODE) {
    content = ENGLISH_FUTURE_STUDY_GUIDE_MD;
  }

  const isEnglish = decodedCode === ENGLISH_SUBJECT_CODE;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackButton
          fallbackHref={`/subjects/${encodeURIComponent(subject.code)}`}
          label={`กลับวิชา ${subject.code}`}
        />
        <div className="flex flex-wrap items-center gap-2">
          <PrintGuideButton />
          {isEnglish && (
            <>
              <Button asChild size="sm" variant="outline" className="rounded-xl border-amber-300 bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                <Link href={`/subjects/${encodeURIComponent(subject.code)}/flashcards`}>
                  <Zap className="mr-1 h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  แผ่นการ์ดท่องจำ (Flashcards)
                </Link>
              </Button>
              <Button asChild size="sm" className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white">
                <Link href={`/quiz/${ENGLISH_QUESTION_SET_ID}`}>
                  <PlayCircle className="mr-1 h-3.5 w-3.5" />
                  ทำแนวข้อสอบ 20 ข้อ (มีช้อย)
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      <header className="flex items-center gap-3">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-3xl text-white shadow-soft"
          style={{ backgroundColor: subject.color }}
          aria-hidden
        >
          <NotebookPen className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-xl font-semibold md:text-2xl">
            ชีตสรุปก่อนสอบ — {localizedToString(subject.name)}
          </h1>
          <p className="text-sm text-muted-foreground">{subject.code}</p>
        </div>
      </header>

      <Card className="rounded-3xl shadow-soft">
        <CardContent className="p-5 md:p-7">
          {content ? (
            <MarkdownLite content={content} />
          ) : (
            <p className="text-sm text-muted-foreground">
              ยังไม่มีชีตสรุปสำหรับวิชานี้ — ผู้ดูแลสามารถเพิ่มได้ภายหลัง
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
