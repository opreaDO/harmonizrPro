import torch
import numpy as np
from backend.ml.bridging.models import MLPProjector

class BridgeInference:
    def __init__(self, model_path: str, input_dim: int, output_dim: int, device="cpu"):
        self.device = device
        self.model = MLPProjector(input_dim, output_dim)
        self.model.load_state_dict(torch.load(model_path, map_location=device))
        self.model.to(device)
        self.model.eval()

    def predict_embedding(self, tag_vector: np.ndarray) -> np.ndarray:
        """Projects a TF-IDF tag vector into the collaborative ALS space."""
        with torch.no_grad():
            x = torch.FloatTensor(tag_vector).to(self.device)
            if x.dim() == 1:
                x = x.unsqueeze(0)
            embedding = self.model(x)
            return embedding.cpu().numpy()
