import torch
import torch.nn as nn

class MLPProjector(nn.Module):
    """
    Level 1: A Multi-Layer Perceptron.
    Takes a TF-IDF tag vector as input and projects it down to the exact 
    dimensionality of our ALS collaborative embeddings.
    """
    def __init__(self, input_dim: int, output_dim: int, hidden_dim: int = 512):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_dim // 2, output_dim)
        )

    def forward(self, x):
        return self.net(x)
