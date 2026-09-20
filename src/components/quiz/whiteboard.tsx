"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Download,
  Eraser,
  Maximize,
  Minimize,
  Pencil,
  Redo2,
  Trash2,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

/**
 * กระดานเขียนแบบ digital whiteboard สำหรับข้อเขียน (คณิต/ฟิสิกส์)
 * - ปากกา/ยางลบ, สี, ขนาด, undo/redo, ล้างกระดาน, fullscreen
 * - ทำงานด้วย pointer events รองรับเมาส์/ปากกา/stylus และสัมผัสบน tablet
 * - autosave ลง localStorage ตาม key ป้องกันงานหายเมื่อรีเฟรช
 * - export เป็น PNG เพื่อแนบไปกับคำตอบได้
 */

interface Stroke {
  color: string;
  width: number;
  erase: boolean;
  points: Array<{ x: number; y: number }>;
}

const PEN_COLORS = ["#251B2B", "#9F1239", "#E11D48", "#7C3AED", "#2563EB", "#16A34A"];

export const Whiteboard = ({
  storageKey,
  onChange,
  className,
}: {
  storageKey: string;
  onChange?: (dataUrl: string | null) => void;
  className?: string;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const redoRef = useRef<Stroke[]>([]);
  const drawingRef = useRef(false);
  const [color, setColor] = useState(PEN_COLORS[0]);
  const [width, setWidth] = useState(3);
  const [erasing, setErasing] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);

  const exportPng = (): string | null => {
    const canvas = canvasRef.current;
    if (!canvas || strokesRef.current.length === 0) return null;
    // วางบนพื้นขาวเพื่อให้ไฟล์ PNG อ่านง่ายเมื่อส่ง/ดูภายหลัง
    const out = document.createElement("canvas");
    out.width = canvas.width;
    out.height = canvas.height;
    const ctx = out.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(canvas, 0, 0);
    return out.toDataURL("image/png");
  };

  const persist = useCallback(() => {
    localStorage.setItem(`fep_wb:${storageKey}`, JSON.stringify(strokesRef.current));
    setHasStrokes(strokesRef.current.length > 0);
    onChange?.(exportPng());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onChange เปลี่ยนบ่อย ไม่ต้อง rebind
  }, [storageKey]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const stroke of strokesRef.current) {
      if (stroke.points.length === 0) continue;
      ctx.globalCompositeOperation = stroke.erase ? "destination-out" : "source-over";
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width * (stroke.erase ? 6 : 1);
      ctx.beginPath();
      const [first, ...rest] = stroke.points;
      ctx.moveTo(first.x, first.y);
      for (const p of rest) ctx.lineTo(p.x, p.y);
      if (rest.length === 0) ctx.lineTo(first.x + 0.01, first.y + 0.01);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
  }, []);

  // โหลดร่างที่ autosave ไว้
  useEffect(() => {
    const saved = localStorage.getItem(`fep_wb:${storageKey}`);
    if (saved) {
      try {
        strokesRef.current = JSON.parse(saved) as Stroke[];
        setHasStrokes(strokesRef.current.length > 0);
        requestAnimationFrame(redraw);
      } catch {
        // ข้อมูลเสียหาย เริ่มกระดานใหม่
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- โหลดครั้งเดียวต่อ storageKey
  }, [storageKey]);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    redoRef.current = [];
    strokesRef.current.push({
      color,
      width,
      erase: erasing,
      points: [pos(e)],
    });
    redraw();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const stroke = strokesRef.current[strokesRef.current.length - 1];
    stroke.points.push(pos(e));
    redraw();
  };

  const onPointerUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    persist();
  };

  const undo = () => {
    const s = strokesRef.current.pop();
    if (s) redoRef.current.push(s);
    setHasStrokes(strokesRef.current.length > 0);
    requestAnimationFrame(redraw);
    persist();
  };

  const redo = () => {
    const s = redoRef.current.pop();
    if (s) strokesRef.current.push(s);
    setHasStrokes(strokesRef.current.length > 0);
    requestAnimationFrame(redraw);
    persist();
  };

  const clear = () => {
    if (strokesRef.current.length === 0) return;
    redoRef.current = [];
    strokesRef.current = [];
    setHasStrokes(false);
    redraw();
    persist();
  };

  const download = () => {
    const dataUrl = exportPng();
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `whiteboard-${storageKey}.png`;
    a.click();
  };

  const toggleFullscreen = async () => {
    if (!fullscreen && wrapRef.current) {
      await wrapRef.current.requestFullscreen().catch(() => undefined);
      setFullscreen(true);
    } else if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => undefined);
      setFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // ปรับขนาด canvas ตาม container
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap) return;
      const data = strokesRef.current;
      canvas.width = wrap.clientWidth * 2; // คู่เพื่อความคมชัด
      canvas.height = wrap.clientHeight * 2;
      strokesRef.current = data;
      redraw();
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={wrapRef}
      className={cn(
        "flex flex-col gap-2 rounded-3xl border border-border bg-card p-3 shadow-soft",
        fullscreen && "bg-white",
        className,
      )}
      data-fullscreen={fullscreen || undefined}
    >
      <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="เครื่องมือกระดานเขียน">
        <Button
          type="button"
          variant={erasing ? "default" : "outline"}
          size="sm"
          className="rounded-xl"
          aria-pressed={erasing}
          aria-label={erasing ? "ปิดยางลบ (โหมดปากกา)" : "เปิดยางลบ"}
          onClick={() => setErasing((v) => !v)}
        >
          {erasing ? <Eraser className="h-4 w-4" aria-hidden /> : <Pencil className="h-4 w-4" aria-hidden />}
          {erasing ? "ยางลบ" : "ปากกา"}
        </Button>

        <div className="flex items-center gap-1" role="radiogroup" aria-label="เลือกสีปากกา">
          {PEN_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={color === c && !erasing}
              aria-label={`สี ${c}`}
              onClick={() => {
                setColor(c);
                setErasing(false);
              }}
              className={cn(
                "h-6 w-6 rounded-full border-2 transition-transform",
                color === c && !erasing ? "scale-110 border-foreground/60" : "border-border",
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="flex w-28 items-center gap-2">
          <span className="text-xs text-muted-foreground" id="wb-width-label">ขนาด</span>
          <Slider
            value={[width]}
            min={1}
            max={10}
            step={1}
            aria-labelledby="wb-width-label"
            onValueChange={(v) => setWidth(v[0] ?? 3)}
          />
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" className="rounded-xl" aria-label="ย้อนกลับ" onClick={undo}>
            <Undo2 className="h-4 w-4" aria-hidden />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="rounded-xl" aria-label="ทำซ้ำ" onClick={redo}>
            <Redo2 className="h-4 w-4" aria-hidden />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="rounded-xl" aria-label="ล้างกระดาน" onClick={clear}>
            <Trash2 className="h-4 w-4" aria-hidden />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="rounded-xl" aria-label="บันทึกเป็นภาพ" onClick={download}>
            <Download className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-xl"
            aria-label={fullscreen ? "ออกจากเต็มจอ" : "เต็มจอ"}
            onClick={toggleFullscreen}
          >
            {fullscreen ? <Minimize className="h-4 w-4" aria-hidden /> : <Maximize className="h-4 w-4" aria-hidden />}
          </Button>
        </div>
      </div>

      <div className="relative min-h-[260px] flex-1 overflow-hidden rounded-2xl border border-dashed border-border bg-white">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          aria-label="พื้นที่เขียนวิธีทำ"
        />
        {!hasStrokes && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            เขียนวิธีทำด้วยเมาส์ ปากกา หรือนิ้วได้เลย
          </p>
        )}
      </div>
    </div>
  );
};
