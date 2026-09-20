import { notFound } from "next/navigation";
import Link from "next/link";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { ArrowLeft } from "lucide-react";
import { ADMIN_COOKIE } from "@/server/api-helpers";
import { Button } from "@/components/ui/button";
import { documentService } from "@/server/services/document-service";
import { getReadOnlySession } from "@/server/read-session";
import { StudyWorkspace } from "@/components/study/study-workspace";

export const dynamic = "force-dynamic";

export default async function StudyPage({
  params,
}: {
  params: Promise<{ docId: string }>;
}) {
  const { docId } = await params;
  const [doc, session, cookieStore] = await Promise.all([
    documentService.getDocument(docId),
    getReadOnlySession(),
    cookies(),
  ]);
  if (!doc) notFound();
  const expectedAdmin = createHash("sha256")
    .update(process.env.ADMIN_CODE ?? "Ming888")
    .digest("hex");
  const isAdmin = cookieStore.get(ADMIN_COOKIE)?.value === expectedAdmin;

  const [progress, annotations] = await Promise.all([
    documentService.getProgress(session.ownerKey, doc.id),
    documentService.listAnnotations(session.ownerKey, doc.id),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="rounded-xl">
          <Link href={`/subjects/${encodeURIComponent(doc.subjectCode)}`}>
            <ArrowLeft className="h-4 w-4" aria-hidden /> กลับวิชา {doc.subjectCode}
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold md:text-xl">{doc.title}</h1>
          <p className="text-xs text-muted-foreground">
            {doc.subjectName}
            {doc.topicTitle ? ` · ${doc.topicTitle}` : ""}
            {doc.pageCount ? ` · ${doc.pageCount} หน้า` : ""}
          </p>
        </div>
      </div>

      <StudyWorkspace
        isAdmin={isAdmin}
        documentId={doc.id}
        fileUrl={doc.fileUrl}
        initialPage={progress?.lastPage ?? 1}
        initialBookmarks={annotations.bookmarks.map((b) => ({
          id: b.id,
          page: b.page,
          label: b.label ?? null,
        }))}
        initialNotes={annotations.notes.map((n) => ({
          id: n.id,
          page: n.page,
          content: n.content,
        }))}
        initialHighlights={annotations.highlights.map((h) => ({
          id: h.id,
          page: h.page,
          color: h.color,
          note: h.note ?? null,
        }))}
      />
    </div>
  );
}
