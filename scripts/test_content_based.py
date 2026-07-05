import asyncio
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.services.lastfm import get_track_tags
from backend.ml.content_based import ContentBasedRecommender

async def main():
    print("Fetching tags from Last.fm...")
    seed_tracks = [
        {"artist": "Radiohead", "track": "Creep", "id": "radiohead_creep"},
        {"artist": "Nirvana", "track": "Smells Like Teen Spirit", "id": "nirvana_teen_spirit"},
        {"artist": "Coldplay", "track": "Yellow", "id": "coldplay_yellow"},
        {"artist": "Daft Punk", "track": "Get Lucky", "id": "daftpunk_getlucky"},
        {"artist": "The Weeknd", "track": "Blinding Lights", "id": "weeknd_blindinglights"},
        {"artist": "Kendrick Lamar", "track": "HUMBLE.", "id": "kendrick_humble"},
        {"artist": "Taylor Swift", "track": "Cruel Summer", "id": "taylor_cruel_summer"},
    ]
    
    training_data = []
    for t in seed_tracks:
        try:
            tags = await get_track_tags(t["artist"], t["track"])
            print(f"Tags for {t['artist']} - {t['track']}: {tags[:5]}...")
            training_data.append({"id": t["id"], "tags": tags})
        except Exception as e:
            print(f"Failed to fetch tags for {t['artist']} - {t['track']}: {e}")
        
    print("\nTraining Content-Based Recommender...")
    recommender = ContentBasedRecommender()
    recommender.train(training_data)
    
    test_tags = ["alternative rock", "grunge", "90s rock"]
    print(f"\nFinding recommendations for tags: {test_tags}")
    
    try:
        recs = recommender.recommend(test_tags, top_k=2)
        print(f"Recommendations: {recs}")
    except Exception as e:
        print(f"Recommendation failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())
