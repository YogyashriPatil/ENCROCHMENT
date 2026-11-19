
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

        mask_height, mask_width = change_mask.shape

        # 3. Read the latest image for visualization.
        image = cv2.imread(str(after_image))

        if image is None:
            raise ValueError("Unable to read latest image.")

        image_height, image_width = image.shape[:2]

        # Resize mask if its dimensions differ from the image.
        if (mask_width, mask_height) != (image_width, image_height):
            change_mask = cv2.resize(
                change_mask.astype(np.uint8),
                (image_width, image_height),
                interpolation=cv2.INTER_NEAREST
            )

            mask_height, mask_width = change_mask.shape

        analysis_results = []

        # 4. Analyze each building.
        for index, building in enumerate(buildings, start=1):

            x1, y1, x2, y2 = building["bbox"]

            x1 = max(0, min(image_width - 1, int(x1)))
            y1 = max(0, min(image_height - 1, int(y1)))
            x2 = max(0, min(image_width, int(x2)))
            y2 = max(0, min(image_height, int(y2)))

            building_mask = change_mask[y1:y2, x1:x2]

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

                # Yellow box for potential changes.
                box_color = (0, 215, 255)

            else:
                status = "No Significant Change"

                # Green box for no significant change.
                box_color = (0, 200, 0)

            confidence = float(building["confidence"])

            analysis_results.append({
                "building_id": index,
                "confidence": round(confidence, 4),
                "bounding_box": building["bbox"],
                "changed_pixels": changed_pixels,
                "total_pixels": total_pixels,
                "overlap_percentage": round(
                    overlap_percentage, 2
                ),
                "status": status
            })

            # 5. Draw bounding box.
            cv2.rectangle(
                image,
                (x1, y1),
                (x2, y2),
                box_color,
                2
            )

            # 6. Draw building information.
            
            # Compact building label
            label = (
                f"ID:{index} "
                f"C:{confidence:.2f} "
                f"Ch:{overlap_percentage:.1f}%"
            )

            font = cv2.FONT_HERSHEY_SIMPLEX

            # Smaller font for crowded satellite images
            font_scale = max(0.30, min(image_width / 1400, 0.42))
            thickness = 1

            (text_width, text_height), baseline = cv2.getTextSize(
                label,
                font,
                font_scale,
                thickness
            )

            label_height = text_height + baseline + 8
            label_width = text_width + 8

            # Keep label within image boundaries
            label_x = min(x1, image_width - label_width)

            if y1 - label_height >= 0:
                label_y = y1 - label_height
            else:
                label_y = min(y1 + 2, image_height - label_height)

            label_y = max(0, label_y)

            # Draw background
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

            # Draw label text
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


        # 7. Save annotated image.
        visualization_filename = (
            f"analysis_{uuid.uuid4().hex}.jpg"
        )

        visualization_path = (
            self.visualization_dir / visualization_filename
        )

        saved = cv2.imwrite(
            str(visualization_path),
            image,
            [cv2.IMWRITE_JPEG_QUALITY, 90]
        )

        if not saved:
            raise RuntimeError(
                "Could not save annotated visualization."
            )

        # 8. Return analysis and visualization filename.
        return {
            "total_buildings": len(buildings),

            "potential_changes": sum(
                1 for item in analysis_results
                if item["status"] == "Potential Change Detected"
            ),

            "building_analysis": analysis_results,

            "visualization_filename": visualization_filename
        }
