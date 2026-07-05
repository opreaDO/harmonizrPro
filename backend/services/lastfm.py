import httpx
import os
from dotenv import load_dotenv

load_dotenv()

LASTFM_API_KEY = os.getenv("LASTFM_API_KEY")
LASTFM_BASE_URL = os.getenv("LASTFM_BASE_URL", "https://ws.audioscrobbler.com/2.0/")

async def get_track_tags(artist: str, track: str) -> list[str]:
    """Fetches the top tags for a given track from Last.fm."""
    if not LASTFM_API_KEY:
        raise ValueError("LASTFM_API_KEY is not set in .env")
    
    params = {
        "method": "track.gettoptags",
        "artist": artist,
        "track": track,
        "api_key": LASTFM_API_KEY,
        "format": "json",
        "autocorrect": 1
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(LASTFM_BASE_URL, params=params)
        response.raise_for_status()
        data = response.json()
        
        tags = []
        if "toptags" in data and "tag" in data["toptags"]:
            tag_list = data["toptags"]["tag"]
            if isinstance(tag_list, list):
                tags = [tag["name"].lower() for tag in tag_list]
            elif isinstance(tag_list, dict):
                tags = [tag_list["name"].lower()]
        return tags

async def get_user_top_tracks(username: str, limit: int = 50) -> list[dict]:
    """Fetches a user's top tracks from Last.fm."""
    if not LASTFM_API_KEY:
        raise ValueError("LASTFM_API_KEY is not set in .env")
        
    params = {
        "method": "user.gettoptracks",
        "user": username,
        "api_key": LASTFM_API_KEY,
        "format": "json",
        "limit": limit
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(LASTFM_BASE_URL, params=params)
        response.raise_for_status()
        data = response.json()
        
        tracks = []
        if "toptracks" in data and "track" in data["toptracks"]:
            track_list = data["toptracks"]["track"]
            if not isinstance(track_list, list):
                track_list = [track_list]
            
            for t in track_list:
                tracks.append({
                    "artist": t["artist"]["name"],
                    "track": t["name"],
                    "id": f"{t['artist']['name']}_{t['name']}".replace(" ", "_").lower()
                })
        return tracks
