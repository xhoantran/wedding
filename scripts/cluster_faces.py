#!/usr/bin/env python3
"""Step 2: Cluster face embeddings to group same people together.

Stable cluster IDs: if clusters_raw.json and cluster_mapping.json exist,
new clusters are matched to old ones by face overlap so assignments survive
re-clustering.
"""

import json
import shutil
from pathlib import Path

import numpy as np
from sklearn.cluster import DBSCAN

OUTPUT_DIR = Path(__file__).parent / "output"
EMBEDDINGS_FILE = OUTPUT_DIR / "embeddings.json"
CLUSTERS_DIR = OUTPUT_DIR / "clusters"
CLUSTERS_RAW_FILE = OUTPUT_DIR / "clusters_raw.json"
MAPPING_FILE = Path(__file__).parent / "cluster_mapping.json"


def face_id(face: dict) -> str:
    """Unique identifier for a face: photo + crop path."""
    return f"{face['photo']}:{face['crop']}"


def match_clusters(old_clusters: dict, new_clusters: dict) -> dict[int, str]:
    """Match new DBSCAN label -> old cluster key by face overlap.

    Returns a mapping of new_label (int) -> old_cluster_key (str).
    Only matches with >50% overlap (in either direction) are kept.
    """
    # Build old face sets: old_key -> set of face_ids
    old_face_sets: dict[str, set] = {}
    for key, faces in old_clusters.items():
        old_face_sets[key] = {face_id(f) for f in faces}

    # new_clusters here is {new_label_int: [face_dicts]}
    matches: dict[int, str] = {}
    matched_old: set[str] = set()

    # Sort new clusters by size descending (larger clusters match first)
    for new_label in sorted(new_clusters.keys(), key=lambda k: len(new_clusters[k]), reverse=True):
        new_faces = {face_id(f) for f in new_clusters[new_label]}
        best_key = None
        best_overlap = 0

        for old_key, old_faces in old_face_sets.items():
            if old_key in matched_old:
                continue
            overlap = len(new_faces & old_faces)
            if overlap > best_overlap:
                best_overlap = overlap
                best_key = old_key

        # Match if >50% overlap in either direction
        if best_key and best_overlap > 0:
            old_size = len(old_face_sets[best_key])
            new_size = len(new_faces)
            if best_overlap / max(old_size, new_size) > 0.5:
                matches[new_label] = best_key
                matched_old.add(best_key)

    return matches


def main():
    with open(EMBEDDINGS_FILE) as f:
        embeddings_data = json.load(f)

    if not embeddings_data:
        print("No embeddings found. Run detect_faces.py first.")
        return

    print(f"Loaded {len(embeddings_data)} face embeddings")

    encodings = np.array([e["encoding"] for e in embeddings_data])
    norms = np.linalg.norm(encodings, axis=1, keepdims=True)
    encodings = encodings / norms

    clustering = DBSCAN(eps=0.4, min_samples=2, metric="cosine")
    labels = clustering.fit_predict(encodings)

    # Group by raw DBSCAN label
    raw_groups: dict[int, list] = {}
    for i, label in enumerate(labels):
        if label not in raw_groups:
            raw_groups[label] = []
        raw_groups[label].append({
            "photo": embeddings_data[i]["photo"],
            "source_dir": embeddings_data[i]["source_dir"],
            "crop": embeddings_data[i]["crop_path"],
            "location": embeddings_data[i]["location"],
        })

    # Load previous clusters for stable ID matching
    old_clusters: dict = {}
    old_mapping: dict = {}
    if CLUSTERS_RAW_FILE.exists():
        with open(CLUSTERS_RAW_FILE) as f:
            old_clusters = json.load(f)
    if MAPPING_FILE.exists():
        with open(MAPPING_FILE) as f:
            old_mapping = json.load(f)

    # Match new labels to old cluster keys
    label_to_old_key: dict[int, str] = {}
    if old_clusters:
        label_to_old_key = match_clusters(old_clusters, raw_groups)

    # Find the next available cluster number
    used_nums: set[int] = set()
    for key in old_clusters:
        try:
            used_nums.add(int(key.split("_", 1)[1]))
        except (IndexError, ValueError):
            pass
    for key in label_to_old_key.values():
        try:
            used_nums.add(int(key.split("_", 1)[1]))
        except (IndexError, ValueError):
            pass
    next_num = max(used_nums, default=-1) + 1

    # Assign stable keys
    clusters: dict[str, list] = {}
    new_mapping: dict = {}
    remapped = 0
    new_count = 0

    for label, faces in sorted(raw_groups.items()):
        # Noise faces (DBSCAN label -1) always go to cluster_-1
        if label == -1:
            clusters["cluster_-1"] = faces
            if "cluster_-1" in old_mapping:
                new_mapping["cluster_-1"] = old_mapping["cluster_-1"]
            continue

        if label in label_to_old_key:
            key = label_to_old_key[label]
            remapped += 1
        else:
            key = f"cluster_{next_num}"
            next_num += 1
            new_count += 1

        clusters[key] = faces

        # Carry forward mapping if it existed for this key
        if key in old_mapping:
            new_mapping[key] = old_mapping[key]

    # Save clusters
    with open(CLUSTERS_RAW_FILE, "w") as f:
        json.dump(clusters, f, indent=2)

    # Save updated mapping (preserves old assignments, drops stale ones)
    with open(MAPPING_FILE, "w") as f:
        json.dump(new_mapping, f, indent=2, ensure_ascii=False)

    # Create cluster directories with crop copies
    if CLUSTERS_DIR.exists():
        shutil.rmtree(CLUSTERS_DIR)
    CLUSTERS_DIR.mkdir(parents=True)

    for cluster_key, faces in clusters.items():
        cluster_dir = CLUSTERS_DIR / cluster_key
        cluster_dir.mkdir()
        for face_entry in faces:
            src = OUTPUT_DIR / face_entry["crop"]
            dst = cluster_dir / Path(face_entry["crop"]).name
            if src.exists():
                shutil.copy2(src, dst)

    # Summary
    mapped_count = sum(1 for v in new_mapping.values() if v is not None)
    print(f"\nClustering complete!")
    print(f"  {len(clusters)} clusters")
    print(f"  {remapped} matched to previous clusters (assignments preserved)")
    print(f"  {new_count} new clusters")
    print(f"  {mapped_count} name assignments carried forward")
    print(f"\nReview clusters in: {CLUSTERS_DIR}")
    print(f"Next step: python scripts/debug_faces.py")


if __name__ == "__main__":
    main()
