import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.db  # noqa: F401 — registers all ORM models so relationships resolve
from app.services.pipelines.anpr_service import ANPRService
from app.routers import license_plate, stats

logger = logging.getLogger("carsrecong")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Load the ONNX models once at startup so the first request doesn't pay the
    initialization cost and so a missing/broken model fails fast and visibly.
    """
    logger.info("Loading ANPR models...")
    try:
        app.state.anpr_service = ANPRService()
        logger.info("ANPR models loaded.")
    except Exception:
        # Keep the app up so /api/health still answers; /api/anpr/* will return 503.
        app.state.anpr_service = None
        logger.exception("Failed to load ANPR models; ANPR endpoints will return 503.")
    yield
    app.state.anpr_service = None


# Initialize the FastAPI application with metadata
app = FastAPI(
    title="CarsTracker API",
    description="Machine Learning backend for ALPR and Vehicle Tracking",
    version="1.0.0",
    lifespan=lifespan,
)

# Define allowed origins for Cross-Origin Resource Sharing (CORS)
# This ensures the React/Vite frontend can securely communicate with the API
# from different local development ports.
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Add the CORS middleware to the application pipeline
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health", tags=["System"])
def health_check():
    """
    Simple health check endpoint to verify the API is running.
    Useful for Docker health checks and initial debugging.
    
    Returns:
        dict: A status dictionary indicating the service is operational.
    """
    return {
        "status": "active",
        "service": "carsrecong_api",
        "message": "System is ready for ML inference"
    }


# Register API routers
app.include_router(license_plate.router)
app.include_router(stats.router)
