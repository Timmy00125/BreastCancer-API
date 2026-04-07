from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.session import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    age = Column(Integer)
    medical_history = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    predictions = relationship(
        "PredictionRecord", back_populates="patient", cascade="all, delete-orphan"
    )


class PredictionRecord(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    prediction = Column(String)
    confidence = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
    heatmap_path = Column(String, nullable=True)
    model_version = Column(String, default="v1.0")
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    patient = relationship("Patient", back_populates="predictions")
