"use client";

import { useMemo } from "react";
import { KatexText } from "@/components/katex-text";
import { ExternalLink } from "lucide-react";

/**
 * เรนเดอร์ markdown ย่อที่ใช้ในชีตสรุป: # ## ### หัวข้อ, ตาราง, บล็อกคำพูด, - ลิสต์, ตัวเลข. ลิสต์, ลิงก์, **ตัวหนา**, $...$ LaTeX
 * ทำงานรวดเร็ว ไม่มี dependency หนัก และแสดงผลลื่นไหล
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
  | { kind: "blockquote"; text: string }
  | { kind: "hr" }
  | { kind: "table"; headers: string[]; rows: string[][] }
  | { kind: "ul" | "ol"; items: string[] };

function splitBlocks(src: string): Block[] {
  const out: Block[] = [];
  const lines = src.split(/\r?\n/);
  let list: { kind: "ul" | "ol"; items: string[] } | null = null;
  let tableLines: string[] | null = null;

  const flushList = () => {
    if (list) {
      out.push(list);
      list = null;
    }
  };

  const flushTable = () => {
    if (!tableLines || tableLines.length === 0) {
      tableLines = null;
      return;
    }

    const parsedRows = tableLines.map((line) =>
      line
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((c) => c.trim())
    );

    // เช็คว่าแถวที่ 2 เป็น delimiter line หรือไม่ (เช่น | :--- | :--- |)
    if (parsedRows.length >= 2 && parsedRows[1].every((c) => /^:?-+:?$/.test(c))) {
      const headers = parsedRows[0];
      const rows = parsedRows.slice(2);
      out.push({ kind: "table", headers, rows });
    } else {
      // ไม่ใช่ตารางที่สมบูรณ์ เรนเดอร์เป็นพารากราฟปกติ
      for (const line of tableLines) {
        out.push({ kind: "p", text: line });
      }
    }
    tableLines = null;
  };

  const flushAll = () => {
    flushList();
    flushTable();
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    // เช็คแถวตาราง markdown (| ... |)
    if (/^\|(.+)\|$/.test(line.trim())) {
      flushList();
      if (!tableLines) tableLines = [];
      tableLines.push(line.trim());
      continue;
    } else {
      flushTable();
    }

    if (/^###\s+/.test(line)) {
      flushList();
      out.push({ kind: "h3", text: line.replace(/^###\s+/, "") });
    } else if (/^##\s+/.test(line)) {
      flushList();
      out.push({ kind: "h2", text: line.replace(/^##\s+/, "") });
    } else if (/^#\s+/.test(line)) {
      flushList();
      out.push({ kind: "h1", text: line.replace(/^#\s+/, "") });
    } else if (/^[-*]\s+/.test(line)) {
      if (!list || list.kind !== "ul") {
        flushList();
        list = { kind: "ul", items: [] };
      }
      list.items.push(line.replace(/^[-*]\s+/, ""));
    } else if (/^\d+[.)]\s+/.test(line)) {
      if (!list || list.kind !== "ol") {
        flushList();
        list = { kind: "ol", items: [] };
      }
      list.items.push(line.replace(/^\d+[.)]\s+/, ""));
    } else if (/^---$/.test(line.trim())) {
      flushList();
      out.push({ kind: "hr" });
    } else if (/^>\s?/.test(line)) {
      flushList();
      out.push({ kind: "blockquote", text: line.replace(/^>\s?/, "") });
    } else if (line.trim() === "") {
      flushList();
    } else {
      flushList();
      out.push({ kind: "p", text: line });
    }
  }

  flushAll();
  return out;
}

function Block({ block }: { block: Block }) {
  if (block.kind === "h1") {
    return (
      <h2 className="mt-4 rounded-2xl bg-secondary/80 px-4 py-2.5 text-lg font-bold text-wine shadow-2xs dark:text-primary">
        <Inline text={block.text} />
      </h2>
    );
  }
  if (block.kind === "h2") {
    return (
      <h3 className="mt-4 text-base font-bold text-purple-brand dark:text-rose-300">
        <Inline text={block.text} />
      </h3>
    );
  }
  if (block.kind === "h3") {
    return (
      <h4 className="mt-2 font-semibold text-foreground">
        <Inline text={block.text} />
      </h4>
    );
  }
  if (block.kind === "hr") {
    return <hr className="my-3 border-border/70" />;
  }
  if (block.kind === "blockquote") {
    return (
      <blockquote className="my-2 rounded-r-2xl border-l-4 border-primary/70 bg-accent/30 px-4 py-3 text-sm text-foreground/90 italic shadow-2xs">
        <Inline text={block.text} />
      </blockquote>
    );
  }
  if (block.kind === "table") {
    return (
      <div className="my-3 overflow-x-auto rounded-2xl border border-border/80 bg-card shadow-2xs">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="border-b border-border bg-muted/60 font-semibold text-foreground">
            <tr>
              {block.headers.map((h, idx) => (
                <th key={idx} className="border-r border-border/50 px-4 py-3 last:border-r-0 whitespace-nowrap">
                  <Inline text={h} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {block.rows.map((row, rIdx) => (
              <tr key={rIdx} className={rIdx % 2 === 1 ? "bg-muted/15" : "bg-transparent hover:bg-muted/30 transition-colors"}>
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="border-r border-border/40 px-4 py-2.5 align-top last:border-r-0">
                    <Inline text={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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

/**
 * เรนเดอร์ข้อความ inline:
 * - [ข้อความ](url) -> ลิงก์คลิกได้ พร้อมเปิดแท็บใหม่
 * - **ตัวหนา** -> <strong>
 * - *ตัวเอียง* -> <em>
 * - $...$ -> KaTeX Math
 */
function Inline({ text }: { text: string }) {
  // จับ markdown links [text](url) และ **bold** และ *italic*
  const tokenRegex = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const tokens = text.split(tokenRegex).filter(Boolean);

  return (
    <>
      {tokens.map((token, idx) => {
        // ลิงก์ markdown [text](url)
        const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
          const [, label, href] = linkMatch;
          const isExternal = href.startsWith("http://") || href.startsWith("https://");
          return (
            <a
              key={idx}
              href={href}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
              className="inline-flex items-center gap-1 font-medium text-primary underline underline-offset-3 hover:text-primary/80 transition-colors"
            >
              <span>{label}</span>
              {isExternal && <ExternalLink className="h-3 w-3 inline shrink-0 opacity-70" />}
            </a>
          );
        }

        // ตัวหนา **bold**
        if (token.startsWith("**") && token.endsWith("**")) {
          return (
            <strong key={idx} className="font-semibold text-foreground">
              <KatexText text={token.slice(2, -2)} />
            </strong>
          );
        }

        // ตัวเอียง *italic*
        if (token.startsWith("*") && token.endsWith("*") && token.length > 2) {
          return (
            <em key={idx} className="italic text-foreground/90">
              <KatexText text={token.slice(1, -1)} />
            </em>
          );
        }

        // ข้อความธรรมดา (ส่งต่อให้ KaTeX ประมวลผลสูตรคณิตศาสตร์ถ้ามี)
        return <KatexText key={idx} text={token} />;
      })}
    </>
  );
}
