#!/usr/bin/env python3
"""Step 1: Detect faces in all photos and extract embeddings using InsightFace (ArcFace).

Scans multiple photo directories, detects faces, extracts 512-dim ArcFace embeddings,
and saves face crops for visual review.

Usage:
    python scripts/detect_faces.py                    # scan default directories
    python scripts/detect_faces.py --force             # re-process all photos
    python scripts/detect_faces.py --dirs /path/to/photos  # custom directories
"""

import argparse
import json
from pathlib import Path

import cv2
import numpy as np
from insightface.app import FaceAnalysis
from PIL import Image
from tqdm import tqdm

# Default photo directories
PROJECT_ROOT = Path(__file__).parent.parent
PHOTO_DIRS = [
    PROJECT_ROOT / "public" / "images" / "tea-ceremony" / "khach",
    PROJECT_ROOT / "public" / "images" / "tea-ceremony" / "phong-su",
    PROJECT_ROOT / "public" / "images" / "tea-ceremony" / "anh-film",
    PROJECT_ROOT / "public" / "images" / "tea-ceremony" / "truyen-thong",
    PROJECT_ROOT / "public" / "images" / "gallery",
]

OUTPUT_DIR = Path(__file__).parent / "output"
CROPS_DIR = OUTPUT_DIR / "crops"
EMBEDDINGS_FILE = OUTPUT_DIR / "embeddings.json"

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}


def collect_photos(dirs: list[Path]) -> list[Path]:
    """Collect all image files from multiple directories."""
    photos = []
    for d in dirs:
        if not d.exists():
            print(f"Warning: {d} does not exist, skipping")
            continue
        for p in sorted(d.iterdir()):
            if p.suffix.lower() in IMAGE_EXTENSIONS:
                photos.append(p)
    return photos


def get_providers() -> list[str]:
    """Get best available ONNX Runtime providers (prefer CoreML on Mac)."""
    import onnxruntime as ort
    available = ort.get_available_providers()
    # CoreML uses Apple Neural Engine / GPU on Mac
    if "CoreMLExecutionProvider" in available:
        return ["CoreMLExecutionProvider", "CPUExecutionProvider"]
    return ["CPUExecutionProvider"]


def init_face_analyzer() -> FaceAnalysis:
    """Initialize InsightFace analyzer with buffalo_l model (ArcFace)."""
    providers = get_providers()
    print(f"Using providers: {providers}")
    app = FaceAnalysis(
        name="buffalo_l",
        providers=providers,
    )
    app.prepare(ctx_id=0, det_size=(640, 640))
    return app


def detect_and_extract(app: FaceAnalysis, photo_path: Path) -> list[dict]:
    """Detect faces in a photo and return 512-dim ArcFace embeddings + metadata."""
    img = cv2.imread(str(photo_path))
    if img is None:
        raise ValueError(f"Could not read image: {photo_path}")

    faces = app.get(img)

    results = []
    for i, face in enumerate(faces):
        bbox = face.bbox.astype(int)
        left, top, right, bottom = bbox

        # Save face crop with padding
        crop_name = f"{photo_path.stem}_face_{i}.jpg"
        crop_path = CROPS_DIR / crop_name
        h, w = img.shape[:2]
        pad = int((bottom - top) * 0.3)
        crop_box = (
            max(0, left - pad),
            max(0, top - pad),
            min(w, right + pad),
            min(h, bottom + pad),
        )
        face_crop = img[crop_box[1]:crop_box[3], crop_box[0]:crop_box[2]]
        face_crop_rgb = cv2.cvtColor(face_crop, cv2.COLOR_BGR2RGB)
        pil_crop = Image.fromarray(face_crop_rgb)
        pil_crop.thumbnail((200, 200))
        pil_crop.save(str(crop_path), quality=85)

        results.append({
            "photo": photo_path.name,
            "source_dir": photo_path.parent.name,
            "face_index": i,
            "location": [int(top), int(right), int(bottom), int(left)],
            "det_score": float(face.det_score),
            "encoding": face.embedding.tolist(),
            "crop_path": f"crops/{crop_name}",
        })

    return results


def main():
    parser = argparse.ArgumentParser(description="Detect faces in wedding photos (InsightFace/ArcFace)")
    parser.add_argument("--force", action="store_true",
                        help="Re-process all photos, ignoring cache")
    parser.add_argument("--dirs", nargs="+", type=Path,
                        help="Custom photo directories (overrides defaults)")
    parser.add_argument("--min-score", type=float, default=0.5,
                        help="Minimum detection confidence (0-1, default 0.5)")
    args = parser.parse_args()

    dirs = [Path(d) for d in args.dirs] if args.dirs else PHOTO_DIRS
    CROPS_DIR.mkdir(parents=True, exist_ok=True)

    # Load existing embeddings for incremental processing
    existing: set[str] = set()
    existing_data: list[dict] = []
    if EMBEDDINGS_FILE.exists() and not args.force:
        with open(EMBEDDINGS_FILE) as f:
            existing_data = json.load(f)
            existing = {e["photo"] for e in existing_data}

    # Collect all photos
    photos = collect_photos(dirs)
    print(f"Found {len(photos)} photos across {len(dirs)} directories")

    # Initialize InsightFace
    print("Loading InsightFace model (buffalo_l / ArcFace)...")
    app = init_face_analyzer()
    print("Model loaded.\n")

    all_embeddings = list(existing_data) if not args.force else []
    new_count = 0
    new_faces = 0

    for photo in tqdm(photos, desc="Detecting faces"):
        if photo.name in existing and not args.force:
            continue

        try:
            results = detect_and_extract(app, photo)
            # Filter by detection confidence
            results = [r for r in results if r["det_score"] >= args.min_score]
            all_embeddings.extend(results)
            new_count += 1
            new_faces += len(results)
        except Exception as e:
            print(f"\nError processing {photo.name}: {e}")

    # Save embeddings
    with open(EMBEDDINGS_FILE, "w") as f:
        json.dump(all_embeddings, f, indent=2)

    total_faces = len(all_embeddings)
    cached = len(photos) - new_count
    print(f"\nDone! Processed {new_count} new photos ({cached} cached).")
    print(f"New faces detected: {new_faces}")
    print(f"Total faces: {total_faces}")
    print(f"Embeddings saved to: {EMBEDDINGS_FILE}")
    print(f"Face crops saved to: {CROPS_DIR}")
    print(f"\nNext step: python scripts/cluster_faces.py")


if __name__ == "__main__":
    main()
