import { describe, it, expect } from "vitest";
import { parseRouteDecision } from "../supervisor.node";

describe("parseRouteDecision", () => {
  it("routes to rag when the model answers 'rag'", () => {
    expect(parseRouteDecision("rag")).toBe("rag");
    expect(parseRouteDecision("  RAG  ")).toBe("rag");
    expect(parseRouteDecision("The answer is rag.")).toBe("rag");
  });

  it("routes to history_only when the model answers 'history_only'", () => {
    expect(parseRouteDecision("history_only")).toBe("history_only");
    expect(parseRouteDecision("History_Only")).toBe("history_only");
  });

  it("defaults to general for anything else, including empty or garbled output", () => {
    expect(parseRouteDecision("general")).toBe("general");
    expect(parseRouteDecision("")).toBe("general");
    expect(parseRouteDecision("I'm not sure what you mean")).toBe("general");
  });

  it("prefers rag over history_only if a response nonsensically mentions both", () => {
    // 'rag' is checked first — this documents the precedence rather than asserting it's ideal.
    expect(parseRouteDecision("rag or history_only")).toBe("rag");
  });
});
