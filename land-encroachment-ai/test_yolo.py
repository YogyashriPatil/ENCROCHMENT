
# Import the ChangeDetector class
from app.models.change_detector import ChangeDetector

# Display the test starting message
print("\nStarting ChangeFormer model loading test...")

try:
    # Create the ChangeDetector object
    # This loads the trained checkpoint
    detector = ChangeDetector()

    # Display successful loading message
    print("\nSUCCESS: ChangeFormer loaded correctly!")

    # Display the selected processing device
    print("Device:", detector.device)

    # Display the model architecture
    print("Architecture: ChangeFormerV6")

except Exception as error:

    # Display the error if model loading fails
    print("\nChangeFormer loading failed!")

    # Print the complete error message
    print("Error:", error)

    # Print detailed error information
    import traceback
    traceback.print_exc()
