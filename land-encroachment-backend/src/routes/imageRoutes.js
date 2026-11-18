
import express from "express";

import {
  getAllImages,
  getImagesByParcel,
  createImage,
} from "../controllers/imageController.js";

const router = express.Router();

router.get("/", getAllImages);

router.get("/parcel/:parcelId", getImagesByParcel);

router.post("/", createImage);

export default router;
