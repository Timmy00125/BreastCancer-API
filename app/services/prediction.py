import io
import os
from datetime import datetime
from typing import Optional, Tuple, Any

import cv2
import numpy as np
import tensorflow as tf
from fastapi import HTTPException
from PIL import Image
from sqlalchemy.orm import Session
from tensorflow.keras.models import load_model  # type: ignore
from tensorflow.keras.preprocessing import image as keras_image  # type: ignore

from app.core.config import HEATMAP_DIR, IMAGE_SIZE, MODEL_PATH, MODEL_VERSION
from app.db.models import Patient, PredictionRecord

def find_last_conv_layer(mdl) -> Optional[str]:
    """Scan the model (including nested models) for the last Conv2D layer."""
    for layer in reversed(mdl.layers):
        if isinstance(layer, tf.keras.layers.Conv2D):
            return layer.name

        if isinstance(layer, tf.keras.Model):
            nested = find_last_conv_layer(layer)
            if nested:
                return nested

        if "conv" in layer.name.lower() and hasattr(layer, "output_shape"):
            output_shape = getattr(layer, "output_shape", None)
            if isinstance(output_shape, tuple) and len(output_shape) == 4:
                return layer.name

    return None


def load_ml_model() -> Tuple[Any, Optional[str]]:
    """Load model and detect Grad-CAM target layer, raising an error if it fails."""
    if not os.path.exists(MODEL_PATH):
        raise RuntimeError(f"Model file not found at {MODEL_PATH}")

    model = load_model(MODEL_PATH)
    dummy_input = np.zeros((1, IMAGE_SIZE[0], IMAGE_SIZE[1], 3), dtype=np.float32)
    _ = model(dummy_input, training=False)
    last_conv_layer_name = find_last_conv_layer(model)
    print(f"[INFO] Model loaded. Grad-CAM target layer: {last_conv_layer_name}")
    return model, last_conv_layer_name


def is_supported_image_filename(name: str) -> bool:
    """Return True when a filename appears to be a supported image file."""
    lower = name.lower()
    return lower.endswith((".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff", ".webp"))


def preprocess_image(img_bytes: bytes) -> np.ndarray:
    """Normalize uploaded bytes into model-ready image array."""
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    img = img.resize(IMAGE_SIZE)
    arr = keras_image.img_to_array(img)
    return np.expand_dims(arr, axis=0) / 255.0


def generate_gradcam(
    model: Any, last_conv_layer_name: Optional[str], img_bytes: bytes, img_array: np.ndarray, pred_index: int
) -> Optional[str]:
    """Generate a Grad-CAM heatmap overlay, save it, and return filename."""
    if model is None or last_conv_layer_name is None:
        return None

    try:
        img_tensor = tf.cast(img_array, tf.float32)
        _ = model(img_tensor, training=False)

        grad_model = tf.keras.models.Model(
            inputs=model.inputs,
            outputs=[model.get_layer(last_conv_layer_name).output, model.output],
        )

        with tf.GradientTape() as tape:
            conv_outputs, predictions = grad_model(img_array)
            loss = predictions[:, pred_index]

        grads = tape.gradient(loss, conv_outputs)
        pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
        conv_outputs = conv_outputs[0]
        heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]
        heatmap = tf.squeeze(heatmap)
        heatmap = tf.maximum(heatmap, 0) / (tf.math.reduce_max(heatmap) + 1e-8)
        heatmap = heatmap.numpy()

        original_img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        orig_w, orig_h = original_img.size
        heatmap_resized = cv2.resize(heatmap, (orig_w, orig_h))
        heatmap_uint8 = np.uint8(255 * heatmap_resized)
        heatmap_color = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)

        orig_np = np.array(original_img)
        orig_cv = cv2.cvtColor(orig_np, cv2.COLOR_RGB2BGR)
        superimposed = cv2.addWeighted(orig_cv, 0.6, heatmap_color, 0.4, 0)

        fname = f"heatmap_{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}.jpg"
        save_path = os.path.join(HEATMAP_DIR, fname)
        cv2.imwrite(save_path, superimposed)
        return fname
    except Exception as error:
        print(f"[WARNING] Grad-CAM failed: {error}")
        return None


def run_prediction(
    model: Any, last_conv_layer_name: Optional[str], img_bytes: bytes, filename: str, patient_id: Optional[int], db: Session
) -> dict:
    """Run prediction pipeline, persist record, and return API response payload."""
    if model is None:
        raise HTTPException(status_code=500, detail="Model is not loaded.")

    img_array = preprocess_image(img_bytes)
    preds = model.predict(img_array, verbose=0)

    pred_index = int((preds[0] > 0.5).astype("int32")[0])
    class_labels = ["benign", "malignant"]
    label = class_labels[pred_index]
    confidence = float(preds[0][0] if label == "malignant" else 1 - preds[0][0])

    heatmap_fname = generate_gradcam(model, last_conv_layer_name, img_bytes, img_array, pred_index)

    if patient_id is not None:
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if patient is None:
            raise HTTPException(
                status_code=404, detail=f"Patient {patient_id} not found."
            )

    record = PredictionRecord(
        filename=filename,
        prediction=label,
        confidence=confidence,
        heatmap_path=heatmap_fname,
        model_version=MODEL_VERSION,
        patient_id=patient_id,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "id": record.id,
        "prediction": record.prediction,
        "filename": record.filename,
        "confidence": record.confidence,
        "timestamp": record.timestamp,
        "heatmap_url": f"/heatmaps/{heatmap_fname}" if heatmap_fname else None,
        "model_version": record.model_version,
        "patient_id": record.patient_id,
    }
