
# Import required libraries
import sys
import torch
import numpy as np

from pathlib import Path
from PIL import Image
from torchvision import transforms

# Get the AI project root directory
PROJECT_ROOT = Path(__file__).resolve().parents[2]

# Add ChangeFormer source directory to Python path
CHANGEFORMER_DIR = PROJECT_ROOT / "ChangeFormer"

if str(CHANGEFORMER_DIR) not in sys.path:
    sys.path.insert(0, str(CHANGEFORMER_DIR))

# Import the original ChangeFormer architecture
from models.networks import define_G


class ChangeDetector:

    def __init__(self):

        # Automatically select GPU or CPU
        self.device = torch.device(
            "cuda" if torch.cuda.is_available() else "cpu"
        )

        print("ChangeFormer device:", self.device)

        # Configure the ChangeFormerV6 architecture
        from types import SimpleNamespace

        args = SimpleNamespace(
            net_G="ChangeFormerV6",
            embed_dim=256
        )

        # Create the model architecture
        self.model = define_G(args=args, gpu_ids=[])

        # Locate the trained checkpoint
        checkpoint_path = (
            PROJECT_ROOT
            / "weights"
            / "changeformer"
            / "best_ckpt.pt"
        )

        # Check whether the checkpoint exists
        if not checkpoint_path.exists():
            raise FileNotFoundError(
                f"Checkpoint not found: {checkpoint_path}"
            )

        # Load the trained checkpoint
        checkpoint = torch.load(
            checkpoint_path,
            map_location="cpu",
            weights_only=False
        )

        # Load trained model weights
        self.model.load_state_dict(
            checkpoint["model_G_state_dict"]
        )

        # Move model to selected device
        self.model = self.model.to(self.device)

        # Set model to evaluation mode
        self.model.eval()

        # Prepare image preprocessing
        self.transform = transforms.Compose([
            transforms.Resize((256, 256)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.5, 0.5, 0.5],
                std=[0.5, 0.5, 0.5]
            )
        ])

        print("ChangeFormer model loaded successfully!")

    def detect_changes(self, before_image, after_image):

        # Open both images in RGB format
        image1 = Image.open(before_image).convert("RGB")
        image2 = Image.open(after_image).convert("RGB")

        # Check that both images have the same original dimensions
        if image1.size != image2.size:
            raise ValueError(
                "Before and after images must have the same dimensions."
            )

        # Store the original image dimensions
        original_size = image1.size

        # Preprocess both images
        image1 = self.transform(image1).unsqueeze(0)
        image2 = self.transform(image2).unsqueeze(0)

        # Move images to GPU or CPU
        image1 = image1.to(self.device)
        image2 = image2.to(self.device)

        # Run change detection without calculating gradients
        with torch.no_grad():

            # Get model predictions
            outputs = self.model(image1, image2)

            # Select the final prediction
            prediction = outputs[-1]

            # Convert prediction into probabilities
            probabilities = torch.softmax(prediction, dim=1)

            # Get the predicted class for every pixel
            change_mask = torch.argmax(
                probabilities,
                dim=1
            )

        # Convert mask into a NumPy array
        mask = change_mask.squeeze(0).cpu().numpy()

        # Convert mask into a black-and-white image
        mask_image = Image.fromarray(
            (mask * 255).astype(np.uint8)
        )

        # Resize mask to original image dimensions
        mask_image = mask_image.resize(
            original_size,
            Image.Resampling.NEAREST
        )

        # Return the binary change mask
        return np.array(mask_image)
