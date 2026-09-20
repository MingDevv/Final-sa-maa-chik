"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  Highlighter,
  NotebookPen,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PdfViewer } from "@/components/study/pdf-viewer";

interface BookmarkItem {
  id: string;
  page: number;
  label: string | null;
}
interface NoteItem {
  id: string;
  page: number;
  content: string;
}
interface HighlightItem {
  id: string;
  page: number;
  color: string;
  note: string | null;
}

/** พื้นที่อ่านชีท: PDF viewer + sidebar (บุ๊กมาร์ก/ไฮไลต์/โน้ต) + บันทึกหน้าล่าสุดอัตโนมัติ */
export function StudyWorkspace({
  isAdmin = false,
  documentId,
  fileUrl,
  initialPage,
  initialBookmarks,
  initialNotes,
  initialHighlights,
}: {
  isAdmin?: boolean;
  documentId: string;
  fileUrl: string;
  initialPage: number;
  initialBookmarks: BookmarkItem[];
  initialNotes: NoteItem[];
  initialHighlights: HighlightItem[];
}) {
  const router = useRouter();
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [notes, setNotes] = useState(initialNotes);
  const [highlights, setHighlights] = useState(initialHighlights);
  const [noteDraft, setNoteDraft] = useState("");
  const [creatingSet, setCreatingSet] = useState(false);
  const readSecondsRef = useRef(0);

  // บันทึกหน้าล่าสุดทุกครั้งที่เปลี่ยนหน้า
  const saveProgress = useCallback(
    (lastPage: number, readSeconds: number) => {
      fetch(`/api/documents/${documentId}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastPage, readSeconds }),
      }).catch(() => undefined);
    },
    [documentId],
  );

  const onPageChange = useCallback(
    (p: number, total: number) => {
      setPage(p);
      setTotalPages(total);
      saveProgress(p, 0);
    },
    [saveProgress],
  );

  // นับเวลาอ่าน ส่งทุก 60 วินาที
  useEffect(() => {
    const t = setInterval(() => {
      readSecondsRef.current += 15;
      if (readSecondsRef.current >= 60) {
        saveProgress(page, readSecondsRef.current);
        readSecondsRef.current = 0;
      }
    }, 15000);
    return () => clearInterval(t);
  }, [page, saveProgress]);

  const addBookmark = async () => {
    const res = await fetch(`/api/documents/${documentId}/annotations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookmark: { page, label: `หน้า ${page}` } }),
    });
    const json = await res.json();
    if (json.ok) {
      setBookmarks((b) =>
        [...b, { id: json.data.id, page, label: `หน้า ${page}` }].sort((x, y) => x.page - y.page),
      );
      toast.success(`บุ๊กมาร์กหน้า ${page} แล้ว`);
    }
  };

  const addHighlight = async () => {
    const res = await fetch(`/api/documents/${documentId}/annotations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ highlight: { page, note: null } }),
    });
    const json = await res.json();
    if (json.ok) {
      setHighlights((h) => [
        { id: json.data.id, page, color: "#E11D48", note: null },
        ...h,
      ]);
      toast.success(`ไฮไลต์หน้า ${page} แล้ว`);
    }
  };

  const addNote = async () => {
    const content = noteDraft.trim();
    if (!content) return;
    const res = await fetch(`/api/documents/${documentId}/annotations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: { page, content } }),
    });
    const json = await res.json();
    if (json.ok) {
      setNotes((n) => [{ id: json.data.id, page, content }, ...n]);
      setNoteDraft("");
      toast.success("บันทึกโน้ตแล้ว");
    }
  };

  const removeAnnotation = async (type: "bookmark" | "highlight" | "note", id: string) => {
    const res = await fetch(`/api/documents/${documentId}/annotations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ remove: { type, id } }),
    });
    const json = await res.json();
    if (json.ok) {
      if (type === "bookmark") setBookmarks((b) => b.filter((x) => x.id !== id));
      if (type === "highlight") setHighlights((h) => h.filter((x) => x.id !== id));
      if (type === "note") setNotes((n) => n.filter((x) => x.id !== id));
    }
  };

  /** workflow สร้างชุดฝึกจากหัวข้อนี้ → เป็น "ฉบับร่าง" ให้ผู้ดูแลตรวจและเผยแพร่ก่อนใช้จริง */
  const createDraftSet = async () => {
    setCreatingSet(true);
    try {
      const res = await fetch(`/api/admin/documents/${documentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success(
          "สร้างชุดฝึกฉบับร่างแล้ว — ผู้ดูแลจะเพิ่มโจทย์จากเนื้อหาอ้างอิงและเผยแพร่ก่อนใช้งานจริง",
        );
        router.push("/admin?tab=sets");
      } else {
        toast.error(json.error ?? "สร้างชุดฝึกไม่สำเร็จ");
      }
    } finally {
      setCreatingSet(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
      <PdfViewer
        fileUrl={fileUrl}
        initialPage={initialPage}
        page={page}
        onPageChange={onPageChange}
        onLoadInfo={setTotalPages}
      />

      <aside className="flex flex-col gap-3" aria-label="เครื่องมือประกอบการอ่าน">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" className="rounded-2xl" onClick={addBookmark}>
            <Bookmark className="mr-1 h-4 w-4" aria-hidden /> บุ๊กมาร์ก
          </Button>
          <Button variant="secondary" size="sm" className="rounded-2xl" onClick={addHighlight}>
            <Highlighter className="mr-1 h-4 w-4" aria-hidden /> ไฮไลต์
          </Button>
          {isAdmin && (
            <Button
              variant="secondary"
              size="sm"
              className="rounded-2xl"
              onClick={createDraftSet}
              disabled={creatingSet}
              title="สร้างชุดฝึกฉบับร่างจากหัวข้อนี้ (ผู้ดูแลตรวจและเผยแพร่ก่อนใช้จริง)"
            >
              <Sparkles className="mr-1 h-4 w-4" aria-hidden />
              {creatingSet ? "กำลังสร้าง..." : "สร้างชุดฝึก"}
            </Button>
          )}
        </div>

        <Tabs defaultValue="notes" className="rounded-3xl border border-border bg-card shadow-soft">
          <TabsList className="mx-2 mt-2 grid grid-cols-3 rounded-2xl">
            <TabsTrigger value="notes" className="rounded-xl">
              <NotebookPen className="mr-1 h-4 w-4" aria-hidden /> โน้ต
            </TabsTrigger>
            <TabsTrigger value="bookmarks" className="rounded-xl">บุ๊กมาร์ก</TabsTrigger>
            <TabsTrigger value="highlights" className="rounded-xl">ไฮไลต์</TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="flex flex-col gap-2 px-3 pb-3">
            <Textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder={`เขียนโน้ตประกอบหน้า ${page}...`}
              aria-label="โน้ตส่วนตัว"
              rows={3}
              className="rounded-2xl"
            />
            <Button size="sm" className="rounded-2xl" onClick={addNote} disabled={!noteDraft.trim()}>
              บันทึกโน้ตหน้า {page}
            </Button>
            <ScrollArea className="h-56">
              <ul className="flex flex-col gap-2 pr-2">
                {notes.length === 0 && (
                  <li className="py-4 text-center text-xs text-muted-foreground">ยังไม่มีโน้ต</li>
                )}
                {notes.map((n) => (
                  <li key={n.id} className="rounded-2xl bg-muted/60 p-2 text-sm">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        className="text-xs font-medium text-wine underline-offset-2 hover:underline dark:text-primary"
                        onClick={() => onPageChange(n.page, totalPages)}
                      >
                        หน้า {n.page}
                      </button>
                      <button
                        type="button"
                        aria-label="ลบโน้ต"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => removeAnnotation("note", n.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap">{n.content}</p>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="bookmarks" className="px-3 pb-3">
            <ScrollArea className="h-64">
              <ul className="flex flex-col gap-2 pr-2">
                {bookmarks.length === 0 && (
                  <li className="py-4 text-center text-xs text-muted-foreground">ยังไม่มีบุ๊กมาร์ก</li>
                )}
                {bookmarks.map((b) => (
                  <li key={b.id} className="flex items-center justify-between rounded-2xl bg-muted/60 px-2 py-1.5 text-sm">
                    <button
                      type="button"
                      className="font-medium text-wine underline-offset-2 hover:underline dark:text-primary"
                      onClick={() => onPageChange(b.page, totalPages)}
                    >
                      หน้า {b.page}
                    </button>
                    <button
                      type="button"
                      aria-label="ลบบุ๊กมาร์ก"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeAnnotation("bookmark", b.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="highlights" className="px-3 pb-3">
            <ScrollArea className="h-64">
              <ul className="flex flex-col gap-2 pr-2">
                {highlights.length === 0 && (
                  <li className="py-4 text-center text-xs text-muted-foreground">ยังไม่มีไฮไลต์</li>
                )}
                {highlights.map((h) => (
                  <li key={h.id} className="flex items-center justify-between rounded-2xl bg-muted/60 px-2 py-1.5 text-sm">
                    <button
                      type="button"
                      className="flex items-center gap-2 font-medium underline-offset-2 hover:underline"
                      onClick={() => onPageChange(h.page, totalPages)}
                    >
                      <span
                        className="inline-block h-4 w-4 rounded-full"
                        style={{ backgroundColor: h.color }}
                        aria-hidden
                      />
                      หน้า {h.page}
                    </button>
                    <button
                      type="button"
                      aria-label="ลบไฮไลต์"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeAnnotation("highlight", h.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <p className="rounded-2xl bg-soft-pink/60 p-3 text-xs leading-relaxed text-wine dark:bg-secondary dark:text-primary">
          หมายเหตุ: เนื้อหาในชีทเป็นข้อมูลอ้างอิงสำหรับการเรียนเท่านั้น —
          &ldquo;สร้างชุดฝึก&rdquo; จะสร้างชุดฉบับร่างให้ผู้ดูแลเพิ่มโจทย์จากข้อมูลในเอกสารเท่านั้น
          และตรวจก่อนเผยแพร่ (ระบบไม่เดาโจทย์เอง)
        </p>
      </aside>
    </div>
  );
}
