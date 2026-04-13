from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import HEATMAP_DIR
from app.db.session import initialize_database
from app.routers.analytics import router as analytics_router
from app.routers.exports import router as exports_router
from app.routers.patients import router as patients_router
from app.routers.predictions import router as predictions_router
from app.services.prediction import load_ml_model


def create_app() -> FastAPI:
    """Create and configure the FastAPI application instance."""
    app = FastAPI(title="Breast Cancer Prediction API", version="2.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.mount("/heatmaps", StaticFiles(directory=HEATMAP_DIR), name="heatmaps")

    app.include_router(predictions_router)
    app.include_router(patients_router)
    app.include_router(analytics_router)
    app.include_router(exports_router)

    @app.on_event("startup")
    def startup_database() -> None:
        initialize_database()

    @app.on_event("startup")
    def startup_model() -> None:
        model, last_conv_layer_name = load_ml_model()
        app.state.model = model
        app.state.last_conv_layer_name = last_conv_layer_name

    return app
