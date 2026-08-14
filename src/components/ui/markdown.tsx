"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
}

// Tokenize and highlight simple code syntaxes
function HighlightCode({ code }: { code: string }) {
  if (!code) return null;

  const lines = code.split("\n");

  return (
    <pre className="text-sm font-mono overflow-x-auto leading-relaxed select-text">
      <code>
        {lines.map((line, lineIdx) => {
          // Highlight comments
          if (line.trim().startsWith("//") || line.trim().startsWith("#")) {
            return (
              <div key={lineIdx} className="text-muted-foreground/60 italic">
                {line}
              </div>
            );
          }

          // A simple tokenizer regex for keywords, strings, and numbers
          const parts = line.split(/(\b(?:const|let|var|function|return|class|import|export|from|if|else|for|while|await|async|def|import|print|from|class|public|private|new|void)\b|"[^"]*"|'[^']*'|`[^`]*`|\b\d+\b)/g);

          return (
            <div key={lineIdx} className="min-h-[1.2em]">
              {parts.map((part, partIdx) => {
                // Keyword highlighting
                if (/^(?:const|let|var|function|return|class|import|export|from|if|else|for|while|await|async|def|import|print|from|class|public|private|new|void)$/.test(part)) {
                  return (
                    <span key={partIdx} className="text-indigo-400 font-semibold">
                      {part}
                    </span>
                  );
                }
                // String highlighting
                if (/^("[^"]*"|'[^']*'|`[^`]*`)$/.test(part)) {
                  return (
                    <span key={partIdx} className="text-emerald-400">
                      {part}
                    </span>
                  );
                }
                // Number highlighting
                if (/^\d+$/.test(part)) {
                  return (
                    <span key={partIdx} className="text-amber-400">
                      {part}
                    </span>
                  );
                }
                return <span key={partIdx}>{part}</span>;
              })}
            </div>
          );
        })}
      </code>
    </pre>
  );
}

// Custom code block wrapper with title, badge and copy functionality
function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-lg border bg-zinc-950 text-zinc-50 overflow-hidden shadow-md">
      <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-900 border-b border-zinc-800 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
        <span>{language || "code"}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-zinc-200 transition-colors p-1"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 bg-zinc-950">
        <HighlightCode code={code} />
      </div>
    </div>
  );
}

// Inline styles parsing helper (bold, italic, inline code)
function parseInlineStyles(text: string) {
  if (!text) return "";

  // Bold (**text** or __text__)
  let html = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.*?)__/g, "<strong>$1</strong>");

  // Italic (*text* or _text_)
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/_(.*?)_/g, "<em>$1</em>");

  // Inline code (`code`)
  html = html.replace(/`(.*?)`/g, '<code class="px-1 py-0.5 rounded bg-muted font-mono text-sm font-semibold text-foreground/90">$1</code>');

  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeBlockLanguage = "";
  let codeBlockLines: string[] = [];

  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];

  let keyCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle Code Blocks opening/closing
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        // Close code block
        const code = codeBlockLines.join("\n");
        elements.push(
          <CodeBlock
            key={`code-${keyCounter++}`}
            code={code}
            language={codeBlockLanguage}
          />
        );
        inCodeBlock = false;
        codeBlockLines = [];
        codeBlockLanguage = "";
      } else {
        // Open code block
        inCodeBlock = true;
        codeBlockLanguage = line.trim().replace(/^```/, "");
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Handle Tables
    if (line.trim().startsWith("|")) {
      const columns = line
        .split("|")
        .map((col) => col.trim())
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1); // Remove empty boundaries

      // Skip separator row (e.g. |---|---|)
      if (line.includes("-") && columns.every((col) => col.startsWith("-") || col.endsWith("-"))) {
        continue;
      }

      if (tableHeaders.length === 0) {
        tableHeaders = columns;
      } else {
        tableRows.push(columns);
      }

      // Check if next line is not a table row to close
      const nextLine = lines[i + 1];
      if (!nextLine || !nextLine.trim().startsWith("|")) {
        const headers = [...tableHeaders];
        const rows = [...tableRows];
        elements.push(
          <div key={`table-${keyCounter++}`} className="my-5 overflow-x-auto border rounded-lg shadow-sm">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/50 font-semibold">
                  {headers.map((h, hIdx) => (
                    <th key={hIdx} className="p-3 border-r last:border-r-0">
                      {parseInlineStyles(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-3 border-r last:border-r-0">
                        {parseInlineStyles(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableHeaders = [];
        tableRows = [];
      }
      continue;
    }

    // Skip empty lines
    if (!line.trim()) {
      elements.push(<div key={`empty-${keyCounter++}`} className="h-2" />);
      continue;
    }

    // Headings
    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={`h1-${keyCounter++}`} className="text-3xl font-bold tracking-tight border-b pb-3 mb-5 mt-7">
          {parseInlineStyles(line.substring(2))}
        </h1>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={`h2-${keyCounter++}`} className="text-2xl font-bold tracking-tight mt-7 mb-3 text-foreground/90">
          {parseInlineStyles(line.substring(3))}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={`h3-${keyCounter++}`} className="text-lg font-semibold mt-5 mb-2 text-foreground/80">
          {parseInlineStyles(line.substring(4))}
        </h3>
      );
    } 
    // Blockquotes
    else if (line.trim().startsWith(">")) {
      elements.push(
        <blockquote key={`quote-${keyCounter++}`} className="border-l-4 border-indigo-500 pl-4 py-2 my-4 text-muted-foreground bg-indigo-500/5 rounded-r italic text-sm leading-7">
          {parseInlineStyles(line.trim().substring(1).trim())}
        </blockquote>
      );
    }
    // Lists
    else if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
      const cleanLine = line.trim().replace(/^[\*\-]\s+/, "");
      elements.push(
        <div key={`li-${keyCounter++}`} className="flex items-start gap-3 pl-4 py-1 text-[15px] leading-7 text-foreground/90">
          <span className="mt-[0.7em] h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
          <span className="flex-1">{parseInlineStyles(cleanLine)}</span>
        </div>
      );
    } else if (/^\d+\.\s+/.test(line.trim())) {
      const cleanLine = line.trim().replace(/^\d+\.\s+/, "");
      const num = line.trim().match(/^\d+/)?.[0] || "1";
      elements.push(
        <div key={`oli-${keyCounter++}`} className="flex items-start gap-3 pl-4 py-1 text-[15px] leading-7 text-foreground/90">
          <span className="text-primary font-semibold text-xs mt-[5px] w-5 text-right flex-shrink-0">{num}.</span>
          <span className="flex-1">{parseInlineStyles(cleanLine)}</span>
        </div>
      );
    }
    // Plain Paragraph
    else {
      elements.push(
        <p key={`p-${keyCounter++}`} className="text-[15px] text-foreground/90 leading-7 py-1">
          {parseInlineStyles(line)}
        </p>
      );
    }
  }

  // Handle open elements at EOF (e.g. if stream cuts off during a code block)
  if (inCodeBlock && codeBlockLines.length > 0) {
    elements.push(
      <CodeBlock
        key={`code-eof`}
        code={codeBlockLines.join("\n")}
        language={codeBlockLanguage}
      />
    );
  }

  return <div className="space-y-1.5 select-text">{elements}</div>;
}
