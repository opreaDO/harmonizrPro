import torch
import torch.nn as nn
import torch.nn.functional as F

class UserTower(nn.Module):
    def __init__(self, num_users: int, embedding_dim: int = 64):
        super().__init__()
        self.user_embedding = nn.Embedding(num_users, embedding_dim)
        # Deep network for user features (just ID for now)
        self.net = nn.Sequential(
            nn.Linear(embedding_dim, embedding_dim * 2),
            nn.ReLU(),
            nn.Linear(embedding_dim * 2, embedding_dim)
        )
        
    def forward(self, user_idx):
        emb = self.user_embedding(user_idx)
        return F.normalize(self.net(emb), dim=1)

class ItemTower(nn.Module):
    def __init__(self, num_items: int, content_dim: int, embedding_dim: int = 64):
        super().__init__()
        self.item_embedding = nn.Embedding(num_items, embedding_dim)
        self.content_net = nn.Sequential(
            nn.Linear(content_dim, 256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, embedding_dim)
        )
        # Combine ID embedding and content embedding
        self.combine_net = nn.Sequential(
            nn.Linear(embedding_dim * 2, embedding_dim * 2),
            nn.ReLU(),
            nn.Linear(embedding_dim * 2, embedding_dim)
        )
        
    def forward(self, item_idx, content_features):
        id_emb = self.item_embedding(item_idx)
        content_emb = self.content_net(content_features)
        combined = torch.cat([id_emb, content_emb], dim=1)
        return F.normalize(self.combine_net(combined), dim=1)

class TwoTowerModel(nn.Module):
    def __init__(self, num_users: int, num_items: int, content_dim: int, embedding_dim: int = 64):
        super().__init__()
        self.user_tower = UserTower(num_users, embedding_dim)
        self.item_tower = ItemTower(num_items, content_dim, embedding_dim)
        
    def forward(self, user_idx, item_idx, content_features):
        user_vector = self.user_tower(user_idx)
        item_vector = self.item_tower(item_idx, content_features)
        
        # Output is the dot product of user and item vectors
        score = (user_vector * item_vector).sum(dim=1)
        return score
