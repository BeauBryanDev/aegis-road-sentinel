
from typing import Optional
from pydantic import BaseModel, Field
"""
Pydantic schemas for the ANPR inference endpoint responses.
"""

class PlateDetection(BaseModel):
    """A single detected vehicle and (optionally) the plate read from it."""
    vehicle_type: str = Field(..., description="Detector class, e.g. car / truck / motorbike")
    vehicle_confidence: float = Field(..., ge=0.0, le=1.0)
    vehicle_bbox: list[int] = Field(..., description="[x_min, y_min, x_max, y_max] in original image pixels")

    plate_detected: bool = False
    plate_text: Optional[str] = Field(None, description="Decoded plate string (None if no plate / empty read)")
    plate_text_confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="OCR confidence")
    plate_detection_confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="Plate detector confidence")
    plate_bbox: Optional[list[int]] = Field(None, description="Plate [x_min, y_min, x_max, y_max] in original image pixels")

    # Persistence / whitelist outcome
    is_allowed: bool = Field(False, description="True if the plate matched the allowed_cars whitelist")
    detection_id: Optional[int] = Field(None, description="DB id of the persisted detection (None if not persisted)")


class AnprResponse(BaseModel):
    """Full result of running the ANPR pipeline on one image."""
    filename: Optional[str] = None
    vehicle_count: int
    detections: list[PlateDetection]
    processing_time_ms: float
