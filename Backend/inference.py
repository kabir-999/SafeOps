from __future__ import annotations

import json
import os
import threading
import time
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import cv2
import numpy as np
import torch
from ultralytics import YOLO

ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = Path(__file__).resolve().parent
OUTPUT_ROOT = BACKEND_DIR / "outputs"
TMP_ROOT = BACKEND_DIR / "tmp"
MPLCONFIGDIR = BACKEND_DIR / ".mplconfig"

for directory in (OUTPUT_ROOT, TMP_ROOT, MPLCONFIGDIR):
    directory.mkdir(parents=True, exist_ok=True)

os.environ.setdefault("MPLCONFIGDIR", str(MPLCONFIGDIR))
os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

YOLO_MODEL_CANDIDATES = [BACKEND_DIR / "best 3.pt", BACKEND_DIR / "current_best.pt"]

SUPPORTED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
SUPPORTED_VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".m4v"}

PERSON_ALIASES = {"person", "worker", "human"}
PPE_ALIASES = {
    "helmet": {"helmet", "hardhat", "hard-hat", "hard_hat", "safety_helmet", "safety helmet"},
    "vest": {"vest", "safety_vest", "safety vest", "reflective_vest", "reflective vest", "jacket"},
}
PPE_VIOLATION_ALIASES = {
    "helmet": {"no_hardhat", "no_helmet", "missing_helmet", "without_helmet"},
    "vest": {"no_safety_vest", "no_vest", "missing_vest", "without_vest"},
}
PPE_LABELS = {
    "helmet": "Missing Helmet",
    "vest": "No Safety Vest",
}
PPE_WEIGHTS = {"helmet": 5, "vest": 4}
PERSON_COLORS = {
    "non_compliant": (72, 100, 255),
    "compliant": (90, 220, 110),
    "unknown": (210, 210, 210),
}


def resolve_yolo_model_path() -> Path:
    for candidate in YOLO_MODEL_CANDIDATES:
        if candidate.exists():
            return candidate
    return YOLO_MODEL_CANDIDATES[0]


YOLO_MODEL_PATH = resolve_yolo_model_path()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def choose_device() -> str:
    if torch.cuda.is_available():
        return "cuda"
    mps_backend = getattr(torch.backends, "mps", None)
    if mps_backend and torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def to_int_bbox(bbox: list[float]) -> dict[str, int]:
    x1, y1, x2, y2 = bbox
    return {"x1": int(round(x1)), "y1": int(round(y1)), "x2": int(round(x2)), "y2": int(round(y2))}


def clamp_bbox(bbox: list[float], width: int, height: int) -> list[int]:
    x1, y1, x2, y2 = bbox
    return [
        max(0, min(width - 1, int(round(x1)))),
        max(0, min(height - 1, int(round(y1)))),
        max(0, min(width - 1, int(round(x2)))),
        max(0, min(height - 1, int(round(y2)))),
    ]


def infer_media_type(filename: str) -> str:
    suffix = Path(filename).suffix.lower()
    if suffix in SUPPORTED_IMAGE_EXTENSIONS:
        return "image"
    if suffix in SUPPORTED_VIDEO_EXTENSIONS:
        return "video"
    raise ValueError(
        f"Unsupported file type '{suffix or 'unknown'}'. Supported images: "
        f"{sorted(SUPPORTED_IMAGE_EXTENSIONS)}. Supported videos: {sorted(SUPPORTED_VIDEO_EXTENSIONS)}."
    )


def normalize_name(name: str) -> str:
    return name.strip().lower().replace("-", "_")


def center_of(bbox: list[float]) -> tuple[float, float]:
    x1, y1, x2, y2 = bbox
    return ((x1 + x2) / 2.0, (y1 + y2) / 2.0)


def bbox_area(bbox: list[float]) -> float:
    x1, y1, x2, y2 = bbox
    return max(0.0, x2 - x1) * max(0.0, y2 - y1)


def intersection_area(a: list[float], b: list[float]) -> float:
    x1 = max(a[0], b[0])
    y1 = max(a[1], b[1])
    x2 = min(a[2], b[2])
    y2 = min(a[3], b[3])
    if x2 <= x1 or y2 <= y1:
        return 0.0
    return (x2 - x1) * (y2 - y1)


