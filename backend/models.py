from sqlalchemy import Column, String, Float, Integer, Text
from backend.database import Base

class Track(Base):
    __tablename__ = "tracks"

    track_id = Column(String(50), primary_key=True, index=True)
    title = Column(Text)
    song_id = Column(String(50))
    release = Column(Text)
    artist_id = Column(String(50))
    artist_mbid = Column(String(50))
    artist_name = Column(Text)
    duration = Column(Float)
    artist_familiarity = Column(Float)
    artist_hotttnesss = Column(Float)
    year = Column(Integer)
