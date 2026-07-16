import os
import sys
import pandas as pd
import random

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.ml.two_tower.recommender import TwoTowerRecommender

def get_dummy_data():
    """Generates a small dummy dataset to verify the pipeline works locally."""
    print("Generating dummy data for local test...")
    
    users = [f"user_{i}" for i in range(100)]
    tracks = [f"song_{i}" for i in range(50)]
    
    # Generate tracks_data
    possible_tags = ["rock", "pop", "jazz", "electronic", "upbeat", "sad", "guitar", "piano", "90s", "dance"]
    tracks_data = []
    for track_id in tracks:
        tags = random.sample(possible_tags, k=random.randint(2, 5))
        tracks_data.append({"id": track_id, "tags": tags})
        
    # Generate interactions_df
    interactions = []
    for _ in range(500):
        interactions.append({
            "user_id": random.choice(users),
            "track_id": random.choice(tracks),
            "play_count": random.randint(1, 10)
        })
        
    interactions_df = pd.DataFrame(interactions)
    return interactions_df, tracks_data

def main():
    print("=========================================================")
    print("      TWO-TOWER RECOMMENDER TRAINING PIPELINE            ")
    print("=========================================================")
    
    # Try to load real data if it exists (for Colab), otherwise fallback to dummy data
    dataset_path = '/content/train_triplets.txt'
    
    if os.path.exists(dataset_path):
        print(f"Found real dataset at {dataset_path}!")
        print("Loading real interactions...")
        # Add your real data loading logic here for Colab
        # interactions_df = pd.read_csv(...)
        # tracks_data = load_real_tags(...) 
        print("Real data loading is currently stubbed in this script.")
        interactions_df, tracks_data = get_dummy_data()
    else:
        print("Real dataset not found locally. Using dummy data for pipeline verification.")
        interactions_df, tracks_data = get_dummy_data()
        
    print(f"\nDataset loaded:")
    print(f"- {len(interactions_df)} interactions")
    print(f"- {len(tracks_data)} tracks with tags\n")
    
    # Initialize and train
    recommender = TwoTowerRecommender()
    recommender.train(interactions_df, tracks_data, epochs=5, batch_size=32)
    
    print("\nTraining complete! Models saved to ./data/models/twotower/")
    print("You can now start the FastAPI server to serve recommendations.")

if __name__ == "__main__":
    main()