def point_in_bbox(point: tuple[float, float], bbox: list[float]) -> bool:
    x, y = point
    return bbox[0] <= x <= bbox[2] and bbox[1] <= y <= bbox[3]


def enhance_low_light(image: np.ndarray) -> np.ndarray:
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)

    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    l_channel = clahe.apply(l_channel)

    lab = cv2.merge((l_channel, a_channel, b_channel))
    enhanced = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

    gamma = 1.5
    inv_gamma = 1.0 / gamma
    table = np.array([(index / 255.0) ** inv_gamma * 255 for index in range(256)], dtype=np.uint8)
    enhanced = cv2.LUT(enhanced, table)
    return cv2.fastNlMeansDenoisingColored(enhanced, None, 10, 10, 7, 21)


def is_low_light(image: np.ndarray, threshold: float = 80.0) -> bool:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    return float(np.mean(gray)) < threshold


def make_relative_output_path(path: Path) -> str:
    return "/" + str(path.relative_to(BACKEND_DIR)).replace(os.sep, "/")


def short_status(person: dict[str, Any]) -> str:
    helmet = "YES" if person["ppe_status"].get("helmet") is True else "NO"
    vest = "YES" if person["ppe_status"].get("vest") is True else "NO"
    return f"Helmet: {helmet} | Vest: {vest} | {person['safety_status']}"


def person_color(person: dict[str, Any]) -> tuple[int, int, int]:
    if person["missing_items"]:
        return PERSON_COLORS["non_compliant"]
    if any(value is True for value in person["ppe_status"].values()):
        return PERSON_COLORS["compliant"]
    return PERSON_COLORS["unknown"]


def compliance_object_color(status: bool) -> tuple[int, int, int]:
    return PERSON_COLORS["compliant"] if status else PERSON_COLORS["non_compliant"]


def compliance_object_label(compliance_object: dict[str, Any]) -> str:
    state = "YES" if compliance_object["status"] else "NO"
    item_label = "Helmet" if compliance_object["item"] == "helmet" else "Vest"
    return f"{item_label}: {state}"


def create_video_writer(path: Path, fps: float, frame_size: tuple[int, int]) -> tuple[cv2.VideoWriter, str]:
    for codec in ("avc1", "H264", "mp4v"):
        fourcc = cv2.VideoWriter_fourcc(*codec)
        writer = cv2.VideoWriter(str(path), fourcc, fps, frame_size)
        if writer.isOpened():
            return writer, codec
        writer.release()
    raise RuntimeError(f"Could not create a video writer for {path.name} with codecs avc1, H264, or mp4v.")


@dataclass
class TrackState:
    track_id: int
    center: tuple[float, float]
    bbox: list[float]
    last_seen_frame: int
    missed_frames: int = 0


class SimpleCentroidTracker:
    def __init__(self, max_distance: float = 120.0, max_missed_frames: int = 20) -> None:
        self.max_distance = max_distance
        self.max_missed_frames = max_missed_frames
        self.next_track_id = 1
        self.tracks: dict[int, TrackState] = {}

    def assign(self, detections: list[dict[str, Any]], frame_index: int) -> list[int]:
        if not detections:
            expired = []
            for track_id, track in self.tracks.items():
                track.missed_frames += 1
                if track.missed_frames > self.max_missed_frames:
                    expired.append(track_id)
            for track_id in expired:
                self.tracks.pop(track_id, None)
            return []

        detection_centers = [center_of(det["bbox"]) for det in detections]
        assignments: dict[int, int] = {}
        used_tracks: set[int] = set()
        used_detections: set[int] = set()

        candidate_pairs: list[tuple[float, int, int]] = []
        for track_id, track in self.tracks.items():
            for detection_index, detection_center in enumerate(detection_centers):
                distance = ((track.center[0] - detection_center[0]) ** 2 + (track.center[1] - detection_center[1]) ** 2) ** 0.5
                candidate_pairs.append((distance, track_id, detection_index))

        for distance, track_id, detection_index in sorted(candidate_pairs, key=lambda item: item[0]):
            if distance > self.max_distance or track_id in used_tracks or detection_index in used_detections:
                continue
            assignments[detection_index] = track_id
            used_tracks.add(track_id)
            used_detections.add(detection_index)

        for detection_index, detection in enumerate(detections):
            if detection_index not in assignments:
                track_id = self.next_track_id
                self.next_track_id += 1
                assignments[detection_index] = track_id
                self.tracks[track_id] = TrackState(
                    track_id=track_id,
                    center=detection_centers[detection_index],
                    bbox=detection["bbox"],
                    last_seen_frame=frame_index,
                    missed_frames=0,
                )

        expired = []
        for track_id, track in self.tracks.items():
            if track_id in used_tracks or track_id in assignments.values():
                detection_index = next((idx for idx, assigned_track_id in assignments.items() if assigned_track_id == track_id), None)
                if detection_index is not None:
                    track.center = detection_centers[detection_index]
                    track.bbox = detections[detection_index]["bbox"]
                    track.last_seen_frame = frame_index
                    track.missed_frames = 0
            else:
                track.missed_frames += 1
                if track.missed_frames > self.max_missed_frames:
                    expired.append(track_id)

        for track_id in expired:
            self.tracks.pop(track_id, None)

        return [assignments[index] for index in range(len(detections))]


