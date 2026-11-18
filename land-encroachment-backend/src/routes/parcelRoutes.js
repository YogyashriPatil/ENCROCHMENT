import express from "express";

import {
  getAllParcels,
  getParcelById,
  createParcel,
} from "../controllers/parcelController.js";

const router = express.Router();

router.get("/", getAllParcels);
router.get("/:id", getParcelById);
router.post("/", createParcel);

export default router;