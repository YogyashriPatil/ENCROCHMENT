
from pathlib import Path
import rasterio

BASE_DIR = Path(__file__).resolve().parent

images = [
    BASE_DIR / "uploads" / "before.png",
    BASE_DIR / "uploads" / "after.png"
]

for image_path in images:

    print("\n" + "=" * 55)
    print("IMAGE:", image_path.name)

    if not image_path.exists():
        print("File not found:", image_path)
        continue

    try:
        with rasterio.open(image_path) as src:

            print("Format:", src.driver)
            print("Width:", src.width)
            print("Height:", src.height)
            print("CRS:", src.crs)
            print("Bounds:", src.bounds)
            print("Transform:", src.transform)

            if src.crs is not None:
                print("Georeferencing: AVAILABLE")
            else:
                print("Georeferencing: NOT AVAILABLE")

    except Exception as error:
        print("Could not read image using Rasterio:", error)
