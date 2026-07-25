const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 150;
const SEPARATORS = ["\n\n", "\n", ". ", " ", ""];

function splitBySeparator(text: string, separators: string[]): string[] {
  if (text.length <= CHUNK_SIZE) return [text];

  const [separator, ...rest] = separators;
  const parts = separator ? text.split(separator) : text.split("");

  const merged: string[] = [];
  let current = "";

  for (const part of parts) {
    const candidate = current ? current + separator + part : part;
    if (candidate.length <= CHUNK_SIZE) {
      current = candidate;
    } else {
      if (current) merged.push(current);
      current = part;
    }
  }
  if (current) merged.push(current);

  return merged.flatMap((piece) => (piece.length > CHUNK_SIZE && rest.length ? splitBySeparator(piece, rest) : [piece]));
}

function withOverlap(chunks: string[]): string[] {
  if (chunks.length <= 1) return chunks;

  const result: string[] = [chunks[0]];
  for (let i = 1; i < chunks.length; i++) {
    const prevTail = result[i - 1].slice(-CHUNK_OVERLAP);
    result.push(prevTail + chunks[i]);
  }
  return result;
}

/** Splits text into ~1000 char chunks with ~150 char overlap, breaking on paragraph/sentence/word boundaries where possible. */
export function splitIntoChunks(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const rawChunks = splitBySeparator(trimmed, SEPARATORS).filter((c) => c.trim().length > 0);
  return withOverlap(rawChunks);
}
