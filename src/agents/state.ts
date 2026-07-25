import { Annotation } from "@langchain/langgraph";

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface RetrievedChunk {
  chunkId: string;
  documentId: string;
  documentName: string;
  content: string;
  pageNumber?: number;
  score: number;
}

export interface Citation {
  documentId: string;
  documentName: string;
  chunkId: string;
  pageNumber?: number;
  snippet: string;
}

export type RouteDecision = "rag" | "general" | "history_only";

export const GraphState = Annotation.Root({
  userId: Annotation<string>,
  sessionId: Annotation<string>,
  userMessage: Annotation<string>,
  model: Annotation<string>,
  conversationHistory: Annotation<ConversationTurn[]>,
  route: Annotation<RouteDecision | undefined>,
  retrievedChunks: Annotation<RetrievedChunk[]>({
    reducer: (_left, right) => right,
    default: () => [],
  }),
  finalAnswer: Annotation<string | undefined>,
  citations: Annotation<Citation[]>({
    reducer: (_left, right) => right,
    default: () => [],
  }),
});

export type ChatGraphState = typeof GraphState.State;
export type ChatGraphUpdate = typeof GraphState.Update;
