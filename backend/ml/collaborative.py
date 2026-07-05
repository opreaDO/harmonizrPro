import os
import pickle
import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix
import implicit

class CollaborativeRecommender:
    def __init__(self, model_dir: str = "./data/models"):
        self.model_dir = model_dir
        self.model_path = os.path.join(model_dir, "als_model.pkl")
        self.user_mapping_path = os.path.join(model_dir, "user_mapping.pkl")
        self.track_mapping_path = os.path.join(model_dir, "track_mapping.pkl")
        
        self.model = implicit.als.AlternatingLeastSquares(factors=50, regularization=0.1, iterations=15)
        
        self.user_to_idx = {}
        self.idx_to_user = {}
        self.track_to_idx = {}
        self.idx_to_track = {}
        self.is_trained = False
        
        self.user_items = None
        
        os.makedirs(model_dir, exist_ok=True)
        self.load_model()

    def train(self, df: pd.DataFrame):
        print("Preparing data for ALS training...")
        
        unique_users = df['user_id'].unique()
        unique_tracks = df['track_id'].unique()
        
        self.user_to_idx = {user: idx for idx, user in enumerate(unique_users)}
        self.idx_to_user = {idx: user for user, idx in self.user_to_idx.items()}
        
        self.track_to_idx = {track: idx for idx, track in enumerate(unique_tracks)}
        self.idx_to_track = {idx: track for track, idx in self.track_to_idx.items()}
        
        user_indices = df['user_id'].map(self.user_to_idx).values
        track_indices = df['track_id'].map(self.track_to_idx).values
        play_counts = df['play_count'].values.astype(np.float32)
        
        print("Building sparse matrix...")
        self.user_items = csr_matrix(
            (play_counts, (user_indices, track_indices)), 
            shape=(len(unique_users), len(unique_tracks))
        )
        
        print(f"Training ALS model on {len(unique_users)} users and {len(unique_tracks)} tracks...")
        self.model.fit(self.user_items)
        self.is_trained = True
        
        self.save_model()
        print("Training complete and ALS model saved.")

    def recommend(self, user_id: str, top_k: int = 10) -> list[str]:
        if not self.is_trained:
            raise ValueError("Model is not trained yet.")
            
        if user_id not in self.user_to_idx:
            print(f"User {user_id} not found in training data (Cold start).")
            return []
            
        user_idx = self.user_to_idx[user_id]
        ids, scores = self.model.recommend(user_idx, self.user_items[user_idx], N=top_k)
        
        recommendations = [self.idx_to_track[idx] for idx in ids]
        return recommendations

    def get_similar_tracks(self, track_id: str, top_k: int = 10) -> list[str]:
        if not self.is_trained:
            raise ValueError("Model is not trained yet.")
            
        if track_id not in self.track_to_idx:
            print(f"Track {track_id} not found in training data.")
            return []
            
        track_idx = self.track_to_idx[track_id]
        ids, scores = self.model.similar_items(track_idx, N=top_k+1)
        
        recommendations = [self.idx_to_track[idx] for idx in ids if idx != track_idx][:top_k]
        return recommendations

    def save_model(self):
        with open(self.model_path, 'wb') as f:
            pickle.dump(self.model, f)
        with open(self.user_mapping_path, 'wb') as f:
            pickle.dump((self.user_to_idx, self.idx_to_user), f)
        with open(self.track_mapping_path, 'wb') as f:
            pickle.dump((self.track_to_idx, self.idx_to_track), f)

    def load_model(self):
        if os.path.exists(self.model_path) and os.path.exists(self.user_mapping_path):
            with open(self.model_path, 'rb') as f:
                self.model = pickle.load(f)
            with open(self.user_mapping_path, 'rb') as f:
                self.user_to_idx, self.idx_to_user = pickle.load(f)
            with open(self.track_mapping_path, 'rb') as f:
                self.track_to_idx, self.idx_to_track = pickle.load(f)
            self.is_trained = True
            print("Loaded existing collaborative model.")
        else:
            print("No existing collaborative model found.")
