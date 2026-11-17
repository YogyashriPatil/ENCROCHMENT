import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to TerraWatch Backend API",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    project: "TerraWatch",
    status: "Running",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`TerraWatch Backend running on port ${PORT}`);
});