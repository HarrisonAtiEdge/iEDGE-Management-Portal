import type jsPDF from "jspdf";

export type PdfRun = { text: string; bold: boolean; italic: boolean; underline: boolean };
type PdfBlock = { runs: PdfRun[]; marker: string | null };
export type PdfLine = { runs: PdfRun[]; indent: boolean; marker: string | null };

const LIST_INDENT = 12;

/**
 * jsPDF's standard fonts (Helvetica etc.) only ship metrics/glyphs for the
 * WinAnsi (Latin-1-ish) range. Content pasted from Word/Google Docs/web
 * pages commonly carries "smart" typography outside that range — curly
 * quotes, en/em dashes, ellipsis, non-breaking spaces, zero-width joiners.
 * Those render as missing glyphs, or worse, get measured with 0 width by
 * getTextWidth(), which throws off our own word-wrap math and makes text
 * overlap/run together. It looks fine on screen (browsers use real system
 * fonts with full Unicode) but "weird" in the PDF. We normalize to safe
 * ASCII equivalents only for what we draw into the PDF — the on-screen
 * editor content is left untouched.
 */
const PDF_UNSAFE_CHAR_MAP: Record<string, string> = {
  "‘": "'",
  "’": "'",
  "‚": "'",
  "‛": "'",
  "“": '"',
  "”": '"',
  "„": '"',
  "‟": '"',
  "–": "-",
  "—": "--",
  "―": "--",
  "…": "...",
  "•": "-",
  "●": "-",
  "◦": "-",
  " ": " ",
  "­": "",
  "​": "",
  "‌": "",
  "‍": "",
  "﻿": "",
  "\t": "    ",
};

const PDF_UNSAFE_CHAR_PATTERN = new RegExp(
  `[${Object.keys(PDF_UNSAFE_CHAR_MAP).join("")}]`,
  "g",
);

function sanitizeForPdf(text: string): string {
  return text.replace(PDF_UNSAFE_CHAR_PATTERN, (ch) => PDF_UNSAFE_CHAR_MAP[ch] ?? ch);
}

/**
 * Parses a Tiptap-produced description (paragraphs, <br> line breaks,
 * <strong>/<b> bold, <em>/<i> italic, <u> underline runs, and a single
 * level of <ul>/<ol> list items — the only formatting the description
 * editor exposes) into blocks of styled runs the PDF renderer can lay out.
 * Anything outside that limited vocabulary is flattened to plain text
 * rather than dropped.
 */
function parseDescriptionHtml(html: string): PdfBlock[] {
  if (!html || !html.trim()) return [];

  // DOMParser produces an inert document — unlike setting .innerHTML on a
  // real element, it never loads images or fires event-handler attributes,
  // even while we're just reading the parsed structure below.
  const container = new DOMParser().parseFromString(html, "text/html").body;

  const blocks: PdfBlock[] = [];

  const extractRuns = (
    node: ParentNode,
    style: { bold: boolean; italic: boolean; underline: boolean },
    runs: PdfRun[],
  ) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = sanitizeForPdf(child.textContent || "");
        if (text) runs.push({ text, ...style });
        return;
      }

      if (child.nodeType !== Node.ELEMENT_NODE) return;

      const el = child as HTMLElement;
      const tag = el.tagName.toLowerCase();

      if (tag === "br") {
        runs.push({ text: "\n", ...style });
        return;
      }

      extractRuns(el, {
        bold: style.bold || tag === "strong" || tag === "b",
        italic: style.italic || tag === "em" || tag === "i",
        underline: style.underline || tag === "u",
      }, runs);
    });
  };

  const noStyle = { bold: false, italic: false, underline: false };

  container.childNodes.forEach((node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) {
      const text = node.nodeType === Node.TEXT_NODE ? sanitizeForPdf(node.textContent || "") : "";
      if (text.trim()) {
        blocks.push({ runs: [{ text, ...noStyle }], marker: null });
      }
      return;
    }

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === "ul" || tag === "ol") {
      const ordered = tag === "ol";
      let index = 1;
      el.querySelectorAll(":scope > li").forEach((li) => {
        const runs: PdfRun[] = [];
        extractRuns(li, noStyle, runs);
        blocks.push({ runs, marker: ordered ? `${index}.` : "•" });
        index += 1;
      });
      return;
    }

    const runs: PdfRun[] = [];
    extractRuns(el, noStyle, runs);
    blocks.push({ runs, marker: null });
  });

  return blocks;
}

function fontStyle(bold: boolean, italic: boolean): string {
  if (bold && italic) return "bolditalic";
  if (bold) return "bold";
  if (italic) return "italic";
  return "normal";
}

/**
 * Word-wraps parsed blocks to fit maxWidth, measuring each word with the
 * given jsPDF instance/font size so line breaks match what will actually be
 * drawn. Explicit "\n" runs (from <br>) force a break.
 */
