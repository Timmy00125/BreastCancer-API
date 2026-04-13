import io
import zipfile
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, Request
from sqlalchemy.orm import Session

from app.db.models import PredictionRecord
from app.db.session import get_db
from app.services.prediction import is_supported_image_filename, run_prediction

router = APIRouter()


@router.post("/predict")
async def predict(
    request: Request,
    file: UploadFile = File(...),
    patient_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
):
    """Predict one uploaded image and store result."""
    contents = await file.read()
    filename = file.filename or "uploaded_image"
    try:
        return run_prediction(request.app.state.model, request.app.state.last_conv_layer_name, contents, filename, patient_id, db)
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.post("/predict/batch")
async def predict_batch(
    request: Request,
    file: UploadFile = File(...),
    patient_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
):
    """Accept a ZIP of images and process each image synchronously."""
    contents = await file.read()
    if not (file.filename or "").endswith(".zip"):
        raise HTTPException(
            status_code=400,
            detail="Only .zip files are accepted for batch prediction.",
        )

    results = []
    errors = []
    names: list[str] = []

    try:
        with zipfile.ZipFile(io.BytesIO(contents)) as zip_file:
            names = [
                name
                for name in zip_file.namelist()
                if not name.endswith("/") and is_supported_image_filename(name)
            ]
            if len(names) == 0:
                raise HTTPException(
                    status_code=400,
                    detail="ZIP has no supported image files.",
                )

            for name in names:
                try:
                    img_bytes = zip_file.read(name)
                    result = run_prediction(request.app.state.model, request.app.state.last_conv_layer_name, img_bytes, name, patient_id, db)
                    results.append(result)
                except Exception as error:
                    errors.append({"filename": name, "error": str(error)})

    except zipfile.BadZipFile:
        raise HTTPException(status_code=400, detail="Invalid ZIP file.")

    return {
        "total": len(names),
        "succeeded": len(results),
        "failed": len(errors),
        "results": results,
        "errors": errors,
    }


@router.get("/history")
def get_history(db: Session = Depends(get_db)):
    """Return prediction history ordered by newest first."""
    records = (
        db.query(PredictionRecord).order_by(PredictionRecord.timestamp.desc()).all()
    )
    return [
        {
            "id": record.id,
            "filename": record.filename,
            "prediction": record.prediction,
            "confidence": record.confidence,
            "timestamp": record.timestamp,
            "heatmap_url": f"/heatmaps/{record.heatmap_path}"
            if record.heatmap_path
            else None,
            "model_version": record.model_version,
            "patient_id": record.patient_id,
            "patient_name": record.patient.name if record.patient else None,
        }
        for record in records
    ]
