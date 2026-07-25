import { Request, Response } from "express";
import * as documentService from "../services/document.service";
import * as ingestionService from "../services/ingestion.service";
import { HttpError } from "../middleware/errorHandler";

export async function upload(req: Request, res: Response) {
  if (!req.file) {
    throw new HttpError(400, "No file uploaded (expected multipart field 'file')");
  }

  const document = await ingestionService.processDocument(req.user!.userId, req.file);
  res.status(201).json(document);
}

export async function list(req: Request, res: Response) {
  const documents = await documentService.listDocuments(req.user!.userId);
  res.status(200).json({ documents });
}

export async function remove(req: Request, res: Response) {
  await documentService.deleteDocument(req.user!.userId, String(req.params.id));
  res.status(204).send();
}
