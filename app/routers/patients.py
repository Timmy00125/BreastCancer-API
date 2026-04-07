from typing import Optional

from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.orm import Session

from app.db.models import Patient
from app.db.session import get_db

router = APIRouter()


@router.get("/patients")
def get_patients(db: Session = Depends(get_db)):
    """List all patients with simple scan count summary."""
    patients = db.query(Patient).order_by(Patient.created_at.desc()).all()
    return [
        {
            "id": patient.id,
            "name": patient.name,
            "age": patient.age,
            "medical_history": patient.medical_history,
            "created_at": patient.created_at,
            "scan_count": len(patient.predictions),
        }
        for patient in patients
    ]


@router.post("/patients")
def create_patient(
    name: str = Form(...),
    age: int = Form(...),
    medical_history: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    """Create a new patient profile."""
    patient = Patient(name=name, age=age, medical_history=medical_history)
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return {
        "id": patient.id,
        "name": patient.name,
        "age": patient.age,
        "medical_history": patient.medical_history,
        "created_at": patient.created_at,
    }


@router.get("/patients/{patient_id}")
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    """Return one patient and their scans."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")

    scans = sorted(patient.predictions, key=lambda record: record.timestamp)
    return {
        "id": patient.id,
        "name": patient.name,
        "age": patient.age,
        "medical_history": patient.medical_history,
        "created_at": patient.created_at,
        "scans": [
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
            }
            for record in scans
        ],
    }


@router.delete("/patients/{patient_id}")
def delete_patient(patient_id: int, db: Session = Depends(get_db)):
    """Delete a patient and their related scans."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")

    db.delete(patient)
    db.commit()
    return {"detail": "Patient deleted."}
