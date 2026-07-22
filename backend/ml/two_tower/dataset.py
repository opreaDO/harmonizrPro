import torch
from torch.utils.data import Dataset
import numpy as np

class InteractionDataset(Dataset):
    def __init__(self, user_indices, item_indices, num_items, id_dropout_rate=0.15):
        # Pre-convert EVERYTHING to tensors once (eliminates 120M tensor allocations per epoch)
        self.user_indices = torch.tensor(np.array(user_indices), dtype=torch.long)
        self.item_indices = torch.tensor(np.array(item_indices), dtype=torch.long)
        self.num_items = num_items
        self.id_dropout_rate = id_dropout_rate

    def __len__(self):
        return len(self.user_indices)

    def __getitem__(self, idx):
        user_idx = self.user_indices[idx]
        item_idx = self.item_indices[idx]
        real_item_idx = item_idx.clone()
        
        # ID Dropout
        if torch.rand(1).item() < self.id_dropout_rate:
            item_idx = torch.tensor(self.num_items, dtype=torch.long)
            
        return user_idx, item_idx, real_item_idx
