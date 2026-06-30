from fastapi import APIRouter, Request
from sqlalchemy import text

from app.core.session import SessionLocal

router = APIRouter(prefix="/api/health", tags=["System"])


@router.get("")
def health_check(request: Request):
    """
    Comprehensive health check. Verifies:
    - API process is alive
    - PostgreSQL is reachable and responding
    - ANPR models are loaded and ready

    Returns HTTP 200 with status="healthy" when all checks pass.
    Returns HTTP 200 with status="degraded" when the API is up but a
    dependency is down (so load balancers / Docker healthchecks can still
    distinguish a dead container from a degraded one by inspecting the body).
    """
    checks = {}

    # --- Database ---
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        checks["database"] = "ok"
    except Exception as exc:
        checks["database"] = f"error: {exc}"

    # --- ANPR models ---
    anpr = getattr(request.app.state, "anpr_service", None)
    checks["anpr_models"] = "ok" if anpr is not None else "not loaded"

    overall = "healthy" if all(v == "ok" for v in checks.values()) else "degraded"

    return {
        "status": overall,
        "service": "aegis-road-sentinel",
        "checks": checks,
    }
