import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";
import { authRateLimit } from "../middleware/rateLimit";

const router = Router();

router.post("/signup", authRateLimit, authController.signup);
router.post("/login", authRateLimit, authController.login);
router.post("/logout", authController.logout);
router.get("/me", requireAuth, authController.me);

export default router;
