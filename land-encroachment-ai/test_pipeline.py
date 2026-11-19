# Import image processing libraries
import numpy as np
from PIL import Image, ImageDraw
# Import the combined AI pipeline
from app.services.encroachment_pipeline import EncroachmentPipeline
from PIL import Image, ImageDraw, ImageFont
# Import required libraries
from pathlib import Path
import json

# Get the project root directory
PROJECT_ROOT = Path(__file__).resolve().parent

# Define input image paths
before_image = PROJECT_ROOT / "uploads" / "before.png"
after_image = PROJECT_ROOT / "uploads" / "after.png"

# Define the output report path
report_path = PROJECT_ROOT / "results" / "pipeline_report.json"

# Check whether input images exist
if not before_image.exists() or not after_image.exists():
    raise FileNotFoundError("Before or after image not found!")

# Create the results folder if it does not exist
report_path.parent.mkdir(parents=True, exist_ok=True)

# Initialize both AI models
pipeline = EncroachmentPipeline()

# Run the combined AI analysis
print("\nStarting combined encroachment analysis...\n")

results = pipeline.analyze(
    before_image,
    after_image
)

# Display the analysis summary
print("\n========== ANALYSIS REPORT ==========")

print("Total Buildings:", results["total_buildings"])
print("Potential Changes:", results["potential_changes"])

# Display individual building results
for building in results["building_analysis"]:

    print("\nBuilding ID:", building["building_id"])
    print("Confidence:", building["confidence"])
    print("Overlap:", building["overlap_percentage"], "%")
    print("Status:", building["status"])

# Save the results in JSON format
with open(report_path, "w", encoding="utf-8") as file:

    json.dump(
        results,
        file,
        indent=4
    )

# Confirm report creation
print("\nAnalysis report saved successfully!")
print("Report location:", report_path)

# ==========================================
# PROFESSIONAL GIS-STYLE VISUALIZATION
# ==========================================

# Load the original satellite image
original_image = Image.open(after_image).convert("RGBA")

# Generate the ChangeFormer change mask
change_mask = pipeline.change_detector.detect_changes(
    str(before_image),
    str(after_image)
)

# Create a red transparent overlay for changed regions
red_overlay = Image.new(
    "RGBA",
    original_image.size,
    (255, 0, 0, 0)
)

# Apply transparency to changed pixels
alpha_mask = Image.fromarray(
    np.where(change_mask > 0, 100, 0).astype(np.uint8)
)

red_overlay.putalpha(alpha_mask)

# Combine satellite image and change overlay
image = Image.alpha_composite(
    original_image,
    red_overlay
)

# Define the dashboard dimensions
dashboard = Image.new(
    "RGB",
    (1400, 900),
    (25, 30, 40)
)

# Create drawing object
draw = ImageDraw.Draw(dashboard)

# Load fonts
try:
    title_font = ImageFont.truetype("arial.ttf", 30)
    heading_font = ImageFont.truetype("arial.ttf", 22)
    normal_font = ImageFont.truetype("arial.ttf", 17)
    small_font = ImageFont.truetype("arial.ttf", 15)

except OSError:
    title_font = ImageFont.load_default()
    heading_font = ImageFont.load_default()
    normal_font = ImageFont.load_default()
    small_font = ImageFont.load_default()

# Draw dashboard title
draw.text(
    (35, 25),
    "AI LAND ENCROACHMENT MONITORING SYSTEM",
    fill="white",
    font=title_font
)

draw.text(
    (35, 70),
    "Satellite Image Analysis | YOLO + ChangeFormer",
    fill=(170, 185, 200),
    font=normal_font
)

# Resize satellite image while maintaining aspect ratio
image.thumbnail((950, 750))

# Draw satellite image on dashboard
dashboard.paste(
    image.convert("RGB"),
    (30, 120)
)

# Calculate image scaling factors
scale_x = image.width / original_image.width
scale_y = image.height / original_image.height

# Draw building bounding boxes
image_draw = ImageDraw.Draw(dashboard)

for building in results["building_analysis"]:

    # Get original bounding box coordinates
    x1, y1, x2, y2 = building["bounding_box"]

    # Scale coordinates to dashboard image size
    x1 = int(30 + x1 * scale_x)
    y1 = int(120 + y1 * scale_y)
    x2 = int(30 + x2 * scale_x)
    y2 = int(120 + y2 * scale_y)

    # Select box color
    if building["status"] == "Potential Change Detected":
        color = (255, 210, 0)
    else:
        color = (0, 230, 120)

    # Draw building bounding box
    image_draw.rectangle(
        (x1, y1, x2, y2),
        outline=color,
        width=3
    )

    # Draw numbered building marker
    marker_x = max(30, x1)
    marker_y = max(120, y1 - 24)

    image_draw.ellipse(
        (marker_x, marker_y, marker_x + 24, marker_y + 24),
        fill=color
    )

    image_draw.text(
        (marker_x + 7, marker_y + 4),
        str(building["building_id"]),
        fill="black",
        font=small_font
    )

# ==========================================
# RIGHT-SIDE SUMMARY PANEL
# ==========================================

panel_x = 1010

# Draw panel heading
draw.text(
    (panel_x, 130),
    "ANALYSIS SUMMARY",
    fill="white",
    font=heading_font
)

# Display total buildings
draw.text(
    (panel_x, 180),
    f"Total Buildings: {results['total_buildings']}",
    fill="white",
    font=normal_font
)

# Display potential changes
draw.text(
    (panel_x, 215),
    f"Potential Changes: {results['potential_changes']}",
    fill=(255, 210, 0),
    font=normal_font
)

# Display unchanged buildings
unchanged = (
    results["total_buildings"]
    - results["potential_changes"]
)

draw.text(
    (panel_x, 250),
    f"No Significant Change: {unchanged}",
    fill=(0, 230, 120),
    font=normal_font
)

# Draw separator line
draw.line(
    (panel_x, 290, 1360, 290),
    fill=(100, 110, 125),
    width=2
)

# Draw building-wise results heading
draw.text(
    (panel_x, 310),
    "BUILDING DETAILS",
    fill="white",
    font=heading_font
)

# Display each building's details
y_position = 355

for building in results["building_analysis"]:

    # Choose status color
    if building["status"] == "Potential Change Detected":
        color = (255, 210, 0)
    else:
        color = (0, 230, 120)

    # Display building ID
    draw.text(
        (panel_x, y_position),
        f"Building {building['building_id']}",
        fill="white",
        font=normal_font
    )

    # Display overlap percentage
    draw.text(
        (panel_x + 175, y_position),
        f"{building['overlap_percentage']}%",
        fill=color,
        font=normal_font
    )

    y_position += 32

# ==========================================
# COLOR LEGEND
# ==========================================

draw.rectangle(
    (30, 850, 55, 870),
    fill=(255, 210, 0)
)

draw.text(
    (65, 850),
    "Potential Building Change",
    fill="white",
    font=small_font
)

draw.rectangle(
    (320, 850, 345, 870),
    fill=(0, 230, 120)
)

draw.text(
    (355, 850),
    "No Significant Change",
    fill="white",
    font=small_font
)

draw.rectangle(
    (620, 850, 645, 870),
    fill=(255, 0, 0)
)

draw.text(
    (655, 850),
    "Detected Change Regions",
    fill="white",
    font=small_font
)

# Save the final dashboard image
visualization_path = (
    PROJECT_ROOT
    / "results"
    / "gis_monitoring_dashboard.jpg"
)

dashboard.save(visualization_path, quality=95)

print("\nGIS dashboard generated successfully!")
print("Saved at:", visualization_path)
