import torch
from torch.utils.data import Dataset
import random

class InteractionDataset(Dataset):
    def __init__(self, user_indices, item_indices, item_content_matrix, num_items, num_negatives=4):
        self.user_indices = user_indices
        self.item_indices = item_indices
        self.item_content_matrix = item_content_matrix
        self.num_items = num_items
        self.num_negatives = num_negatives
        
        # Precompute a set of interacted items per user for fast negative sampling
        self.user_item_set = {}
        for u, i in zip(self.user_indices, self.item_indices):
            if u not in self.user_item_set:
                self.user_item_set[u] = set()
            self.user_item_set[u].add(i)

    def __len__(self):
        # Total size is positives + negatives
        return len(self.user_indices) * (1 + self.num_negatives)

    def __getitem__(self, idx):
        # Simulate on-the-fly negative sampling
        real_idx = idx // (1 + self.num_negatives)
        is_positive = (idx % (1 + self.num_negatives)) == 0
        
        user_idx = self.user_indices[real_idx]
        
        if is_positive:
            item_idx = self.item_indices[real_idx]
            label = 1.0
        else:
            # Generate random negative sample
            item_idx = random.randint(0, self.num_items - 1)
            while item_idx in self.user_item_set[user_idx]:
                item_idx = random.randint(0, self.num_items - 1)
            label = 0.0
            
        # Get content features (TF-IDF vector)
        content_features = self.item_content_matrix[item_idx]
        if hasattr(content_features, "toarray"):
            content_features = content_features.toarray()[0]
            
        return (
            torch.tensor(user_idx, dtype=torch.long),
            torch.tensor(item_idx, dtype=torch.long),
            torch.tensor(content_features, dtype=torch.float32),
            torch.tensor(label, dtype=torch.float32)
        )
