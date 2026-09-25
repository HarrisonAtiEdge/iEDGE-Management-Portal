const HTML_TAG_PATTERN = /<[a-z][\s\S]*>/i;

export function isHtmlContent(value: string): boolean {
  return HTML_TAG_PATTERN.test(value);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Legacy description values were plain text saved from a <textarea>, so
 * newlines carried the line breaks. HTML ignores raw "\n", so on first load
 * into the rich text editor we convert them into <br> once; anything already
 * containing tags (i.e. previously saved by the rich editor) passes through
 * untouched.
 */
export function normalizeDescriptionToHtml(value: string | undefined | null): string {
  if (!value) return "";
  if (isHtmlContent(value)) return value;

  return escapeHtml(value).replace(/\n/g, "<br>");
}
