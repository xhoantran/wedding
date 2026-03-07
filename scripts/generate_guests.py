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
    """Build per-person data keyed by cluster_key."""
    persons: dict = {}

    for cluster_key, info in mapping.items():
        if info is None:
            continue

        faces = clusters.get(cluster_key, [])
        if not faces:
            print(f"Warning: {cluster_key} has no faces, skipping")
            continue

        photos = sorted(set(photo_web_path(f) for f in faces))
        avatar = info.get("avatar") or pick_avatar(faces)
        featured = info.get("featuredPhotos", [])

        person = {
            "name": info["name"],
            "id": info.get("id", str(uuid.uuid4())),
            "avatar": avatar,
            "featuredPhotos": featured,
            "photos": photos,
        }
        if info.get("vnTitle"):
            person["vnTitle"] = info["vnTitle"]
        persons[cluster_key] = person

    return persons


def main():
    with open(CLUSTERS_RAW_FILE) as f:
        clusters = json.load(f)

    with open(MAPPING_FILE) as f:
        mapping = json.load(f)

    persons = build_person_data(clusters, mapping)

    # Build slug -> cluster_key lookup for group member resolution
    slug_to_keys: dict[str, list[str]] = {}
    for ck, p in persons.items():
        slug_to_keys.setdefault(slugify(p["name"]), []).append(ck)

    # Load invite groups (couples/pairs) if exists
    groups: list[dict] = []
    if GROUPS_FILE.exists():
        with open(GROUPS_FILE) as f:
            groups = json.load(f)

    grouped_keys: set = set()
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
            keys = slug_to_keys.get(slug, [])
            if not keys:
                print(f"Warning: group member '{slug}' not found, skipping")
                continue
            for ck in keys:
                p = persons[ck]
                names.append(p["name"])
                if avatar is None:
                    avatar = p["avatar"]
                featured_photos.extend(p["featuredPhotos"])
                all_photos.update(p["photos"])
                grouped_keys.add(ck)

        if names:
            # Use group id, or first member's id, or generate new
            member_ids = [persons[ck]["id"] for slug in members for ck in slug_to_keys.get(slug, []) if ck in persons]
            group_id = group.get("id") or (member_ids[0] if member_ids else str(uuid.uuid4()))

            entry = {
                "id": group_id,
                "names": names,
                "avatar": avatar,
                "featuredPhotos": sorted(set(featured_photos)),
                "photos": sorted(all_photos),
            }
            if group.get("vnTitle"):
                entry["vnTitle"] = group["vnTitle"]
            if group.get("message"):
                entry["message"] = group["message"]
            guests[group_id] = entry

    # Add remaining solo guests
    # Build message lookup from mapping
    person_messages: dict[str, str] = {}
    for cluster_key, info in mapping.items():
        if info and info.get("message"):
            person_messages[cluster_key] = info["message"]

    for ck, p in persons.items():
        if ck in grouped_keys:
            continue
        guest_id = p["id"]
        entry = {
            "id": guest_id,
            "names": [p["name"]],
            "avatar": p["avatar"],
            "featuredPhotos": p["featuredPhotos"],
            "photos": p["photos"],
        }
        if p.get("vnTitle"):
            entry["vnTitle"] = p["vnTitle"]
        if ck in person_messages:
            entry["message"] = person_messages[ck]
        guests[guest_id] = entry

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
