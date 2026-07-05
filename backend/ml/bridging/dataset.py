import torch
from torch.utils.data import Dataset
import numpy as np

class TagToEmbeddingDataset(Dataset):
    """
    PyTorch Dataset that aligns our two foundational models.
    Inputs (X): TF-IDF Tag Vectors
    Targets (Y): ALS Latent Embeddings
    """
    def __init__(self, tag_vectors: np.ndarray, als_embeddings: np.ndarray):
        self.x = torch.FloatTensor(tag_vectors)
        self.y = torch.FloatTensor(als_embeddings)

    def __len__(self):
        return len(self.x)

    def __getitem__(self, idx):
        return self.x[idx], self.y[idx]
