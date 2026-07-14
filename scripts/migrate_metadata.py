import os
import sqlite3
import urllib.request
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load environment variables
load_dotenv()

# We look for common Postgres env var names
DB_URL = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL") or os.getenv("DB_CONNECTION_STRING")

if not DB_URL:
    raise ValueError("Database connection string not found. Please ensure it is set in .env (e.g., DATABASE_URL=...)")

# SQLAlchemy 1.4+ requires the 'postgresql://' prefix instead of 'postgres://'
if DB_URL.startswith("postgres://"):
    DB_URL = DB_URL.replace("postgres://", "postgresql://", 1)

SQLITE_URL = "http://millionsongdataset.com/sites/default/files/AdditionalFiles/track_metadata.db"
LOCAL_SQLITE_PATH = "./data/raw/msd/track_metadata.db"

def download_sqlite():
    os.makedirs(os.path.dirname(LOCAL_SQLITE_PATH), exist_ok=True)
    if os.path.exists(LOCAL_SQLITE_PATH):
        print(f"SQLite DB already exists at {LOCAL_SQLITE_PATH}.")
        return

    print(f"Downloading MSD metadata DB (~300MB) from {SQLITE_URL}...")
    def hook(count, block_size, total_size):
        if total_size > 0:
            percent = int(count * block_size * 100 / total_size)
            if percent % 10 == 0 and percent != getattr(hook, "last_percent", -1):
                print(f"Downloading... {percent}%")
                hook.last_percent = percent
    hook.last_percent = -1
    urllib.request.urlretrieve(SQLITE_URL, LOCAL_SQLITE_PATH, reporthook=hook)
    print("Download complete.")

def migrate_to_postgres():
    print("Connecting to PostgreSQL...")
    engine = create_engine(DB_URL)
    
    # We use TEXT for strings to avoid crashing on incredibly long classical music track names
    with engine.begin() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS tracks (
                track_id VARCHAR(50) PRIMARY KEY,
                title TEXT,
                song_id VARCHAR(50),
                release TEXT,
                artist_id VARCHAR(50),
                artist_mbid VARCHAR(50),
                artist_name TEXT,
                duration FLOAT,
                artist_familiarity FLOAT,
                artist_hotttnesss FLOAT,
                year INT
            );
        """))
        # We removed the truncate statement here to allow the migration to resume without deleting the previous 180k rows.

    print("Connecting to local SQLite database...")
    sqlite_conn = sqlite3.connect(LOCAL_SQLITE_PATH)
    cursor = sqlite_conn.cursor()

    print("Fetching tracks from SQLite...")
    cursor.execute("SELECT track_id, title, song_id, release, artist_id, artist_mbid, artist_name, duration, artist_familiarity, artist_hotttnesss, year FROM songs")
    
    batch_size = 20000
    rows = cursor.fetchmany(batch_size)
    total_migrated = 0
    
    insert_query = text("""
        INSERT INTO tracks (
            track_id, title, song_id, release, artist_id, artist_mbid, artist_name, duration, artist_familiarity, artist_hotttnesss, year
        ) VALUES (
            :track_id, :title, :song_id, :release, :artist_id, :artist_mbid, :artist_name, :duration, :artist_familiarity, :artist_hotttnesss, :year
        ) ON CONFLICT (track_id) DO NOTHING
    """)
    
    while rows:
        data_to_insert = [
            {
                "track_id": r[0], "title": r[1], "song_id": r[2],
                "release": r[3], "artist_id": r[4], "artist_mbid": r[5],
                "artist_name": r[6], "duration": r[7], 
                "artist_familiarity": r[8], "artist_hotttnesss": r[9], "year": r[10]
            }
            for r in rows
        ]
        
        with engine.begin() as conn:
            conn.execute(insert_query, data_to_insert)
            
        total_migrated += len(rows)
        print(f"Migrated {total_migrated} tracks to Postgres...")
        rows = cursor.fetchmany(batch_size)
        
    sqlite_conn.close()
    print("Migration complete! The SQLite file can now be safely deleted.")

if __name__ == "__main__":
    download_sqlite()
    migrate_to_postgres()
