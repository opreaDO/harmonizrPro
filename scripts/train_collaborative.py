import sys
import os
import pandas as pd
import numpy as np

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.ml.collaborative import CollaborativeRecommender

def main():
    data_path = "./data/raw/msd/train_triplets.txt"
    if not os.path.exists(data_path):
        print("Data not found. Run download_msd.py first.")
        return
        
    print(f"Loading MSD dataset from {data_path}...")
    print("Using memory-optimized dtypes. (Note: loading all 48M rows uses ~3-5GB RAM).")
    
    dtypes = {
        'user_id': 'category',
        'track_id': 'category',
        'play_count': np.uint16
    }
    
    # We are loading 2,000,000 rows out of the 48 million
    print("Loading a 2-million row subset for training...")
    df = pd.read_csv(
        data_path, 
        sep='\t', 
        names=['user_id', 'track_id', 'play_count'],
        dtype=dtypes,
        nrows=2000000 
    )
    
    print(f"Loaded {len(df)} rows.")
    
    # Cast back to string for our dictionary mappings in the model
    df['user_id'] = df['user_id'].astype(str)
    df['track_id'] = df['track_id'].astype(str)
    
    recommender = CollaborativeRecommender()
    recommender.train(df)
    
    print("\n--- Testing Model ---")
    sample_user = df['user_id'].iloc[0]
    sample_track = df['track_id'].iloc[0]
    
    print(f"1. Getting recommendations for sample user: {sample_user}")
    recs = recommender.recommend(sample_user, top_k=5)
    print(f"Top 5 User Recommendations: {recs}")
    
    print(f"\n2. Finding tracks similar to sample track: {sample_track}")
    sim_tracks = recommender.get_similar_tracks(sample_track, top_k=5)
    print(f"Top 5 Similar Tracks: {sim_tracks}")

if __name__ == "__main__":
    main()
