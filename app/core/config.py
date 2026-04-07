import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HEATMAP_DIR = os.path.join(BASE_DIR, "heatmaps")
os.makedirs(HEATMAP_DIR, exist_ok=True)

SQLALCHEMY_DATABASE_URL = "sqlite:///./predictions.db"
RESET_DB_ON_STARTUP = os.getenv("RESET_DB_ON_STARTUP", "1") == "1"

MODEL_PATH = os.path.join(BASE_DIR, "bcd_model.h5")
MODEL_VERSION = "v1.0"
IMAGE_SIZE = (150, 150)
