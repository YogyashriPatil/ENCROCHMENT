
# Import Path to handle file locations
from pathlib import Path

# Import our BuildingDetector class
from app.models.building_detector import BuildingDetector


# Get the project root directory
project_root = Path(__file__).resolve().parent

# Set the input image path
image_path = project_root / "uploads" / "test.jpg"

# Set the output image path
output_path = project_root / "results" / "yolo_test_result.jpg"

# Check whether the input image exists
if not image_path.exists():
    raise FileNotFoundError(f"Image not found: {image_path}")

# Create the building detector
detector = BuildingDetector()

# Run building detection
detections = detector.detect_buildings(
    image_path=str(image_path),
    confidence=0.15
)

# Display the total number of buildings
print("\nTotal buildings detected:", len(detections))

# Run YOLO again to get the annotated image
results = detector.model.predict(
    source=str(image_path),
    conf=0.15,
    imgsz=640,
    save=False,
    verbose=False
)

# Create the results folder if it does not exist
output_path.parent.mkdir(parents=True, exist_ok=True)

# Draw bounding boxes and confidence labels
annotated_image = results[0].plot()

# Save the annotated image
from PIL import Image

Image.fromarray(annotated_image[:, :, ::-1]).save(output_path)

# Display the detected building details
for index, detection in enumerate(detections, start=1):

    print(f"\nBuilding {index}")
    print("Class:", detection["class"])
    print("Confidence:", round(detection["confidence"], 4))
    print("Bounding Box:", detection["bbox"])

# Display the saved image location
print("\nAnnotated image saved successfully!")
print("Output:", output_path)
