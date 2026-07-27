from fastapi import APIRouter, HTTPException, Query
from backend.api.lastfm import LastFMClient

router = APIRouter()

@router.get("/validate_user")
def validate_user(username: str = Query(..., description="Last.fm username")):
    """Validates if a username exists on Last.fm"""
    if not username:
        raise HTTPException(status_code=400, detail="Username is required")
        
    info = LastFMClient.get_user_info(username)
    if not info:
        raise HTTPException(status_code=404, detail="User not found on Last.fm")
        
    return {"valid": True, "username": info.get("name")}

import asyncio
import httpx
from backend.api.recommendations import fetch_itunes_data

async def attach_itunes_to_lastfm(tracks: list) -> list:
    async with httpx.AsyncClient() as client:
        tasks = []
        for t in tracks:
            artist = t.get("artist", {}).get("#text", "")
            if not artist and isinstance(t.get("artist"), str):
                artist = t.get("artist")
            tasks.append(fetch_itunes_data(t.get("name", ""), artist, client))
        itunes_data = await asyncio.gather(*tasks)
        
    for i, t in enumerate(tracks):
        if itunes_data[i]:
            t["itunes_image"] = itunes_data[i].get("image")
            t["preview"] = itunes_data[i].get("preview")
    return tracks

@router.get("/user_stats")
async def get_user_stats(
    username: str = Query(..., description="Last.fm username"),
    period: str = Query("overall", description="overall, 7day, 1month, 3month, 6month, 12month")
):
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

    top_artists = LastFMClient.get_user_top_artists(username, limit=5, period=period)
    top_tracks = LastFMClient.get_user_top_tracks(username, limit=5, period=period)
    recent_tracks_for_stats = LastFMClient.get_user_recent_tracks(username, limit=100)
    
    # 1. Calculate Chronotype (Audio Rhythm)
    buckets = {"Morning (6am-12pm)": 0, "Afternoon (12pm-6pm)": 0, "Evening (6pm-12am)": 0, "Late Night (12am-6am)": 0}
    from datetime import datetime
    for t in recent_tracks_for_stats:
        if "date" in t and "uts" in t["date"]:
            hour = datetime.fromtimestamp(int(t["date"]["uts"])).hour
            if 6 <= hour < 12: buckets["Morning (6am-12pm)"] += 1
            elif 12 <= hour < 18: buckets["Afternoon (12pm-6pm)"] += 1
            elif 18 <= hour <= 23: buckets["Evening (6pm-12am)"] += 1
            else: buckets["Late Night (12am-6am)"] += 1
            
    chronotype = max(buckets, key=buckets.get) if any(buckets.values()) else "Unknown"

    # 2. Calculate Binge Factor (Artist Fixation)
    max_streak = 0
    current_streak = 1
    binge_artist = "None"
    
    if recent_tracks_for_stats:
        prev_artist = recent_tracks_for_stats[0].get("artist", {}).get("#text", "")
        for t in recent_tracks_for_stats[1:]:
            curr_artist = t.get("artist", {}).get("#text", "")
            if curr_artist == prev_artist:
                current_streak += 1
            else:
                if current_streak > max_streak:
                    max_streak = current_streak
                    binge_artist = prev_artist
                current_streak = 1
                prev_artist = curr_artist
        if current_streak > max_streak:
            max_streak = current_streak
            binge_artist = prev_artist

    recent_tracks_enriched = await attach_itunes_to_lastfm(recent_tracks_for_stats[:5])

    return {
        "info": info,
        "top_artists": top_artists,
        "top_tracks": top_tracks,
        "recent_tracks": recent_tracks_enriched,
        "chronotype": chronotype,
        "binge": {"artist": binge_artist, "streak": max_streak}
    }
