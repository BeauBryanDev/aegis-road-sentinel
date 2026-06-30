from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.session import get_db
from app.models.detections import Detection

router = APIRouter(prefix="/api/stats", tags=["Stats"])


@router.get("")
def get_stats(
    db: Session = Depends(get_db),
    from_date: Optional[datetime] = Query(
        None,
        description="Filter detections from this datetime (ISO 8601, e.g. 2026-06-01T00:00:00).",
    ),
    to_date: Optional[datetime] = Query(
        None,
        description="Filter detections up to this datetime (ISO 8601).",
    ),
):
    """
    Aggregate detection stats for the dashboard.
    Optionally scoped to a date range via `from_date` / `to_date`.
    """
    base = db.query(Detection)
    if from_date:
        base = base.filter(Detection.created_at >= from_date)
    if to_date:
        base = base.filter(Detection.created_at <= to_date)

    total = base.with_entities(func.count(Detection.id)).scalar() or 0

    type_counts_raw = (
        base.with_entities(
            func.lower(Detection.vehicle_type).label("vtype"),
            func.count(Detection.id).label("cnt"),
        )
        .group_by(func.lower(Detection.vehicle_type))
        .all()
    )
    type_counts = {row.vtype: row.cnt for row in type_counts_raw}

    # Canonical types (post-bridge) stored in DB
    cars       = type_counts.get("car", 0)
    trucks     = type_counts.get("truck", 0)
    buses      = type_counts.get("bus", 0)
    motorcycles = type_counts.get("motorcycle", 0)

    avg_vehicle_conf = (
        base.with_entities(func.avg(Detection.vehicle_confidence))
        .filter(Detection.vehicle_confidence.isnot(None))
        .scalar()
    )
    avg_plate_conf = (
        base.with_entities(func.avg(Detection.plate_confidence))
        .filter(Detection.plate_confidence.isnot(None))
        .scalar()
    )

    allowed_count = (
        base.with_entities(func.count(Detection.id))
        .filter(Detection.is_allowed == True)
        .scalar() or 0
    )

    avg_processing_ms = (
        base.with_entities(func.avg(Detection.processing_time_ms))
        .filter(Detection.processing_time_ms.isnot(None))
        .scalar()
    )

    return {
        "total_detections": total,
        "by_vehicle_type": {
            "cars": cars,
            "trucks": trucks,
            "buses": buses,
            "motorcycles": motorcycles,
        },
        "confidence": {
            "vehicle_detection": round(avg_vehicle_conf or 0.0, 4),
            "plate_detection": round(avg_plate_conf or 0.0, 4),
        },
        "access_control": {
            "allowed": allowed_count,
            "denied": total - allowed_count,
        },
        "avg_processing_ms": round(avg_processing_ms or 0.0, 2),
        "period": {
            "from": from_date.isoformat() if from_date else None,
            "to": to_date.isoformat() if to_date else None,
        },
    }
