import torch
import torch.nn as nn
import torch.optim as optim

class TwoTowerTrainer:
    def __init__(self, model, dataloader, learning_rate=1e-3, device="cpu"):
        self.model = model.to(device)
        self.dataloader = dataloader
        self.device = device
        
        # InfoNCE (In-Batch Softmax) Loss
        self.criterion = nn.CrossEntropyLoss()
        self.optimizer = optim.Adam(self.model.parameters(), lr=learning_rate)

    def train_epoch(self):
        self.model.train()
        total_loss = 0.0
        
        for batch_u, batch_i, batch_c in self.dataloader:
            batch_u = batch_u.to(self.device)
            batch_i = batch_i.to(self.device)
            batch_c = batch_c.to(self.device)
            
            self.optimizer.zero_grad()
            
            # Forward pass through individual towers
            user_vectors = self.model.user_tower(batch_u)
            item_vectors = self.model.item_tower(batch_i, batch_c)
            
            # Compute pairwise dot products (InfoNCE logits) -> [BatchSize, BatchSize]
            logits = torch.matmul(user_vectors, item_vectors.T)
            
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
