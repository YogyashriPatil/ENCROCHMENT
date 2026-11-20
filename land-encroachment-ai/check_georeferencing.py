
from pathlib import Path
import rasterio

image_paths = [
    Path(r"E:\Final-year project\implementation-of-project\land-encroachment-ai\uploads\before.png"),
    Path(r"E:\Final-year project\implementation-of-project\land-encroachment-ai\uploads\after.png"),
    Path(r"E:\Final-year project\implementation-of-project\land-encroachment-ai\uploads\test.jpg")
]

for image_path in image_paths:
    print("\n" + "=" * 50)
    print("IMAGE:", image_path.name)

    try:
        with rasterio.open(image_path) as src:
            print("Format:", src.driver)
            print("Width:", src.width)
            print("Height:", src.height)
            print("CRS:", src.crs)
            print("Bounds:", src.bounds)
            print("Transform:", src.transform)

            if src.crs is None:
                print("RESULT: No geographic CRS found.")
            else:
                print("RESULT: Geographic reference information found.")

    except Exception as error:
        print("Error:", error)
