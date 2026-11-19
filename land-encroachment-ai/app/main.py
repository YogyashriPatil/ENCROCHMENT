from fastapi import FastAPI
from app.api.routes.detection_routes import router as detection_router
from pathlib import Path
from fastapi.staticfiles import StaticFiles
app = FastAPI(
    title="TerraWatch AI Service",
    description="AI-based land change detection and building monitoring",
    version="1.0.0"
)


@app.get("/")
def home():
    return {
        "success": True,
        "message": "TerraWatch AI Service is running"
    }


@app.get("/health")
def health():
    return {
        "success": True,
        "service": "TerraWatch AI",
        "status": "healthy"
    }

PROJECT_ROOT = Path(__file__).resolve().parents[1]

VISUALIZATION_DIR = PROJECT_ROOT / "results" / "visualizations"

VISUALIZATION_DIR.mkdir(parents=True, exist_ok=True)

app.mount(
    "/visualizations",
    StaticFiles(directory=str(VISUALIZATION_DIR)),
    name="visualizations"
)

app.include_router(
    detection_router,
    prefix="/api/ai",
    tags=["AI Detection"]
)
