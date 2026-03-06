#!/usr/bin/env python3
"""Remove tea-ceremony photos that have no detected faces.

Run AFTER detect_faces.py to clean up unused photos from public/.

Usage:
    python scripts/cleanup_photos.py          # dry run (show what would be deleted)
    python scripts/cleanup_photos.py --delete  # actually delete files
"""

import argparse
import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
OUTPUT_DIR = Path(__file__).parent / "output"
EMBEDDINGS_FILE = OUTPUT_DIR / "embeddings.json"

TEA_CEREMONY_DIR = PROJECT_ROOT / "public" / "images" / "tea-ceremony"
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}


def main():
    parser = argparse.ArgumentParser(description="Remove photos with no detected faces")
    parser.add_argument("--delete", action="store_true", help="Actually delete files (default is dry run)")
    args = parser.parse_args()

    if not EMBEDDINGS_FILE.exists():
        print("Error: embeddings.json not found. Run detect_faces.py first.")
        return

    with open(EMBEDDINGS_FILE) as f:
        embeddings = json.load(f)

    photos_with_faces = {e["photo"] for e in embeddings}

    # Collect all tea-ceremony photos
    all_photos = []
    for p in TEA_CEREMONY_DIR.rglob("*"):
        if p.suffix.lower() in IMAGE_EXTENSIONS:
            all_photos.append(p)

    unused = [p for p in all_photos if p.name not in photos_with_faces]
    used = len(all_photos) - len(unused)

    print(f"Tea ceremony photos: {len(all_photos)}")
    print(f"  With faces: {used}")
    print(f"  No faces: {len(unused)}")

    if not unused:
        print("\nNothing to clean up.")
        return

    if args.delete:
        total_size = 0
        for p in unused:
            total_size += p.stat().st_size
            p.unlink()
        print(f"\nDeleted {len(unused)} files ({total_size / 1024 / 1024:.1f} MB)")
    else:
        total_size = sum(p.stat().st_size for p in unused)
        print(f"\nWould delete {len(unused)} files ({total_size / 1024 / 1024:.1f} MB)")
        print("Run with --delete to actually remove them.")


if __name__ == "__main__":
    main()
