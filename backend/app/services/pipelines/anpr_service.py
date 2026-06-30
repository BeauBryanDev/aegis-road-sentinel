"""
ANPR orchestration service.

Composes the two-stage detector (vehicle + plate) and the OCR reader into a single
pipeline. A single instance holds the loaded ONNX sessions and is safe to share across
requests: ONNX Runtime's `InferenceSession.run` is thread-safe and this class keeps no
per-request mutable state.
"""
from typing import Any, Dict, List

import cv2
import numpy as np

from app.core.config import settings
from app.services.pipelines.inference import VehicleDetectionPipeline
from app.services.pipelines.ocr_processor import PlateOCRProcessor
from app.services.preprocessing import extract_plate_crop


class ANPRService:
    """End-to-end Automatic Number Plate Recognition pipeline."""

    def __init__(self, use_gpu: bool | None = None):
        use_gpu = settings.use_gpu if use_gpu is None else use_gpu
        self.detector = VehicleDetectionPipeline(use_gpu=use_gpu)
        self.ocr = PlateOCRProcessor(use_gpu=use_gpu)

    def process_image_bytes(self, data: bytes) -> List[Dict[str, Any]]:
        """
        Decode raw image bytes and run the full pipeline.

        Raises:
            ValueError: if the bytes cannot be decoded into an image.
        """
        frame = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
        if frame is None:
            raise ValueError("Could not decode image. The file may be corrupt or not an image.")
        return self.process_frame(frame)

    def process_frame(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """Run vehicle detection -> plate detection -> OCR on a decoded BGR frame."""
        detections: List[Dict[str, Any]] = []

        vehicles = self.detector.detect_vehicles(
            frame, conf_threshold=settings.vehicle_conf_threshold
        )

        for vehicle in vehicles:
            result: Dict[str, Any] = {
                "vehicle_type": vehicle["class"],
                "vehicle_confidence": round(float(vehicle["score"]), 4),
                "vehicle_bbox": [int(c) for c in vehicle["bbox"]],
                "plate_detected": False,
                "plate_text": None,
                "plate_text_confidence": None,
                "plate_detection_confidence": None,
                "plate_bbox": None,
            }

            # Stage 2: locate the plate inside the (padded) vehicle crop.
            vehicle_crop, (vx, vy) = extract_plate_crop(
                frame, vehicle["bbox"], padding=0.12, return_offset=True
            )
            if vehicle_crop.size > 0:
                plate_box, plate_conf = self.detector.detect_plate(
                    vehicle_crop, conf_threshold=settings.plate_conf_threshold
                )

                if plate_box is not None:
                    result["plate_detected"] = True
                    result["plate_detection_confidence"] = round(float(plate_conf), 4)

                    # Map the plate box from crop space back to the original frame.
                    result["plate_bbox"] = [
                        vx + plate_box[0],
                        vy + plate_box[1],
                        vx + plate_box[2],
                        vy + plate_box[3],
                    ]

                    # Stage 3: OCR on the natural-colour plate crop.
                    plate_crop = extract_plate_crop(vehicle_crop, plate_box, padding=0.05)
                    if plate_crop.size > 0:
                        text, ocr_conf = self.ocr.extract_text(plate_crop)
                        result["plate_text"] = text or None
                        result["plate_text_confidence"] = round(float(ocr_conf), 4)

            detections.append(result)

        return detections
