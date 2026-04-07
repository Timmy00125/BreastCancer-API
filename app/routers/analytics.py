from fastapi import APIRouter, Depends
from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from app.db.models import Patient, PredictionRecord
from app.db.session import get_db

router = APIRouter()


@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db)):
    """Return aggregate analytics for dashboard metrics."""
    total = db.query(func.count(PredictionRecord.id)).scalar()
    malignant = (
        db.query(func.count(PredictionRecord.id))
        .filter(PredictionRecord.prediction == "malignant")
        .scalar()
    )
    benign = (
        db.query(func.count(PredictionRecord.id))
        .filter(PredictionRecord.prediction == "benign")
        .scalar()
    )
    avg_confidence = db.query(func.avg(PredictionRecord.confidence)).scalar() or 0.0
    total_patients = db.query(func.count(Patient.id)).scalar()

    monthly = (
        db.query(
            extract("year", PredictionRecord.timestamp).label("year"),
            extract("month", PredictionRecord.timestamp).label("month"),
            PredictionRecord.prediction,
            func.count(PredictionRecord.id).label("count"),
        )
        .group_by("year", "month", PredictionRecord.prediction)
        .order_by("year", "month")
        .all()
    )

    monthly_data: dict = {}
    for row in monthly:
        key = f"{int(row.year)}-{int(row.month):02d}"
        if key not in monthly_data:
            monthly_data[key] = {"month": key, "benign": 0, "malignant": 0}
        monthly_data[key][row.prediction] = row.count

    return {
        "total_scans": total,
        "malignant_count": malignant,
        "benign_count": benign,
        "average_confidence": round(avg_confidence * 100, 2),
        "total_patients": total_patients,
        "monthly_breakdown": list(monthly_data.values())[-6:],
    }
