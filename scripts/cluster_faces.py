#!/usr/bin/env python3
"""Step 2: Cluster face embeddings to group same people together.

Stable cluster IDs: if clusters_raw.json and cluster_mapping.json exist,
new clusters are matched to old ones by centroid embedding similarity so
assignments survive re-clustering (even when face indices change).
"""

import argparse
import json
import shutil
from pathlib import Path

import numpy as np
from sklearn.cluster import DBSCAN

OUTPUT_DIR = Path(__file__).parent / "output"
EMBEDDINGS_FILE = OUTPUT_DIR / "embeddings.json"
CLUSTERS_DIR = OUTPUT_DIR / "clusters"
CLUSTERS_RAW_FILE = OUTPUT_DIR / "clusters_raw.json"
CENTROIDS_FILE = OUTPUT_DIR / "clusters_centroids.json"
MAPPING_FILE = Path(__file__).parent / "cluster_mapping.json"


def compute_centroid(embeddings: list[list[float]]) -> list[float]:
    """Compute L2-normalized mean embedding (centroid) for a cluster."""
    arr = np.array(embeddings)
    centroid = arr.mean(axis=0)
    norm = np.linalg.norm(centroid)
    if norm > 0:
        centroid = centroid / norm
    return centroid.tolist()


def match_clusters_by_centroid(
    old_centroids: dict[str, list[float]],
    new_centroids: dict[int, list[float]],
    threshold: float = 0.6,
) -> dict[int, str]:
    """Match new DBSCAN label -> old cluster key by centroid cosine similarity.

    Returns a mapping of new_label (int) -> old_cluster_key (str).
    Only matches with cosine similarity > threshold are kept.
    Uses greedy best-match to avoid duplicate assignments.
    """
    if not old_centroids or not new_centroids:
        return {}

    # Build similarity matrix
    old_keys = list(old_centroids.keys())
    old_vecs = np.array([old_centroids[k] for k in old_keys])
    new_labels = list(new_centroids.keys())
    new_vecs = np.array([new_centroids[l] for l in new_labels])

    # Normalize (should already be normalized, but be safe)
    old_norms = np.linalg.norm(old_vecs, axis=1, keepdims=True)
    old_vecs = old_vecs / np.maximum(old_norms, 1e-10)
    new_norms = np.linalg.norm(new_vecs, axis=1, keepdims=True)
    new_vecs = new_vecs / np.maximum(new_norms, 1e-10)

    # Cosine similarity matrix: (new x old)
    sim_matrix = new_vecs @ old_vecs.T

    matches: dict[int, str] = {}
    matched_old: set[str] = set()

    # Greedy matching: pick highest similarity pairs first
    while True:
        # Mask already matched
        for i, nl in enumerate(new_labels):
            if nl in matches:
                sim_matrix[i, :] = -1
        for j, ok in enumerate(old_keys):
            if ok in matched_old:
                sim_matrix[:, j] = -1

        best_idx = np.unravel_index(np.argmax(sim_matrix), sim_matrix.shape)
        best_sim = sim_matrix[best_idx]

        if best_sim < threshold:
            break

        new_label = new_labels[best_idx[0]]
        old_key = old_keys[best_idx[1]]
        matches[new_label] = old_key
        matched_old.add(old_key)

    return matches


def main():
    parser = argparse.ArgumentParser(description="Cluster face embeddings")
    parser.add_argument("--clean", action="store_true",
                        help="Delete all clustering state before running (full reset)")
    args = parser.parse_args()

    if args.clean:
        for path in [CLUSTERS_RAW_FILE, CENTROIDS_FILE, MAPPING_FILE]:
            if path.exists():
                path.unlink()
                print(f"Deleted {path}")
        if CLUSTERS_DIR.exists():
            shutil.rmtree(CLUSTERS_DIR)
            print(f"Deleted {CLUSTERS_DIR}")
        print()

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
    raw_group_embeddings: dict[int, list] = {}
    for i, label in enumerate(labels):
        if label not in raw_groups:
            raw_groups[label] = []
            raw_group_embeddings[label] = []
        raw_groups[label].append({
            "photo": embeddings_data[i]["photo"],
            "source_dir": embeddings_data[i]["source_dir"],
            "crop": embeddings_data[i]["crop_path"],
            "location": embeddings_data[i]["location"],
            "img_width": embeddings_data[i].get("img_width"),
            "img_height": embeddings_data[i].get("img_height"),
        })
        raw_group_embeddings[label].append(encodings[i].tolist())

    # Compute centroids for new clusters (excluding noise)
    new_centroids: dict[int, list[float]] = {}
    for label, embs in raw_group_embeddings.items():
        if label == -1:
            continue
        new_centroids[label] = compute_centroid(embs)

    # Load previous centroids for stable ID matching
    old_centroids: dict[str, list[float]] = {}
    old_mapping: dict = {}
    if CENTROIDS_FILE.exists():
        with open(CENTROIDS_FILE) as f:
            old_centroids = json.load(f)
    # Also try loading old clusters for used_nums tracking
    old_cluster_keys: set[str] = set()
    if CLUSTERS_RAW_FILE.exists():
        with open(CLUSTERS_RAW_FILE) as f:
            old_cluster_keys = set(json.load(f).keys())
    if MAPPING_FILE.exists():
        with open(MAPPING_FILE) as f:
            old_mapping = json.load(f)

    # Match new labels to old cluster keys by centroid similarity
    label_to_old_key: dict[int, str] = {}
    if old_centroids:
        label_to_old_key = match_clusters_by_centroid(old_centroids, new_centroids)

    # Find the next available cluster number
    used_nums: set[int] = set()
    for key in old_cluster_keys:
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
    centroids_out: dict[str, list[float]] = {}
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
        centroids_out[key] = new_centroids[label]

        # Carry forward mapping if it existed for this key
        if key in old_mapping:
            new_mapping[key] = old_mapping[key]

    # Save clusters (same format as before — debug_faces.py compatible)
    with open(CLUSTERS_RAW_FILE, "w") as f:
        json.dump(clusters, f, indent=2)

    # Save centroids separately for future matching
    with open(CENTROIDS_FILE, "w") as f:
        json.dump(centroids_out, f)

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
