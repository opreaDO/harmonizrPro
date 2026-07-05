import asyncio
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.services.lastfm import get_track_tags, get_user_top_tracks
from backend.ml.content_based import ContentBasedRecommender

async def main():
    username = "rj"
    limit = 30
    
    print(f"Fetching top {limit} tracks for Last.fm user '{username}'...")
    try:
        top_tracks = await get_user_top_tracks(username, limit=limit)
    except Exception as e:
        print(f"Failed to fetch user tracks: {e}")
        return
        
    if not top_tracks:
        print("No tracks found.")
        return
        
    print(f"Found {len(top_tracks)} tracks. Fetching tags for each...\n")
    
    training_data = []
    for t in top_tracks:
        try:
            tags = await get_track_tags(t["artist"], t["track"])
            if tags:
                track_id = f"{t['artist']} - {t['track']}"
                training_data.append({"id": track_id, "tags": tags})
                # Using [OK] instead of unicode checkmarks to prevent windows console encoding crashes
                print(f"[OK] {track_id} ({len(tags)} tags)")
            else:
                print(f"[NO TAGS] {t['artist']} - {t['track']}")
        except Exception as e:
            print(f"[ERROR] Failed to fetch tags for {t['artist']} - {t['track']}: {e}")
            
    print(f"\nTraining Content-Based Recommender on {len(training_data)} real tracks...")
    recommender = ContentBasedRecommender()
    recommender.train(training_data)
    
    if training_data:
        seed = training_data[0]
        print(f"\n--- Testing Recommendation ---")
        print(f"Seed Track: {seed['id']}")
        print(f"Seed Tags: {seed['tags'][:5]}...")
        
        recs = recommender.recommend(seed["tags"], top_k=4)
        
        print(f"\nTop Recommendations in '{username}'s library similar to '{seed['id']}':")
        for rec in recs:
            if rec != seed['id']:
                print(f"-> {rec}")

if __name__ == "__main__":
    asyncio.run(main())
