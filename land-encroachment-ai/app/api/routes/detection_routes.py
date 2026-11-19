
from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
from PIL import Image
import tempfile
import shutil

from app.services.encroachment_pipeline import EncroachmentPipeline

router = APIRouter()

# Load both AI models only once.
pipeline = None

MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".tif", ".tiff"}


def get_pipeline():
    global pipeline

    if pipeline is None:
        pipeline = EncroachmentPipeline()

    return pipeline


async def save_uploaded_image(upload: UploadFile, destination: Path):
    extension = Path(upload.filename or "").suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image format: {extension}"
        )

    total_size = 0

    try:
        with destination.open("wb") as output:
            while True:
                chunk = await upload.read(1024 * 1024)

                if not chunk:
                    break

                total_size += len(chunk)

                if total_size > MAX_FILE_SIZE:
                    raise HTTPException(
                        status_code=413,
                        detail="Each image must be 15 MB or smaller."
                    )

                output.write(chunk)

    finally:
        await upload.close()

    if total_size == 0:
        raise HTTPException(
            status_code=400,
            detail="Uploaded image is empty."
        )

    # Verify that the uploaded file is a readable image.
    try:
        with Image.open(destination) as image:
            image.verify()
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is not a valid image."
        )


@router.post("/analyze")
async def analyze_images(
    before_image: UploadFile = File(...),
    after_image: UploadFile = File(...)
):
    try:
        with tempfile.TemporaryDirectory() as temp_dir:

            temp_path = Path(temp_dir)

            before_path = temp_path / (
                "before" + Path(before_image.filename or "").suffix.lower()
            )

            after_path = temp_path / (
                "after" + Path(after_image.filename or "").suffix.lower()
            )

            await save_uploaded_image(before_image, before_path)
            await save_uploaded_image(after_image, after_path)

            # Run YOLO + ChangeFormer pipeline.
            ai_pipeline = get_pipeline()

            results = ai_pipeline.analyze(
                before_image=str(before_path),
                after_image=str(after_path)
            )

            filename = results.pop("visualization_filename")

            results["visualization_url"] = (
                f"/visualizations/{filename}"
            )

            return {
                "success": True,
                "message": "AI image analysis completed successfully.",
                "data": results
            }

    except HTTPException:
        raise

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception as error:
        print("AI analysis error:", repr(error))

        raise HTTPException(
            status_code=500,
            detail="AI analysis failed. Check the AI backend terminal."
        )
