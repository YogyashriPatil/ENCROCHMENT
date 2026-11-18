
import { query } from "../config/db.js";

// GET /api/images
export const getAllImages = async (req, res) => {
  try {
    const result = await query(`
      SELECT
        id,
        parcel_id,
        image_name,
        image_type,
        image_date,
        storage_path,
        uploaded_at
      FROM public.satellite_images
      ORDER BY uploaded_at DESC
    `);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get images error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve images",
    });
  }
};

// GET /api/images/parcel/:parcelId
export const getImagesByParcel = async (req, res) => {
  try {
    const { parcelId } = req.params;

    const result = await query(
      `SELECT * FROM public.satellite_images
       WHERE parcel_id = $1
       ORDER BY image_date DESC`,
      [parcelId]
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get parcel images error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve parcel images",
    });
  }
};

// POST /api/images
export const createImage = async (req, res) => {
  try {
    const {
      parcel_id,
      image_name,
      image_type,
      image_date,
      storage_path,
    } = req.body;

    if (!image_name || !image_name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Image name is required",
      });
    }

    const allowedTypes = ["Satellite", "Drone"];

    if (!allowedTypes.includes(image_type)) {
      return res.status(400).json({
        success: false,
        message: "Image type must be Satellite or Drone",
      });
    }

    if (image_date && !/^\d{4}-\d{2}-\d{2}$/.test(image_date)) {
      return res.status(400).json({
        success: false,
        message: "Image date must use YYYY-MM-DD format",
      });
    }

    const result = await query(
      `INSERT INTO public.satellite_images
       (parcel_id, image_name, image_type, image_date, storage_path)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        parcel_id || null,
        image_name.trim(),
        image_type,
        image_date || null,
        storage_path || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Image metadata saved successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Create image error:", error.message);

    if (error.code === "23503") {
      return res.status(400).json({
        success: false,
        message: "The specified parcel does not exist",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to save image metadata",
    });
  }
};
