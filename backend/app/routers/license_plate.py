import time

from fastapi import APIRouter, Depends, Request, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.session import get_db
from app.crud.detection_crud import persist_detections
from app.schemas.anpr_schema import AnprResponse, PlateDetection

router = APIRouter(prefix="/api/anpr", tags=["ANPR"])


@router.post("/detect", response_model=AnprResponse)
async def detect(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    anpr_service = request.app.state.anpr_service
    if anpr_service is None:
        raise HTTPException(status_code=503, detail="ANPR models failed to load at startup.")

    if file.content_type not in settings.allowed_image_types:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{file.content_type}'. "
                   f"Accepted: {sorted(settings.allowed_image_types)}",
        )

    data = await file.read()
    if len(data) > settings.max_upload_size_mb * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds the {settings.max_upload_size_mb} MB limit.",
        )

    t0 = time.perf_counter()
    try:
        raw_detections = anpr_service.process_image_bytes(data)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)

    # Attach processing time to each detection so persist_detections can store it.
    for det in raw_detections:
        det["processing_time_ms"] = elapsed_ms

    enriched = persist_detections(db, raw_detections, source="upload")

    detections = [PlateDetection(**d) for d in enriched]

    return AnprResponse(
        filename=file.filename,
        vehicle_count=len(detections),
        detections=detections,
        processing_time_ms=elapsed_ms,
    )
