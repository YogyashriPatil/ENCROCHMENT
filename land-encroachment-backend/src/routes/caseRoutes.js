
import express from "express";

import {
  getAllCases,
  getCaseById,
  createCase,
  updateCaseStatus,
} from "../controllers/caseController.js";

const router = express.Router();

router.get("/", getAllCases);

router.post("/", createCase);

router.patch("/:id/status", updateCaseStatus);

router.get("/:id", getCaseById);

export default router;
