import { notFound } from "next/navigation";
import { NotebookPen } from "lucide-react";
import { BackButton } from "@/components/back-button";
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
        <BackButton
          fallbackHref={`/subjects/${encodeURIComponent(subject.code)}`}
          label={`กลับวิชา ${subject.code}`}
        />
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
