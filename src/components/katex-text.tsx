"use client";

import katex from "katex";
import "katex/dist/katex.min.css";
import { useMemo } from "react";

/**
 * เรนเดอร์ข้อความที่มีสูตร LaTeX ในรูป $...$ (inline) หรือ $$...$$ (block)
 * ข้อความปกติแสดงตรง ๆ พร้อมขึ้นบรรทัดใหม่
 */
export const KatexText = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => {
  const parts = useMemo(() => splitLatex(text), [text]);

  const rendered = parts.map((part, i) => {
    if (part.kind === "text") {
      return (
        <span key={i} className="whitespace-pre-wrap">
          {part.value}
        </span>
      );
    }
    try {
      const html = katex.renderToString(part.value, {
        displayMode: part.kind === "block",
        throwOnError: false,
        output: "html",
      });
      return (
        <span
          key={i}
          className={part.kind === "block" ? "my-2 block overflow-x-auto" : "inline-block"}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    } catch {
      return (
        <span key={i} className="font-mono text-sm">
          {part.value}
        </span>
      );
    }
  });

  return <span className={className}>{rendered}</span>;
};

type Part = { kind: "text" | "inline" | "block"; value: string };

const splitLatex = (text: string): Part[] => {
  const parts: Part[] = [];
  const regex = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push({ kind: "text", value: text.slice(last, m.index) });
    if (m[1] !== undefined) parts.push({ kind: "block", value: m[1] });
    else parts.push({ kind: "inline", value: m[2] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ kind: "text", value: text.slice(last) });
  return parts;
};
