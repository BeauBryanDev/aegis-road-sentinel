from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Any, List, Optional, Union


class DetectionBase(BaseModel):
    vehicle_type: str
    vehicle_confidence: Optional[float] = None
    plate_text: str = Field(..., min_length=1, max_length=10)
    plate_confidence: Optional[float] = None
    original_image_s3_key: str
    cropped_vehicle_s3_key: Optional[str] = None
    cropped_plate_s3_key: Optional[str] = None
    is_allowed: bool = False
    processing_time_ms: Optional[float] = None
    source: str = "upload"


class DetectionCreate(DetectionBase):
    user_id: Optional[int] = None
    allowed_car_id: Optional[int] = None
    # Stored as [x1, y1, x2, y2] list by the pipeline
    plate_bbox: Optional[Union[List[Any], Any]] = None


class Detection(DetectionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    user_id: Optional[int] = None
    allowed_car_id: Optional[int] = None
    # Accept whatever JSON shape the DB column holds (list or dict)
    plate_bbox: Optional[Any] = None