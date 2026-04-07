from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.export import build_csv_stream, build_pdf_stream

router = APIRouter()


@router.get("/export/csv")
def export_csv(db: Session = Depends(get_db)):
    """Export prediction history as CSV."""
    return build_csv_stream(db)


@router.get("/export/pdf/{record_id}")
def export_pdf(record_id: int, db: Session = Depends(get_db)):
    """Export one prediction report as PDF."""
    return build_pdf_stream(record_id, db)
