"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * PDF viewer — โหลดเอนจิน pdf.js (UMD build) จาก CDN ตรง ๆ
 * (ไม่ผ่าน bundler เพื่อเลี่ยงปัญหา dynamic import ของ Turbopack/webpack)
 * จำตำแหน่งหน้าล่าสุดผ่าน onPageChange + ปรับขนาด/ซูมได้ ทุกอุปกรณ์
 */

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

const PDFJS_VERSION = "3.11.174";
const PDFJS_SRC = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;
const PDFJS_WORKER = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;

let pdfJsPromise: Promise<any> | null = null;

/** โหลด pdf.js จาก CDN ครั้งเดียวแล้วใช้ซ้ำ (คืน window.pdfjsLib) */
function loadPdfJs(): Promise<any> {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (!pdfJsPromise) {
    pdfJsPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = PDFJS_SRC;
      script.onload = () => {
        if (window.pdfjsLib) resolve(window.pdfjsLib);
        else reject(new Error("pdf.js โหลดแล้วแต่ไม่พบตัวไลบรารี"));
      };
      script.onerror = () => reject(new Error("โหลด PDF engine จาก CDN ไม่สำเร็จ (ตรวจอินเทอร์เน็ต)"));
      document.head.appendChild(script);
    });
  }
  return pdfJsPromise;
}

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
  const renderTaskRef = useRef<any>(null);
  const docRef = useRef<any>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoomState] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pdfRef = useRef<any>(null);

  // โหลดเอกสาร (ทน StrictMode: ทุก effect run ทำงานเต็มรอบ, ตัวที่ถูกยกเลิกจะทิ้งผลเอง)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const pdfjs = await loadPdfJs();
        if (cancelled) return;
        pdfRef.current = pdfjs;
        pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
        const loadingTask = pdfjs.getDocument({ url: fileUrl });
        const doc = await loadingTask.promise;
        if (cancelled) return;
        docRef.current = doc;
        setTotalPages(doc.numPages);
        onLoadInfo?.(doc.numPages);
        setLoading(false);
        const start = Math.min(Math.max(initialPage ?? 1, 1), doc.numPages);
        if (start !== page) onPageChange(start, doc.numPages);
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error && e.message.includes("CDN")
              ? e.message
              : "ไม่สามารถเปิดไฟล์ PDF นี้ได้",
          );
          setLoading(false);
          console.error(e);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- โหลดครั้งเดียวต่อไฟล์
  }, [fileUrl]);

  // เรนเดอร์หน้าปัจจุบัน — ขนาดพอดี: จอใหญ่จำกัดไม่เกิน 660px กลางจอ, จอเล็กเต็มความกว้าง, ซูมได้
  const renderPage = useCallback(
    async (n: number, zoom: number) => {
      const canvas = canvasRef.current;
      const pdfjs = pdfRef.current;
      const doc = docRef.current;
      if (!canvas || !pdfjs || !doc) return;
      try {
        const p = await doc.getPage(Math.min(Math.max(n, 1), doc.numPages));
        const wrap = canvas.parentElement!;
        const targetW = Math.min(wrap.clientWidth, 660) * zoom;
        const scale = Math.max(0.5, Math.min(3, targetW / 620));
        const viewport = p.getViewport({ scale: scale * 2 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${targetW}px`;
        canvas.style.height = "auto";
        renderTaskRef.current?.cancel();
        const task = p.render({
          canvasContext: canvas.getContext("2d")!,
          viewport,
        });
        renderTaskRef.current = task;
        await task.promise.catch(() => undefined);
      } catch {
        // เปลี่ยนหน้า/ซูมเร็ว ๆ แล้ว render ถูกยกเลิก — ข้าม
      }
    },
    [],
  );

  useEffect(() => {
    if (!totalPages) return;
    renderPage(page, zoom);
  }, [page, totalPages, zoom, renderPage]);

  // คงขนาดที่ถูกต้องเมื่อจอเปลี่ยนขนาด (หมุนจอ/ย่อขยายหน้าต่าง)
  useEffect(() => {
    if (!totalPages) return;
    let t: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(() => renderPage(page, zoom), 250);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(t);
    };
  }, [page, totalPages, zoom, renderPage]);

  const setZoom = (z: number) =>
    setZoomState(Math.min(2.5, Math.max(0.5, Math.round(z * 10) / 10)));

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
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-card px-3 py-2 shadow-soft">
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
        <div className="flex items-center gap-1" role="group" aria-label="ซูมเอกสาร">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-xl"
            aria-label="ซูมออก"
            onClick={() => setZoom(zoom - 0.2)}
            disabled={zoom <= 0.6}
          >
            −
          </Button>
          <button
            type="button"
            className="min-w-12 rounded-xl px-1 text-xs text-muted-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring"
            onClick={() => setZoom(1)}
            aria-label="ซูมกลับขนาดพอดี"
            title="ซูมกลับขนาดพอดี"
          >
            {Math.round(zoom * 100)}%
          </button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-xl"
            aria-label="ซูมเข้า"
            onClick={() => setZoom(zoom + 0.2)}
            disabled={zoom >= 2.4}
          >
            +
          </Button>
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
          className={loading || error ? "hidden" : "mx-auto block rounded-xl"}
          aria-label="หน้าเอกสาร PDF"
        />
      </div>
    </div>
  );
};
