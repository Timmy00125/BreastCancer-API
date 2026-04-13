import os
from pydantic_settings import BaseSettings

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class Settings(BaseSettings):
    HEATMAP_DIR: str = os.path.join(BASE_DIR, "heatmaps")
    SQLALCHEMY_DATABASE_URL: str = "sqlite:///./predictions.db"
    RESET_DB_ON_STARTUP: bool = True
    MODEL_PATH: str = os.path.join(BASE_DIR, "bcd_model.h5")
    MODEL_VERSION: str = "v1.0"
    CORS_ORIGINS: str = "*"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
os.makedirs(settings.HEATMAP_DIR, exist_ok=True)

HEATMAP_DIR = settings.HEATMAP_DIR
SQLALCHEMY_DATABASE_URL = settings.SQLALCHEMY_DATABASE_URL
RESET_DB_ON_STARTUP = settings.RESET_DB_ON_STARTUP
MODEL_PATH = settings.MODEL_PATH
MODEL_VERSION = settings.MODEL_VERSION
CORS_ORIGINS = settings.CORS_ORIGINS
IMAGE_SIZE = (150, 150)
