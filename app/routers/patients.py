from typing import Optional, List

from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from app.db.models import Patient
from app.db.session import get_db

router = APIRouter(tags=["Patients"])

class PatientResponse(BaseModel):
    id: int
    name: str
    age: int
    medical_history: Optional[str]
    created_at: datetime
    scan_count: Optional[int] = None

class ScanResponse(BaseModel):
    id: int
    filename: str
    prediction: str
    confidence: float
    timestamp: datetime
    heatmap_url: Optional[str]
    model_version: str

class PatientDetailResponse(PatientResponse):
    scans: List[ScanResponse]

@router.get("/patients", response_model=List[PatientResponse], summary="Get all patients")
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

@router.post("/patients", response_model=PatientResponse, summary="Create a patient")
def create_patient(
    name: str = Form(..., description="Full name of the patient"),
    age: int = Form(..., description="Age of the patient"),
    medical_history: Optional[str] = Form(None, description="Patient's medical history"),
    db: Session = Depends(get_db),
):
    """Create a new patient profile with the provided details."""
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
        "scan_count": 0,
    }

@router.get("/patients/{patient_id}", response_model=PatientDetailResponse, summary="Get patient details")
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    """Return one patient profile and their longitudinal scan history."""
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
        "scan_count": len(patient.predictions),
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

@router.delete("/patients/{patient_id}", summary="Delete a patient")
def delete_patient(patient_id: int, db: Session = Depends(get_db)):
    """Delete a patient and cascade delete their related scans."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")

    db.delete(patient)
    db.commit()
    return {"detail": "Patient deleted."}
