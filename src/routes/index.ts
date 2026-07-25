import { Router } from "express";
import authRoutes from "./auth.routes";
import documentsRoutes from "./documents.routes";
import chatRoutes from "./chat.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/documents", documentsRoutes);
router.use("/chat", chatRoutes);

export default router;
