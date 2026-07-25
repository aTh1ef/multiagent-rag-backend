import multer from "multer";
import { SUPPORTED_MIME_TYPES } from "../utils/textExtraction";

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!SUPPORTED_MIME_TYPES.includes(file.mimetype as (typeof SUPPORTED_MIME_TYPES)[number])) {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Accepted types: PDF, TXT, DOCX.`));
      return;
    }
    cb(null, true);
  },
});
