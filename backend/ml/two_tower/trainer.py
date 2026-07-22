import torch
import torch.nn as nn
import torch.optim as optim
from tqdm import tqdm

class TwoTowerTrainer:
    def __init__(self, model, dataloader, content_matrix, learning_rate=1e-3, device="cpu"):
        self.model = model.to(device)
        self.dataloader = dataloader
        self.content_matrix = content_matrix
        self.device = device
        self.temperature = 0.07  # Standard contrastive learning temperature (CLIP uses 0.07)
        
        # InfoNCE (In-Batch Softmax) Loss
        self.criterion = nn.CrossEntropyLoss()
        self.optimizer = optim.Adam(self.model.parameters(), lr=learning_rate)

    def train_epoch(self):
        self.model.train()
        total_loss = 0.0
        
        # Wrap dataloader in a progress bar
        progress_bar = tqdm(self.dataloader, desc="Training Batches", leave=False)
        
        for batch_u, batch_i, batch_real_i in progress_bar:
            batch_u = batch_u.to(self.device)
            batch_i = batch_i.to(self.device)
            
            # Ultra-fast PyTorch tensor slicing! Zero CPU overhead.
            batch_c = self.content_matrix[batch_real_i].to(self.device)
            
            self.optimizer.zero_grad()
            
            # Forward pass through individual towers (outputs are L2-normalized)
            user_vectors = self.model.user_tower(batch_u)
            item_vectors = self.model.item_tower(batch_i, batch_c)
            
            # Compute scaled pairwise dot products (InfoNCE logits) -> [BatchSize, BatchSize]
            # Temperature controls sharpness: lower = sharper distinctions
            logits = torch.matmul(user_vectors, item_vectors.T) / self.temperature
            
            # The positive item for user i is at index i in the batch
            labels = torch.arange(logits.size(0)).to(self.device)
            
            loss = self.criterion(logits, labels)
            
            loss.backward()
            self.optimizer.step()
            
            total_loss += loss.item()
            
        return total_loss / len(self.dataloader)

    def train(self, epochs=10):
        print(f"Starting Two-Tower training on {self.device} for {epochs} epochs...")
        for epoch in range(epochs):
            avg_loss = self.train_epoch()
            print(f"Epoch {epoch+1}/{epochs} - InfoNCE Loss: {avg_loss:.4f}")
        print("Training complete.")
