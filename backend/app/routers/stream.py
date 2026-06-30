
import asyncio
import json
import os
import tempfile
import time
from typing import AsyncGenerator, Optional

import cv2
import numpy as np
from fastapi import (
    APIRouter, Depends, HTTPException, Query,
    Request, UploadFile, File, WebSocket, WebSocketDisconnect,
)
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.session import get_db, SessionLocal
from app.crud.detection_crud import persist_detections, update_detection_plate
from app.models.users import User
from app.routers.deps import get_current_user
from app.services.tracking_service import VehicleTracker
"""
Stream endpoints for video upload (SSE) and live WebSocket feed.

POST /api/stream/upload-video
    Accepts a video file upload. Samples every N frames, runs the ANPR pipeline
    on each sample, and streams results back as Server-Sent Events so the client
    receives detections progressively instead of waiting for the full video.

WS /api/stream/ws
    WebSocket endpoint for a live camera feed. The client sends raw JPEG frame
    bytes; the server responds with a JSON payload of detections for that frame.
    This is the path for a browser webcam or an IP camera proxy.
"""
router = APIRouter(prefix="/api/stream", tags=["Stream"])


ALLOWED_VIDEO_TYPES = {
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "video/x-msvideo",   # avi
    "video/x-matroska",  # mkv
    "video/webm",
}
MAX_VIDEO_SIZE_MB = 500


def _get_anpr(request: Request):
    svc = request.app.state.anpr_service
    if svc is None:
        raise HTTPException(status_code=503, detail="ANPR models failed to load at startup.")
    return svc


def _sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


# Video processing — runs blocking OpenCV + ANPR in a thread executor
# so the async event loop never stalls and SSE chunks flush in real time.

def _read_frame(cap: cv2.VideoCapture):
    """Blocking cap.read() — called via run_in_executor."""
    return cap.read()


def _run_pipeline(anpr_service, frame: np.ndarray):
    """Blocking ONNX inference — called via run_in_executor."""
    return anpr_service.process_frame(frame)


async def _process_video(
    video_path: str,
    anpr_service,
    db: Session,
    frame_interval: int,
    user_id: int | None = None,
) -> AsyncGenerator[str, None]:
    loop = asyncio.get_event_loop()
    cap = cv2.VideoCapture(video_path)
    # One tracker per video — assigns stable track_ids across frames
    tracker = VehicleTracker(iou_threshold=0.3, max_age=max(10, frame_interval * 2))

    try:
        if not cap.isOpened():
            yield _sse({"event": "error", "detail": "Could not open video file."})
            return

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        duration_s = round(total_frames / fps, 2) if total_frames > 0 else 0

        yield _sse({
            "event": "start",
            "total_frames": total_frames,
            "fps": fps,
            "duration_s": duration_s,
            "frame_interval": frame_interval,
        })

        frame_index = 0
        processed = 0
        unique_vehicles = 0

        while True:
            ret, frame = await loop.run_in_executor(None, _read_frame, cap)
            if not ret:
                break

            if frame_index % frame_interval == 0:
                t0 = time.perf_counter()
                try:
                    raw = await loop.run_in_executor(None, _run_pipeline, anpr_service, frame)
                except Exception as exc:
                    yield _sse({"event": "frame_error", "frame": frame_index, "detail": str(exc)})
                    frame_index += 1
                    continue

                elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)
                timestamp_s = round(frame_index / fps, 3)

                # Assign stable track_ids; decide what actually needs persisting
                tracked = tracker.update(raw)

                for det in tracked:
                    det["processing_time_ms"] = elapsed_ms

                # Split flagged detections: new tracks → INSERT, better plate on
                # existing track → UPDATE the row already in DB.
                to_insert = [d for d in tracked if d.get("should_persist") and d.get("is_new")]
                to_update = [
                    d for d in tracked
                    if d.get("should_persist")
                    and d.get("plate_updated")
                    and not d.get("is_new")
                    and d.get("track_id") in {
                        trk.track_id for trk in tracker.active_tracks if trk.detection_id
                    }
                ]

                if to_insert:
                    enriched = persist_detections(db, to_insert, source="video", user_id=user_id)
                    for det, row in zip(to_insert, enriched):
                        if row.get("detection_id") and det.get("track_id"):
                            tracker.set_detection_id(det["track_id"], row["detection_id"])
                    unique_vehicles += len(to_insert)

                for det in to_update:
                    trk_obj = next(
                        (t for t in tracker.active_tracks if t.track_id == det["track_id"]),
                        None,
                    )
                    if trk_obj and trk_obj.detection_id and det.get("plate_text"):
                        update_detection_plate(
                            db,
                            trk_obj.detection_id,
                            det["plate_text"],
                            det.get("plate_text_confidence"),
                            det.get("plate_bbox"),
                        )

                yield _sse({
                    "event": "frame",
                    "frame_index": frame_index,
                    "timestamp_s": timestamp_s,
                    "detections": tracked,
                    "processing_time_ms": elapsed_ms,
                })

                processed += 1

            frame_index += 1

        yield _sse({
            "event": "done",
            "frames_processed": processed,
            "total_frames": total_frames,
            "unique_vehicles": unique_vehicles,
        })

    finally:
        cap.release()
        # Clean up the temp file here — this is the only place guaranteed to run
        # after the generator is exhausted (doing it in the endpoint's finally block
        # runs immediately when StreamingResponse is returned, before any frames).
        try:
            os.unlink(video_path)
        except OSError:
            pass


