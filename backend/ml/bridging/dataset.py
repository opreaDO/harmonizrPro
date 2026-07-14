import torch
from torch.utils.data import Dataset
import numpy as np

class TagToEmbeddingDataset(Dataset):
    """
    PyTorch Dataset that aligns our two foundational models.
    Inputs (X): TF-IDF Tag Vectors
    Targets (Y): ALS Latent Embeddings
    """
    def __init__(self, tag_vectors, als_embeddings: np.ndarray):
        import scipy.sparse
        self.is_sparse = scipy.sparse.issparse(tag_vectors)
        self.x = tag_vectors
        self.y = torch.FloatTensor(als_embeddings)

    def __len__(self):
        return self.x.shape[0]

    def __getitem__(self, idx):
        if self.is_sparse:
            x_val = self.x[idx].toarray()[0]
        else:
            x_val = self.x[idx]
        return torch.FloatTensor(x_val), self.y[idx]
