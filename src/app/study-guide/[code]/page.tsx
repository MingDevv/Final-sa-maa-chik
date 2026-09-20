import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, NotebookPen } from "lucide-react";
import { db } from "@/lib/db";
import { localizedToString } from "@/lib/types";
import { MarkdownLite } from "@/components/study-guide/markdown-lite";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

/** หน้าชีตสรุปก่อนสอบของแต่ละวิชา — เนื้อหาจากฐานข้อมูล (ตาราง study_guides) */
export default async function StudyGuidePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const subject = await db.subject.findUnique({
    where: { code: decodeURIComponent(code) },
    include: { studyGuide: true },
  });
  if (!subject) notFound();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/subjects/${encodeURIComponent(subject.code)}`}
          className="flex items-center gap-1 rounded-xl px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-secondary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> กลับวิชา {subject.code}
        </Link>
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
          {subject.studyGuide ? (
            <MarkdownLite content={subject.studyGuide.content} />
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
