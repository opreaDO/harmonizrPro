from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import numpy as np

# Database imports
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Track

# ML models and logic
from backend.ml.two_tower.recommender import TwoTowerRecommender
from backend.api.lastfm import LastFMClient

router = APIRouter(tags=["Recommendations"])

try:
    recommender = TwoTowerRecommender()
except Exception as e:
    print(f"Warning: Could not load TwoTowerRecommender: {e}")
    recommender = None


class RecommendationResponse(BaseModel):
    user_id: Optional[str] = None
    search_query: Optional[str] = None
    recommendations: List[Dict[str, Any]]

def translate_ids_to_tracks(db: Session, track_ids: List[str]) -> List[Dict[str, str]]:
    """Translates raw SO... IDs into human readable track dictionaries using Postgres."""
    if not db:
        # Fallback if DB is not connected
        return [{"track_id": tid, "name": f"Unknown Track ({tid})"} for tid in track_ids]
        
    # ML model uses song_id (SO...), but the DB PK is track_id (TR...)
    tracks = db.query(Track).filter(Track.song_id.in_(track_ids)).all()
    # Create a mapping to preserve the mathematical ordering
    track_map = {t.song_id: {"track_id": t.track_id, "name": f"{t.artist_name} - {t.title}"} for t in tracks}
    
    results = []
    for sid in track_ids:
        if sid in track_map:
            results.append(track_map[sid])
        else:
            results.append({"track_id": sid, "name": f"Unknown Track ({sid})"})
    return results


@router.get("/recommend/{user_id}", response_model=RecommendationResponse)
def get_recommendations(user_id: str, top_k: int = 10, db: Session = Depends(get_db)):
    if not recommender or not recommender.is_trained:
        raise HTTPException(status_code=503, detail="Recommendation engine is not ready.")
    
    try:
        recs = recommender.recommend(user_id, top_k=top_k)
        if not recs:
            return {"user_id": user_id, "recommendations": []}
            
        translated = translate_ids_to_tracks(db, recs)
        return {"user_id": user_id, "recommendations": translated}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/bridge_recommend", response_model=RecommendationResponse)
def get_bridge_recommendations(artist: str, track: str, use_fallback: bool = True, use_super_tags: bool = False, top_k: int = 10, db: Session = Depends(get_db)):
    """
    Cold-start protocol using Two-Tower model:
    1. Fetches tags from live Last.fm API
    2. Projects into Math vector using Item Tower
    3. Finds closest historical tracks in the FAISS index
    """
    if not recommender:
        raise HTTPException(status_code=503, detail="ML engine is not fully loaded.")
        
    try:
        # 1. Fetch live tags
        tags = LastFMClient.get_track_tags(artist, track)
        
        # Fallback to artist tags if the specific track is too obscure
        if not tags and use_fallback:
            tags = LastFMClient.get_artist_tags(artist)
            
        if use_super_tags:
            super_tags = LastFMClient.get_artist_super_tags(artist, num_similar=3)
            tags = list(set(tags + super_tags))
            
        if not tags:
            raise HTTPException(status_code=404, detail="No acoustic tags found for this track or artist on Last.fm.")
            
        # Fast-Path: If the track exists in our model
        track_rows = db.query(Track).filter(Track.artist_name.ilike(artist), Track.title.ilike(track)).all()
        for track_row in track_rows:
            if track_row.song_id in recommender.track_to_idx:
                recs = recommender.get_similar_tracks(track_row.song_id, top_k=top_k)
                translated = translate_ids_to_tracks(db, recs)
                return {"search_query": f"{artist} - {track} (Fast-Path)", "recommendations": translated}
            
        # 2. Text to math (TF-IDF & Tower) and NN Search
        recs = recommender.recommend_for_cold_track(tags, top_k=top_k)
        
        # 3. Translate IDs
        translated = translate_ids_to_tracks(db, recs)
        
        return {"search_query": f"{artist} - {track}", "recommendations": translated}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search_track")
async def search_track(query: str):
    """
    Pass-through endpoint to search Last.fm for songs by generic string query.
    Used for the frontend typeahead search dropdown.
    Fetches iTunes album artwork concurrently for performance.
    """
    try:
        import asyncio
        import httpx
        import urllib.parse
        
        matches = LastFMClient.search_track(query)
        
        async def fetch_itunes_image(name, artist, client):
            try:
                term = urllib.parse.quote(f"{name} {artist}")
                res = await client.get(f"https://itunes.apple.com/search?term={term}&entity=song&limit=1", timeout=2.0)
                if res.status_code == 200:
                    data = res.json()
                    if data.get("resultCount", 0) > 0:
                        return data["results"][0].get("artworkUrl100", "").replace("100x100bb.jpg", "300x300bb.jpg")
            except Exception:
                pass
            return None

        async with httpx.AsyncClient() as client:
            tasks = []
            for match in matches:
                name = match.get("name")
                artist = match.get("artist")
                tasks.append(fetch_itunes_image(name, artist, client))
            
            images = await asyncio.gather(*tasks)

        results = []
        for i, match in enumerate(matches):
            results.append({
                "name": match.get("name"),
                "artist": match.get("artist"),
                "image": images[i],
                "mbid": match.get("mbid")
            })
            
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
