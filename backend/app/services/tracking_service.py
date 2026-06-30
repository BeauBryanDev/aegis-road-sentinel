
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
""" 
NPR tracking algorithm:
  Each frame's detections are matched to existing active tracks via IoU.
  A match updates the track's position and resets its "missing" counter.
  An unmatched detection spawns a new track.
  Tracks that go unmatched for more than `max_age` frames are deleted.

  We persist to DB only twice per track lifetime:
    1. When a track is first confirmed (hits >= min_hits).
    2. When OCR successfully reads a plate for the first time on an
       existing track (so the initial DB row gets updated with the plate).
"""

def _iou(box_a: List[int], box_b: List[int]) -> float:
    """Compute IoU between two [x1, y1, x2, y2] boxes."""
    xa = max(box_a[0], box_b[0])
    ya = max(box_a[1], box_b[1])
    xb = min(box_a[2], box_b[2])
    yb = min(box_a[3], box_b[3])

    inter = max(0, xb - xa) * max(0, yb - ya)
    if inter == 0:
        return 0.0

    area_a = (box_a[2] - box_a[0]) * (box_a[3] - box_a[1])
    area_b = (box_b[2] - box_b[0]) * (box_b[3] - box_b[1])
    union = area_a + area_b - inter
    return inter / union if union > 0 else 0.0


def _iou_matrix(
    tracks: List["Track"], detections: List[Dict[str, Any]]
) -> np.ndarray:
    """Return an (n_tracks × n_detections) IoU matrix."""
    mat = np.zeros((len(tracks), len(detections)), dtype=np.float32)
    for i, trk in enumerate(tracks):
        for j, det in enumerate(detections):
            mat[i, j] = _iou(trk.bbox, det["vehicle_bbox"])
    return mat


def _greedy_match(
    iou_mat: np.ndarray, threshold: float
) -> List[Tuple[int, int]]:
    """
    Greedy highest-IoU-first matching.
    Returns list of (track_idx, detection_idx) pairs above threshold.
    """
    matched: List[Tuple[int, int]] = []
    if iou_mat.size == 0:
        return matched

    flat = np.argsort(-iou_mat, axis=None)  # descending
    used_tracks, used_dets = set(), set()

    for idx in flat:
        t, d = divmod(int(idx), iou_mat.shape[1])
        if iou_mat[t, d] < threshold:
            break
        if t in used_tracks or d in used_dets:
            continue
        matched.append((t, d))
        used_tracks.add(t)
        used_dets.add(d)

    return matched


#  Track  
@dataclass
class Track:
    track_id: int
    bbox: List[int]
    vehicle_type: str
    vehicle_confidence: float

    hits: int = 1           # total frames matched
    missing: int = 0        # consecutive frames without a match

    # Best plate reading seen so far for this track
    plate_text: Optional[str] = None
    plate_confidence: Optional[float] = None

    # DB row id assigned when first persisted; None until persisted
    detection_id: Optional[int] = None

    # Flags consumed by the caller after each update()
    is_new: bool = True         # True only on the frame the track was created
    plate_updated: bool = False # True on the frame a plate is first read


