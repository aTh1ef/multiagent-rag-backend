import { Router } from "express";
import * as chatController from "../controllers/chat.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.post("/sessions", chatController.createSession);
router.get("/sessions", chatController.listSessions);
router.get("/sessions/:id", chatController.getSession);
router.patch("/sessions/:id", chatController.updateSession);
router.delete("/sessions/:id", chatController.deleteSession);
router.get("/sessions/:id/messages", chatController.listMessages);
router.post("/sessions/:id/messages", chatController.sendMessage);

export default router;
