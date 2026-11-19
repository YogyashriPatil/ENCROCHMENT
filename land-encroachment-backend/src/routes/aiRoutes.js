
import express from "express";
import multer from "multer";
import { analyzeImages } from "../controllers/aiController.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024
  },
  fileFilter: (req, file, callback) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/tiff"
    ];

    if (allowedTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error("Only JPG, PNG and TIFF images are allowed."));
    }
  }
});

router.post(
  "/analyze",
  upload.fields([
    { name: "before_image", maxCount: 1 },
    { name: "after_image", maxCount: 1 }
  ]),
  analyzeImages
);

export default router;