#  VehicleTracker 
class VehicleTracker:
    """
    One instance per video. Not thread-safe — use a fresh instance per request.

    Parameters
 
    iou_threshold : float
        Minimum IoU to consider two boxes the same vehicle (default 0.3).
        Lower = more permissive matching across large frame gaps.
    max_age : int
        Frames a track survives without any matching detection before it is
        deleted (default 5). Increase if frame_interval is large.
    min_hits : int
        Minimum consecutive hits before a track is considered confirmed and
        eligible for DB persistence (default 1 = persist on first detection).
    """

    def __init__(
        self,
        iou_threshold: float = 0.3,
        max_age: int = 10,
        min_hits: int = 1,
    ):
        self.iou_threshold = iou_threshold
        self.max_age = max_age
        self.min_hits = min_hits
        self._tracks: List[Track] = []
        self._next_id = 1

    def update(
        self, detections: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Match `detections` (output of ANPRService.process_frame) to existing
        tracks and return an enriched copy of each detection dict with:

            track_id    : int   — stable id for this vehicle across frames
            is_new       : bool  — True only the first frame this vehicle appears
            plate_updated   : bool  — True the first frame a plate text is read

        The caller should persist to DB when `is_new` or `plate_updated` is True.
        For subsequent frames of the same vehicle both flags are False, so the
        caller can safely skip persistence.
        """
        # Reset per-frame flags from previous call
        for trk in self._tracks:
            trk.is_new = False
            trk.plate_updated = False

        if not detections:
            # Age all tracks and prune
            for trk in self._tracks:
                trk.missing += 1
            self._tracks = [t for t in self._tracks if t.missing <= self.max_age]
            return []

        #  Match detections to tracks 
        iou_mat = _iou_matrix(self._tracks, detections)
        matched_pairs = _greedy_match(iou_mat, self.iou_threshold)

        matched_track_idxs = {t for t, _ in matched_pairs}
        matched_det_idxs = {d for _, d in matched_pairs}

        # Update matched tracks
        for t_idx, d_idx in matched_pairs:
            
            trk = self._tracks[t_idx]
            det = detections[d_idx]
            trk.bbox = det["vehicle_bbox"]
            trk.hits += 1
            trk.missing = 0

            # Update plate if new reading has higher confidence than current best
            new_plate = det.get("plate_text")
            new_conf = det.get("plate_text_confidence") or 0.0
            if new_plate and new_conf > (trk.plate_confidence or 0.0):
                trk.plate_text = new_plate
                trk.plate_confidence = new_conf
                trk.plate_updated = True

        # Age unmatched tracks
        for t_idx, trk in enumerate(self._tracks):
            if t_idx not in matched_track_idxs:
                trk.missing += 1

        # Spawn new tracks for unmatched detections
        for d_idx, det in enumerate(detections):
            if d_idx not in matched_det_idxs:
                trk = Track(
                    track_id=self._next_id,
                    bbox=det["vehicle_bbox"],
                    vehicle_type=det.get("vehicle_type", ""),
                    vehicle_confidence=det.get("vehicle_confidence", 0.0),
                )
                plate = det.get("plate_text")
                if plate:
                    trk.plate_text = plate
                    trk.plate_confidence = det.get("plate_text_confidence") or 0.0
                self._tracks.append(trk)
                self._next_id += 1

        # Prune dead tracks
        self._tracks = [t for t in self._tracks if t.missing <= self.max_age]

        #  Build enriched detection list  
        # Re-match detections to tracks (tracks may have just been created)
        iou_mat2 = _iou_matrix(self._tracks, detections)
        result: List[Dict[str, Any]] = []

        for d_idx, det in enumerate(detections):
            col = iou_mat2[:, d_idx]
            best_t = int(np.argmax(col)) if len(col) > 0 else -1

            if best_t >= 0 and col[best_t] >= self.iou_threshold:
                trk = self._tracks[best_t]
            else:
                # Fallback: find the newest track whose bbox matches
                trk = self._tracks[-1]  # just-created track for this detection

            enriched = dict(det)
            enriched["track_id"] = trk.track_id
            enriched["is_new"] = trk.is_new
            enriched["plate_updated"] = trk.plate_updated

            # Only flag for persistence if track is confirmed
            confirmed = trk.hits >= self.min_hits
            enriched["should_persist"] = confirmed and (trk.is_new or trk.plate_updated)

            result.append(enriched)

        return result


    def set_detection_id(self, track_id: int, detection_id: int) -> None:
        """Called by the stream after a DB persist to store the row id on the track."""
        for trk in self._tracks:
            if trk.track_id == track_id:
                trk.detection_id = detection_id
                return

    @property
    def active_tracks(self) -> List[Track]:
        return list(self._tracks)
