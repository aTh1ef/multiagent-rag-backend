import { Router } from "express";
import * as documentsController from "../controllers/documents.controller";
import { requireAuth } from "../middleware/auth";
import { upload } from "../middleware/upload";

const router = Router();

router.use(requireAuth);

router.post("/", upload.single("file"), documentsController.upload);
router.get("/", documentsController.list);
router.delete("/:id", documentsController.remove);

export default router;
