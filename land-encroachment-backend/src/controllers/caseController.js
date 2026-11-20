
import { query } from "../config/db.js";
import { randomUUID } from "crypto";
// GET /api/cases
// Retrieve all cases with parcel information
export const getAllCases = async (req, res) => {
  try {
    const { risk_level, status } = req.query;

    const result = await query(
      `
      SELECT
        ec.*,
        lp.parcel_code,
        lp.location_name,
        dc.change_type,
        dc.confidence,
        dc.affected_area_sq_m
      FROM public.encroachment_cases ec
      LEFT JOIN public.land_parcels lp
        ON ec.parcel_id = lp.id
      LEFT JOIN public.detected_changes dc
        ON ec.detected_change_id = dc.id
      WHERE
        ($1::text IS NULL OR ec.risk_level = $1)
        AND
        ($2::text IS NULL OR ec.status = $2)
      ORDER BY ec.created_at DESC
      `,
      [risk_level || null, status || null]
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get cases error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve cases",
    });
  }
};

// GET /api/cases/:id
// Retrieve one case
export const getCaseById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `
      SELECT
        ec.*,
        lp.parcel_code,
        lp.location_name,
        dc.change_type,
        dc.confidence,
        dc.affected_area_sq_m
      FROM public.encroachment_cases ec
      LEFT JOIN public.land_parcels lp
        ON ec.parcel_id = lp.id
      LEFT JOIN public.detected_changes dc
        ON ec.detected_change_id = dc.id
      WHERE ec.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Case not found",
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get case error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve case",
    });
  }
};

// POST /api/cases
// Create a case from an existing detected change
export const createCase = async (req, res) => {
  try {
    const {
      case_code,
      parcel_id,
      detected_change_id,
      risk_level,
      description,
    } = req.body;

    if (
      !case_code?.trim() ||
      !parcel_id ||
      !detected_change_id ||
      !risk_level
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Case code, parcel ID, detected change ID and risk level are required",
      });
    }

    if (!["High", "Medium", "Low"].includes(risk_level)) {
      return res.status(400).json({
        success: false,
        message: "Risk level must be High, Medium or Low",
      });
    }

    // Ensure the detected change belongs to the supplied parcel.
    const result = await query(
      `
      INSERT INTO public.encroachment_cases (
        case_code,
        parcel_id,
        detected_change_id,
        risk_level,
        description
      )
      SELECT $1, dc.parcel_id, dc.id, $4, $5
      FROM public.detected_changes dc
      WHERE dc.id = $3
        AND dc.parcel_id = $2
      RETURNING *
      `,
      [
        case_code.trim(),
        parcel_id,
        detected_change_id,
        risk_level,
        description || null,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Detected change not found or it does not belong to this parcel",
      });
    }

    res.status(201).json({
      success: true,
      message: "Potential encroachment case created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Create case error:", error.message);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "This case code already exists",
      });
    }

    if (error.code === "22P02" || error.code === "23503") {
      return res.status(400).json({
        success: false,
        message: "Invalid parcel ID or detected change ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create case",
    });
  }
};

// PATCH /api/cases/:id/status
// Update case review status
export const updateCaseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "Under Review",
      "Verified",
      "Rejected",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid case status",
      });
    }

    const result = await query(
      `
      UPDATE public.encroachment_cases
      SET status = $1
      WHERE id = $2
      RETURNING *
      `,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Case not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Case status updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Update case status error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to update case status",
    });
  }
};

// POST /api/cases/from-ai
// Create an encroachment case from an AI building detection
export const createCaseFromAI = async (req, res) => {
  try {
    const { ai_detection_id, risk_level, description } = req.body;

    // 1. Validate required fields
    if (!ai_detection_id || !risk_level) {
      return res.status(400).json({
        success: false,
        message: "AI detection ID and risk level are required."
      });
    }

    // 2. Validate risk level
    if (!["High", "Medium", "Low"].includes(risk_level)) {
      return res.status(400).json({
        success: false,
        message: "Risk level must be High, Medium or Low."
      });
    }

    // 3. Get AI detection
    const detectionResult = await query(
      `
      SELECT
        id,
        analysis_run_id,
        parcel_id,
        building_id,
        confidence,
        overlap_percentage,
        detection_status
      FROM public.ai_building_detections
      WHERE id = $1
      `,
      [ai_detection_id]
    );

    if (detectionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "AI detection not found."
      });
    }

    const detection = detectionResult.rows[0];

    // 4. Only potential changes can become cases
    if (detection.detection_status !== "potential_change") {
      return res.status(400).json({
        success: false,
        message: "Cases can only be created from potential change detections."
      });
    }

    if (!detection.parcel_id) {
      return res.status(400).json({
        success: false,
        message: "This AI detection is not linked to a land parcel."
      });
    }

    // 5. Check for an existing case
    const existingCase = await query(
      `
      SELECT id, case_code
      FROM public.encroachment_cases
      WHERE ai_detection_id = $1
      `,
      [ai_detection_id]
    );

    if (existingCase.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "A case already exists for this AI detection.",
        data: existingCase.rows[0]
      });
    }

    // 6. Generate unique case code
    const caseCode = `AI-${randomUUID().slice(0, 8).toUpperCase()}`;

    // 7. Prepare case description
    const caseDescription = description?.trim() ||
      `Potential change detected by AI. Building ID: ${detection.building_id}, AI confidence: ${detection.confidence ?? "N/A"}, overlap: ${detection.overlap_percentage ?? 0}%. Requires human verification.`;

    // 8. Create case
    const result = await query(
      `
      INSERT INTO public.encroachment_cases (
        case_code,
        parcel_id,
        ai_detection_id,
        risk_level,
        status,
        description
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        caseCode,
        detection.parcel_id,
        ai_detection_id,
        risk_level,
        "Under Review",
        caseDescription
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Potential encroachment case created from AI detection.",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Create AI case error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "A case already exists for this AI detection."
      });
    }

    if (error.code === "22P02" || error.code === "23503") {
      return res.status(400).json({
        success: false,
        message: "Invalid AI detection or parcel ID."
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create case from AI detection."
    });
  }
};
