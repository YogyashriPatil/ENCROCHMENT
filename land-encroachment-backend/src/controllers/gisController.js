
import { query } from "../config/db.js";

// GET /api/gis/spatial-analysis
// Find intersections between parcel boundaries and detected changes.
export const getSpatialAnalysis = async (req, res) => {
  try {
    const result = await query(`
      WITH intersections AS (
        SELECT
          dc.id AS change_id,
          dc.parcel_id,
          dc.change_type,
          dc.confidence,
          dc.affected_area_sq_m,
          dc.detected_at,

          lp.parcel_code,
          lp.location_name,

          lp.boundary,
          dc.change_geometry,

          extensions.ST_Intersection(
            lp.boundary,
            dc.change_geometry
          ) AS overlap_geometry

        FROM public.detected_changes dc

        INNER JOIN public.land_parcels lp
          ON dc.parcel_id = lp.id

        WHERE
          lp.boundary IS NOT NULL
          AND dc.change_geometry IS NOT NULL
          AND extensions.ST_Intersects(
            lp.boundary,
            dc.change_geometry
          )
      ),

      measurements AS (
        SELECT
          *,

          extensions.ST_Area(
            boundary::extensions.geography
          ) AS parcel_area_calculated,

          extensions.ST_Area(
            change_geometry::extensions.geography
          ) AS change_area_calculated,

          extensions.ST_Area(
            overlap_geometry::extensions.geography
          ) AS overlap_area_calculated,

          CASE
            WHEN extensions.ST_IsEmpty(overlap_geometry)
            THEN NULL
            ELSE extensions.ST_AsGeoJSON(
              extensions.ST_Multi(
                extensions.ST_CollectionExtract(
                  overlap_geometry,
                  3
                )
              )
            )::json
          END AS overlap_geojson

        FROM intersections
      )

      SELECT
        change_id,
        parcel_id,
        parcel_code,
        location_name,
        change_type,
        confidence,
        affected_area_sq_m,
        detected_at,

        ROUND(parcel_area_calculated::numeric, 2)
          AS parcel_area_sq_m,

        ROUND(change_area_calculated::numeric, 2)
          AS change_area_sq_m,

        ROUND(overlap_area_calculated::numeric, 2)
          AS overlap_area_sq_m,

        ROUND(
        (
            (
            overlap_area_calculated /
            NULLIF(change_area_calculated, 0)
            ) * 100
        )::numeric,
        2
        ) AS overlap_percentage,

        overlap_geojson

      FROM measurements

      WHERE overlap_area_calculated > 0

      ORDER BY overlap_area_calculated DESC
    `);

    res.status(200).json({
      success: true,
      message: "GIS spatial analysis completed successfully",
      count: result.rows.length,
      data: result.rows,
    });

  } catch (error) {
    console.error("GIS spatial analysis error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to perform GIS spatial analysis",
    });
  }
};

// Calculate an explainable risk score for each spatial intersection.
const calculateRiskScore = (confidence, overlapPercentage, overlapArea) => {
  const aiConfidence = Math.min(
    100,
    Math.max(0, Number(confidence) || 0)
  );

  const overlap = Math.min(
    100,
    Math.max(0, Number(overlapPercentage) || 0)
  );

  const area = Math.max(0, Number(overlapArea) || 0);

  // Prototype weights:
  // AI confidence = 40%
  // Spatial overlap = 35%
  // Affected area = 25%

  const areaScore = Math.min((area / 100) * 100, 100);

  const score =
    aiConfidence * 0.40 +
    overlap * 0.35 +
    areaScore * 0.25;

  const riskScore = Math.round(score * 100) / 100;

  let riskLevel = "Low";

  if (riskScore >= 70) {
    riskLevel = "High";
  } else if (riskScore >= 40) {
    riskLevel = "Medium";
  }

  return {
    risk_score: riskScore,
    risk_level: riskLevel,
    score_breakdown: {
      confidence_contribution: Number(
        (aiConfidence * 0.40).toFixed(2)
      ),
      overlap_contribution: Number(
        (overlap * 0.35).toFixed(2)
      ),
      area_contribution: Number(
        (areaScore * 0.25).toFixed(2)
      ),
    },
  };
};


// GET /api/gis/risk-assessment
export const getRiskAssessment = async (req, res) => {
  try {
    const result = await query(`
      SELECT
        dc.id AS change_id,
        dc.parcel_id,
        dc.change_type,
        dc.confidence,
        dc.detected_at,

        lp.parcel_code,
        lp.location_name,

        ROUND(
          (
            extensions.ST_Area(
              extensions.ST_Intersection(
                lp.boundary,
                dc.change_geometry
              )::extensions.geography
            )
          )::numeric,
          2
        ) AS overlap_area_sq_m,

        ROUND(
          (
            extensions.ST_Area(
              extensions.ST_Intersection(
                lp.boundary,
                dc.change_geometry
              )::extensions.geography
            )
            /
            NULLIF(
              extensions.ST_Area(
                dc.change_geometry::extensions.geography
              ),
              0
            )
          * 100)::numeric,
          2
        ) AS overlap_percentage

      FROM public.detected_changes dc

      INNER JOIN public.land_parcels lp
        ON dc.parcel_id = lp.id

      WHERE
        lp.boundary IS NOT NULL
        AND dc.change_geometry IS NOT NULL
        AND extensions.ST_Intersects(
          lp.boundary,
          dc.change_geometry
        )

      ORDER BY dc.detected_at DESC
    `);

    const assessments = result.rows.map((item) => ({
      ...item,
      ...calculateRiskScore(
        item.confidence,
        item.overlap_percentage,
        item.overlap_area_sq_m
      ),
    }));

    res.status(200).json({
      success: true,
      message: "Risk assessment completed successfully",
      count: assessments.length,
      data: assessments,
    });

  } catch (error) {
    console.log("========== RISK ASSESSMENT ERROR ==========");

    console.log("Error object:", error);
    console.log("Error message:", error?.message);
    console.log("Error code:", error?.code);
    console.log("Error detail:", error?.detail);
    console.log("Error stack:", error?.stack);

    console.log("============================================");

    return res.status(500).json({
      success: false,
      message: "Failed to calculate risk assessment",
      error: error?.message || String(error),
    });
  }
};