class ComplianceEngine:
    def __init__(self) -> None:
        self.device = choose_device()
        self.detector = YOLO(str(YOLO_MODEL_PATH))
        self.class_names = {
            int(class_id): str(class_name)
            for class_id, class_name in self.detector.model.names.items()
        }
        self.person_class_ids = {
            class_id
            for class_id, class_name in self.class_names.items()
            if normalize_name(class_name) in PERSON_ALIASES
        }
        self.ppe_class_ids = {
            item: {
                class_id
                for class_id, class_name in self.class_names.items()
                if normalize_name(class_name) in aliases
            }
            for item, aliases in PPE_ALIASES.items()
        }
        self.ppe_violation_class_ids = {
            item: {
                class_id
                for class_id, class_name in self.class_names.items()
                if normalize_name(class_name) in aliases
            }
            for item, aliases in PPE_VIOLATION_ALIASES.items()
        }
        self.available_ppe_items = sorted(
            item
            for item in PPE_ALIASES
            if self.ppe_class_ids.get(item) or self.ppe_violation_class_ids.get(item)
        )

    def build_model_info(self) -> dict[str, Any]:
        return {
            "detector_model_path": str(YOLO_MODEL_PATH),
            "device": self.device,
            "detector_classes": self.class_names,
            "person_class_ids": sorted(self.person_class_ids),
            "available_ppe_items": self.available_ppe_items,
            "supports_ppe_compliance": bool(self.available_ppe_items),
            "warnings": self._model_warnings(),
        }

    def build_compact_model_info(self) -> dict[str, Any]:
        return {
            "detector_model": YOLO_MODEL_PATH.name,
            "device": self.device,
            "supports_ppe_compliance": bool(self.available_ppe_items),
            "available_ppe_items": self.available_ppe_items,
        }

    def _model_warnings(self) -> list[str]:
        missing_items = [item for item in PPE_ALIASES if item not in self.available_ppe_items]
        warnings: list[str] = []
        if YOLO_MODEL_PATH.name != "best 3.pt":
            warnings.append(
                "best 3.pt was not found in Backend/, so the backend is currently using "
                f"{YOLO_MODEL_PATH.name} instead."
            )
        if not self.person_class_ids:
            warnings.append("The current YOLO weights do not expose a 'person' class, so people counting will fail.")
        if missing_items:
            warnings.append(
                "The current YOLO weights do not include PPE classes for "
                f"{', '.join(missing_items)}. Person detection will work, but missing-item analysis "
                "for those labels stays unknown until you replace the weights with a PPE-trained model."
            )
        return warnings

    def _run_detector(self, frame_bgr: np.ndarray) -> list[dict[str, Any]]:
        results = self.detector.predict(
            source=frame_bgr,
            conf=0.3,
            iou=0.5,
            verbose=False,
            device=self.device,
        )
        detections: list[dict[str, Any]] = []
        result = results[0]
        if result.boxes is None:
            return detections

        for box in result.boxes:
            class_id = int(box.cls[0].item())
            bbox = [float(value) for value in box.xyxy[0].tolist()]
            detections.append(
                {
                    "class_id": class_id,
                    "class_name": self.class_names.get(class_id, str(class_id)),
                    "confidence": float(box.conf[0].item()),
                    "bbox": bbox,
                }
            )
        return detections

    def _assign_ppe_to_people(
        self,
        people: list[dict[str, Any]],
        compliance_objects: list[dict[str, Any]],
    ) -> None:
        for compliance_object in compliance_objects:
            object_center = center_of(compliance_object["bbox"])
            object_bbox = compliance_object["bbox"]
            object_area = max(1.0, bbox_area(object_bbox))
            best_person: dict[str, Any] | None = None
            best_score = 0.0
            for person in people:
                person_bbox = person["bbox"]
                score = 0.0
                if point_in_bbox(object_center, person_bbox):
                    score = 1.0 + (intersection_area(object_bbox, person_bbox) / object_area)
                else:
                    overlap = intersection_area(object_bbox, person_bbox)
                    if overlap > 0:
                        score = overlap / object_area
                if score > best_score:
                    best_score = score
                    best_person = person
            if best_person is None or best_score < 0.1:
                continue
            item = compliance_object["item"]
            current_status = best_person["ppe_status"][item]
            incoming_status = compliance_object["status"]
            if current_status is None or (current_status is True and incoming_status is False):
                best_person["ppe_status"][item] = incoming_status
            best_person["compliance_objects"].append(compliance_object["id"])
            compliance_object["assigned_person_id"] = best_person["id"]

    def analyze_frame(
        self,
        frame_bgr: np.ndarray,
        frame_index: int,
        timestamp_ms: float,
        tracker: SimpleCentroidTracker | None = None,
    ) -> dict[str, Any]:
        detections = self._run_detector(frame_bgr)

        people_detections = [det for det in detections if det["class_id"] in self.person_class_ids]
        ppe_detections: list[dict[str, Any]] = []
        ppe_counter = 1
        for detection in detections:
            matched_item = False
            for item, class_ids in self.ppe_class_ids.items():
                if detection["class_id"] in class_ids:
                    ppe_detections.append(
                        {
                            "id": f"O{ppe_counter}",
                            "item": item,
                            "label": self.class_names[detection["class_id"]],
                            "status": True,
                            "confidence": round(detection["confidence"], 4),
                            "bbox": detection["bbox"],
                            "assigned_person_id": None,
                        }
                    )
                    ppe_counter += 1
                    matched_item = True
                    break
            if matched_item:
                continue
            for item, class_ids in self.ppe_violation_class_ids.items():
                if detection["class_id"] in class_ids:
                    ppe_detections.append(
                        {
                            "id": f"O{ppe_counter}",
                            "item": item,
                            "label": self.class_names[detection["class_id"]],
                            "status": False,
                            "confidence": round(detection["confidence"], 4),
                            "bbox": detection["bbox"],
                            "assigned_person_id": None,
                        }
                    )
                    ppe_counter += 1
                    break

        if tracker:
            track_ids = tracker.assign(people_detections, frame_index)
        else:
            track_ids = list(range(1, len(people_detections) + 1))

        people: list[dict[str, Any]] = []
        for index, detection in enumerate(people_detections):
            track_id = track_ids[index] if index < len(track_ids) else index + 1
            person_id = f"P{track_id}"
            bbox = detection["bbox"]
            cx, cy = center_of(bbox)
            person = {
                "id": person_id,
                "bbox": bbox,
                "confidence": round(detection["confidence"], 4),
                "position": {
                    "x": round(cx, 2),
                    "y": round(cy, 2),
                    "x_percent": round(cx / frame_bgr.shape[1], 4),
                    "y_percent": round(cy / frame_bgr.shape[0], 4),
                },
                "ppe_status": {item: None for item in PPE_ALIASES},
                "compliance_objects": [],
                "time_detected": now_iso(),
                "frame_index": frame_index,
                "timestamp_ms": round(timestamp_ms, 2),
            }
            people.append(person)

        self._assign_ppe_to_people(people, ppe_detections)

        for person in people:
            missing_items = [item for item, status in person["ppe_status"].items() if status is not True]
            person["missing_items"] = missing_items
            person["violations"] = [PPE_LABELS[item] for item in missing_items]
            person["risk_score"] = sum(PPE_WEIGHTS[item] for item in missing_items)
            person["safety_status"] = "SAFE" if not missing_items else "NO SAFE"
            person["bbox"] = to_int_bbox(person["bbox"])

        compliance_objects = []
        for compliance_object in ppe_detections:
            compliance_objects.append(
                {
                    **compliance_object,
                    "bbox": to_int_bbox(compliance_object["bbox"]),
                }
            )

        frame_report = {
            "frame_index": frame_index,
            "timestamp_ms": round(timestamp_ms, 2),
            "people_count": len(people),
            "non_compliant_people": sum(1 for person in people if person["missing_items"]),
            "missing_item_counts": {
                item: sum(1 for person in people if item in person["missing_items"])
                for item in PPE_ALIASES
            },
            "people": people,
            "compliance_objects": compliance_objects,
            "warnings": self._model_warnings(),
        }
        return frame_report

    def draw_frame_overlay(self, frame_bgr: np.ndarray, frame_report: dict[str, Any], view_name: str) -> np.ndarray:
        canvas = frame_bgr.copy()
        for compliance_object in frame_report["compliance_objects"]:
            bbox = compliance_object["bbox"]
            color = compliance_object_color(compliance_object["status"])
            cv2.rectangle(canvas, (bbox["x1"], bbox["y1"]), (bbox["x2"], bbox["y2"]), color, 2)
            cv2.putText(
                canvas,
                compliance_object_label(compliance_object),
                (bbox["x1"], max(18, bbox["y1"] - 6)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                color,
                2,
                cv2.LINE_AA,
            )

        for person in frame_report["people"]:
            bbox = person["bbox"]
            color = person_color(person)
            cv2.rectangle(canvas, (bbox["x1"], bbox["y1"]), (bbox["x2"], bbox["y2"]), color, 2)
            cv2.putText(
                canvas,
                f"{person['id']} | {short_status(person)}",
                (bbox["x1"], max(24, bbox["y1"] - 8)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                color,
                2,
                cv2.LINE_AA,
            )

        panel_height = min(canvas.shape[0] - 10, 76)
        cv2.rectangle(canvas, (10, 10), (650, 10 + panel_height), (10, 10, 10), -1)
        cv2.rectangle(canvas, (10, 10), (650, 10 + panel_height), (70, 70, 70), 1)
        header = (
            f"{view_name} | People: {frame_report['people_count']} | No Safe: {frame_report['non_compliant_people']}"
        )
        cv2.putText(canvas, header, (20, 32), cv2.FONT_HERSHEY_SIMPLEX, 0.58, (245, 245, 245), 2, cv2.LINE_AA)

        overlay_note = "Helmet and Safety Vest are shown as YES/NO for each person."
        cv2.putText(canvas, overlay_note, (20, 58), cv2.FONT_HERSHEY_SIMPLEX, 0.44, (200, 200, 200), 1, cv2.LINE_AA)
        return canvas


class ComplianceService:
    def __init__(self) -> None:
        self.engine = ComplianceEngine()
        self.lock = threading.Lock()
        self.frame_stride = 5

    def get_model_info(self) -> dict[str, Any]:
        return self.engine.build_model_info()

    def analyze_file(self, input_path: Path, original_filename: str) -> dict[str, Any]:
        media_type = infer_media_type(original_filename)
        analysis_id = datetime.now().strftime("%Y%m%d-%H%M%S") + "-" + uuid.uuid4().hex[:8]
        run_dir = OUTPUT_ROOT / analysis_id
        run_dir.mkdir(parents=True, exist_ok=True)

        source_copy = run_dir / f"source{input_path.suffix.lower()}"
        source_copy.write_bytes(input_path.read_bytes())

        started_at = time.perf_counter()
        with self.lock:
            if media_type == "image":
                report = self._analyze_image(source_copy, original_filename, analysis_id, run_dir)
            else:
                report = self._analyze_video(source_copy, original_filename, analysis_id, run_dir)
        report["processing_seconds"] = round(time.perf_counter() - started_at, 3)
        report["artifacts"]["source_url"] = make_relative_output_path(source_copy)

        report_path = run_dir / "report.json"
        report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
        report["artifacts"]["report_url"] = make_relative_output_path(report_path)
        return report

    def _build_final_report(
        self,
        *,
        analysis_id: str,
        media_type: str,
        original_filename: str,
        summary: dict[str, Any],
        people: list[dict[str, Any]],
        artifacts: dict[str, str],
        warnings: list[str],
        runtime: dict[str, Any],
    ) -> dict[str, Any]:
        report = {
            "analysis_id": analysis_id,
            "timestamp": now_iso(),
            "media_type": media_type,
            "filename": original_filename,
            "summary": summary,
            "people": people,
            "artifacts": artifacts,
            "model": self.engine.build_compact_model_info(),
            "warnings": warnings,
            "runtime": runtime,
        }
        return report

    def _analyze_image(self, image_path: Path, original_filename: str, analysis_id: str, run_dir: Path) -> dict[str, Any]:
        frame = cv2.imread(str(image_path))
        if frame is None:
            raise ValueError(f"Could not decode image file: {original_filename}")

        frame_report = self.engine.analyze_frame(frame, frame_index=0, timestamp_ms=0.0)
        annotated = self.engine.draw_frame_overlay(frame, frame_report, view_name="ORIGINAL")

        annotated_path = run_dir / "annotated.png"
        cv2.imwrite(str(annotated_path), annotated)

        people = frame_report["people"]
        summary = self._build_summary(people, processed_frames=1, total_frames=1)

        return self._build_final_report(
            analysis_id=analysis_id,
            media_type="image",
            original_filename=original_filename,
            summary=summary,
            people=people,
            artifacts={
                "annotated_media_url": make_relative_output_path(annotated_path),
            },
            warnings=self.engine._model_warnings(),
            runtime={
                "fps": 0.0,
                "processed_frames": 1,
                "total_frames": 1,
            },
        )

    def _analyze_video(self, video_path: Path, original_filename: str, analysis_id: str, run_dir: Path) -> dict[str, Any]:
        capture = cv2.VideoCapture(str(video_path))
        if not capture.isOpened():
            raise ValueError(f"Could not open video file: {original_filename}")

        fps = float(capture.get(cv2.CAP_PROP_FPS) or 0.0)
        width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
        height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
        total_frames = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)

        if width <= 0 or height <= 0:
            raise ValueError(f"Could not read video dimensions for: {original_filename}")

        writer_fps = fps if fps > 0 else 10.0
        annotated_path = run_dir / "annotated.mp4"
        annotated_writer, annotated_codec = create_video_writer(annotated_path, writer_fps, (width, height))

        tracker = SimpleCentroidTracker()
        aggregate_people: dict[str, dict[str, Any]] = {}
        processed_frames = 0
        frame_index = 0

        try:
            while True:
                ok, frame = capture.read()
                if not ok:
                    break

                should_process = frame_index % self.frame_stride == 0
                if should_process:
                    timestamp_ms = (frame_index / fps * 1000.0) if fps > 0 else float(frame_index * 100)
                    frame_report = self.engine.analyze_frame(
                        frame,
                        frame_index=frame_index,
                        timestamp_ms=timestamp_ms,
                        tracker=tracker,
                    )
                    processed_frames += 1
                    annotated_frame = self.engine.draw_frame_overlay(frame, frame_report, view_name="ORIGINAL")
                    self._merge_people_aggregate(aggregate_people, frame_report["people"])
                else:
                    annotated_frame = frame.copy()
                    cv2.putText(
                        annotated_frame,
                        "Frame skipped to keep local video analysis responsive",
                        (20, 34),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.55,
                        (220, 220, 220),
                        2,
                        cv2.LINE_AA,
                    )

                annotated_writer.write(annotated_frame)
                frame_index += 1
        finally:
            capture.release()
            annotated_writer.release()

        people = self._finalize_people_aggregate(aggregate_people)
        summary = self._build_summary(people, processed_frames=processed_frames, total_frames=max(total_frames, frame_index))

        return self._build_final_report(
            analysis_id=analysis_id,
            media_type="video",
            original_filename=original_filename,
            summary=summary,
            people=people,
            artifacts={
                "annotated_media_url": make_relative_output_path(annotated_path),
            },
            warnings=self.engine._model_warnings(),
            runtime={
                "fps": round(writer_fps, 3),
                "frame_stride": self.frame_stride,
                "processed_frames": processed_frames,
                "total_frames": max(total_frames, frame_index),
                "video_codecs": {
                    "annotated": annotated_codec,
                },
            },
        )

    def _merge_people_aggregate(self, aggregate_people: dict[str, dict[str, Any]], people: list[dict[str, Any]]) -> None:
        for person in people:
            existing = aggregate_people.get(person["id"])
            if existing is None:
                aggregate_people[person["id"]] = {
                    "id": person["id"],
                    "bbox": person["bbox"],
                    "confidence": person["confidence"],
                    "position": person["position"],
                    "first_frame": person["frame_index"],
                    "last_frame": person["frame_index"],
                    "timestamps_ms": [person["timestamp_ms"]],
                    "false_counts": {item: 0 for item in PPE_ALIASES},
                    "true_counts": {item: 0 for item in PPE_ALIASES},
                }
                existing = aggregate_people[person["id"]]

            existing["bbox"] = person["bbox"]
            existing["confidence"] = max(existing["confidence"], person["confidence"])
            existing["position"] = person["position"]
            existing["last_frame"] = person["frame_index"]
            existing["timestamps_ms"].append(person["timestamp_ms"])

            for item, status in person["ppe_status"].items():
                if status is True:
                    existing["true_counts"][item] += 1
                else:
                    existing["false_counts"][item] += 1

    def _finalize_people_aggregate(self, aggregate_people: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
        finalized: list[dict[str, Any]] = []
        for person in sorted(aggregate_people.values(), key=lambda record: record["id"]):
            ppe_status: dict[str, bool | None] = {}
            for item in PPE_ALIASES:
                if person["true_counts"][item] > person["false_counts"][item]:
                    ppe_status[item] = True
                else:
                    ppe_status[item] = False

            missing_items = [item for item, status in ppe_status.items() if status is False]
            finalized.append(
                {
                    "id": person["id"],
                    "bbox": person["bbox"],
                    "confidence": round(float(person["confidence"]), 4),
                    "position": person["position"],
                    "ppe_status": ppe_status,
                    "safety_status": "SAFE" if not missing_items else "NO SAFE",
                    "missing_items": missing_items,
                    "violations": [PPE_LABELS[item] for item in missing_items],
                    "risk_score": sum(PPE_WEIGHTS[item] for item in missing_items),
                    "first_frame": person["first_frame"],
                    "last_frame": person["last_frame"],
                    "observations": len(person["timestamps_ms"]),
                }
            )
        return finalized

    def _build_summary(self, people: list[dict[str, Any]], processed_frames: int, total_frames: int) -> dict[str, Any]:
        missing_item_counts = {
            item: sum(1 for person in people if item in person["missing_items"])
            for item in PPE_ALIASES
        }
        total_missing_items = sum(missing_item_counts.values())
        non_compliant_people = [person for person in people if person["missing_items"]]
        compliant_people = sum(1 for person in people if not person["missing_items"])
        compliance_rate = (compliant_people / len(people) * 100.0) if people else None
        return {
            "total_people_detected": len(people),
            "safe_people": compliant_people,
            "no_safe_people": len(non_compliant_people),
            "total_missing_items": total_missing_items,
            "missing_item_counts": missing_item_counts,
            "compliance_rate_percent": round(compliance_rate, 2) if compliance_rate is not None else None,
            "processed_frames": processed_frames,
            "total_frames": total_frames,
            "people_status": [
                {
                    "id": person["id"],
                    "safety_status": person["safety_status"],
                    "helmet": "YES" if person["ppe_status"].get("helmet") is True else "NO",
                    "safety_vest": "YES" if person["ppe_status"].get("vest") is True else "NO",
                    "missing_items": person["missing_items"],
                    "violations": person["violations"],
                    "risk_score": person["risk_score"],
                }
                for person in people
            ],
        }
