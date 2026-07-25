import mammoth from "mammoth";
import { HumanMessage } from "@langchain/core/messages";
import { getChatModel } from "../lib/gemini";
import { HttpError } from "../middleware/errorHandler";

export interface ExtractedPage {
  pageNumber?: number;
  text: string;
}

export const SUPPORTED_MIME_TYPES = [
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

const PDF_EXTRACTION_PROMPT =
  "Extract all readable text from this PDF document. Preserve the reading order. " +
  "Tag the start of each page with a marker on its own line in the exact form [PAGE n] " +
  "(where n is the 1-based page number), followed by that page's text. " +
  "Do not summarize, comment, or add any text that isn't present in the document.";

async function extractPdfText(buffer: Buffer): Promise<ExtractedPage[]> {
  const model = getChatModel("gemini-2.5-flash", 0);
  const message = new HumanMessage({
    content: [
      { type: "application/pdf", data: buffer.toString("base64") },
      { type: "text", text: PDF_EXTRACTION_PROMPT },
    ],
  });

  const response = await model.invoke([message]);
  const rawText = typeof response.content === "string" ? response.content : JSON.stringify(response.content);

  const pageSplit = rawText.split(/\[PAGE\s+(\d+)\]/).slice(1);
  const pages: ExtractedPage[] = [];
  for (let i = 0; i < pageSplit.length; i += 2) {
    const pageNumber = Number(pageSplit[i]);
    const text = pageSplit[i + 1]?.trim() ?? "";
    if (text) pages.push({ pageNumber, text });
  }

  if (pages.length === 0 && rawText.trim()) {
    pages.push({ text: rawText.trim() });
  }

  return pages;
}

async function extractDocxText(buffer: Buffer): Promise<ExtractedPage[]> {
  const { value } = await mammoth.extractRawText({ buffer });
  const text = value.trim();
  return text ? [{ text }] : [];
}

async function extractTxtText(buffer: Buffer): Promise<ExtractedPage[]> {
  const text = buffer.toString("utf-8").trim();
  return text ? [{ text }] : [];
}

export async function extractText(buffer: Buffer, mimeType: string): Promise<ExtractedPage[]> {
  switch (mimeType) {
    case "application/pdf":
      return extractPdfText(buffer);
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return extractDocxText(buffer);
    case "text/plain":
      return extractTxtText(buffer);
    default:
      throw new HttpError(400, `Unsupported file type: ${mimeType}`);
  }
}
