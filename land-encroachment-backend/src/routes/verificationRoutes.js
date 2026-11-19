
import express from "express";

import {
  getAllVerifications,
  getVerificationsByCase,
  createVerification,
} from "../controllers/verificationController.js";

const router = express.Router();

router.get("/", getAllVerifications);

router.get("/case/:caseId", getVerificationsByCase);

router.post("/", createVerification);

export default router;
