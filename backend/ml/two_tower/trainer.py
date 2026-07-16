import torch
import torch.nn as nn
import torch.optim as optim

class TwoTowerTrainer:
    def __init__(self, model, dataloader, learning_rate=1e-3, device="cpu"):
        self.model = model.to(device)
        self.dataloader = dataloader
        self.device = device
        
        # BCEWithLogitsLoss since the model directly outputs dot-product logits
        self.criterion = nn.BCEWithLogitsLoss()
        self.optimizer = optim.Adam(self.model.parameters(), lr=learning_rate)

    def train_epoch(self):
        self.model.train()
        total_loss = 0.0
        
        for batch_u, batch_i, batch_c, labels in self.dataloader:
            batch_u = batch_u.to(self.device)
            batch_i = batch_i.to(self.device)
            batch_c = batch_c.to(self.device)
            labels = labels.to(self.device)
            
            self.optimizer.zero_grad()
            
            predictions = self.model(batch_u, batch_i, batch_c)
            loss = self.criterion(predictions, labels)
            
            loss.backward()
            self.optimizer.step()
            
            total_loss += loss.item()
            
        return total_loss / len(self.dataloader)

    def train(self, epochs=10):
        print(f"Starting Two-Tower training on {self.device} for {epochs} epochs...")
        for epoch in range(epochs):
            avg_loss = self.train_epoch()
            print(f"Epoch {epoch+1}/{epochs} - BCE Loss: {avg_loss:.4f}")
        print("Training complete.")
