"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * PDF viewer ด้วย pdf.js — จำตำแหน่งหน้าล่าสุดผ่าน prop onLastPage
 * รองรับ keyboard (ซ้าย/ขวา) และปุ่มเลื่อนหน้า บนมือถือ/แท็บเล็ต
 */
export const PdfViewer = ({
  fileUrl,
  initialPage,
  page,
  onPageChange,
  onLoadInfo,
  className,
}: {
  fileUrl: string;
  initialPage?: number;
  page: number;
  onPageChange: (page: number, totalPages: number) => void;
  onLoadInfo?: (totalPages: number) => void;
  className?: string;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loadingTaskRef = useRef<import("pdfjs-dist").PDFDocumentLoadingTask | null>(null);
  const renderTaskRef = useRef<ReturnType<import("pdfjs-dist").PDFPageProxy["render"]> | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  // โหลดเอกสาร
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    let cancelled = false;

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        const loadingTask = pdfjs.getDocument({ url: fileUrl });
        loadingTaskRef.current = loadingTask;
        const doc = await loadingTask.promise;
        if (cancelled) return;
        setTotalPages(doc.numPages);
        onLoadInfo?.(doc.numPages);

        const start = Math.min(Math.max(initialPage ?? 1, 1), doc.numPages);
        if (start !== page) onPageChange(start, doc.numPages);
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError("ไม่สามารถเปิดไฟล์ PDF นี้ได้");
          setLoading(false);
          console.error(e);
        }
      }
    })();

    return () => {
      cancelled = true;
      loadingTaskRef.current?.destroy().catch(() => undefined);
      loadingTaskRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl]);

  // เรนเดอร์หน้าปัจจุบัน
  const renderPage = useCallback(async (n: number) => {
    const canvas = canvasRef.current;
    const loadingTask = loadingTaskRef.current;
    if (!canvas || !loadingTask || loadingTask.destroyed) return;
    const doc = await loadingTask.promise.catch(() => null);
    if (!doc) return;
    const p = await doc.getPage(Math.min(Math.max(n, 1), doc.numPages));
    const wrap = canvas.parentElement!;
    const scale = Math.max(1, Math.min(2.5, wrap.clientWidth / 620));
    const viewport = p.getViewport({ scale: scale * 2 });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.width = `${wrap.clientWidth}px`;
    canvas.style.height = "auto";
    void dpr;
    renderTaskRef.current?.cancel();
    const task = p.render({ canvas, viewport });
    renderTaskRef.current = task;
    try {
      await task.promise;
    } catch {
      // ถูก cancel เพราะเปลี่ยนหน้าเร็ว — ไม่ต้องทำอะไร
    }
  }, []);

  useEffect(() => {
    if (!totalPages) return;
    renderPage(page);
  }, [page, totalPages, renderPage]);

  const go = (n: number) => {
    if (n >= 1 && n <= totalPages && n !== page) onPageChange(n, totalPages);
  };

  // keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") go(page + 1);
      if (e.key === "ArrowLeft" || e.key === "PageUp") go(page - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, totalPages]);

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-card px-3 py-2 shadow-soft">
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl"
          disabled={page <= 1}
          onClick={() => go(page - 1)}
          aria-label="หน้าก่อนหน้า"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden /> ก่อนหน้า
        </Button>
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="pdf-page" className="sr-only">ไปที่หน้า</label>
          <input
            id="pdf-page"
            type="number"
            min={1}
            max={totalPages || 1}
            value={page}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n)) go(n);
            }}
            className="w-16 rounded-xl border border-input bg-background px-2 py-1 text-center"
            aria-label="หน้าปัจจุบัน"
          />
          <span className="text-muted-foreground">/ {totalPages || "–"}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl"
          disabled={totalPages > 0 && page >= totalPages}
          onClick={() => go(page + 1)}
          aria-label="หน้าถัดไป"
        >
          ถัดไป <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      <div className="mt-3 flex justify-center overflow-auto rounded-2xl border border-border bg-card p-2 shadow-soft">
        {loading && <p className="p-8 text-sm text-muted-foreground">กำลังเปิดชีท...</p>}
        {error && (
          <p className="p-8 text-sm text-destructive" role="alert">{error}</p>
        )}
        <canvas
          ref={canvasRef}
          className={loading || error ? "hidden" : "block rounded-xl"}
          aria-label="หน้าเอกสาร PDF"
        />
      </div>
    </div>
  );
};
