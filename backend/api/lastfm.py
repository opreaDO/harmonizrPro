import os
import requests
from dotenv import load_dotenv

load_dotenv()

LASTFM_API_KEY = os.getenv("LASTFM_API_KEY")

class LastFMClient:
    BASE_URL = "http://ws.audioscrobbler.com/2.0/"
    
    @staticmethod
    def get_track_tags(artist: str, track: str):
        """
        Fetches the top crowdsourced tags for a specific artist and track 
        from the live Last.fm API.
        """
        if not LASTFM_API_KEY:
            raise ValueError("LASTFM_API_KEY is not set in .env")
            
        params = {
            "method": "track.gettoptags",
            "artist": artist,
            "track": track,
            "api_key": LASTFM_API_KEY,
            "format": "json"
        }
        
        response = requests.get(LastFMClient.BASE_URL, params=params)
        
        if response.status_code != 200:
            print(f"Last.fm API Error: {response.status_code} - {response.text}")
            return []
            
        data = response.json()
        
        tags = []
        if "toptags" in data and "tag" in data["toptags"]:
            # Last.fm returns a list or a single object depending on count
            tag_list = data["toptags"]["tag"]
            if isinstance(tag_list, dict):
                tag_list = [tag_list]
                
            for tag_obj in tag_list:
                tags.append(tag_obj["name"].lower())
                
        return tags

    @staticmethod
    def search_track(query: str):
        """
        Searches Last.fm for a track based on a raw text query.
        """
        if not LASTFM_API_KEY:
            raise ValueError("LASTFM_API_KEY is not set in .env")
            
        params = {
            "method": "track.search",
            "track": query,
            "api_key": LASTFM_API_KEY,
            "format": "json",
            "limit": 5
        }
        
        response = requests.get(LastFMClient.BASE_URL, params=params)
        if response.status_code == 200:
            data = response.json()
            matches = data.get("results", {}).get("trackmatches", {}).get("track", [])
            if isinstance(matches, dict):
                matches = [matches]
            return matches
        return []
