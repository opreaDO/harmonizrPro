import sys
import os
import torch
import numpy as np
from torch.utils.data import DataLoader

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.ml.bridging.dataset import TagToEmbeddingDataset
from backend.ml.bridging.models import MLPProjector
from backend.ml.bridging.trainer import BridgeTrainer

def main():
    print("Generating synthetic aligned data to test the MLP Bridging pipeline...")
    
    num_samples = 1000
    tag_dim = 5000 # Matches our TF-IDF max_features
    als_dim = 50   # Matches our ALS factors
    
    # Random TF-IDF like data (sparse-ish, values between 0 and 1)
    mock_tags = np.random.rand(num_samples, tag_dim) * (np.random.rand(num_samples, tag_dim) > 0.95)
    
    # Random ALS embeddings (Creating a solvable linear relationship + noise)
    true_projection = np.random.randn(tag_dim, als_dim)
    mock_als = mock_tags.dot(true_projection) + (np.random.randn(num_samples, als_dim) * 0.1)
    
    dataset = TagToEmbeddingDataset(mock_tags, mock_als)
    dataloader = DataLoader(dataset, batch_size=32, shuffle=True)
    
    device = "cuda" if torch.cuda.is_available() else "cpu"
    
    model = MLPProjector(input_dim=tag_dim, output_dim=als_dim)
    trainer = BridgeTrainer(model, dataloader, learning_rate=1e-3, device=device)
    
    print("\n--- Training Level 1 Bridging Model (MLP + MSE) ---")
    trainer.train(epochs=15)
    
    os.makedirs("./data/models", exist_ok=True)
    model_path = "./data/models/bridge_mlp.pth"
    torch.save(model.state_dict(), model_path)
    print(f"\nModel saved to {model_path}")

if __name__ == "__main__":
    main()
