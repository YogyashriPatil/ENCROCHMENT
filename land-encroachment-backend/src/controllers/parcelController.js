
import { query } from "../config/db.js";

// GET /api/parcels
// Retrieve all land parcels
export const getAllParcels = async (req, res) => {
  try {
    const result = await query(`
      SELECT
        id,
        parcel_code,
        location_name,
        area_sq_m,
        CASE
          WHEN boundary IS NOT NULL
          THEN extensions.ST_AsGeoJSON(boundary)::json
          ELSE NULL
        END AS boundary,
        created_at
      FROM public.land_parcels
      ORDER BY created_at DESC
    `);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get parcels error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve land parcels",
    });
  }
};

// GET /api/parcels/:id
// Retrieve one parcel
export const getParcelById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `
      SELECT
        id,
        parcel_code,
        location_name,
        area_sq_m,
        CASE
          WHEN boundary IS NOT NULL
          THEN extensions.ST_AsGeoJSON(boundary)::json
          ELSE NULL
        END AS boundary,
        created_at
      FROM public.land_parcels
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Land parcel not found",
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get parcel error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve land parcel",
    });
  }
};

// POST /api/parcels
// Create a new land parcel
export const createParcel = async (req, res) => {
  try {
    const {
      parcel_code,
      location_name,
      area_sq_m,
      boundary,
    } = req.body;

    if (!parcel_code || !parcel_code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Parcel code is required",
      });
    }

    if (
      area_sq_m !== undefined &&
      area_sq_m !== null &&
      (!Number.isFinite(Number(area_sq_m)) ||
        Number(area_sq_m) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Area must be a valid non-negative number",
      });
    }

    if (
      boundary !== undefined &&
      boundary !== null &&
      (
        !["Polygon", "MultiPolygon"].includes(boundary.type) ||
        !Array.isArray(boundary.coordinates)
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Boundary must be a valid GeoJSON Polygon or MultiPolygon",
      });
    }

    const result = await query(
      `
      INSERT INTO public.land_parcels (
        parcel_code,
        location_name,
        area_sq_m,
        boundary
      )
      VALUES (
        $1,
        $2,
        $3,
        CASE
          WHEN $4::jsonb IS NULL THEN NULL
          ELSE extensions.ST_Multi(
            extensions.ST_SetSRID(
              extensions.ST_GeomFromGeoJSON($4::text),
              4326
            )
          )
        END
      )
      RETURNING
        id,
        parcel_code,
        location_name,
        area_sq_m,
        created_at
      `,
      [
        parcel_code.trim(),
        location_name || null,
        area_sq_m ?? null,
        boundary ? JSON.stringify(boundary) : null,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Land parcel created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Create parcel error:", error.message);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "This parcel code already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create land parcel",
    });
  }
};
