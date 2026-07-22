import os
import torch
import pickle
import numpy as np
import pandas as pd
from torch.utils.data import DataLoader
from gensim.models import FastText
import faiss

from backend.ml.two_tower.model import TwoTowerModel
from backend.ml.two_tower.dataset import InteractionDataset
from backend.ml.two_tower.trainer import TwoTowerTrainer

class TwoTowerRecommender:
    def __init__(self, model_dir: str = "./data/models/twotower"):
        self.model_dir = model_dir
        self.model_path = os.path.join(model_dir, "twotower.pth")
        self.user_mapping_path = os.path.join(model_dir, "user_mapping.pkl")
        self.track_mapping_path = os.path.join(model_dir, "track_mapping.pkl")
        self.fasttext_path = os.path.join(model_dir, "fasttext.model")
        self.faiss_index_path = os.path.join(model_dir, "faiss_index.bin")
        
        self.device = torch.device("cuda" if torch.cuda.is_available() else ("mps" if torch.backends.mps.is_available() else "cpu"))
        
        self.user_to_idx = {}
        self.idx_to_user = {}
        self.track_to_idx = {}
        self.idx_to_track = {}
        
        self.fasttext_model = None
        
        self.model = None
        self.item_faiss_index = None
        self.is_trained = False
        
        os.makedirs(model_dir, exist_ok=True)
        self.load_model()

    def train(self, interactions_df: pd.DataFrame, tracks_data: list[dict], epochs=5, batch_size=256):
        print("Preparing data for Two-Tower training...")
        
        # 1. Map users and items
        unique_users = interactions_df['user_id'].unique()
        self.user_to_idx = {user: idx for idx, user in enumerate(unique_users)}
        self.idx_to_user = {idx: user for user, idx in self.user_to_idx.items()}
        
        unique_tracks = [t['id'] for t in tracks_data]
        self.track_to_idx = {track: idx for idx, track in enumerate(unique_tracks)}
        self.idx_to_track = {idx: track for track, idx in self.track_to_idx.items()}
        
        # 2. Build FastText for items
        print("Training FastText model on tags...")
        # CRITICAL FIX: Lowercase all tags! SQLite tags are mixed case ("Progressive rock"), 
        # but the live Last.fm API returns lowercase ("progressive rock").
        sentences = [[str(tag).lower() for tag in track.get('tags', [])] for track in tracks_data]
        # FastText learns sub-word features so it naturally handles messy/misspelled tags
        self.fasttext_model = FastText(sentences=sentences, vector_size=128, window=5, min_count=1, workers=4)
        self.fasttext_model.save(self.fasttext_path)
        
        print("Building Dense FastText content features...")
        content_matrix = np.zeros((len(tracks_data), 128), dtype=np.float32)
        for i, tags in enumerate(sentences):
            if tags:
                vectors = [self.fasttext_model.wv[tag] for tag in tags if tag in self.fasttext_model.wv]
                if vectors:
                    content_matrix[i] = np.mean(vectors, axis=0)
        
        content_dim = 128
        
        # 3. Filter interactions to known items
        valid_interactions = interactions_df[interactions_df['track_id'].isin(self.track_to_idx)].copy()
        
        user_indices = valid_interactions['user_id'].map(self.user_to_idx).values
        track_indices = valid_interactions['track_id'].map(self.track_to_idx).values
        
        # 4. Initialize Model (+1 for <UNK> token)
        self.model = TwoTowerModel(
            num_users=len(self.user_to_idx),
            num_items=len(self.track_to_idx) + 1,
            content_dim=content_dim,
            embedding_dim=64
        )
        
        # 5. Dataset and DataLoader
        dataset = InteractionDataset(
            user_indices=user_indices,
            item_indices=track_indices,
            num_items=len(self.track_to_idx),
            id_dropout_rate=0.15
        )
        dataloader = DataLoader(
            dataset, 
            batch_size=batch_size, 
            shuffle=True, 
            num_workers=0, 
            pin_memory=True
        )
        
        # 6. Content matrix is already dense, just convert to PyTorch Tensor
        print("Optimizing content matrix for GPU feeding (converting to dense)...")
        dense_content_tensor = torch.tensor(content_matrix, dtype=torch.float32)
        
        # 7. Train
        trainer = TwoTowerTrainer(self.model, dataloader, dense_content_tensor, device=self.device)
        trainer.train(epochs=epochs)
        
        # 8. Precompute Item Embeddings and build FAISS index
        self._build_faiss_index(dense_content_tensor)
        
        self.is_trained = True
        self.save_model()
        print("Two-Tower training complete.")

    def _build_faiss_index(self, content_tensor):
        """Batch-computes all item embeddings and builds a FAISS index for fast retrieval."""
        print("Precomputing item embeddings for fast retrieval...")
        self.model.eval()
        self.model.to(self.device)
        
        num_items = len(self.track_to_idx)
        all_embeddings = []
        batch_size = 4096
        
        with torch.no_grad():
            for start in range(0, num_items, batch_size):
                end = min(start + batch_size, num_items)
                
                item_indices = torch.arange(start, end, dtype=torch.long).to(self.device)
                content_batch = content_tensor[start:end].to(self.device)
                
                item_embs = self.model.item_tower(item_indices, content_batch)
                all_embeddings.append(item_embs.cpu().numpy())
        
        item_embeddings = np.concatenate(all_embeddings, axis=0).astype(np.float32)
        
        # We optimize for dot product via Inner Product search
        self.item_faiss_index = faiss.IndexFlatIP(64)
        self.item_faiss_index.add(item_embeddings)

    def recommend(self, user_id: str, top_k: int = 10) -> list[str]:
        if not self.is_trained or self.item_faiss_index is None:
            raise ValueError("Model is not trained yet.")
            
        if user_id not in self.user_to_idx:
            print(f"User {user_id} not found (Cold start user).")
            return []
            
        user_idx = self.user_to_idx[user_id]
        
        self.model.eval()
        with torch.no_grad():
            user_idx_tensor = torch.tensor([user_idx], dtype=torch.long).to(self.device)
            user_vector = self.model.user_tower(user_idx_tensor).cpu().numpy()
            
        distances, indices = self.item_faiss_index.search(user_vector, top_k)
        
        recommendations = [self.idx_to_track[idx] for idx in indices[0] if idx != -1]
        return recommendations

    def get_similar_tracks(self, track_id: str, top_k: int = 10) -> list[str]:
        if not self.is_trained or self.item_faiss_index is None:
            raise ValueError("Model is not trained yet.")
            
        if track_id not in self.track_to_idx:
            print(f"Track {track_id} not found.")
            return []
            
        track_idx = self.track_to_idx[track_id]
        
        # Get the precomputed embedding for this track from the FAISS index
        track_vector = np.array([self.item_faiss_index.reconstruct(track_idx)])
        
        # Search for similar items in the item FAISS index
        distances, indices = self.item_faiss_index.search(track_vector, top_k + 1)
        
        recommendations = [self.idx_to_track[idx] for idx in indices[0] if idx not in [-1, track_idx]][:top_k]
        return recommendations

    def recommend_for_cold_track(self, tags: list[str], top_k: int = 10) -> list[str]:
        if not self.is_trained or self.item_faiss_index is None:
            raise ValueError("Model is not trained yet.")
            
        vectors = [self.fasttext_model.wv[tag] for tag in tags if tag in self.fasttext_model.wv]
        if vectors:
            tag_vector = np.mean(vectors, axis=0)
        else:
            tag_vector = np.zeros(128, dtype=np.float32)
        
        self.model.eval()
        with torch.no_grad():
            unk_idx = len(self.track_to_idx) # The <UNK> token index
            dummy_idx_tensor = torch.tensor([unk_idx], dtype=torch.long).to(self.device)
            content_tensor = torch.tensor(tag_vector, dtype=torch.float32).unsqueeze(0).to(self.device)
            item_vector = self.model.item_tower(dummy_idx_tensor, content_tensor).cpu().numpy()
            
        distances, indices = self.item_faiss_index.search(item_vector, top_k)
        recommendations = [self.idx_to_track[idx] for idx in indices[0] if idx != -1]
        return recommendations

    def save_model(self):
        torch.save(self.model.state_dict(), self.model_path)
        with open(self.user_mapping_path, 'wb') as f:
            pickle.dump((self.user_to_idx, self.idx_to_user), f)
        with open(self.track_mapping_path, 'wb') as f:
            pickle.dump((self.track_to_idx, self.idx_to_track), f)
        if self.item_faiss_index is not None:
            faiss.write_index(self.item_faiss_index, self.faiss_index_path)

    def load_model(self):
        if (os.path.exists(self.model_path) and os.path.exists(self.user_mapping_path)):
            with open(self.user_mapping_path, 'rb') as f:
                self.user_to_idx, self.idx_to_user = pickle.load(f)
            with open(self.track_mapping_path, 'rb') as f:
                self.track_to_idx, self.idx_to_track = pickle.load(f)
            
            if os.path.exists(self.fasttext_path):
                self.fasttext_model = FastText.load(self.fasttext_path)
                content_dim = self.fasttext_model.vector_size
            else:
                content_dim = 128
                
            self.model = TwoTowerModel(
                num_users=len(self.user_to_idx),
                num_items=len(self.track_to_idx) + 1, # +1 for <UNK> token
                content_dim=content_dim,
                embedding_dim=64
            )
            self.model.load_state_dict(torch.load(self.model_path, map_location=self.device))
            self.model.to(self.device)
            
            if os.path.exists(self.faiss_index_path):
                self.item_faiss_index = faiss.read_index(self.faiss_index_path)
                
            self.is_trained = True
            print("Loaded Two-Tower model.")
