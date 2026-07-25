import rateLimit from "express-rate-limit";

// Brute-force guard for signup/login: generous enough for normal retries (typos, forgotten
// passwords) but bounded enough to slow down credential-stuffing / password-guessing attempts.
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please wait a few minutes and try again." },
});

// Each chat message costs real Gemini API quota (2-3 calls), which is scarce on the free
// tier. This caps abuse/runaway-loop scenarios independent of the upstream quota itself.
export const chatRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many messages sent. Please slow down and try again shortly." },
});
