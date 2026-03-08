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

    # Load existing guests.json to preserve manually-set fields (e.g. ceremony)
    old_guests: dict = {}
    if GUESTS_FILE.exists():
        with open(GUESTS_FILE) as f:
            old_guests = json.load(f)

    # Build slug -> cluster_key lookup for group member resolution
    slug_to_keys: dict[str, list[str]] = {}
    for ck, p in persons.items():
        slug_to_keys.setdefault(slugify(p["name"]), []).append(ck)

    # Load invite groups (couples/pairs) if exists
    groups: list[dict] = []
    if GROUPS_FILE.exists():
        with open(GROUPS_FILE) as f:
            groups = json.load(f)

    guests: dict = {}

    # Build id -> cluster_key lookup for UUID-based group members
    id_to_keys: dict[str, list[str]] = {}
    for ck, p in persons.items():
        id_to_keys.setdefault(p["id"], []).append(ck)

    # Process explicit groups (couples) — creates combined group entries
    # Individual members also keep their own entries (added in the solo loop below)
    for group in groups:
        members = group["members"]  # list of person slugs or UUIDs

        names = []
        avatars = []
        featured_photos = []
        all_photos: set = set()
        member_vn_titles: list[str] = []
        member_messages: list[str] = []

        for member in members:
            # Try UUID lookup first, then slug lookup
            keys = id_to_keys.get(member) or slug_to_keys.get(member, [])
            if not keys:
                print(f"Warning: group member '{member}' not found, skipping")
                continue
            for ck in keys:
                p = persons[ck]
                names.append(p["name"])
                avatars.append(p["avatar"])
                featured_photos.extend(p["featuredPhotos"])
                all_photos.update(p["photos"])
                # Collect individual vnTitle/message for inheritance
                if p.get("vnTitle"):
                    member_vn_titles.append(p["vnTitle"])
                m_info = mapping.get(ck)
                if m_info and m_info.get("message"):
                    member_messages.append(m_info["message"])

        if names:
            # Generate stable group ID from sorted member UUIDs
            member_ids = sorted(
                persons[ck]["id"]
                for m in members
                for ck in (id_to_keys.get(m) or slug_to_keys.get(m, []))
                if ck in persons
            )
            group_id = group.get("id") or str(
                uuid.uuid5(uuid.NAMESPACE_URL, "+".join(member_ids))
            )

            entry = {
                "id": group_id,
                "names": names,
                "avatar": avatars,
                "featuredPhotos": sorted(set(featured_photos)),
                "photos": sorted(all_photos),
            }
            # Inherit vnTitle as array: group-level (split by &) > member titles
            # Always pad to match names length
            group_vn = group.get("vnTitle")
            if group_vn:
                titles = [t.strip() for t in group_vn.split("&")]
            elif member_vn_titles:
                titles = member_vn_titles
            else:
                titles = []
            # Pad with "" so vnTitle always matches names length
            while len(titles) < len(names):
                titles.insert(0, "")
            entry["vnTitle"] = titles
            # Inherit message: group-level > first member's
            message = group.get("message") or (member_messages[0] if member_messages else "")
            if message:
                entry["message"] = message
            entry["ceremony"] = True
            guests[group_id] = entry

    # Add ALL persons as individual entries (including grouped members)
    person_messages: dict[str, str] = {}
    for cluster_key, info in mapping.items():
        if info and info.get("message"):
            person_messages[cluster_key] = info["message"]

    for ck, p in persons.items():
        guest_id = p["id"]
        entry = {
            "id": guest_id,
            "names": [p["name"]],
            "avatar": [p["avatar"]],
            "featuredPhotos": p["featuredPhotos"],
            "photos": p["photos"],
        }
        entry["vnTitle"] = [p["vnTitle"]] if p.get("vnTitle") else [""]
        if ck in person_messages:
            entry["message"] = person_messages[ck]
        entry["ceremony"] = True
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
