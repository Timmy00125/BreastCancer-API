import csv
import io
import os
from datetime import datetime
from typing import Any, cast

from fastapi import HTTPException
from fastapi.responses import StreamingResponse
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Image as RLImage
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy.orm import Session

from app.core.config import HEATMAP_DIR
from app.db.models import PredictionRecord


def build_csv_stream(db: Session) -> StreamingResponse:
    """Build a streaming CSV response for prediction history."""
    records = (
        db.query(PredictionRecord).order_by(PredictionRecord.timestamp.desc()).all()
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "ID",
            "Filename",
            "Prediction",
            "Confidence (%)",
            "Timestamp",
            "Model Version",
            "Patient ID",
            "Patient Name",
        ]
    )
    for record in records:
        typed_record = cast(Any, record)
        writer.writerow(
            [
                typed_record.id,
                typed_record.filename,
                typed_record.prediction,
                round(typed_record.confidence * 100, 2),
                typed_record.timestamp.isoformat() if typed_record.timestamp else "",
                typed_record.model_version or "",
                typed_record.patient_id or "",
                typed_record.patient.name if typed_record.patient else "",
            ]
        )

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=prediction_history.csv"},
    )


def build_pdf_stream(record_id: int, db: Session) -> StreamingResponse:
    """Build a PDF report stream for one prediction record."""
    record = db.query(PredictionRecord).filter(PredictionRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Prediction record not found.")
    typed_record = cast(Any, record)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=0.5 * inch,
        bottomMargin=0.5 * inch,
    )
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "Title",
        parent=styles["Title"],
        fontSize=20,
        textColor=colors.HexColor("#1a1a2e"),
        spaceAfter=6,
        alignment=TA_CENTER,
    )
    subtitle_style = ParagraphStyle(
        "Sub",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.HexColor("#6c757d"),
        alignment=TA_CENTER,
        spaceAfter=20,
    )
    section_style = ParagraphStyle(
        "Section",
        parent=styles["Heading2"],
        fontSize=13,
        textColor=colors.HexColor("#16213e"),
        spaceBefore=14,
        spaceAfter=6,
    )
    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontSize=10,
        leading=16,
        textColor=colors.HexColor("#212529"),
    )

    story = []
    story.append(Paragraph("Breast Cancer Prediction Report", title_style))
    story.append(
        Paragraph(
            f"Generated on {datetime.utcnow().strftime('%B %d, %Y at %H:%M UTC')}",
            subtitle_style,
        )
    )

    story.append(Paragraph("Patient Information", section_style))
    patient_data = [
        ["Patient Name", typed_record.patient.name if typed_record.patient else "N/A"],
        [
            "Patient Age",
            str(typed_record.patient.age) if typed_record.patient else "N/A",
        ],
        [
            "Medical History",
            (typed_record.patient.medical_history or "None")
            if typed_record.patient
            else "N/A",
        ],
    ]
    patient_table = Table(patient_data, colWidths=[2.0 * inch, 4.5 * inch])
    patient_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#e8f4f8")),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#dee2e6")),
                (
                    "ROWBACKGROUNDS",
                    (0, 0),
                    (-1, -1),
                    [colors.white, colors.HexColor("#f8f9fa")],
                ),
                ("PADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(patient_table)
    story.append(Spacer(1, 0.15 * inch))

    story.append(Paragraph("AI Prediction Results", section_style))
    result_color = "#dc3545" if typed_record.prediction == "malignant" else "#198754"
    prediction_data = [
        ["File Analyzed", typed_record.filename],
        ["Prediction", typed_record.prediction.upper()],
        ["Confidence Score", f"{round(typed_record.confidence * 100, 2)}%"],
        ["Model Version", typed_record.model_version or "v1.0"],
        [
            "Scan Timestamp",
            typed_record.timestamp.strftime("%B %d, %Y %H:%M UTC")
            if typed_record.timestamp
            else "N/A",
        ],
    ]
    prediction_table = Table(prediction_data, colWidths=[2.0 * inch, 4.5 * inch])
    prediction_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#e8f4f8")),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#dee2e6")),
                (
                    "ROWBACKGROUNDS",
                    (0, 0),
                    (-1, -1),
                    [colors.white, colors.HexColor("#f8f9fa")],
                ),
                ("PADDING", (0, 0), (-1, -1), 8),
                ("TEXTCOLOR", (1, 1), (1, 1), colors.HexColor(result_color)),
                ("FONTNAME", (1, 1), (1, 1), "Helvetica-Bold"),
            ]
        )
    )
    story.append(prediction_table)
    story.append(Spacer(1, 0.15 * inch))

    if typed_record.heatmap_path:
        heatmap_file = os.path.join(HEATMAP_DIR, typed_record.heatmap_path)
        if os.path.exists(heatmap_file):
            story.append(Paragraph("Explainability Heatmap (Grad-CAM)", section_style))
            story.append(
                Paragraph(
                    "The heatmap below highlights the regions of the image the AI model focused on when making its prediction. Warmer colors (red/yellow) indicate regions of higher activation.",
                    body_style,
                )
            )
            story.append(Spacer(1, 0.1 * inch))
            story.append(RLImage(heatmap_file, width=4.0 * inch, height=4.0 * inch))
            story.append(Spacer(1, 0.15 * inch))

    story.append(Paragraph("Disclaimer", section_style))
    story.append(
        Paragraph(
            "This report is generated by an AI-powered system for informational purposes only. "
            "It must not be used as the sole basis for clinical decisions. Always consult a qualified "
            "medical professional for diagnosis and treatment.",
            body_style,
        )
    )

    doc.build(story)
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=report_{record_id}.pdf"},
    )
