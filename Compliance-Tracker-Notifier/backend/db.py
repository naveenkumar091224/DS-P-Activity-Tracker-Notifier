from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from models import Base
import os
from pathlib import Path

# Ensure data directory exists
data_dir = Path("/app/data")
data_dir.mkdir(parents=True, exist_ok=True)

# Database URL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:////app/data/compliance_tracker.db")

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Initialize database tables"""
    # Import auth models lazily to avoid circular imports during module initialization.
    import user_models  # noqa: F401

    Base.metadata.create_all(bind=engine)

def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Made with Bob
