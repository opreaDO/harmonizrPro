from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

# Import our trained ML models
from backend.ml.collaborative import CollaborativeRecommender

router = APIRouter(tags=["Recommendations"])

# Load the model into memory when the server starts.
# Note: ALS on 48M rows is large. In production, this might be handled via a singleton 
# or specific dependency injection to manage memory efficiently.
try:
    collaborative_recommender = CollaborativeRecommender()
except Exception as e:
    print(f"Warning: Could not load CollaborativeRecommender: {e}")
    collaborative_recommender = None


class RecommendationResponse(BaseModel):
    user_id: str
    recommendations: List[str]

@router.get("/recommend/{user_id}", response_model=RecommendationResponse)
def get_recommendations(user_id: str, top_k: int = 10):
    """
    Fetches personalized track recommendations for a given User ID 
    using the trained Alternating Least Squares (ALS) model.
    """
    if not collaborative_recommender or not collaborative_recommender.is_trained:
        raise HTTPException(status_code=503, detail="Recommendation engine is not ready (Model not trained).")
    
    try:
        recs = collaborative_recommender.recommend(user_id, top_k=top_k)
        if not recs:
            # Handle cold start (eventually this will trigger the PyTorch Bridging model)
            return {"user_id": user_id, "recommendations": []}
            
        return {"user_id": user_id, "recommendations": recs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class SimilarTracksResponse(BaseModel):
    track_id: str
    similar_tracks: List[str]

@router.get("/similar/{track_id}", response_model=SimilarTracksResponse)
def get_similar_tracks(track_id: str, top_k: int = 10):
    """
    Finds tracks mathematically similar to the requested Track ID
    by comparing latent embedding vectors in the ALS space.
    """
    if not collaborative_recommender or not collaborative_recommender.is_trained:
        raise HTTPException(status_code=503, detail="Recommendation engine is not ready (Model not trained).")
    
    try:
        sim_tracks = collaborative_recommender.get_similar_tracks(track_id, top_k=top_k)
        return {"track_id": track_id, "similar_tracks": sim_tracks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
