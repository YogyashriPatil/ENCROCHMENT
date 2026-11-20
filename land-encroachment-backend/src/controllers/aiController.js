
import pool from "../config/db.js";
import { randomUUID } from "crypto";

const analyzeImages = async (req, res) => {
  let client;

  try {
    // 1. Get uploaded images
    const beforeImage = req.files?.before_image?.[0];
    const afterImage = req.files?.after_image?.[0];

    if (!beforeImage || !afterImage) {
      return res.status(400).json({
        success: false,
        message: "Both before_image and after_image are required."
      });
    }

    // 2. Get optional database references
    const { parcel_id, old_image_id, new_image_id } = req.body || {};

    const aiServiceUrl = process.env.AI_SERVICE_URL;

    if (!aiServiceUrl) {
      return res.status(500).json({
        success: false,
        message: "AI_SERVICE_URL is not configured."
      });
    }

    // 3. Forward images to FastAPI
    const formData = new FormData();

    formData.append(
      "before_image",
      new Blob([beforeImage.buffer], {
        type: beforeImage.mimetype
      }),
      beforeImage.originalname
    );

    formData.append(
      "after_image",
      new Blob([afterImage.buffer], {
        type: afterImage.mimetype
      }),
      afterImage.originalname
    );

    const aiResponse = await fetch(
      `${aiServiceUrl}/api/ai/analyze`,
      {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(180000)
      }
    );

    const result = await aiResponse.json();

    if (!aiResponse.ok) {
      return res.status(aiResponse.status).json({
        success: false,
        message: "AI service returned an error.",
        error: result
      });
    }

    // 4. Extract building detection results
    const analysisData = result.data;
    const buildingAnalysis = analysisData?.building_analysis;

    if (!Array.isArray(buildingAnalysis)) {
      return res.status(502).json({
        success: false,
        message: "AI service returned an invalid building analysis."
      });
    }

    // 5. Generate unique analysis ID
    const analysisRunId = randomUUID();

    // 6. Save all building detections in one transaction
    client = await pool.connect();

    await client.query("BEGIN");

    const savedDetections = [];

    for (const building of buildingAnalysis) {
      const insertQuery = `
        INSERT INTO public.ai_building_detections (
          analysis_run_id,
          parcel_id,
          old_image_id,
          new_image_id,
          building_id,
          confidence,
          bounding_box,
          changed_pixels,
          total_pixels,
          overlap_percentage,
          detection_status
        )
        VALUES (
          $1, $2, $3, $4, $5, $6,
          $7::jsonb, $8, $9, $10, $11
        )
        RETURNING *
      `;

      const values = [
        analysisRunId,
        parcel_id || null,
        old_image_id || null,
        new_image_id || null,
        building.building_id,
        building.confidence,
        JSON.stringify(building.bounding_box || []),
        building.changed_pixels ?? 0,
        building.total_pixels ?? 0,
        building.overlap_percentage ?? 0,
        building.status || "Unknown"
      ];

      const dbResult = await client.query(insertQuery, values);

      savedDetections.push(dbResult.rows[0]);
    }

    await client.query("COMMIT");

    // 7. Return AI results and saved database records
    return res.status(200).json({
      success: true,
      message: "AI analysis completed and results saved successfully.",
      analysis_run_id: analysisRunId,
      total_buildings: analysisData.total_buildings,
      potential_changes: analysisData.potential_changes,
      saved_records: savedDetections.length,
      data: {
        building_analysis: savedDetections
      },
      before_image_url: analysisData.before_image_url
      ? `${aiServiceUrl}${analysisData.before_image_url}`
      : null,

    after_image_url: analysisData.after_image_url
      ? `${aiServiceUrl}${analysisData.after_image_url}`
      : null,

    change_mask_url: analysisData.change_mask_url
      ? `${aiServiceUrl}${analysisData.change_mask_url}`
      : null,

    visualization_url: analysisData.visualization_url
      ? `${aiServiceUrl}${analysisData.visualization_url}`
      : null
    });

  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Database rollback error:", rollbackError);
      }
    }

    console.error("AI analysis and database error:", error);

    return res.status(500).json({
      success: false,
      message: "AI analysis or database saving failed.",
      error: error.message
    });

  } finally {
    if (client) {
      client.release();
    }
  }
};

export { analyzeImages };
