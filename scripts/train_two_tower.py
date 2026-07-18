import os
import sys
import argparse
import pandas as pd
import sqlite3

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.ml.two_tower.recommender import TwoTowerRecommender

def main():
    parser = argparse.ArgumentParser(description="Train the Two-Tower Model on the full MSD dataset in the cloud")
    parser.add_argument("--triplets", type=str, default="data/raw/msd/train_triplets.txt", help="Path to train_triplets.txt")
    parser.add_argument("--tags", type=str, default="data/raw/msd/lastfm_tags.db", help="Path to lastfm_tags.db")
    parser.add_argument("--metadata", type=str, default="data/raw/msd/track_metadata.db", help="Path to track_metadata.db")
    parser.add_argument("--output", type=str, default="./data/models/twotower", help="Path to save the trained model")
    parser.add_argument("--batch-size", type=int, default=8192, help="Batch size for InfoNCE (higher = more free negatives)")
    parser.add_argument("--epochs", type=int, default=5, help="Number of training epochs")
    
    args = parser.parse_args()
    
    print("=========================================================")
    print("      TWO-TOWER RECOMMENDER CLOUD TRAINING PIPELINE      ")
    print("=========================================================")
    
    if not os.path.exists(args.triplets):
        print(f"ERROR: Trips file not found at {args.triplets}")
        sys.exit(1)
        
    if not os.path.exists(args.tags):
        print(f"ERROR: Tags DB not found at {args.tags}")
        sys.exit(1)
        
    if not os.path.exists(args.metadata):
        print(f"ERROR: Metadata DB not found at {args.metadata}")
        sys.exit(1)

    print(f"Loading Interactions from {args.triplets}...")
    # The file has no headers: user_id, song_id, play_count
    df = pd.read_csv(args.triplets, sep='\t', header=None, names=['user_id', 'track_id', 'play_count'])
    print(f"Original Rows: {len(df):,}")

    print("Applying Core-10 Filter (dropping users with < 10 listens)...")
    user_counts = df['user_id'].value_counts()
    valid_users = user_counts[user_counts >= 10].index
    interactions_df = df[df['user_id'].isin(valid_users)].copy()
    print(f"Rows after Core-10 filter: {len(interactions_df):,}")
    
    del df 
    
    print(f"Loading Metadata Mapping from {args.metadata}...")
    conn_meta = sqlite3.connect(args.metadata)
    cursor_meta = conn_meta.cursor()
    cursor_meta.execute("SELECT track_id, song_id FROM songs")
    track_to_song = {r[0]: r[1] for r in cursor_meta.fetchall() if r[0] and r[1]}
    conn_meta.close()

    print(f"Loading Tags from SQLite ({args.tags})...")
    conn = sqlite3.connect(args.tags)
    cursor = conn.cursor()
    cursor.execute("SELECT rowid, tag FROM tags")
    tag_id_to_text = {r[0]: r[1] for r in cursor.fetchall()}

    cursor.execute("SELECT rowid, tid FROM tids")
    tid_id_to_track_id = {r[0]: r[1] for r in cursor.fetchall()}

    cursor.execute("SELECT tid, tag, val FROM tid_tag")
    tid_tags = cursor.fetchall()
    conn.close()

    print("Mapping tags to songs...")
    track_tags = {}
    for tid_id, tag_id, val in tid_tags:
        track_id = tid_id_to_track_id.get(tid_id)
        if track_id:
            song_id = track_to_song.get(track_id)
            if song_id:
                if song_id not in track_tags:
                    track_tags[song_id] = []
                tag_text = tag_id_to_text.get(tag_id)
                if tag_text:
                    track_tags[song_id].append(tag_text)

    tracks_data = [{"id": k, "tags": v} for k, v in track_tags.items()]
    print(f"Loaded tags for {len(tracks_data):,} tracks.\n")
    
    print(f"Initializing Recommender and scaling batch size to {args.batch_size}...")
    os.makedirs(args.output, exist_ok=True)
    recommender = TwoTowerRecommender(model_dir=args.output)
    
    # Train the model!
    recommender.train(
        interactions_df=interactions_df, 
        tracks_data=tracks_data, 
        epochs=args.epochs, 
        batch_size=args.batch_size
    )
    
    print(f"\nTraining complete! Models successfully saved to {args.output}")
    print("Download these files from Google Drive to your local repository to serve recommendations!")

if __name__ == "__main__":
    main()
