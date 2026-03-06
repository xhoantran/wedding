#!/usr/bin/env python3
"""Step 3: Interactively assign person codes and names to face clusters."""

import json
import os
from pathlib import Path

OUTPUT_DIR = Path(__file__).parent / "output"
CLUSTERS_RAW_FILE = OUTPUT_DIR / "clusters_raw.json"
MAPPING_FILE = Path(__file__).parent / "cluster_mapping.json"


def main():
    # Load clusters
    with open(CLUSTERS_RAW_FILE) as f:
        clusters = json.load(f)

    # Load existing mapping
    mapping = {}
    if MAPPING_FILE.exists():
        with open(MAPPING_FILE) as f:
            mapping = json.load(f)

    # Filter out noise cluster
    real_clusters = {k: v for k, v in clusters.items() if k != "cluster_-1"}

    print(f"Found {len(real_clusters)} clusters to assign")
    print(f"Already mapped: {sum(1 for k in real_clusters if k in mapping)}")
    print()
    print("For each cluster, enter:")
    print("  - Person name (e.g., 'Nguyen Van A'), or")
    print("  - 'skip' to ignore this cluster, or")
    print("  - 'quit' to save and exit")
    print()

    def cluster_sort_key(item):
        # Extract number from "cluster_N" for numeric sorting
        try:
            return int(item[0].split("_", 1)[1])
        except (IndexError, ValueError):
            return float("inf")

    for cluster_key, faces in sorted(real_clusters.items(), key=cluster_sort_key):
        if cluster_key in mapping:
            existing = mapping[cluster_key]
            if existing is None:
                status = "(skipped)"
            else:
                status = f"(mapped to: {existing['name']})"
            print(f"  {cluster_key}: {len(faces)} faces {status}")
            continue

        # Show cluster info
        photos = sorted(set(f["photo"] for f in faces))
        print(f"\n--- {cluster_key} ---")
        print(f"  Faces: {len(faces)}")
        print(f"  Photos: {', '.join(photos[:5])}{'...' if len(photos) > 5 else ''}")
        print(f"  Review crops: scripts/output/clusters/{cluster_key}/")

        # Get user input
        while True:
            name = input("  Name (or skip/quit): ").strip()
            if name.lower() == "quit":
                _save(mapping)
                return
            if name.lower() == "skip":
                mapping[cluster_key] = None
                break
            if name:
                mapping[cluster_key] = {"name": name}
                break

    _save(mapping)
    print(f"\nAll clusters assigned! Next: python scripts/generate_guests.py")


def _save(mapping: dict):
    with open(MAPPING_FILE, "w") as f:
        json.dump(mapping, f, indent=2, ensure_ascii=False)
    mapped = sum(1 for v in mapping.values() if v is not None)
    print(f"\nSaved {mapped} mappings to {MAPPING_FILE}")


if __name__ == "__main__":
    main()
