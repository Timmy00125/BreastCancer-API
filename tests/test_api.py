import io
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.core.app_factory import create_app

app = create_app()
client = TestClient(app)

def create_dummy_image() -> bytes:
    img = Image.new("RGB", (150, 150), color="white")
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="PNG")
    return img_byte_arr.getvalue()

def test_read_history():
    response = client.get("/history")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_predict_endpoint_missing_file():
    response = client.post("/predict")
    assert response.status_code == 422  # Unprocessable Entity
