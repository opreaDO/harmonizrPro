from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import numpy as np

# Database imports
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Track

# ML models and logic
from backend.ml.collaborative import CollaborativeRecommender
from backend.ml.content_based import ContentBasedRecommender
from backend.ml.bridging.inference import BridgeInference
from backend.api.lastfm import LastFMClient

router = APIRouter(tags=["Recommendations"])

try:
    collaborative_recommender = CollaborativeRecommender()
except Exception as e:
    print(f"Warning: Could not load CollaborativeRecommender: {e}")
    collaborative_recommender = None

try:
    content_recommender = ContentBasedRecommender()
    bridge_model = BridgeInference(
        model_path="./data/models/bridge_mlp.pth", 
        input_dim=5000, 
        output_dim=50
    )
except Exception as e:
    print(f"Warning: Could not load Bridging models: {e}")
    content_recommender = None
    bridge_model = None


class RecommendationResponse(BaseModel):
    user_id: Optional[str] = None
    search_query: Optional[str] = None
    recommendations: List[Dict[str, Any]]

def translate_ids_to_tracks(db: Session, track_ids: List[str]) -> List[Dict[str, str]]:
    """Translates raw SO... IDs into human readable track dictionaries using Postgres."""
    if not db:
        # Fallback if DB is not connected
        return [{"track_id": tid, "name": f"Unknown Track ({tid})"} for tid in track_ids]
        
    tracks = db.query(Track).filter(Track.track_id.in_(track_ids)).all()
    # Create a mapping to preserve the mathematical ordering
    track_map = {t.track_id: {"track_id": t.track_id, "name": f"{t.artist_name} - {t.title}"} for t in tracks}
    
    results = []
    for tid in track_ids:
        if tid in track_map:
            results.append(track_map[tid])
        else:
            results.append({"track_id": tid, "name": f"Unknown Track ({tid})"})
    return results


@router.get("/recommend/{user_id}", response_model=RecommendationResponse)
def get_recommendations(user_id: str, top_k: int = 10, db: Session = Depends(get_db)):
    if not collaborative_recommender or not collaborative_recommender.is_trained:
        raise HTTPException(status_code=503, detail="Recommendation engine is not ready.")
    
    try:
        recs = collaborative_recommender.recommend(user_id, top_k=top_k)
        if not recs:
            return {"user_id": user_id, "recommendations": []}
            
        translated = translate_ids_to_tracks(db, recs)
        return {"user_id": user_id, "recommendations": translated}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/bridge_recommend", response_model=RecommendationResponse)
def get_bridge_recommendations(artist: str, track: str, top_k: int = 10, db: Session = Depends(get_db)):
    """
    Cold-start protocol:
    1. Fetches tags from live Last.fm API
    2. Uses TF-IDF vectorizer to convert words to numbers
    3. Projects into 50-dim math vector using PyTorch Bridging MLP
    4. Finds closest historical tracks in the ALS matrix via dot product
    """
    if not bridge_model or not content_recommender or not collaborative_recommender:
        raise HTTPException(status_code=503, detail="Bridging ML engine is not fully loaded.")
        
    try:
        # 1. Fetch live tags
        tags = LastFMClient.get_track_tags(artist, track)
        if not tags:
            raise HTTPException(status_code=404, detail="No crowdsourced tags found on Last.fm for this track.")
            
        # 2. Text to math (TF-IDF)
        text = " ".join(tags)
        tag_vector = content_recommender.vectorizer.transform([text]).astype(np.float32).toarray()[0]
        
        # 3. Math to Embedding (PyTorch)
        embedding = bridge_model.predict_embedding(tag_vector) # Shape: (1, 50)
        
        # 4. Find Nearest Neighbors in ALS Space
        item_factors = collaborative_recommender.model.item_factors
        # Dot product of the new vector against all 193k historical vectors
        scores = np.dot(item_factors, embedding[0])
        top_indices = np.argsort(scores)[::-1][:top_k]
        
        recs = [collaborative_recommender.idx_to_track[idx] for idx in top_indices]
        
        # 5. Translate IDs
        translated = translate_ids_to_tracks(db, recs)
        
        return {"search_query": f"{artist} - {track}", "recommendations": translated}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search_track")
def search_track(query: str):
    """
    Pass-through endpoint to search Last.fm for songs by generic string query.
    Used for the frontend typeahead search dropdown.
    """
    try:
        matches = LastFMClient.search_track(query)
        results = []
        for match in matches:
            results.append({
                "name": match.get("name"),
                "artist": match.get("artist")
            })
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
