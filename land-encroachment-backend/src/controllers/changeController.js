
import { query } from "../config/db.js";

// GET /api/changes
export const getAllChanges = async (req, res) => {
  try {
    const result = await query(`
      SELECT
        dc.*,
        lp.parcel_code,
        lp.location_name
      FROM public.detected_changes dc
      LEFT JOIN public.land_parcels lp
        ON dc.parcel_id = lp.id
      ORDER BY dc.detected_at DESC
    `);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get changes error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve detected changes",
    });
  }
};

// GET /api/changes/parcel/:parcelId
export const getChangesByParcel = async (req, res) => {
  try {
    const { parcelId } = req.params;

    const result = await query(
      `SELECT *
       FROM public.detected_changes
       WHERE parcel_id = $1
       ORDER BY detected_at DESC`,
      [parcelId]
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get parcel changes error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve parcel changes",
    });
  }
};

// POST /api/changes
export const createChange = async (req, res) => {
  try {
    const {
      parcel_id,
      old_image_id,
      new_image_id,
      change_type,
      confidence,
      affected_area_sq_m,
      change_geometry,
    } = req.body;

    if (!parcel_id || !old_image_id || !new_image_id || !change_type) {
      return res.status(400).json({
        success: false,
        message: "Parcel, both image IDs and change type are required",
      });
    }

    if (
      confidence !== undefined &&
      confidence !== null &&
      (!Number.isFinite(Number(confidence)) ||
        Number(confidence) < 0 ||
        Number(confidence) > 100)
    ) {
      return res.status(400).json({
        success: false,
        message: "Confidence must be between 0 and 100",
      });
    }

    if (
      affected_area_sq_m !== undefined &&
      affected_area_sq_m !== null &&
      (!Number.isFinite(Number(affected_area_sq_m)) ||
        Number(affected_area_sq_m) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Affected area must be a non-negative number",
      });
    }

    if (
      change_geometry &&
      (
        !["Polygon", "MultiPolygon"].includes(change_geometry.type) ||
        !Array.isArray(change_geometry.coordinates)
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Change geometry must be a GeoJSON Polygon or MultiPolygon",
      });
    }

    const result = await query(
      `
      INSERT INTO public.detected_changes (
        parcel_id,
        old_image_id,
        new_image_id,
        change_type,
        confidence,
        affected_area_sq_m,
        change_geometry
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        CASE
          WHEN $7::jsonb IS NULL THEN NULL
          ELSE extensions.ST_Multi(
            extensions.ST_SetSRID(
              extensions.ST_GeomFromGeoJSON($7::text),
              4326
            )
          )
        END
      )
      RETURNING *
      `,
      [
        parcel_id,
        old_image_id,
        new_image_id,
        change_type,
        confidence ?? null,
        affected_area_sq_m ?? null,
        change_geometry ? JSON.stringify(change_geometry) : null,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Detected change saved successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Create change error:", error.message);

    if (error.code === "23503") {
      return res.status(400).json({
        success: false,
        message: "Invalid parcel ID or satellite image ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to save detected change",
    });
  }
};
