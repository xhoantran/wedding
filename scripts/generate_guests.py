#!/usr/bin/env python3
"""Step 4: Generate public/data/guests.json from clusters + mapping."""

import json
import re
import unicodedata
import uuid
from pathlib import Path

OUTPUT_DIR = Path(__file__).parent / "output"
CLUSTERS_RAW_FILE = OUTPUT_DIR / "clusters_raw.json"
MAPPING_FILE = Path(__file__).parent / "cluster_mapping.json"
GROUPS_FILE = Path(__file__).parent / "invite_groups.json"
GUESTS_FILE = Path(__file__).parent.parent / "data" / "guests.json"


def slugify(name: str) -> str:
    """Convert a name to a URL-safe slug. Handles Vietnamese diacritics."""
    # Normalize unicode and strip diacritics
    nfkd = unicodedata.normalize("NFKD", name)
    ascii_name = nfkd.encode("ascii", "ignore").decode("ascii")
    # Lowercase, replace non-alphanumeric with hyphens, collapse multiples
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_name.lower()).strip("-")
    return slug


DIR_TO_WEB_PATH = {
    "khach": "/images/tea-ceremony/khach",
    "phong-su": "/images/tea-ceremony/phong-su",
    "anh-film": "/images/tea-ceremony/anh-film",
    "truyen-thong": "/images/tea-ceremony/truyen-thong",
    "gallery": "/images/gallery",
}


def photo_web_path(face: dict) -> str:
    """Build the web-accessible path for a photo from its face entry."""
    prefix = DIR_TO_WEB_PATH.get(face.get("source_dir", ""), "/images/gallery")
    return f"{prefix}/{face['photo']}"


def pick_avatar(faces: list[dict]) -> str:
    """Pick the photo where this person's face is largest (most prominent)."""
    best = max(faces, key=lambda f: _face_area(f["location"]))
    return photo_web_path(best)


def _face_area(location: list[int]) -> int:
    top, right, bottom, left = location
    return (bottom - top) * (right - left)


def build_person_data(clusters, mapping) -> dict:
    """Build per-person data: {slug: {name, avatar, featuredPhotos, photos}}."""
    persons: dict = {}

    for cluster_key, info in mapping.items():
        if info is None:
            continue

        faces = clusters.get(cluster_key, [])
        if not faces:
            print(f"Warning: {cluster_key} has no faces, skipping")
            continue

        slug = slugify(info["name"])
        photos = sorted(set(photo_web_path(f) for f in faces))
        avatar = info.get("avatar") or pick_avatar(faces)
        featured = info.get("featuredPhotos", [])

        if slug in persons:
            existing_photos = set(persons[slug]["photos"])
            existing_photos.update(photos)
            persons[slug]["photos"] = sorted(existing_photos)
            # Merge featured photos
            existing_featured = set(persons[slug]["featuredPhotos"])
            existing_featured.update(featured)
            persons[slug]["featuredPhotos"] = sorted(existing_featured)
        else:
            person = {
                "name": info["name"],
                "avatar": avatar,
                "featuredPhotos": featured,
                "photos": photos,
            }
            if info.get("vnTitle"):
                person["vnTitle"] = info["vnTitle"]
            persons[slug] = person

    return persons


def main():
    with open(CLUSTERS_RAW_FILE) as f:
        clusters = json.load(f)

    with open(MAPPING_FILE) as f:
        mapping = json.load(f)

    persons = build_person_data(clusters, mapping)

    # Load invite groups (couples/pairs) if exists
    groups: list[dict] = []
    if GROUPS_FILE.exists():
        with open(GROUPS_FILE) as f:
            groups = json.load(f)

    grouped_slugs: set = set()
    guests: dict = {}

    # Process explicit groups (couples)
    for group in groups:
        members = group["members"]  # list of person slugs
        code = group.get("code") or "-".join(members)

        names = []
        avatar = None
        featured_photos = []
        all_photos: set = set()

        for slug in members:
            if slug not in persons:
                print(f"Warning: group member '{slug}' not found, skipping")
                continue
            p = persons[slug]
            names.append(p["name"])
            if avatar is None:
                avatar = p["avatar"]
            featured_photos.extend(p["featuredPhotos"])
            all_photos.update(p["photos"])
            grouped_slugs.add(slug)

        if names:
            entry = {
                "names": names,
                "avatar": avatar,
                "featuredPhotos": sorted(set(featured_photos)),
                "photos": sorted(all_photos),
            }
            if group.get("vnTitle"):
                entry["vnTitle"] = group["vnTitle"]
            if group.get("message"):
                entry["message"] = group["message"]
            guests[code] = entry

    # Add remaining solo guests
    # Load per-person messages from mapping
    person_messages: dict = {}
    for cluster_key, info in mapping.items():
        if info and info.get("message"):
            person_messages[slugify(info["name"])] = info["message"]

    for slug, p in persons.items():
        if slug in grouped_slugs:
            continue
        entry = {
            "names": [p["name"]],
            "avatar": p["avatar"],
            "featuredPhotos": p["featuredPhotos"],
            "photos": p["photos"],
        }
        if p.get("vnTitle"):
            entry["vnTitle"] = p["vnTitle"]
        if slug in person_messages:
            entry["message"] = person_messages[slug]
        guests[slug] = entry

    # Load existing guests.json to reuse stable IDs
    existing_ids: dict[str, str] = {}
    if GUESTS_FILE.exists():
        with open(GUESTS_FILE) as f:
            for key, data in json.load(f).items():
                if "id" in data:
                    existing_ids[key] = data["id"]

    # Assign stable UUIDs (reuse existing, generate new for new guests)
    for key, entry in guests.items():
        entry["id"] = existing_ids.get(key, str(uuid.uuid4()))

    # Ensure output directory exists
    GUESTS_FILE.parent.mkdir(parents=True, exist_ok=True)

    with open(GUESTS_FILE, "w") as f:
        json.dump(guests, f, indent=2, ensure_ascii=False)

    print(f"Generated {len(guests)} guest entries")
    for code, data in guests.items():
        names_str = " & ".join(data["names"])
        print(f"  {code}: {names_str} ({len(data['photos'])} photos)")
    print(f"\nSaved to: {GUESTS_FILE}")


if __name__ == "__main__":
    main()
