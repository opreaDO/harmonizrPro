import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL") or os.getenv("DB_CONNECTION_STRING")

if DB_URL and DB_URL.startswith("postgres://"):
    # SQLAlchemy 1.4+ requires postgresql:// instead of postgres://
    DB_URL = DB_URL.replace("postgres://", "postgresql://", 1)

if not DB_URL:
    print("Warning: Database URL not configured in .env. Database connections will fail.")
    engine = None
    SessionLocal = None
else:
    engine = create_engine(DB_URL, pool_pre_ping=True)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency block for FastAPI endpoints
def get_db():
    if not SessionLocal:
        yield None
        return
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
