import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
import faiss
import pickle
import os

class ContentBasedRecommender:
    def __init__(self, model_dir: str = "./data/models"):
        self.model_dir = model_dir
        self.vectorizer_path = os.path.join(model_dir, "tfidf_vectorizer.pkl")
        self.index_path = os.path.join(model_dir, "faiss_index.bin")
        self.metadata_path = os.path.join(model_dir, "track_metadata.pkl")
        
        self.vectorizer = TfidfVectorizer(max_features=5000, stop_words='english')
        self.index = None
        self.metadata = [] 
        self.is_trained = False
        
        os.makedirs(model_dir, exist_ok=True)
        self.load_model()

    def train(self, tracks_data: list[dict]):
        if not tracks_data:
            return

        print(f"Training content-based model on {len(tracks_data)} tracks...")
        corpus = [" ".join(track.get('tags', [])) for track in tracks_data]
        self.metadata = [track['id'] for track in tracks_data]
        
        X = self.vectorizer.fit_transform(corpus).astype(np.float32).toarray()
        dimension = X.shape[1]
        self.index = faiss.IndexFlatIP(dimension)
        
        faiss.normalize_L2(X)
        self.index.add(X)
        self.is_trained = True
        
        self.save_model()
        print("Training complete and models saved.")

    def add_track(self, track_id: str, tags: list[str]):
        if not self.is_trained or self.index is None:
            raise ValueError("Model must be trained first before adding individual tracks.")
            
        text = " ".join(tags)
        vector = self.vectorizer.transform([text]).astype(np.float32).toarray()
        faiss.normalize_L2(vector)
        
        self.index.add(vector)
        self.metadata.append(track_id)
        self.save_model()

    def recommend(self, tags: list[str], top_k: int = 10) -> list[str]:
        if not self.is_trained or self.index is None:
            raise ValueError("Model is not trained yet.")
            
        text = " ".join(tags)
        vector = self.vectorizer.transform([text]).astype(np.float32).toarray()
        faiss.normalize_L2(vector)
        
        distances, indices = self.index.search(vector, top_k)
        
        recommendations = []
        for i in range(len(indices[0])):
            idx = indices[0][i]
            if idx != -1 and idx < len(self.metadata):
                recommendations.append(self.metadata[idx])
                
        return recommendations

    def save_model(self):
        with open(self.vectorizer_path, 'wb') as f:
            pickle.dump(self.vectorizer, f)
        with open(self.metadata_path, 'wb') as f:
            pickle.dump(self.metadata, f)
        if self.index is not None:
            faiss.write_index(self.index, self.index_path)

    def load_model(self):
        if os.path.exists(self.vectorizer_path) and os.path.exists(self.metadata_path) and os.path.exists(self.index_path):
            with open(self.vectorizer_path, 'rb') as f:
                self.vectorizer = pickle.load(f)
            with open(self.metadata_path, 'rb') as f:
                self.metadata = pickle.load(f)
            self.index = faiss.read_index(self.index_path)
            self.is_trained = True
            print("Loaded existing content-based model.")
        else:
            print("No existing model found.")
