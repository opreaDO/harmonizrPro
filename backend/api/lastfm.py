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
        If the API hides low-weight tags (returns empty), this will fallback
        to aggressively scraping the raw HTML page.
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
        
        tags = []
        if response.status_code == 200:
            data = response.json()
            if "toptags" in data and "tag" in data["toptags"]:
                # Last.fm returns a list or a single object depending on count
                tag_list = data["toptags"]["tag"]
                if isinstance(tag_list, dict):
                    tag_list = [tag_list]
                    
                for tag_obj in tag_list:
                    tags.append(tag_obj["name"].lower())
                    
        # Fallback: Scrape HTML for low-weight user tags if API returns nothing
        if not tags:
            try:
                import urllib.parse
                import re
                scrape_url = f"https://www.last.fm/music/{urllib.parse.quote(artist)}/_/{urllib.parse.quote(track)}"
                scrape_res = requests.get(scrape_url, timeout=5)
                if scrape_res.status_code == 200:
                    raw_tags = re.findall(r'href="/tag/([^"]+)"', scrape_res.text)
                    clean_tags = [urllib.parse.unquote(t).replace('+', ' ').lower() for t in raw_tags]
                    if clean_tags:
                        tags = list(set(clean_tags))
            except Exception as e:
                print(f"Error scraping tags from Last.fm HTML: {e}")
                
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

    @staticmethod
    def get_user_info(username: str):
        params = {"method": "user.getinfo", "user": username, "api_key": LASTFM_API_KEY, "format": "json"}
        res = requests.get(LastFMClient.BASE_URL, params=params)
        if res.status_code == 200:
            return res.json().get("user", {})
        return {}

    @staticmethod
    def get_user_top_artists(username: str, limit: int = 5):
        params = {"method": "user.gettopartists", "user": username, "api_key": LASTFM_API_KEY, "format": "json", "limit": limit}
        res = requests.get(LastFMClient.BASE_URL, params=params)
        if res.status_code == 200:
            artists = res.json().get("topartists", {}).get("artist", [])
            if isinstance(artists, dict): artists = [artists]
            return artists
        return []

    @staticmethod
    def get_user_top_tracks(username: str, limit: int = 5):
        params = {"method": "user.gettoptracks", "user": username, "api_key": LASTFM_API_KEY, "format": "json", "limit": limit}
        res = requests.get(LastFMClient.BASE_URL, params=params)
        if res.status_code == 200:
            tracks = res.json().get("toptracks", {}).get("track", [])
            if isinstance(tracks, dict): tracks = [tracks]
            return tracks
        return []

    @staticmethod
    def get_user_recent_tracks(username: str, limit: int = 5):
        params = {"method": "user.getrecenttracks", "user": username, "api_key": LASTFM_API_KEY, "format": "json", "limit": limit}
        res = requests.get(LastFMClient.BASE_URL, params=params)
        if res.status_code == 200:
            tracks = res.json().get("recenttracks", {}).get("track", [])
            if isinstance(tracks, dict): tracks = [tracks]
            return tracks
        return []
