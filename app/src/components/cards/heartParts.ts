export type HeartSegment = { text: string; heart: boolean };

/**
 * Splits a heart word into regular/irregular segments by matching each
 * irregular part left-to-right against the word (002i D4). `regular_parts` /
 * `irregular_parts` don't encode position, so the word text is the ground
 * truth. Returns null when a part can't be matched — callers fall back to
 * plain text, because bad content must never crash a drill.
 */
export function splitHeartParts(text: string, irregularParts: string[]): HeartSegment[] | null {
  const segments: HeartSegment[] = [];
  let cursor = 0;
  for (const part of irregularParts) {
    const idx = text.indexOf(part, cursor);
    if (idx === -1 || part.length === 0) return null;
    if (idx > cursor) segments.push({ text: text.slice(cursor, idx), heart: false });
    segments.push({ text: part, heart: true });
    cursor = idx + part.length;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), heart: false });
  return segments;
}
