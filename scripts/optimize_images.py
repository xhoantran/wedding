#!/usr/bin/env python3
"""Resize tea-ceremony images to web-quality in-place.

Resizes to max 2000px wide, 85% JPEG quality.
Skips images already under the size threshold.
"""

from pathlib import Path
from PIL import Image

TEA_CEREMONY_DIR = Path(__file__).parent.parent / "public" / "images" / "tea-ceremony"
MAX_WIDTH = 2000
QUALITY = 85


def optimize(path: Path):
    try:
        img = Image.open(path)
    except Exception as e:
        print(f"  SKIP {path.name}: {e}")
        return

    w, h = img.size
    if w <= MAX_WIDTH:
        print(f"  OK   {path.name} ({w}x{h})")
        return

    ratio = MAX_WIDTH / w
    new_h = int(h * ratio)
    img = img.resize((MAX_WIDTH, new_h), Image.LANCZOS)

    # Preserve EXIF orientation if present
    exif = img.info.get("exif")
    save_kwargs = {"quality": QUALITY, "optimize": True}
    if exif:
        save_kwargs["exif"] = exif

    img.save(path, "JPEG", **save_kwargs)
    old_kb = path.stat().st_size / 1024  # already overwritten, but close enough
    print(f"  DONE {path.name} ({w}x{h} -> {MAX_WIDTH}x{new_h})")


def main():
    images = sorted(TEA_CEREMONY_DIR.rglob("*.jpg")) + sorted(TEA_CEREMONY_DIR.rglob("*.JPG"))
    print(f"Found {len(images)} images in {TEA_CEREMONY_DIR}\n")

    for i, path in enumerate(images, 1):
        print(f"[{i}/{len(images)}]", end="")
        optimize(path)

    print("\nDone!")


if __name__ == "__main__":
    main()
