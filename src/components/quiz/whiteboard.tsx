"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Download,
  Eraser,
  Grid3x3,
  Highlighter,
  Maximize,
  Minimize,
  Pencil,
  PenLine,
  Redo2,
  Trash2,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

/**
 * กระดาษทด v2 — stroke model (Goodnotes-style)
 * - เก็บ strokes เป็น model ลบ stroke ออกจาก model โดยตรง (ไม่ใช้ destination-out → ไม่มีแผ่นดำ/โปร่งใส)
 * - canvas logical coordinate คงที่ (1000×700 หน่วย) resize/fullscreen แล้ว re-render จาก model ไม่บิดภาพ
 * - template พื้นกระดาษ: เปล่า / เส้นบรรทัด / ตาราง / จุด / กราฟ — วาดใต้ stroke พื้นครีมทึบเสมอ
 * - ปากกา / ไฮไลต์โปร่งใส / ยางลบ (Shift+ลาก ได้) / undo-redo / fullscreen / export flatten พื้นขาว
 * - autosave debounce + แสดงเวลา "บันทึกแล้ว" + กู้คืนหลัง refresh
 */

type Tool = "pen" | "highlighter" | "eraser";
type Template = "blank" | "lined" | "grid" | "dots" | "graph";

interface Point {
  x: number;
  y: number;
}
interface Stroke {
  id: string;
  tool: Tool;
  color: string;
  width: number;
  opacity: number;
  points: Point[];
}
interface Serialized {
  strokes: Stroke[];
  template: Template;
}

