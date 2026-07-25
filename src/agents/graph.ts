import { StateGraph, START, END } from "@langchain/langgraph";
import { GraphState, ChatGraphState } from "./state";
import { supervisorNode } from "./nodes/supervisor.node";
import { retrievalNode } from "./nodes/retrieval.node";
import { reasoningNode } from "./nodes/reasoning.node";

const graph = new StateGraph(GraphState)
  .addNode("supervisor", supervisorNode)
  .addNode("retrieval", retrievalNode)
  .addNode("reasoning", reasoningNode)
  .addEdge(START, "supervisor")
  .addConditionalEdges("supervisor", (state: ChatGraphState) => (state.route === "rag" ? "retrieval" : "reasoning"), [
    "retrieval",
    "reasoning",
  ])
  .addEdge("retrieval", "reasoning")
  .addEdge("reasoning", END);

const compiledGraph = graph.compile();

export interface RunChatGraphInput {
  userId: string;
  sessionId: string;
  userMessage: string;
  model: string;
  conversationHistory: ChatGraphState["conversationHistory"];
}

export async function runChatGraph(input: RunChatGraphInput): Promise<ChatGraphState> {
  const result = await compiledGraph.invoke({
    userId: input.userId,
    sessionId: input.sessionId,
    userMessage: input.userMessage,
    model: input.model,
    conversationHistory: input.conversationHistory,
  });

  return result;
}
