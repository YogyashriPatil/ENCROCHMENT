
import pool from "../config/db.js";

// GET /api/verifications
// Retrieve verification history
export const getAllVerifications = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        cv.*,
        ec.case_code,
        u.full_name AS reviewer_name
      FROM public.case_verifications cv
      JOIN public.encroachment_cases ec
        ON cv.case_id = ec.id
      LEFT JOIN public.users u
        ON cv.reviewer_id = u.id
      ORDER BY cv.reviewed_at DESC
    `);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get verification history:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve verification history",
    });
  }
};

// GET /api/verifications/case/:caseId
// Retrieve history for one case
export const getVerificationsByCase = async (req, res) => {
  try {
    const { caseId } = req.params;

    const result = await pool.query(
      `
      SELECT
        cv.*,
        u.full_name AS reviewer_name
      FROM public.case_verifications cv
      LEFT JOIN public.users u
        ON cv.reviewer_id = u.id
      WHERE cv.case_id = $1
      ORDER BY cv.reviewed_at DESC
      `,
      [caseId]
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get case verification:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve case verification history",
    });
  }
};

// POST /api/verifications
// Submit a human verification decision
export const createVerification = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      case_id,
      reviewer_id,
      decision,
      remarks,
    } = req.body;

    const allowedDecisions = [
      "Verified",
      "Rejected",
      "Needs More Review",
    ];

    if (!case_id || !decision) {
      return res.status(400).json({
        success: false,
        message: "Case ID and decision are required",
      });
    }

    if (!allowedDecisions.includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification decision",
      });
    }

    if (remarks !== undefined && typeof remarks !== "string") {
      return res.status(400).json({
        success: false,
        message: "Remarks must be text",
      });
    }

    await client.query("BEGIN");

    // Check that the case exists
    const caseResult = await client.query(
      `SELECT id FROM public.encroachment_cases
       WHERE id = $1
       FOR UPDATE`,
      [case_id]
    );

    if (caseResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Encroachment case not found",
      });
    }

    // Insert verification history
    const verificationResult = await client.query(
      `
      INSERT INTO public.case_verifications (
        case_id,
        reviewer_id,
        decision,
        remarks
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [
        case_id,
        reviewer_id || null,
        decision,
        remarks || null,
      ]
    );

    // Map the review decision to case status
    const newStatus =
      decision === "Needs More Review"
        ? "Under Review"
        : decision;

    // Update case status
    await client.query(
      `
      UPDATE public.encroachment_cases
      SET status = $1
      WHERE id = $2
      `,
      [newStatus, case_id]
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Verification recorded successfully",
      data: {
        verification: verificationResult.rows[0],
        case_status: newStatus,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create verification error:", error.message);

    if (error.code === "23503") {
      return res.status(400).json({
        success: false,
        message: "Invalid case ID or reviewer ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to record verification",
    });
  } finally {
    client.release();
  }
};
