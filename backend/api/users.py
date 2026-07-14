from fastapi import APIRouter, HTTPException, Query
from backend.api.lastfm import LastFMClient

router = APIRouter()

@router.get("/user_stats")
def get_user_stats(username: str = Query(..., description="Last.fm username")):
    """
    Fetches the user's basic stats from Last.fm:
    - User Info (total scrobbles, etc)
    - Top Artists
    - Top Tracks
    - Recent Tracks
    """
    if not username:
        raise HTTPException(status_code=400, detail="Username is required")

    info = LastFMClient.get_user_info(username)
    if not info:
        raise HTTPException(status_code=404, detail="User not found on Last.fm")

    top_artists = LastFMClient.get_user_top_artists(username, limit=5)
    top_tracks = LastFMClient.get_user_top_tracks(username, limit=5)
    recent_tracks = LastFMClient.get_user_recent_tracks(username, limit=5)

    return {
        "info": info,
        "top_artists": top_artists,
        "top_tracks": top_tracks,
        "recent_tracks": recent_tracks
    }
