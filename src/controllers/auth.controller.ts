import { Request, Response } from "express";
import { z } from "zod";
import * as authService from "../services/auth.service";
import { env } from "../config/env";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export async function signup(req: Request, res: Response) {
  const body = signupSchema.parse(req.body);
  const { user, token } = await authService.signup(body.email, body.password, body.name);
  res.cookie("token", token, COOKIE_OPTIONS);
  res.status(201).json({ user, token });
}

export async function login(req: Request, res: Response) {
  const body = loginSchema.parse(req.body);
  const { user, token } = await authService.login(body.email, body.password);
  res.cookie("token", token, COOKIE_OPTIONS);
  res.status(200).json({ user, token });
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie("token");
  res.status(200).json({});
}

export async function me(req: Request, res: Response) {
  const user = await authService.getUserById(req.user!.userId);
  res.status(200).json(user);
}