const LOGICAL_W = 1000;
const LOGICAL_H = 700;
const PEN_COLORS = ["#1E3A8A", "#251B2B", "#9F1239", "#16A34A", "#7C3AED"];
const HIGHLIGHT_COLOR = "#FDE047";

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
  const activeRef = useRef<Stroke | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const [tool, setTool] = useState<Tool>("pen");
  const [erasingTick, setErasingTick] = useState(0);
  const erasingRef = useRef(false);
  const [color, setColor] = useState(PEN_COLORS[0]);
  const [width, setWidth] = useState(3);
  const [template, setTemplate] = useState<Template>("grid");
  const [fullscreenTick, setFullscreenTick] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [hasContent, setHasContent] = useState(false);

  /** วาดพื้นกระดาษ template (ครีมทึบ + เส้น) */
  const drawTemplate = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = "#FFFDF7";
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
      ctx.lineWidth = 1;
      if (template === "lined") {
        ctx.strokeStyle = "#D8CBE3";
        ctx.beginPath();
        for (let y = 70; y < LOGICAL_H; y += 46) {
          ctx.moveTo(24, y);
          ctx.lineTo(LOGICAL_W - 24, y);
        }
        ctx.stroke();
      } else if (template === "grid" || template === "graph") {
        ctx.strokeStyle = "#E3D6EE";
        ctx.beginPath();
        for (let x = 0; x <= LOGICAL_W; x += 40) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, LOGICAL_H);
        }
        for (let y = 0; y <= LOGICAL_H; y += 40) {
          ctx.moveTo(0, y);
          ctx.lineTo(LOGICAL_W, y);
        }
        ctx.stroke();
        if (template === "graph") {
          ctx.strokeStyle = "#C9A0B8";
          ctx.beginPath();
          for (let x = 0; x <= LOGICAL_W; x += 200) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, LOGICAL_H);
          }
          for (let y = 0; y <= LOGICAL_H; y += 200) {
            ctx.moveTo(0, y);
            ctx.lineTo(LOGICAL_W, y);
          }
          ctx.stroke();
        }
      } else if (template === "dots") {
        ctx.fillStyle = "#C4A9DC";
        for (let x = 40; x < LOGICAL_W; x += 40) {
          for (let y = 40; y < LOGICAL_H; y += 40) {
            ctx.beginPath();
            ctx.arc(x, y, 1.6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    },
    [template],
  );

  /** วาด stroke เดียว (logical coordinate) — ไฮไลต์วาดก่อนปากกาเพื่อให้ปากกาทับ */
  const paintStroke = useCallback((ctx: CanvasRenderingContext2D, s: Stroke) => {
    if (s.points.length === 0) return;
    ctx.globalAlpha = s.opacity;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    const [first, ...rest] = s.points;
    ctx.moveTo(first.x, first.y);
    if (rest.length === 0) ctx.lineTo(first.x + 0.1, first.y + 0.1);
    for (const p of rest) ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }, []);

  /** re-render ทั้งกระดาษ: template → ไฮไลต์ → ปากกา (ตามลำดับ layer) */
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawTemplate(ctx);
    const highlighters = strokesRef.current.filter((s) => s.tool === "highlighter");
    const pens = strokesRef.current.filter((s) => s.tool !== "highlighter");
    for (const s of highlighters) paintStroke(ctx, s);
    for (const s of pens) paintStroke(ctx, s);
    if (activeRef.current) paintStroke(ctx, activeRef.current);
  }, [drawTemplate]);

  /** fit canvas = กว้างเท่า container สูงตามสัดส่วน logical — logical coordinate คงที่ */
  const fitCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    canvas.width = wrap.clientWidth * 2;
    canvas.height = Math.round(wrap.clientWidth * 2 * (LOGICAL_H / LOGICAL_W));
    canvas.style.width = `${wrap.clientWidth}px`;
    canvas.style.height = "auto";
    redraw();
  }, [redraw]);

  // โหลดร่างจาก localStorage (restore หลัง refresh)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`fep_wb2:${storageKey}`);
      if (raw) {
        const data = JSON.parse(raw) as Serialized;
        strokesRef.current = Array.isArray(data.strokes) ? data.strokes : [];
        // eslint-disable-next-line react-hooks/set-state-in-effect -- restore ร่างจาก localStorage ตอน mount
        if (data.template) setTemplate(data.template);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- อัปเดตสถานะหลัง restore
        setHasContent(strokesRef.current.length > 0);
      }
    } catch {
      /* เริ่มกระดาษใหม่ */
    }
  }, [storageKey]);

  useEffect(() => {
    const t = setTimeout(() => fitCanvas(), 60);
    window.addEventListener("resize", fitCanvas);
    document.addEventListener("fullscreenchange", fitCanvas);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", fitCanvas);
      document.removeEventListener("fullscreenchange", fitCanvas);
    };
  }, [fitCanvas]);

  const exportPng = (): string | null => {
    const canvas = canvasRef.current;
    if (!canvas || strokesRef.current.length === 0) return null;
    const out = document.createElement("canvas");
    out.width = canvas.width;
    out.height = canvas.height;
    const ctx = out.getContext("2d")!;
    // flatten บนพื้นครีมทึบ — export ไปแอปอื่นไม่มี transparency กลายเป็นดำ
    ctx.fillStyle = "#FFFDF7";
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(canvas, 0, 0);
    return out.toDataURL("image/png");
  };

  const persist = useCallback(() => {
    const data: Serialized = { strokes: strokesRef.current, template };
    try {
      localStorage.setItem(`fep_wb2:${storageKey}`, JSON.stringify(data));
    } catch {
      /* พื้นที่เต็ม — ข้าม */
    }
    setHasContent(strokesRef.current.length > 0);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setSavedAt(new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }));
      onChange?.(exportPng());
    }, 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onChange เปลี่ยนบ่อย เข้าถึงผ่าน closure
  }, [storageKey, template]);

  const toLogical = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * LOGICAL_W,
      y: ((e.clientY - rect.top) / rect.height) * LOGICAL_H,
    };
  };

  /** ยางลบแบบลบ stroke: ตัด stroke ที่มีจุดใกล้ปลายยางออกจาก model */
  const eraseAt = (pt: Point) => {
    const threshold = 14;
    const before = strokesRef.current.length;
    strokesRef.current = strokesRef.current.filter(
      (s) => !s.points.some((p) => Math.hypot(p.x - pt.x, p.y - pt.y) < threshold),
    );
    if (strokesRef.current.length !== before) {
      redoRef.current = [];
      redraw();
    }
  };

  const isErasing = (e: React.PointerEvent) =>
    erasingRef.current || e.buttons === 2 || e.shiftKey;

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = toLogical(e);
    if (isErasing(e)) {
      eraseAt(pt);
      return;
    }
    const pressure = e.pressure > 0 && e.pressure !== 0.5 ? 0.6 + e.pressure * 0.8 : 1;
    const w = tool === "highlighter" ? width * 5 : width * pressure;
    activeRef.current = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tool,
      color: tool === "highlighter" ? HIGHLIGHT_COLOR : color,
      width: w,
      opacity: tool === "highlighter" ? 0.32 : 1,
      points: [pt],
    };
    redraw();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pt = toLogical(e);
    if (isErasing(e)) {
      eraseAt(pt);
      return;
    }
    if (activeRef.current && e.buttons > 0) {
      const last = activeRef.current.points[activeRef.current.points.length - 1];
      if (Math.hypot(pt.x - last.x, pt.y - last.y) > 1.5) {
        activeRef.current.points.push(pt);
        redraw();
      }
    }
  };

  const onPointerUp = () => {
    if (activeRef.current) {
      const s = activeRef.current;
      if (s.points.length > 0) {
        strokesRef.current.push(s);
        redoRef.current = [];
      }
      activeRef.current = null;
      redraw();
      persist();
    }
  };

  const undo = () => {
    const s = strokesRef.current.pop();
    if (s) redoRef.current.push(s);
    redraw();
    persist();
  };
  const redo = () => {
    const s = redoRef.current.pop();
    if (s) strokesRef.current.push(s);
    redraw();
    persist();
  };
  const clear = () => {
    if (strokesRef.current.length === 0) return;
    redoRef.current = [];
    strokesRef.current = [];
    redraw();
    persist();
  };
  const download = () => {
    const dataUrl = (() => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const out = document.createElement("canvas");
      out.width = canvas.width;
      out.height = canvas.height;
      const ctx = out.getContext("2d")!;
      ctx.fillStyle = "#FFFDF7";
      ctx.fillRect(0, 0, out.width, out.height);
      ctx.drawImage(canvas, 0, 0);
      return out.toDataURL("image/png");
    })();
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `scratch-${storageKey.replace(/[^\w-]/g, "_")}.png`;
    a.click();
  };
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement && wrapRef.current) {
      await wrapRef.current.requestFullscreen().catch(() => undefined);
    } else if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => undefined);
    }
  };

  const TEMPLATES: { id: Template; label: string }[] = [
    { id: "blank", label: "เปล่า" },
    { id: "lined", label: "เส้น" },
    { id: "grid", label: "ตาราง" },
    { id: "dots", label: "จุด" },
    { id: "graph", label: "กราฟ" },
  ];

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="เครื่องมือกระดาษทด">
        <Button
          type="button"
          variant={tool === "pen" ? "default" : "outline"}
          size="sm"
          className="rounded-xl"
          aria-pressed={tool === "pen"}
          onClick={() => setTool("pen")}
        >
          <Pencil className="h-4 w-4" aria-hidden /> ปากกา
        </Button>
        <Button
          type="button"
          variant={tool === "highlighter" ? "default" : "outline"}
          size="sm"
          className="rounded-xl"
          aria-pressed={tool === "highlighter"}
          onClick={() => setTool("highlighter")}
        >
          <Highlighter className="h-4 w-4" aria-hidden /> ไฮไลต์
        </Button>
        <Button
          type="button"
          variant={erasingTick % 2 === 1 ? "default" : "outline"}
          size="sm"
          className="rounded-xl"
          aria-pressed={erasingTick % 2 === 1}
          onClick={() => {
            erasingRef.current = !erasingRef.current;
            setErasingTick((t) => t + 1);
          }}
        >
          <Eraser className="h-4 w-4" aria-hidden /> ยางลบ
        </Button>

        {tool !== "eraser" && (
          <div className="flex items-center gap-1" role="radiogroup" aria-label="สีปากกา">
            {PEN_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={color === c}
                aria-label={`สีปากกา ${c}`}
                onClick={() => {
                  setColor(c);
                  setTool("pen");
                }}
                className={cn(
                  "h-6 w-6 rounded-full border-2 transition-transform",
                  color === c ? "scale-110 border-foreground/60" : "border-border",
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}

        <div className="flex w-20 items-center gap-2">
          <span className="text-xs text-muted-foreground" id={`wb2-w-${storageKey.replace(/[^\w]/g, "")}`}>
            ขนาด
          </span>
          <Slider
            value={[width]}
            min={1}
            max={8}
            step={1}
            aria-labelledby={`wb2-w-${storageKey.replace(/[^\w]/g, "")}`}
            onValueChange={(v) => setWidth(v[0] ?? 3)}
          />
        </div>

        <div className="flex items-center gap-1" role="radiogroup" aria-label="พื้นกระดาษ">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={template === t.id}
              aria-label={`พื้นกระดาษแบบ${t.label}`}
              title={`พื้นแบบ${t.label}`}
              onClick={() => setTemplate(t.id)}
              className={cn(
                "flex h-7 items-center rounded-lg border px-2 text-[10px] transition-colors",
                template === t.id
                  ? "border-wine bg-secondary text-wine dark:border-primary dark:text-primary"
                  : "border-border text-muted-foreground hover:bg-secondary/50",
              )}
            >
              {t.id === "lined" && <PenLine className="mr-0.5 h-3 w-3" aria-hidden />}
              {t.id === "grid" && <Grid3x3 className="mr-0.5 h-3 w-3" aria-hidden />}
              {t.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1">
          {savedAt && (
            <span className="mr-1 text-[10px] text-muted-foreground" aria-live="polite">
              ✓ บันทึกแล้ว {savedAt}
            </span>
          )}
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
            aria-label={fullscreenTick ? "ออกจากเต็มจอ" : "เต็มจอ"}
            onClick={toggleFullscreen}
          >
            {fullscreenTick ? <Minimize className="h-4 w-4" aria-hidden /> : <Maximize className="h-4 w-4" aria-hidden />}
          </Button>
        </div>
      </div>

      <div
        ref={wrapRef}
        className={cn(
          "relative min-h-[240px] overflow-hidden rounded-2xl border border-dashed border-border",
          fullscreenTick && "flex h-screen flex-col justify-center rounded-none border-0 p-10",
        )}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onContextMenu={(e) => e.preventDefault()}
          aria-label="พื้นที่กระดาษทด"
        />
        {!hasContent && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-muted-foreground">
            เขียนคำนวณด้วยเมาส์ ปากกา หรือนิ้ว — กด Shift+ลาก หรือเลือกยางลบเพื่อลบ
          </p>
        )}
      </div>
    </div>
  );
};
