import os
from dotenv import load_dotenv
import spotipy
from spotipy.oauth2 import SpotifyOAuth

def main():
    # Load environment variables from the root .env file, overriding any shell defaults
    load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'), override=True)

    # We need the 'playlist-modify-public' and 'playlist-modify-private' scopes to create playlists.
    scope = "playlist-modify-public playlist-modify-private"

    print("Authenticating with Spotify...")
    # This will open a browser window for you to log into your Spotify account.
    # After logging in and granting permission, it will redirect you to localhost:8080.
    # If the browser says 'Unable to connect' after redirect, just copy the full localhost URL 
    # from your address bar and paste it into this terminal if prompted!
    sp = spotipy.Spotify(auth_manager=SpotifyOAuth(scope=scope))

    # Fetch the current user to verify it worked and trigger the token cache save.
    user = sp.current_user()
    
    print("\n" + "="*50)
    print(f"✅ Successfully authenticated!")
    print(f"👤 Bot Account: {user['display_name']} ({user['id']})")
    print("="*50 + "\n")
    print("A .cache file has been created. The backend will use this to automatically authenticate.")

if __name__ == "__main__":
    main()