# Video upload -> SSE

@router.post("/upload-video")
async def upload_video(
    request: Request,
    file: UploadFile = File(...),
    frame_interval: int = Query(
        5,
        ge=1,
        le=60,
        description="Process every Nth frame. 1=every frame, 5=every 5th (default).",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a video file and receive ANPR detections as a Server-Sent Events stream.

    Response content-type is `text/event-stream`. Each event is a JSON object
    with an `event` field:
    - `start`       — video metadata (fps, total_frames, duration_s)
    - `frame`       — detections for one sampled frame
    - `frame_error` — pipeline error on a specific frame (processing continues)
    - `done`        — final summary
    - `error`       — fatal error (video could not be opened)
    """
    anpr_service = _get_anpr(request)

    if file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{file.content_type}'. "
                   f"Accepted: {sorted(ALLOWED_VIDEO_TYPES)}",
        )

    data = await file.read()
    if len(data) > MAX_VIDEO_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail=f"Video exceeds the {MAX_VIDEO_SIZE_MB} MB limit.",
        )

    # Write to a temp file — OpenCV VideoCapture needs a seekable file path.
    # delete=False so the generator can still open it after this function returns.
    # The generator's finally block deletes it when done.
    suffix = os.path.splitext(file.filename or "video")[1] or ".mp4"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tmp.write(data)
    tmp.flush()
    tmp.close()

    return StreamingResponse(
        _process_video(tmp.name, anpr_service, db, frame_interval, user_id=current_user.id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # disable Nginx buffering if behind a proxy
        },
    )


# ---------------------------------------------------------------------------
# WebSocket live feed
# ---------------------------------------------------------------------------

def _ws_auth(token: str) -> Optional[User]:
    """
    Validate a JWT token for a WebSocket connection.
    WebSocket connections cannot send Authorization headers so the token is
    passed as a query parameter: ws://host/api/stream/ws?token=<jwt>
    Returns the User or None if invalid.
    """
    from jose import JWTError, jwt
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
        user_id = payload.get("sub")
        if user_id is None:
            return None
    except JWTError:
        return None

    db = SessionLocal()
    try:
        return db.query(User).filter(User.id == int(user_id), User.is_active == True).first()
    finally:
        db.close()


@router.websocket("/ws")
async def websocket_stream(
    websocket: WebSocket,
    token: str = Query(..., description="JWT access token"),
):
    """
    WebSocket endpoint for a live camera feed.

    Auth: pass the JWT as a query param — ws://host/api/stream/ws?token=<jwt>

    Client → server : raw JPEG bytes per frame.
    Server → client : JSON string —
        {"frame_index": int, "detections": [...], "processing_time_ms": float}
    On error: {"error": "<message>"} — connection stays open.

    Detections are tracked across frames (VehicleTracker) and persisted:
    one DB row per unique vehicle, updated when a better plate is read.
    """
    # Authenticate before accepting the connection
    user = _ws_auth(token)
    if user is None:
        await websocket.close(code=1008, reason="Invalid or missing token.")
        return

    anpr_service = websocket.app.state.anpr_service
    if anpr_service is None:
        await websocket.close(code=1013, reason="ANPR models not loaded.")
        return

    await websocket.accept()
    loop = asyncio.get_event_loop()
    frame_index = 0
    tracker = VehicleTracker(iou_threshold=0.3, max_age=15)

    db = SessionLocal()
    try:
        while True:
            data = await websocket.receive_bytes()

            frame = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
            if frame is None:
                await websocket.send_text(json.dumps({"error": "Could not decode frame."}))
                continue

            t0 = time.perf_counter()
            try:
                raw = await loop.run_in_executor(None, _run_pipeline, anpr_service, frame)
            except Exception as exc:
                await websocket.send_text(json.dumps({"error": str(exc)}))
                frame_index += 1
                continue

            elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)

            tracked = tracker.update(raw)
            for det in tracked:
                det["processing_time_ms"] = elapsed_ms

            # Persist new tracks; update existing tracks with better plate reads
            to_insert = [d for d in tracked if d.get("should_persist") and d.get("is_new")]
            to_update = [
                d for d in tracked
                if d.get("should_persist")
                and d.get("plate_updated")
                and not d.get("is_new")
                and d.get("track_id") in {
                    trk.track_id for trk in tracker.active_tracks if trk.detection_id
                }
            ]

            if to_insert:
                enriched = persist_detections(db, to_insert, source="websocket", user_id=user.id)
                for det, row in zip(to_insert, enriched):
                    if row.get("detection_id") and det.get("track_id"):
                        tracker.set_detection_id(det["track_id"], row["detection_id"])

            for det in to_update:
                trk_obj = next(
                    (t for t in tracker.active_tracks if t.track_id == det["track_id"]), None
                )
                if trk_obj and trk_obj.detection_id and det.get("plate_text"):
                    update_detection_plate(
                        db,
                        trk_obj.detection_id,
                        det["plate_text"],
                        det.get("plate_text_confidence"),
                        det.get("plate_bbox"),
                    )

            await websocket.send_text(json.dumps({
                "frame_index": frame_index,
                "detections": tracked,
                "processing_time_ms": elapsed_ms,
            }))

            frame_index += 1

    except WebSocketDisconnect:
        pass
    finally:
        db.close()
