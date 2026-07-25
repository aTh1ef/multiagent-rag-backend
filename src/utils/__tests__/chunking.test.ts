import { describe, it, expect } from "vitest";
import { splitIntoChunks } from "../chunking";

describe("splitIntoChunks", () => {
  it("returns an empty array for empty or whitespace-only text", () => {
    expect(splitIntoChunks("")).toEqual([]);
    expect(splitIntoChunks("   \n\n  ")).toEqual([]);
  });

  it("returns a single chunk when text is under the chunk size", () => {
    const text = "This is a short document about a bakery.";
    const chunks = splitIntoChunks(text);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe(text);
  });

  it("splits long text into multiple chunks, each within a reasonable size bound", () => {
    const paragraph = "The bakery sells strawberry shortcake and matcha roll cake. ".repeat(50); // ~3000 chars
    const chunks = splitIntoChunks(paragraph);
    expect(chunks.length).toBeGreaterThan(1);
    // Overlap means chunks can exceed the raw 1000-char target by up to the 150-char overlap.
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(1150);
    }
  });

  it("carries a trailing-overlap prefix from the previous chunk into the next one", () => {
    const paragraph = "Sentence one is here. ".repeat(80);
    const chunks = splitIntoChunks(paragraph);
    expect(chunks.length).toBeGreaterThan(1);

    const prevTail = chunks[0].slice(-150);
    expect(chunks[1].startsWith(prevTail)).toBe(true);
  });

  it("does not produce empty or whitespace-only chunks", () => {
    const text = "Paragraph one.\n\nParagraph two.\n\n\n\nParagraph three.".repeat(30);
    const chunks = splitIntoChunks(text);
    for (const chunk of chunks) {
      expect(chunk.trim().length).toBeGreaterThan(0);
    }
  });

  it("handles a single very long word with no natural break points", () => {
    const text = "a".repeat(3000);
    const chunks = splitIntoChunks(text);
    expect(chunks.length).toBeGreaterThan(1);
  });
});
