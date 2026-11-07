import { notFound } from "next/navigation";
import { FileText, NotebookPen } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubjectContent } from "@/components/subject/subject-content";
import { subjectService } from "@/server/services/subject-service";
import { questionSetService } from "@/server/services/question-set-service";
import { documentService } from "@/server/services/document-service";

export const dynamic = "force-dynamic";

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const subject = await subjectService.getSubjectByCode(decodeURIComponent(code));
  if (!subject) notFound();

  const [sets, documents] = await Promise.all([
    questionSetService.listPublished({ subjectId: subject.id }),
    documentService.listForSubject(subject.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="-mb-2">
        <BackButton fallbackHref="/" label="ย้อนกลับหน้าแรก" />
      </div>

      {/* หัววิชา: ชื่อก่อน แล้วค่อยปุ่มชีตสรุปทางขวา (มือถือจะลงมาอยู่ใต้ชื่อ) */}
      <header className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span
            className="subject-icon flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
            style={{ "--sc": subject.color } as React.CSSProperties}
            aria-hidden
          >
            <FileText className="h-7 w-7" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold leading-tight">{subject.name}</h1>
              {subject.status === "ARCHIVED" && (
                <Badge variant="secondary" className="rounded-full">ชุดเก่า — คลังข้อสอบที่ผ่านมา</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{subject.code}</p>
          </div>
        </div>
        <Link
          href={`/study-guide/${encodeURIComponent(subject.code)}`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <NotebookPen className="h-4 w-4" aria-hidden /> อ่านชีตสรุปก่อนสอบ
        </Link>
      </header>

      <SubjectContent
        topics={subject.topics.map((t) => ({ id: t.id, title: t.title }))}
        sets={sets.map((s) => ({
          id: s.id,
          title: s.title,
          topicId: s.topicId ?? null,
          topicTitle: s.topicTitle,
          difficulty: s.difficulty,
          recommendedMinutes: s.recommendedMinutes,
          questionCount: s.questionCount,
        }))}
      />

      <section aria-label="ชีทและเอกสาร" className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">
          <FileText className="mr-1 inline h-5 w-5 text-purple-brand" aria-hidden /> ชีทและเอกสาร
        </h2>
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">ยังไม่มีชีทในวิชานี้</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((d) => (
              <Link
                key={d.id}
                href={`/study/${d.id}`}
                className="lift rounded-3xl focus-visible:outline-2 focus-visible:outline-ring"
              >
                <Card className="h-full rounded-3xl shadow-soft hover:shadow-soft-lg">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-sm font-medium">{d.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">
                    {d.topicTitle ? `${d.topicTitle} · ` : ""}
                    {d.pageCount ?? "?"} หน้า
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
