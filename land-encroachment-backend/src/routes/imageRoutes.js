import express from "express";

import {
  getAllImages,
  getImagesByParcel,
  createImage,
  uploadImage,
} from "../controllers/imageController.js";

import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/", getAllImages);
router.get("/parcel/:parcelId", getImagesByParcel);
router.post("/", createImage);
router.post("/upload", upload.single("image"), uploadImage);

export default router;