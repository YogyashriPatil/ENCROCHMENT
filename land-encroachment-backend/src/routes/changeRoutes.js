
import express from "express";

import {
  getAllChanges,
  getChangesByParcel,
  createChange,
} from "../controllers/changeController.js";

const router = express.Router();

router.get("/", getAllChanges);

router.get("/parcel/:parcelId", getChangesByParcel);

router.post("/", createChange);

export default router;
