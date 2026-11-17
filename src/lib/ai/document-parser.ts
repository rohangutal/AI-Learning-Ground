import mammoth from "mammoth";
import JSZip from "jszip";

export type ExtractedSection = {
  text: string;
  pageNumber?: number;
  slideNumber?: number;
  section?: string;
};

const MAX_EXTRACTED_CHARACTERS = 2_000_000;
const MAX_ARCHIVE_UNCOMPRESSED_BYTES = 30 * 1024 * 1024;

async function loadOfficeArchive(buffer: Buffer) {
  const archive = await JSZip.loadAsync(buffer);
  const entries = Object.values(archive.files);
  const expandedBytes = entries.reduce((total, entry) => {
    const uncompressedSize = (entry as typeof entry & { _data?: { uncompressedSize?: number } })._data?.uncompressedSize ?? 0;
    return total + uncompressedSize;
  }, 0);
  if (entries.length > 5_000 || expandedBytes > MAX_ARCHIVE_UNCOMPRESSED_BYTES) {
    throw new Error("This Office document expands beyond the supported size limit.");
  }
  return archive;
}

function checkExtractedTextLength(sections: ExtractedSection[]) {
  const length = sections.reduce((total, section) => total + section.text.length, 0);
  if (length > MAX_EXTRACTED_CHARACTERS) {
    throw new Error("This document contains too much extractable text. Try a smaller file.");
  }
  return sections.filter((section) => section.text.trim().length > 0);
}

function decodeXml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)));
}

export async function extractStudyDocument(
  buffer: Buffer,
  type: "pdf" | "docx" | "pptx",
): Promise<ExtractedSection[]> {
  if (type === "pdf") {
    const pdf = await import("pdf-parse");
    const parser = new pdf.PDFParse({ data: new Uint8Array(buffer) });
    try {
      const result = await parser.getText();
      return checkExtractedTextLength(result.pages.map((page) => ({
        text: page.text,
        pageNumber: page.num,
      })));
    } finally {
      await parser.destroy();
    }
  }

  if (type === "docx") {
    await loadOfficeArchive(buffer);
    const result = await mammoth.extractRawText({ buffer });
    return checkExtractedTextLength([{ text: result.value }]);
  }

  const archive = await loadOfficeArchive(buffer);
  const slidePaths = Object.keys(archive.files)
    .filter((path) => /^ppt\/slides\/slide\d+\.xml$/.test(path))
    .sort((left, right) => {
      const leftNumber = Number(left.match(/slide(\d+)/)?.[1] ?? 0);
      const rightNumber = Number(right.match(/slide(\d+)/)?.[1] ?? 0);
      return leftNumber - rightNumber;
    });

  const sections: ExtractedSection[] = [];
  for (const [index, path] of slidePaths.entries()) {
    const xml = await archive.files[path].async("string");
    const paragraphs = [...xml.matchAll(/<a:p(?:\s[^>]*)?>([\s\S]*?)<\/a:p>/g)]
      .map((match) => [...match[1].matchAll(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g)]
        .map((text) => decodeXml(text[1]))
        .join(""))
      .filter(Boolean);
    sections.push({ text: paragraphs.join("\n"), slideNumber: index + 1 });
  }

  if (slidePaths.length === 0) throw new Error("No presentation slides were found in this PPTX file.");
  return checkExtractedTextLength(sections);
}

export function chunkExtractedSections(sections: ExtractedSection[]) {
  const chunkSize = 1_400;
  const overlap = 220;
  const chunks: ExtractedSection[] = [];

  for (const section of sections) {
    const text = section.text.replace(/\r/g, "").trim();
    let start = 0;
    while (start < text.length) {
      let end = Math.min(start + chunkSize, text.length);
      if (end < text.length) {
        const boundary = text.lastIndexOf("\n", end);
        const sentence = text.lastIndexOf(". ", end);
        const preferredBoundary = Math.max(boundary, sentence > start + chunkSize * 0.55 ? sentence + 1 : -1);
        if (preferredBoundary > start + chunkSize * 0.55) end = preferredBoundary;
      }
      const content = text.slice(start, end).trim();
      if (content) chunks.push({ ...section, text: content });
      if (end >= text.length) break;
      start = Math.max(start + 1, end - overlap);
    }
  }

  if (chunks.length > 300) throw new Error("This document is too large to index in one request. Try a smaller file.");
  return chunks;
}
