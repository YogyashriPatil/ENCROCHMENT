
import { query } from "../config/db.js";

import supabase from "../config/supabase.js";

import { randomUUID } from "crypto";
import path from "path";

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

    const images = await Promise.all(
      result.rows.map(async (image) => ({
        ...image,
        signed_url: await generateSignedImageUrl(
          image.storage_path
        ),
      }))
    );

    res.status(200).json({
      success: true,
      count: images.length,
      data: images,
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
      `SELECT *
       FROM public.satellite_images
       WHERE parcel_id = $1
       ORDER BY image_date DESC`,
      [parcelId]
    );

    const images = await Promise.all(
      result.rows.map(async (image) => ({
        ...image,
        signed_url: await generateSignedImageUrl(
          image.storage_path
        ),
      }))
    );

    res.status(200).json({
      success: true,
      count: images.length,
      data: images,
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

export const uploadImage = async (req, res) => {
  let uploadedPath = null;

  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image file.",
      });
    }

    const {
      parcel_id,
      image_type,
      image_date,
    } = req.body;

    if (!["Satellite", "Drone"].includes(image_type)) {
      return res.status(400).json({
        success: false,
        message: "Image type must be Satellite or Drone.",
      });
    }

    if (parcel_id) {
      const parcelResult = await query(
        "SELECT id FROM public.land_parcels WHERE id = $1",
        [parcel_id]
      );

      if (parcelResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Land parcel not found.",
        });
      }
    }

    if (image_date && !/^\d{4}-\d{2}-\d{2}$/.test(image_date)) {
      return res.status(400).json({
        success: false,
        message: "Image date must use YYYY-MM-DD format.",
      });
    }

    const extension = path.extname(file.originalname).toLowerCase();

    const safeExtension = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
      "image/tiff": ".tif",
    }[file.mimetype];

    if (!safeExtension || (extension && extension !== safeExtension && !(file.mimetype === "image/jpeg" && extension === ".jpeg"))) {
      return res.status(400).json({
        success: false,
        message: "File extension does not match its image type.",
      });
    }

    const fileName = `${randomUUID()}${safeExtension}`;
    const storagePath = `${image_type.toLowerCase()}/${fileName}`;

    const bucket = process.env.SUPABASE_STORAGE_BUCKET;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    uploadedPath = storagePath;

    const result = await query(
      `INSERT INTO public.satellite_images
       (parcel_id, image_name, image_type, image_date, storage_path)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        parcel_id || null,
        file.originalname,
        image_type,
        image_date || null,
        storagePath,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Image uploaded successfully.",
      data: result.rows[0],
    });

  } catch (error) {
    // Remove the Storage file if the database insert failed.
    if (uploadedPath) {
      const { error: cleanupError } = await supabase.storage
        .from(process.env.SUPABASE_STORAGE_BUCKET)
        .remove([uploadedPath]);

      if (cleanupError) {
        console.error("Storage cleanup failed:", cleanupError.message);
      }
    }

    console.error("Image upload error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Image upload failed.",
    });
  }
};

const generateSignedImageUrl = async (storagePath) => {
  if (!storagePath) return null;

  const { data, error } = await supabase.storage
    .from(process.env.SUPABASE_STORAGE_BUCKET)
    .createSignedUrl(storagePath, 3600);

  if (error) {
    console.error("Signed URL error:", error.message);
    return null;
  }

  return data.signedUrl;
};
