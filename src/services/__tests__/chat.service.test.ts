import { describe, it, expect } from "vitest";
import { isAllowedModel } from "../chat.service";
import { ALLOWED_GEMINI_MODELS } from "../../config/env";

describe("isAllowedModel", () => {
  it("accepts every model in the allowlist", () => {
    for (const model of ALLOWED_GEMINI_MODELS) {
      expect(isAllowedModel(model)).toBe(true);
    }
  });

  it("rejects models outside the allowlist", () => {
    expect(isAllowedModel("gemini-2.5-pro")).toBe(false);
    expect(isAllowedModel("gpt-4")).toBe(false);
    expect(isAllowedModel("gemini-2.5-flash-lite")).toBe(false);
  });

  it("rejects non-string and empty values", () => {
    expect(isAllowedModel(undefined)).toBe(false);
    expect(isAllowedModel(null)).toBe(false);
    expect(isAllowedModel(123)).toBe(false);
    expect(isAllowedModel("")).toBe(false);
  });
});
