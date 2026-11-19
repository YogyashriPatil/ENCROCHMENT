
# Import the YOLO class
from ultralytics import YOLO

# Import Path to handle model file paths
from pathlib import Path


class BuildingDetector:

    def __init__(self):

        # Get the AI project root directory
        project_root = Path(__file__).resolve().parents[2]

        # Define the trained YOLO model path
        model_path = project_root / "weights" / "yolo" / "best.pt"

        # Load the trained YOLO model
        self.model = YOLO(str(model_path))

        print("Building detection model loaded successfully!")

    def detect_buildings(self, image_path, confidence=0.15):

        # Run building detection on the input image
        results = self.model.predict(
            source=image_path,
            conf=confidence,
            imgsz=640,
            verbose=False
        )

        # Store detected building information
        detections = []

        # Process every detected building
        for result in results:

            # Read bounding boxes
            for box in result.boxes:

                # Get bounding box coordinates
                x1, y1, x2, y2 = box.xyxy[0].tolist()

                # Get confidence score
                score = float(box.conf[0])

                # Add detection details
                detections.append({
                    "class": "building",
                    "confidence": score,
                    "bbox": [x1, y1, x2, y2]
                })

        # Return all detected buildings
        return detections
