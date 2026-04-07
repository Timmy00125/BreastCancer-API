# Breast Cancer Predictive System - Recommended Features Implementation

This document outlines the architectural changes necessary to upgrade the Breast Cancer Predictive System prototype with medical-grade features including Explainable AI (Grad-CAM), Patient Management, Reporting/Exporting, Analytics Dashboards, and MLOps batch processing capabilities.

## User Review Required

> [!IMPORTANT]
> **Database Schema Migration Strategy**: We will be dropping the existing SQLite table and recreating it since this is currently a prototype without long-term production data. This ensures a clean schema for Patient Management. Please confirm if this is acceptable.

> [!IMPORTANT]
> **Libraries**: We will install additional dependencies for the FastAPI backend, including `reportlab` (for PDF generation), `python-multipart` (if not already strictly enforced for batch uploads), and `opencv-python-headless` or `matplotlib` (for generating overlay heatmaps).

> [!TIP]
> **Frontend Routing**: The frontend is currently a single `App.tsx` file. To accommodate Patients, Dashboard, and App functionalities, we will introduce `react-router-dom` to separate these sections into distinct pages.

## Proposed Changes

---

### Backend Components

#### [MODIFY] `main.py`
- Modify SQLAlchemy models: 
  - Add a `Patient` model (id, name, age, medical_history).
  - Update `PredictionRecord` to include `patient_id` as a foreign key, `model_version` as a string, and `heatmap_path` to point to generated heatmap images.
- Create Grad-CAM logic: Add a function utilizing `tf.GradientTape` to compute Grad-CAM from the last convolutional layer. Overlay heatmap on original image and save to disk / serve dynamically.
- Add `/patients` endpoints (GET, POST).
- Add functionality in `/predict` to also accept a `.zip` file of images (batch predict).
- Add `/analytics` endpoint returning grouped data for the dashboard.
- Create an endpoint or logic for PDF generation. We can use `reportlab` dynamically or generate simple HTML-to-PDF depending on complexity. 
- Create `/export` endpoint for CSV.

#### [NEW] `requirements.txt` (Update)
- Will add `reportlab`, `matplotlib` (for heatmap colourmap), `zipfile36` (standard lib but handled), `pandas` (for CSV export).

---

### Frontend Components

#### [MODIFY] `frontend/package.json`
- Install dependencies: `react-router-dom`, `recharts` (for dashboard metrics if needed), `lucide-react` (for icons).

#### [MODIFY] `frontend/src/App.tsx`
- Refactor to act as the main Router container.
- Create Navigation mapping to: Home/Predict, Dashboard, Patients.

#### [NEW] `frontend/src/components/`
- Separate UI into logical components:
  - `Navbar.tsx`
  - `PredictFlow.tsx` (Current upload logic + Heatmap display + PDF Report download)
  - `HistoryTable.tsx` (Refactored from current history + Export CSV button)
  - `Dashboard.tsx` (Charts showing aggregate metrics fetched from backend)
  - `PatientsList.tsx` (Manage patients)
  - `PatientProfile.tsx` (Longitudinal view of a specific patient's scans)

## Open Questions

> [!WARNING]
> 1. For Grad-CAM, could you confirm the final Convolutional layer name of `bcd_model.h5`? If unknown, I will programmatically detect the last Conv layer.
> 2. For Batch Uploads (.zip), how should we handle the results? Should it process synchronously and return a large JSON array, or simply process in the background? (For a prototype, synchronous return might be acceptable but slow).
> 3. Does the Frontend aesthetic require an update, or should we continue to use the current Tailwind CSS styling provided?

## Verification Plan

### Automated/Manual Verification
- Run FastAPI backend and monitor for dependency/model loading errors.
- Test single image upload, verify a Grad-CAM heatmap is returned and displayed alongside the original image in the UI.
- Test creating a Patient and linking a prediction to them. Verify longitudinal view.
- Verify Metrics dashboard returns proper aggregates.
- Download a PDF report and verify contents (prediction, confidence, heatmap image).
- Download CSV history and verify fields.
- Upload a .zip containing multiple images to verify batch endpoint properly iterates and saves predictions.
