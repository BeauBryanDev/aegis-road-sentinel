
import re
from typing import Any, Dict, List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.allowed_cars import AllowedCar
from app.models.detections import Detection

# Placeholder until S3 upload is implemented. The detections table requires a
# non-null original_image_s3_key, so we store an empty marker for now.
PENDING_S3_KEY = ""
"""
Persistence and whitelist logic for ANPR detections.

"""
PLATE_TEXT_MAX_LEN = 10


def normalize_plate(plate: Optional[str]) -> str:
    """
    Canonicalize a plate string for comparison: strip whitespace and uppercase.
    Colombian plates are alphanumeric, so this is enough to make OCR output and
    stored whitelist entries comparable (e.g. "abc 123" -> "ABC123").
    """
    return re.sub(r"\s+", "", plate or "").upper()


def get_allowed_car_by_plate(db: Session, plate: str) -> Optional[AllowedCar]:
    """
    Look up a plate in the whitelist. Matching is whitespace- and case-insensitive
    so the stored value doesn't have to be pre-normalized.

    Returns the matching AllowedCar, or None if the plate is not whitelisted.
    """
    normalized = normalize_plate(plate)
    if not normalized:
        return None

    return (
        db.query(AllowedCar)
        .filter(func.upper(func.replace(AllowedCar.license_plate, " ", "")) == normalized)
        .first()
    )


def persist_detections(
    db: Session,
    detections: List[Dict[str, Any]],
    source: str = "upload",
    user_id: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """
    Run the whitelist check and persist each plate detection.

    Vehicles without a readable plate are returned unchanged but NOT persisted:
    the table requires a plate (plate_text is NOT NULL) and there is nothing to
    check against the whitelist.

    The whole batch is committed in a single transaction; on any error the
    transaction is rolled back and the exception re-raised.

    Returns the input detections, each enriched with:
        - ``is_allowed``: whether the plate matched the whitelist
        - ``detection_id``: the DB id if persisted, else None
        - ``allowed_car_id``: the matched whitelist row id, else None
    """
    results: List[Dict[str, Any]] = []

    try:
        for det in detections:
            enriched = dict(det)
            enriched["is_allowed"] = False
            enriched["detection_id"] = None
            enriched["allowed_car_id"] = None

            plate_text = (det.get("plate_text") or "").strip()
            if not plate_text:
                results.append(enriched)
                continue

            allowed_car = get_allowed_car_by_plate(db, plate_text)
            is_allowed = allowed_car is not None

            row = Detection(
                user_id=user_id,
                vehicle_type=det.get("vehicle_type"),
                vehicle_confidence=det.get("vehicle_confidence"),
                plate_text=plate_text[:PLATE_TEXT_MAX_LEN],
                plate_confidence=det.get("plate_text_confidence"),
                plate_bbox=det.get("plate_bbox"),
                original_image_s3_key=PENDING_S3_KEY,
                cropped_vehicle_s3_key=None,
                cropped_plate_s3_key=None,
                is_allowed=is_allowed,
                allowed_car_id=allowed_car.id if allowed_car else None,
                processing_time_ms=det.get("processing_time_ms"),
                source=source,
            )
            db.add(row)
            db.flush()  # assign row.id without ending the transaction

            enriched["is_allowed"] = is_allowed
            enriched["detection_id"] = row.id
            enriched["allowed_car_id"] = allowed_car.id if allowed_car else None
            results.append(enriched)

        db.commit()
    except Exception:
        db.rollback()
        raise

    return results