function wrapBlocksToLines(
  doc: jsPDF,
  blocks: PdfBlock[],
  maxWidth: number,
  fontSize: number,
): PdfLine[] {
  const lines: PdfLine[] = [];

  const measure = (text: string, bold: boolean, italic: boolean) => {
    doc.setFont("helvetica", fontStyle(bold, italic));
    doc.setFontSize(fontSize);
    return doc.getTextWidth(text);
  };

  blocks.forEach((block) => {
    const isListItem = block.marker !== null;
    const availWidth = Math.max(20, maxWidth - (isListItem ? LIST_INDENT : 0));

    type Word = { text: string; bold: boolean; italic: boolean; underline: boolean; forceBreak?: boolean };
    const words: Word[] = [];

    block.runs.forEach((run) => {
      const segments = run.text.split("\n");
      segments.forEach((segment, idx) => {
        segment
          .split(/(\s+)/)
          .filter((tok) => tok.length > 0)
          .forEach((tok) =>
            words.push({ text: tok, bold: run.bold, italic: run.italic, underline: run.underline }),
          );

        if (idx < segments.length - 1) {
          words.push({ text: "", bold: run.bold, italic: run.italic, underline: run.underline, forceBreak: true });
        }
      });
    });

    let currentRuns: PdfRun[] = [];
    let currentWidth = 0;
    let isFirstLine = true;

    const pushLine = () => {
      const trimmedRuns = [...currentRuns];
      while (trimmedRuns.length && /^\s+$/.test(trimmedRuns[trimmedRuns.length - 1].text)) {
        trimmedRuns.pop();
      }

      lines.push({
        runs: trimmedRuns,
        indent: isListItem,
        marker: isListItem && isFirstLine ? block.marker : null,
      });
      currentRuns = [];
      currentWidth = 0;
      isFirstLine = false;
    };

    if (words.length === 0) {
      lines.push({ runs: [], indent: isListItem, marker: block.marker });
      return;
    }

    words.forEach((word) => {
      if (word.forceBreak) {
        pushLine();
        return;
      }

      if (!word.text) return;

      const wordWidth = measure(word.text, word.bold, word.italic);

      if (
        currentWidth + wordWidth > availWidth &&
        currentRuns.some((run) => !/^\s+$/.test(run.text))
      ) {
        pushLine();
      }

      currentRuns.push({ text: word.text, bold: word.bold, italic: word.italic, underline: word.underline });
      currentWidth += wordWidth;
    });

    if (currentRuns.length > 0) pushLine();
  });

  return lines;
}

/** Draws pre-wrapped rich-text lines at (x, startY), returning the y position after the last line. */
function drawLines(
  doc: jsPDF,
  lines: PdfLine[],
  x: number,
  startY: number,
  lineHeight: number,
  fontSize: number,
): number {
  let y = startY;
  const underlineOffset = fontSize * 0.12;

  lines.forEach((line) => {
    doc.setFontSize(fontSize);

    if (line.marker) {
      doc.setFont("helvetica", "normal");
      doc.text(line.marker, x, y);
    }

    let cx = x + (line.indent ? LIST_INDENT : 0);

    line.runs.forEach((run) => {
      doc.setFont("helvetica", fontStyle(run.bold, run.italic));
      doc.text(run.text, cx, y);

      const runWidth = doc.getTextWidth(run.text);

      if (run.underline && run.text.trim()) {
        doc.setLineWidth(Math.max(0.4, fontSize * 0.04));
        doc.line(cx, y + underlineOffset, cx + runWidth, y + underlineOffset);
      }

      cx += runWidth;
    });

    y += lineHeight;
  });

  doc.setFont("helvetica", "normal");

  return y;
}

export type RichDetailLayout = {
  lines: PdfLine[];
  lineHeight: number;
};

/**
 * Builds the wrapped-line layout for a service row's "detail" title (plain,
 * bold) followed by its rich-text description, sized to fit availWidth.
 * Call once per cell during table layout (e.g. didParseCell) so the line
 * count can drive the cell's auto height, then draw with drawRichDetail.
 */
export function layoutRichDetail(
  doc: jsPDF,
  detail: string,
  descriptionHtml: string,
  availWidth: number,
  fontSize: number,
): RichDetailLayout {
  const blocks: PdfBlock[] = [];

  if (detail && detail.trim()) {
    blocks.push({
      runs: [{ text: sanitizeForPdf(detail), bold: false, italic: false, underline: false }],
      marker: null,
    });
  }

  blocks.push(...parseDescriptionHtml(descriptionHtml));

  const lines = wrapBlocksToLines(doc, blocks, availWidth, fontSize);
  const lineHeight = doc.getTextDimensions("Mg", { fontSize }).h * 1.15;

  return { lines, lineHeight };
}

export function drawRichDetail(
  doc: jsPDF,
  layout: RichDetailLayout,
  x: number,
  startY: number,
  fontSize: number,
): void {
  drawLines(doc, layout.lines, x, startY, layout.lineHeight, fontSize);
}
