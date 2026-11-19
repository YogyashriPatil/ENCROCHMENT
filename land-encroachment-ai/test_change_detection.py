
# Import required libraries
from pathlib import Path
import numpy as np
from PIL import Image

# Import the ChangeDetector class
from app.models.change_detector import ChangeDetector


# Get the project root directory
PROJECT_ROOT = Path(__file__).resolve().parent

# Define before and after image paths
BEFORE_IMAGE = PROJECT_ROOT / "uploads" / "before.png"
AFTER_IMAGE = PROJECT_ROOT / "uploads" / "after.png"

# Define output paths
RESULTS_DIR = PROJECT_ROOT / "results"
MASK_PATH = RESULTS_DIR / "change_mask.png"
OVERLAY_PATH = RESULTS_DIR / "change_overlay.png"


# Check whether both images exist
if not BEFORE_IMAGE.exists():
    raise FileNotFoundError(f"Before image not found: {BEFORE_IMAGE}")

if not AFTER_IMAGE.exists():
    raise FileNotFoundError(f"After image not found: {AFTER_IMAGE}")


# Create the results directory
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

# Initialize the trained ChangeFormer model
detector = ChangeDetector()

print("\nRunning ChangeFormer change detection...")


# Detect changes between the two images
change_mask = detector.detect_changes(
    str(BEFORE_IMAGE),
    str(AFTER_IMAGE)
)


# Count changed and unchanged pixels
changed_pixels = int(np.count_nonzero(change_mask))
total_pixels = int(change_mask.size)

# Calculate change percentage
change_percentage = (changed_pixels / total_pixels) * 100


# Save the binary change mask
Image.fromarray(change_mask).save(MASK_PATH)


# Open the after image
after_image = Image.open(AFTER_IMAGE).convert("RGB")

# Resize mask to match the after image
mask_image = Image.fromarray(change_mask).resize(after_image.size)

# Create a red overlay for changed regions
red_overlay = Image.new("RGB", after_image.size, (255, 0, 0))

# Highlight changed pixels on the after image
result_image = Image.composite(
    red_overlay,
    after_image,
    mask_image
)

# Save the change overlay
result_image.save(OVERLAY_PATH)


# Display the results
print("\nCHANGE DETECTION COMPLETED!")
print("--------------------------------")
print("Total pixels:", total_pixels)
print("Changed pixels:", changed_pixels)
print("Change percentage:", round(change_percentage, 2), "%")

print("\nSaved files:")
print("Change mask:", MASK_PATH)
print("Change overlay:", OVERLAY_PATH)
