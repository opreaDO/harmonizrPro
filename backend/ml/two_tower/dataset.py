import torch
from torch.utils.data import Dataset
import random

class InteractionDataset(Dataset):
    def __init__(self, user_indices, item_indices, item_content_matrix, num_items, id_dropout_rate=0.15):
        self.user_indices = user_indices
        self.item_indices = item_indices
        self.item_content_matrix = item_content_matrix
        self.num_items = num_items
        self.id_dropout_rate = id_dropout_rate

    def __len__(self):
        # With InfoNCE, we only need the positive samples
        return len(self.user_indices)

    def __getitem__(self, idx):
        user_idx = self.user_indices[idx]
        item_idx = self.item_indices[idx]
        
        # ID Dropout: Based on the dropout rate, replace the item_idx with the <UNK> token (num_items)
        # This forces the content tower to learn how to rely purely on text features for cold-start tracks.
        if random.random() < self.id_dropout_rate:
            item_idx = self.num_items
            
        # Get content features (TF-IDF vector)
        content_features = self.item_content_matrix[self.item_indices[idx]] # Always get real content
        if hasattr(content_features, "toarray"):
            content_features = content_features.toarray()[0]
            
        return (
            torch.tensor(user_idx, dtype=torch.long),
            torch.tensor(item_idx, dtype=torch.long),
            torch.tensor(content_features, dtype=torch.float32)
        )
