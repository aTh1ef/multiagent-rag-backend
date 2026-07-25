import { getChatModel } from "../../lib/gemini";
import { buildReasoningMessages } from "../prompts/reasoning.prompt";
import type { AllowedGeminiModel } from "../../config/env";
import type { ChatGraphState, ChatGraphUpdate, Citation } from "../state";

function extractCitations(text: string, chunks: ChatGraphState["retrievedChunks"]): Citation[] {
  const citedNumbers = new Set<number>();
  const regex = /\[(\d+)\]/g;
  let match: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((match = regex.exec(text))) {
    citedNumbers.add(Number(match[1]));
  }

  return chunks
    .map((chunk, i) => ({ chunk, num: i + 1 }))
    .filter(({ num }) => citedNumbers.has(num))
    .map(({ chunk }) => {
      const citation: Citation = {
        documentId: chunk.documentId,
        documentName: chunk.documentName,
        chunkId: chunk.chunkId,
        snippet: chunk.content.length > 240 ? `${chunk.content.slice(0, 240)}...` : chunk.content,
      };
      if (chunk.pageNumber !== undefined) citation.pageNumber = chunk.pageNumber;
      return citation;
    });
}

export async function reasoningNode(state: ChatGraphState): Promise<ChatGraphUpdate> {
  const model = getChatModel(state.model as AllowedGeminiModel, 0.3);
  const messages = buildReasoningMessages(state);

  const response = await model.invoke(messages);
  const finalAnswer = typeof response.content === "string" ? response.content : String(response.content);

  const citations = state.route === "rag" ? extractCitations(finalAnswer, state.retrievedChunks) : [];

  return { finalAnswer, citations };
}
