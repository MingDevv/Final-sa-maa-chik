"use client";

import { useMemo } from "react";
import { KatexText } from "@/components/katex-text";

/**
 * เรนเดอร์ markdown ย่อที่ใช้ในชีตสรุป: # ## ### หัวข้อ, - ลิสต์, ตัวเลข. ลิสต์, **ตัวหนา**, $...$ LaTeX
 * ตั้งใจให้เบา ไม่ดึง dependency ภายนอก
 */
export const MarkdownLite = ({ content }: { content: string }) => {
  const blocks = useMemo(() => splitBlocks(content), [content]);
  return (
    <div className="flex flex-col gap-3 leading-relaxed">
      {blocks.map((b, i) => (
        <Block key={i} block={b} />
      ))}
    </div>
  );
};

type Block =
  | { kind: "h1" | "h2" | "h3"; text: string }
  | { kind: "p"; text: string }
  | { kind: "ul" | "ol"; items: string[] };

function splitBlocks(src: string): Block[] {
  const out: Block[] = [];
  const lines = src.split(/\r?\n/);
  let list: { kind: "ul" | "ol"; items: string[] } | null = null;
  const flush = () => {
    if (list) out.push(list);
    list = null;
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^###\s+/.test(line)) {
      flush();
      out.push({ kind: "h3", text: line.replace(/^###\s+/, "") });
    } else if (/^##\s+/.test(line)) {
      flush();
      out.push({ kind: "h2", text: line.replace(/^##\s+/, "") });
    } else if (/^#\s+/.test(line)) {
      flush();
      out.push({ kind: "h1", text: line.replace(/^#\s+/, "") });
    } else if (/^[-*]\s+/.test(line)) {
      if (!list || list.kind !== "ul") {
        flush();
        list = { kind: "ul", items: [] };
      }
      list.items.push(line.replace(/^[-*]\s+/, ""));
    } else if (/^\d+[.)]\s+/.test(line)) {
      if (!list || list.kind !== "ol") {
        flush();
        list = { kind: "ol", items: [] };
      }
      list.items.push(line.replace(/^\d+[.)]\s+/, ""));
    } else if (line.trim() === "") {
      flush();
    } else if (/^>\s?/.test(line)) {
      flush();
      out.push({ kind: "p", text: `**${line.replace(/^>\s?/, "")}**` });
    } else {
      flush();
      out.push({ kind: "p", text: line });
    }
  }
  flush();
  return out;
}

function Block({ block }: { block: Block }) {
  if (block.kind === "h1") {
    return (
      <h2 className="mt-2 rounded-2xl bg-secondary px-4 py-2 text-lg font-bold text-wine dark:text-primary">
        <Inline text={block.text} />
      </h2>
    );
  }
  if (block.kind === "h2") {
    return (
      <h3 className="mt-3 text-base font-bold text-purple-brand dark:text-purple-300">
        <Inline text={block.text} />
      </h3>
    );
  }
  if (block.kind === "h3") {
    return (
      <h4 className="font-semibold">
        <Inline text={block.text} />
      </h4>
    );
  }
  if (block.kind === "ul" || block.kind === "ol") {
    const Tag = block.kind === "ul" ? "ul" : "ol";
    return (
      <Tag className="ml-5 flex list-disc flex-col gap-1.5 text-sm">
        {block.items.map((item, i) => (
          <li key={i}>
            <Inline text={item} />
          </li>
        ))}
      </Tag>
    );
  }
  const paragraph = block as { kind: "p"; text: string };
  return (
    <p className="text-sm">
      <Inline text={paragraph.text} />
    </p>
  );
}

/** **ตัวหนา** + KaTeX */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-foreground">
              <KatexText text={p.slice(2, -2)} />
            </strong>
          );
        }
        return <KatexText key={i} text={p} />;
      })}
    </>
  );
}
