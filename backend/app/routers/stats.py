from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.session import get_db
from app.models.detections import Detection

router = APIRouter(prefix="/api/stats", tags=["Stats"])


@router.get("")
def get_stats(db: Session = Depends(get_db)):
    """
    Aggregate detection stats shown on the dashboard:
    total detections, per-vehicle-type counts, average confidence scores,
    allowed vs denied counts, and average processing time.
    """
    total = db.query(func.count(Detection.id)).scalar() or 0

    type_counts_raw = (
        db.query(
            func.lower(Detection.vehicle_type).label("vtype"),
            func.count(Detection.id).label("cnt"),
        )
        .group_by(func.lower(Detection.vehicle_type))
        .all()
    )
    type_counts = {row.vtype: row.cnt for row in type_counts_raw}

    # Collapse Roboflow class names → UI display groups
    cars = type_counts.get("car", 0)
    trucks = type_counts.get("truck", 0) + type_counts.get("pickup-van", 0)
    buses = type_counts.get("bus", 0) + type_counts.get("microbus", 0)
    motorcycles = type_counts.get("motorbike", 0)

    avg_vehicle_conf = (
        db.query(func.avg(Detection.vehicle_confidence))
        .filter(Detection.vehicle_confidence.isnot(None))
        .scalar()
    )
    avg_plate_conf = (
        db.query(func.avg(Detection.plate_confidence))
        .filter(Detection.plate_confidence.isnot(None))
        .scalar()
    )

    allowed_count = (
        db.query(func.count(Detection.id)).filter(Detection.is_allowed == True).scalar() or 0
    )

    avg_processing_ms = (
        db.query(func.avg(Detection.processing_time_ms))
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
    }
