
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { query } from "./src/config/db.js";
import parcelRoutes from "./src/routes/parcelRoutes.js";
import imageRoutes from "./src/routes/imageRoutes.js";
dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  })
);

app.use(express.json());

// Home route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to TerraWatch Backend API",
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    project: "TerraWatch",
    status: "Running",
  });
});

// Database connection test
app.get("/api/db-test", async (req, res) => {
  try {
    const result = await query(`
      SELECT
        current_database() AS database,
        PostGIS_Full_Version() AS postgis_version
    `);

    res.json({
      success: true,
      message: "TerraWatch database connected successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Database connection error:", error.message);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

// Land parcel routes
app.use("/api/parcels", parcelRoutes);
app.use("/api/images", imageRoutes);
// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`TerraWatch Backend running on port ${PORT}`);
});
