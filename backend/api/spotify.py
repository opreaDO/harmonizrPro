from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import os
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from datetime import datetime
from dotenv import load_dotenv

router = APIRouter()

class Track(BaseModel):
    name: str
    artist: str

class ExportRequest(BaseModel):
    tracks: List[Track]
    playlist_name: str = None

@router.post("/export_spotify")
def export_to_spotify(request: ExportRequest):
    # Ensure environment variables are loaded (override any stale ones in memory)
    env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
    load_dotenv(env_path, override=True)
    
    # Initialize Spotipy
    try:
        scope = "playlist-modify-public playlist-modify-private playlist-read-private playlist-read-collaborative"
        cache_path = os.path.join(os.path.dirname(__file__), '..', '..', '.cache')
        sp = spotipy.Spotify(auth_manager=SpotifyOAuth(scope=scope, cache_path=cache_path))
        user = sp.current_user()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Spotify Auth Error: {str(e)}")

    user_id = user['id']
    
    # 1. Search for each track to get Spotify URIs
    track_uris = []
    not_found = []
    for track in request.tracks:
        query = f"track:{track.name} artist:{track.artist}"
        result = sp.search(q=query, type='track', limit=1)
        items = result.get('tracks', {}).get('items', [])
        if items:
            track_uris.append(items[0]['uri'])
        else:
            # Try a looser search just in case
            loose_query = f"{track.name} {track.artist}"
            loose_result = sp.search(q=loose_query, type='track', limit=1)
            loose_items = loose_result.get('tracks', {}).get('items', [])
            if loose_items:
                track_uris.append(loose_items[0]['uri'])
            else:
                not_found.append(f"{track.name} by {track.artist}")

    if not track_uris:
        raise HTTPException(status_code=400, detail="Could not find any of the requested tracks on Spotify.")

    # 2. Create the playlist manually using the undocumented /me/playlists endpoint to bypass the 403 Forbidden bug
    playlist_name = request.playlist_name or f"Harmonizr Discovery - {datetime.now().strftime('%b %d, %Y')}"
    
    import requests
    token_info = sp.auth_manager.get_cached_token()
    headers = {
        "Authorization": f"Bearer {token_info['access_token']}",
        "Content-Type": "application/json"
    }
    payload = {
        "name": playlist_name,
        "public": False,
        "description": "Exported from Harmonizr Pro"
    }
    
    try:
        res = requests.post("https://api.spotify.com/v1/me/playlists", headers=headers, json=payload)
        res.raise_for_status()
        playlist = res.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create playlist: {str(e)}")

    # 3. Add tracks to playlist
    try:
        # Chunk into 100s as per Spotify API limits
        for i in range(0, len(track_uris), 100):
            sp.playlist_add_items(playlist_id=playlist['id'], items=track_uris[i:i+100])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add tracks: {str(e)}")

    return {
        "success": True,
        "playlist_url": playlist['external_urls']['spotify'],
        "playlist_id": playlist['id'],
        "tracks_added": len(track_uris),
        "tracks_not_found": not_found
    }
