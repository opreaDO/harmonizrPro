import os
import sqlite3
import pickle
import numpy as np
import torch
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.ml.content_based import ContentBasedRecommender
from backend.ml.bridging.dataset import TagToEmbeddingDataset
from backend.ml.bridging.models import MLPProjector
from backend.ml.bridging.trainer import BridgeTrainer
from torch.utils.data import DataLoader

def main():
    print("Loading track_mapping (to get ALS mapping)...")
    with open('data/models/track_mapping.pkl', 'rb') as f:
        track_to_idx, _ = pickle.load(f)

    print("Loading ALS factors...")
    with open('data/models/als_model.pkl', 'rb') as f:
        als_model = pickle.load(f)
    item_factors = als_model.item_factors

    print("Fetching Track_ID -> Song_ID mapping from Postgres...")
    load_dotenv()
    db_url = (os.getenv('DATABASE_URL') or '').replace('postgres://', 'postgresql://', 1)
    engine = create_engine(db_url)
    with engine.connect() as conn:
        rows = conn.execute(text("SELECT track_id, song_id FROM tracks")).fetchall()
    
    # We only care about tracks that exist in the ALS model!
    tid_to_song = {r[0]: r[1] for r in rows if r[1] in track_to_idx}
    print(f"Found {len(tid_to_song)} tracks in DB that have ALS vectors.")

    print("Loading Last.fm tags from SQLite...")
    conn = sqlite3.connect('data/raw/msd/lastfm_tags.db')
    cursor = conn.cursor()
    
    cursor.execute("SELECT rowid, tag FROM tags")
    tag_id_to_text = {r[0]: r[1] for r in cursor.fetchall()}
    
    cursor.execute("SELECT rowid, tid FROM tids")
    tid_id_to_track_id = {r[0]: r[1] for r in cursor.fetchall()}
    
    cursor.execute("SELECT tid, tag, val FROM tid_tag")
    tid_tags = cursor.fetchall()
    conn.close()

    print("Building text corpus for TF-IDF...")
    track_tags = {}
    for tid_id, tag_id, val in tid_tags:
        track_id = tid_id_to_track_id.get(tid_id)
        if track_id in tid_to_song:
            song_id = tid_to_song[track_id]
            if song_id not in track_tags:
                track_tags[song_id] = []
            tag_text = tag_id_to_text.get(tag_id)
            if tag_text:
                track_tags[song_id].append(tag_text)

    valid_song_ids = list(track_tags.keys())
    print(f"Found {len(valid_song_ids)} tracks that have both Tags and ALS Vectors!")

    print("Training TF-IDF Vectorizer...")
    corpus = [" ".join(track_tags[sid]) for sid in valid_song_ids]
    
    content_rec = ContentBasedRecommender()
    X = content_rec.vectorizer.fit_transform(corpus).astype(np.float32)
    
    print("Building ALS Y matrix...")
    Y = np.zeros((len(valid_song_ids), 50), dtype=np.float32)
    for i, sid in enumerate(valid_song_ids):
        als_idx = track_to_idx[sid]
        vec = item_factors[als_idx]
        norm = np.linalg.norm(vec)
        if norm > 0:
            Y[i] = vec / norm
        else:
            Y[i] = vec

    print("Training PyTorch Bridging MLP...")
    dataset = TagToEmbeddingDataset(X, Y)
    dataloader = DataLoader(dataset, batch_size=256, shuffle=True)
    
    device = "cuda" if torch.cuda.is_available() else "cpu"
    
    model = MLPProjector(input_dim=X.shape[1], output_dim=50).to(device)
    trainer = BridgeTrainer(model, dataloader, learning_rate=1e-3, device=device)
    
    trainer.train(epochs=15)
    
    print("Saving PyTorch Model...")
    torch.save(model.state_dict(), "./data/models/bridge_mlp.pth")
    print("Saving TF-IDF Vectorizer...")
    with open("./data/models/tfidf_vectorizer.pkl", "wb") as f:
        pickle.dump(content_rec.vectorizer, f)
        
    print("ALL DONE! The PyTorch Bridge is fully trained on real Last.fm tags!")

if __name__ == "__main__":
    main()
