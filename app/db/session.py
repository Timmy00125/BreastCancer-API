from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from app.core.config import RESET_DB_ON_STARTUP, SQLALCHEMY_DATABASE_URL

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def initialize_database() -> None:
    """Initialize schema for prototype use, with optional reset-on-startup."""
    # Import models here so SQLAlchemy metadata includes all mapped tables.
    from app.db import models  # noqa: F401

    if RESET_DB_ON_STARTUP:
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        print("[INFO] Prototype DB reset: dropped and recreated schema.")
        return

    Base.metadata.create_all(bind=engine)
    print("[INFO] DB schema check completed.")


def get_db() -> Session:
    """Yield a database session for request-scoped dependencies."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
