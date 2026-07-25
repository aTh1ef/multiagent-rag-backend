import { describe, it, expect } from "vitest";
import { extractCitations } from "../reasoning.node";
import type { RetrievedChunk } from "../../state";

function makeChunk(overrides: Partial<RetrievedChunk> = {}): RetrievedChunk {
  return {
    chunkId: "chunk-1",
    documentId: "doc-1",
    documentName: "handbook.txt",
    content: "The bakery is open Monday through Saturday.",
    score: 0.9,
    ...overrides,
  };
}

describe("extractCitations", () => {
  it("returns no citations when the answer cites nothing", () => {
    const chunks = [makeChunk()];
    expect(extractCitations("There is no relevant information.", chunks)).toEqual([]);
  });

  it("extracts a single cited chunk", () => {
    const chunks = [makeChunk()];
    const citations = extractCitations("The bakery is open weekdays [1].", chunks);
    expect(citations).toHaveLength(1);
    expect(citations[0].documentName).toBe("handbook.txt");
  });

  it("extracts multiple distinct citations in one answer", () => {
    const chunks = [
      makeChunk({ chunkId: "c1", documentName: "a.txt" }),
      makeChunk({ chunkId: "c2", documentName: "b.txt" }),
      makeChunk({ chunkId: "c3", documentName: "c.txt" }),
    ];
    const citations = extractCitations("Per [1] and [3], but not [2] in this sentence... wait [2] too.", chunks);
    const names = citations.map((c) => c.documentName).sort();
    expect(names).toEqual(["a.txt", "b.txt", "c.txt"]);
  });

  it("ignores citation markers for chunks that were never retrieved (out-of-range numbers)", () => {
    const chunks = [makeChunk()];
    // Only chunk [1] exists — [2] and [99] don't correspond to any retrieved chunk.
    const citations = extractCitations("See [1], [2], and [99].", chunks);
    expect(citations).toHaveLength(1);
  });

  it("deduplicates repeated citation markers for the same chunk", () => {
    const chunks = [makeChunk()];
    const citations = extractCitations("As shown in [1]. Again, [1] confirms it. [1][1]", chunks);
    expect(citations).toHaveLength(1);
  });

  it("truncates long snippets to 240 characters with an ellipsis", () => {
    const longContent = "x".repeat(500);
    const chunks = [makeChunk({ content: longContent })];
    const citations = extractCitations("[1]", chunks);
    expect(citations[0].snippet.endsWith("...")).toBe(true);
    expect(citations[0].snippet.length).toBe(243);
  });

  it("includes pageNumber only when the chunk has one", () => {
    const withPage = [makeChunk({ pageNumber: 3 })];
    const withoutPage = [makeChunk()];
    expect(extractCitations("[1]", withPage)[0].pageNumber).toBe(3);
    expect(extractCitations("[1]", withoutPage)[0].pageNumber).toBeUndefined();
  });

  it("returns an empty array when there are no retrieved chunks at all", () => {
    expect(extractCitations("[1] [2] [3]", [])).toEqual([]);
  });
});
