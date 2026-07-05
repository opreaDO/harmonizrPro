import torch
import torch.nn as nn
import torch.optim as optim

class BridgeTrainer:
    """
    Handles the PyTorch training loop for the Bridging Model (MLP + MSE Loss).
    """
    def __init__(self, model, dataloader, learning_rate=1e-3, device="cpu"):
        self.model = model.to(device)
        self.dataloader = dataloader
        self.device = device
        self.criterion = nn.MSELoss()
        self.optimizer = optim.Adam(self.model.parameters(), lr=learning_rate)

    def train_epoch(self):
        self.model.train()
        total_loss = 0.0
        for batch_x, batch_y in self.dataloader:
            batch_x, batch_y = batch_x.to(self.device), batch_y.to(self.device)
            
            self.optimizer.zero_grad()
            predictions = self.model(batch_x)
            loss = self.criterion(predictions, batch_y)
            loss.backward()
            self.optimizer.step()
            
            total_loss += loss.item()
            
        return total_loss / len(self.dataloader)

    def train(self, epochs=10):
        print(f"Starting training on {self.device} for {epochs} epochs...")
        for epoch in range(epochs):
            avg_loss = self.train_epoch()
            print(f"Epoch {epoch+1}/{epochs} - MSE Loss: {avg_loss:.4f}")
        print("Training complete.")
