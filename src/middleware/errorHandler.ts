import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import multer from "multer";
import { GoogleGenerativeAIFetchError } from "@google/generative-ai";

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Validation failed", details: err.flatten().fieldErrors });
  }

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }

  if (err instanceof Error && err.message.startsWith("Unsupported file type")) {
    return res.status(400).json({ error: err.message });
  }

  if (err instanceof GoogleGenerativeAIFetchError && err.status === 429) {
    console.error(err);
    return res.status(429).json({
      error:
        "The Gemini free-tier request quota has been reached for this model. Please wait a minute and try again, or switch to a different model in the session's model picker.",
    });
  }

  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
}
