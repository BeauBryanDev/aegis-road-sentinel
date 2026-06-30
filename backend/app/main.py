import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

import app.db  # noqa: F401 — registers all ORM models so relationships resolve
from app.services.pipelines.anpr_service import ANPRService
from app.routers import license_plate, stats, auth, vehicles, stream, health, users

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

# Register API routers
app.include_router(health.router)
app.include_router(license_plate.router)
app.include_router(stats.router)
app.include_router(auth.router)
app.include_router(vehicles.router)
app.include_router(stream.router)
app.include_router(users.router)


def _custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )

    # Add a plain HTTP Bearer scheme so Swagger shows a "paste your token" field.
    schema.setdefault("components", {}).setdefault("securitySchemes", {})["BearerAuth"] = {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
        "description": "Paste your JWT access token (without the 'Bearer ' prefix).",
    }

    # Apply BearerAuth to every operation so the lock icon appears on all
    # endpoints — protected ones enforce it, public ones ignore an extra header.
    for path_item in schema.get("paths", {}).values():
        for operation in path_item.values():
            if not isinstance(operation, dict):
                continue
            security = operation.setdefault("security", [])
            if {"BearerAuth": []} not in security:
                security.append({"BearerAuth": []})

    app.openapi_schema = schema
    return schema


app.openapi = _custom_openapi
