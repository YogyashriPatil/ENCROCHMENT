
import express from "express";

import {
  getSpatialAnalysis,getRiskAssessment,
} from "../controllers/gisController.js";

const router = express.Router();

router.get("/spatial-analysis", getSpatialAnalysis);
router.get("/risk-assessment", getRiskAssessment);
export default router;
