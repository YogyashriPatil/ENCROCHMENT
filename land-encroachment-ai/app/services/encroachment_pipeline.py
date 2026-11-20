
from pathlib import Path
import uuid
import cv2
import numpy as np

from app.models.building_detector import BuildingDetector
from app.models.change_detector import ChangeDetector


class EncroachmentPipeline:

    def __init__(self):
        self.building_detector = BuildingDetector()
        self.change_detector = ChangeDetector()

        project_root = Path(__file__).resolve().parents[2]

        self.visualization_dir = (
            project_root / "results" / "visualizations"
        )

        self.visualization_dir.mkdir(
            parents=True,
            exist_ok=True
        )

        print("Encroachment pipeline initialized successfully!")

    def analyze(self, before_image, after_image):

        # 1. Detect buildings using YOLO.
        buildings = self.building_detector.detect_buildings(
            image_path=str(after_image),
            confidence=0.15
        )

        # 2. Detect changes using ChangeFormer.
        change_mask = self.change_detector.detect_changes(
            str(before_image),
            str(after_image)
        )

        # 3. Read original images.
        before = cv2.imread(str(before_image))
        image = cv2.imread(str(after_image))

        if before is None:
            raise ValueError("Unable to read previous image.")

        if image is None:
            raise ValueError("Unable to read latest image.")

        image_height, image_width = image.shape[:2]

        if before.shape[:2] != image.shape[:2]:
            raise ValueError(
                "Before and after images must have the same dimensions."
            )

        # 4. Resize change mask if required.
        if change_mask.ndim == 3:
            change_mask = cv2.cvtColor(
                change_mask.astype(np.uint8),
                cv2.COLOR_BGR2GRAY
            )

        if change_mask.shape != (image_height, image_width):
            change_mask = cv2.resize(
                change_mask.astype(np.uint8),
                (image_width, image_height),
                interpolation=cv2.INTER_NEAREST
            )

        # Convert the model output into a proper black-and-white mask.
        # 0 = unchanged (black)
        # 255 = changed (white)
        binary_mask = np.where(
            change_mask > 0,
            255,
            0
        ).astype(np.uint8)

        analysis_results = []

        # 5. Analyze every detected building.
        for index, building in enumerate(buildings, start=1):

            x1, y1, x2, y2 = building["bbox"]

            x1 = max(0, min(image_width - 1, int(x1)))
            y1 = max(0, min(image_height - 1, int(y1)))
            x2 = max(0, min(image_width, int(x2)))
            y2 = max(0, min(image_height, int(y2)))

            building_mask = binary_mask[y1:y2, x1:x2]

            total_pixels = building_mask.size

            changed_pixels = int(
                np.count_nonzero(building_mask)
            )

            overlap_percentage = (
                (changed_pixels / total_pixels) * 100
                if total_pixels > 0 else 0.0
            )

            if overlap_percentage >= 5:
                status = "Potential Change Detected"
                box_color = (0, 215, 255)
            else:
                status = "No Significant Change"
                box_color = (0, 200, 0)

            confidence = float(building["confidence"])

            analysis_results.append({
                "building_id": index,
                "confidence": round(confidence, 4),
                "bounding_box": [
                    x1, y1, x2, y2
                ],
                "changed_pixels": changed_pixels,
                "total_pixels": total_pixels,
                "overlap_percentage": round(
                    overlap_percentage, 2
                ),
                "status": status
            })

            # 6. Draw bounding box.
            cv2.rectangle(
                image,
                (x1, y1),
                (x2, y2),
                box_color,
                2
            )

            # 7. Draw compact building label.
            label = (
                f"ID:{index} "
                f"C:{confidence:.2f} "
                f"Ch:{overlap_percentage:.1f}%"
            )

            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = max(
                0.30,
                min(image_width / 1400, 0.42)
            )
            thickness = 1

            (text_width, text_height), baseline = (
                cv2.getTextSize(
                    label,
                    font,
                    font_scale,
                    thickness
                )
            )

            label_height = text_height + baseline + 8
            label_width = text_width + 8

            label_x = max(
                0,
                min(x1, image_width - label_width)
            )

            if y1 - label_height >= 0:
                label_y = y1 - label_height
            else:
                label_y = min(
                    y1 + 2,
                    image_height - label_height
                )

            label_y = max(0, label_y)

            cv2.rectangle(
                image,
                (label_x, label_y),
                (
                    min(label_x + label_width, image_width - 1),
                    min(label_y + label_height, image_height - 1)
                ),
                box_color,
                -1
            )

            cv2.putText(
                image,
                label,
                (label_x + 4, label_y + text_height + 2),
                font,
                font_scale,
                (0, 0, 0),
                thickness,
                cv2.LINE_AA
            )

        # 8. Generate a unique ID for this analysis.
        run_id = uuid.uuid4().hex

        # 9. Save all four output images.
        before_filename = f"{run_id}_before.jpg"
        after_filename = f"{run_id}_after.jpg"
        mask_filename = f"{run_id}_change_mask.png"
        detected_filename = f"{run_id}_detected_buildings.jpg"

        before_path = self.visualization_dir / before_filename
        after_path = self.visualization_dir / after_filename
        mask_path = self.visualization_dir / mask_filename
        detected_path = self.visualization_dir / detected_filename

        saved_before = cv2.imwrite(
            str(before_path),
            before,
            [cv2.IMWRITE_JPEG_QUALITY, 95]
        )

        saved_after = cv2.imwrite(
            str(after_path),
            cv2.imread(str(after_image)),
            [cv2.IMWRITE_JPEG_QUALITY, 95]
        )

        saved_mask = cv2.imwrite(
            str(mask_path),
            binary_mask
        )

        saved_detected = cv2.imwrite(
            str(detected_path),
            image,
            [cv2.IMWRITE_JPEG_QUALITY, 90]
        )

        if not all([
            saved_before,
            saved_after,
            saved_mask,
            saved_detected
        ]):
            raise RuntimeError(
                "Could not save all analysis visualization images."
            )

        print("All four visualization images saved successfully.")

        # 10. Return results and all visualization filenames.
        return {
            "total_buildings": len(buildings),

            "potential_changes": sum(
                1 for item in analysis_results
                if item["status"] == "Potential Change Detected"
            ),

            "building_analysis": analysis_results,

            "before_image_filename": before_filename,
            "after_image_filename": after_filename,
            "change_mask_filename": mask_filename,
            "visualization_filename": detected_filename
        }
