#!/usr/bin/env python3
"""Debug UI for face detection + cluster assignment. Opens a local web server.

Usage:
    python scripts/debug_faces.py          # starts server on port 8888
    python scripts/debug_faces.py --port 9000
"""

import argparse
import json
import webbrowser
from collections import defaultdict
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import unquote

PROJECT_ROOT = Path(__file__).parent.parent
SCRIPTS_DIR = Path(__file__).parent
OUTPUT_DIR = SCRIPTS_DIR / "output"
EMBEDDINGS_FILE = OUTPUT_DIR / "embeddings.json"
CLUSTERS_RAW_FILE = OUTPUT_DIR / "clusters_raw.json"
MAPPING_FILE = SCRIPTS_DIR / "cluster_mapping.json"
GROUPS_FILE = SCRIPTS_DIR / "invite_groups.json"

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}

DIR_TO_WEB_PATH = {
    "khach": "/images/tea-ceremony/khach",
    "phong-su": "/images/tea-ceremony/phong-su",
    "anh-film": "/images/tea-ceremony/anh-film",
    "truyen-thong": "/images/tea-ceremony/truyen-thong",
    "gallery": "/images/gallery",
}

PHOTO_DIRS = [
    ("tea-ceremony/khach", PROJECT_ROOT / "public" / "images" / "tea-ceremony" / "khach"),
    ("tea-ceremony/phong-su", PROJECT_ROOT / "public" / "images" / "tea-ceremony" / "phong-su"),
    ("tea-ceremony/anh-film", PROJECT_ROOT / "public" / "images" / "tea-ceremony" / "anh-film"),
    ("tea-ceremony/truyen-thong", PROJECT_ROOT / "public" / "images" / "tea-ceremony" / "truyen-thong"),
    ("gallery", PROJECT_ROOT / "public" / "images" / "gallery"),
]


def build_photos_data():
    embeddings = []
    if EMBEDDINGS_FILE.exists():
        with open(EMBEDDINGS_FILE) as f:
            embeddings = json.load(f)

    faces_by_photo: dict[str, list] = defaultdict(list)
    for e in embeddings:
        faces_by_photo[e["photo"]].append({
            "location": e["location"],
            "score": round(e["det_score"], 3),
            "crop": e["crop_path"],
        })

    photos = []
    for label, dir_path in PHOTO_DIRS:
        if not dir_path.exists():
            continue
        for p in sorted(dir_path.iterdir()):
            if p.suffix.lower() in IMAGE_EXTENSIONS:
                faces = faces_by_photo.get(p.name, [])
                photos.append({
                    "name": p.name,
                    "folder": label,
                    "path": f"/images/{label}/{p.name}" if label != "gallery" else f"/images/gallery/{p.name}",
                    "faces": faces,
                    "faceCount": len(faces),
                })
    return photos


def build_clusters_data():
    clusters = {}
    if CLUSTERS_RAW_FILE.exists():
        with open(CLUSTERS_RAW_FILE) as f:
            clusters = json.load(f)

    mapping = {}
    if MAPPING_FILE.exists():
        with open(MAPPING_FILE) as f:
            mapping = json.load(f)

    result = []
    for key, faces in clusters.items():
        num = -1
        try:
            num = int(key.split("_", 1)[1])
        except (IndexError, ValueError):
            pass

        # Build web paths for each photo
        photo_web_paths = sorted(set(
            f"{DIR_TO_WEB_PATH.get(f.get('source_dir', ''), '/images/gallery')}/{f['photo']}"
            for f in faces
        ))

        if num == -1:
            # Keep noise as one entry
            result.append({
                "key": key,
                "num": num,
                "faces": faces,
                "faceCount": len(faces),
                "photos": sorted(set(f["photo"] for f in faces)),
                "photoWebPaths": photo_web_paths,
                "name": None,
                "message": "",
                "skipped": False,
                "avatar": None,
                "featuredPhotos": [],
            })
            continue

        m = mapping.get(key)
        result.append({
            "key": key,
            "num": num,
            "faces": faces,
            "faceCount": len(faces),
            "photos": sorted(set(f["photo"] for f in faces)),
            "photoWebPaths": photo_web_paths,
            "name": m["name"] if m else None,
            "message": m.get("message", "") if m else "",
            "vnTitle": m.get("vnTitle", "") if m else "",
            "id": m.get("id", "") if m else "",
            "skipped": m is None and key in mapping,
            "avatar": m.get("avatar") if m else None,
            "featuredPhotos": m.get("featuredPhotos", []) if m else [],
        })

    result.sort(key=lambda c: (0 if c["num"] >= 0 else 1, c["num"]))
    return result


def build_groups_data():
    """Load invite groups and resolve member details from cluster mapping."""
    groups = []
    if GROUPS_FILE.exists():
        with open(GROUPS_FILE) as f:
            groups = json.load(f)

    mapping = {}
    if MAPPING_FILE.exists():
        with open(MAPPING_FILE) as f:
            mapping = json.load(f)

    # Build UUID -> {id, name, avatar} lookup from assigned clusters
    id_lookup: dict[str, dict] = {}
    for _key, info in mapping.items():
        if info is None:
            continue
        pid = info.get("id", "")
        if pid:
            id_lookup[pid] = {
                "id": pid,
                "name": info.get("name", ""),
                "avatar": info.get("avatar", ""),
            }

    resolved = []
    for group in groups:
        members_detail = []
        for mid in group.get("members", []):
            detail = id_lookup.get(mid)
            if detail:
                members_detail.append(detail)
            else:
                members_detail.append({"id": mid, "name": mid[:8] + "…", "avatar": ""})
        resolved.append({
            "members": group.get("members", []),
            "memberDetails": members_detail,
            "vnTitle": group.get("vnTitle", ""),
            "message": group.get("message", ""),
        })
    return resolved


def build_assigned_clusters_list():
    """Build list of assigned clusters with id/name/avatar for the groups UI."""
    mapping = {}
    if MAPPING_FILE.exists():
        with open(MAPPING_FILE) as f:
            mapping = json.load(f)

    clusters_raw = {}
    if CLUSTERS_RAW_FILE.exists():
        with open(CLUSTERS_RAW_FILE) as f:
            clusters_raw = json.load(f)

    result = []
    for key, info in mapping.items():
        if info is None:
            continue
        pid = info.get("id", "")
        if not pid:
            continue

        # Get avatar: use explicit avatar or pick largest face
        avatar = info.get("avatar", "")
        if not avatar:
            faces = clusters_raw.get(key, [])
            if faces:
                best = max(faces, key=lambda f: _face_area(f["location"]))
                source_dir = best.get("source_dir", "")
                prefix = DIR_TO_WEB_PATH.get(source_dir, "/images/gallery")
                avatar = f"{prefix}/{best['photo']}"

        result.append({
            "id": pid,
            "name": info.get("name", ""),
            "avatar": avatar,
        })

    result.sort(key=lambda c: c["name"].lower())
    return result


def _face_area(location: list[int]) -> int:
    top, right, bottom, left = location
    return (bottom - top) * (right - left)


HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Face Detection Debug</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #1a1a1a; color: #eee; padding: 20px; }
  h1 { margin-bottom: 10px; }

  /* Tabs */
  .tabs { display: flex; gap: 0; margin-bottom: 20px; border-bottom: 2px solid #333; }
  .tab { padding: 10px 24px; cursor: pointer; border: 2px solid transparent; border-bottom: none; border-radius: 8px 8px 0 0; font-size: 14px; font-weight: 600; color: #888; }
  .tab:hover { color: #ccc; }
  .tab.active { color: #eee; background: #2a2a2a; border-color: #333; margin-bottom: -2px; border-bottom: 2px solid #2a2a2a; }
  .tab-content { display: none; }
  .tab-content.active { display: block; }

  .stats { margin-bottom: 20px; color: #aaa; font-size: 14px; }
  .filters { margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
  .filters button, .btn { padding: 8px 16px; border: 1px solid #444; background: #2a2a2a; color: #eee; border-radius: 6px; cursor: pointer; font-size: 13px; }
  .filters button.active, .btn.active { background: #4a7c59; border-color: #6a9c79; }
  .filters button:hover, .btn:hover { background: #3a3a3a; }
  .btn.save { background: #2563eb; border-color: #3b82f6; }
  .btn.save:hover { background: #1d4ed8; }
  .btn.danger { background: #991b1b; border-color: #c44; }
  .btn.danger:hover { background: #7f1d1d; }

  /* Photos grid */
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
  .card { background: #2a2a2a; border-radius: 8px; overflow: hidden; border: 2px solid transparent; }
  .card.no-faces { border-color: #c44; }
  .card.has-faces { border-color: #4a7c59; }
  .photo-container { position: relative; width: 100%; cursor: pointer; }
  .photo-container img { width: 100%; display: block; }
  .face-box { position: absolute; border: 2px solid #0f0; pointer-events: none; }
  .face-box .score { position: absolute; top: -18px; left: 0; background: #0f0; color: #000; font-size: 10px; padding: 1px 4px; white-space: nowrap; }
  .face-box.low-score { border-color: #fa0; }
  .face-box.low-score .score { background: #fa0; }
  .card-info { padding: 10px; font-size: 12px; }
  .card-info .name { font-weight: 600; margin-bottom: 4px; word-break: break-all; }
  .card-info .folder { color: #888; }
  .card-info .face-count { color: #0f0; }
  .card-info .face-count.zero { color: #c44; }
  .search { padding: 8px 16px; border: 1px solid #444; background: #2a2a2a; color: #eee; border-radius: 6px; font-size: 13px; width: 200px; }

  /* Clusters */
  .cluster-list { display: flex; flex-direction: column; gap: 16px; }
  .cluster-card { background: #2a2a2a; border-radius: 8px; padding: 16px; border: 2px solid #333; }
  .cluster-card.assigned { border-color: #4a7c59; }
  .cluster-card.skipped { border-color: #666; opacity: 0.5; }
  .cluster-card.noise { border-color: #c44; }
  .cluster-card.merge-selected { border-color: #f59e0b; box-shadow: 0 0 0 2px #f59e0b44; }
  .cluster-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
  .cluster-header h3 { font-size: 16px; min-width: 100px; }
  .cluster-header .badge { font-size: 11px; padding: 2px 8px; border-radius: 10px; background: #444; }
  .cluster-header .badge.assigned-badge { background: #4a7c59; }
  .cluster-header .badge.skipped-badge { background: #666; }
  .cluster-crops { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
  .cluster-crops img { width: 80px; height: 80px; object-fit: cover; border-radius: 6px; border: 2px solid #444; cursor: pointer; }
  .cluster-crops img:hover { border-color: #888; }
  .cluster-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .cluster-actions input { padding: 6px 12px; border: 1px solid #444; background: #1a1a1a; color: #eee; border-radius: 6px; font-size: 13px; width: 200px; }
  .cluster-actions .btn { padding: 6px 14px; font-size: 12px; }
  .cluster-photos { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; padding-top: 10px; border-top: 1px solid #333; }
  .photo-thumb-wrap { position: relative; display: inline-block; }
  .photo-thumb-wrap img { height: 120px; object-fit: cover; border-radius: 4px; cursor: pointer; border: 3px solid transparent; }
  .photo-thumb-wrap.is-avatar img { border-color: #3b82f6; }
  .photo-thumb-wrap.is-featured img { border-color: #f59e0b; }
  .photo-thumb-wrap.is-avatar.is-featured img { border-color: #f59e0b; box-shadow: 0 0 0 2px #3b82f6; }
  .photo-overlay-btns { position: absolute; top: 4px; left: 4px; right: 4px; display: flex; justify-content: space-between; pointer-events: none; }
  .photo-overlay-btns button { pointer-events: auto; width: 26px; height: 26px; border: none; border-radius: 50%; cursor: pointer; font-size: 14px; line-height: 26px; text-align: center; opacity: 0.7; transition: opacity 0.15s; }
  .photo-overlay-btns button:hover { opacity: 1; }
  .avatar-btn { background: #1e3a5f; color: #60a5fa; }
  .avatar-btn.active { background: #3b82f6; color: #fff; opacity: 1 !important; }
  .star-btn { background: #5c4a1e; color: #fbbf24; }
  .star-btn.active { background: #f59e0b; color: #fff; opacity: 1 !important; }

  /* Noise rows */
  .noise-list { display: flex; flex-direction: column; gap: 8px; }
  .noise-row { display: flex; align-items: center; gap: 8px; padding: 6px; background: #1a1a1a; border-radius: 6px; }
  .noise-thumb { width: 60px; height: 60px; object-fit: cover; border-radius: 4px; border: 2px solid #c44; cursor: pointer; flex-shrink: 0; }
  .noise-thumb:hover { border-color: #f66; }
  .noise-photo { color: #888; font-size: 11px; min-width: 120px; }

  /* Toast */
  .toast { position: fixed; bottom: 20px; right: 20px; padding: 12px 24px; border-radius: 8px; font-size: 14px; z-index: 200; opacity: 0; transition: opacity 0.3s; pointer-events: none; }
  .toast.show { opacity: 1; }
  .toast.success { background: #166534; color: #fff; }
  .toast.error { background: #991b1b; color: #fff; }

  /* Modal */
  .modal { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 100; overflow: auto; padding: 20px; }
  .modal.open { display: flex; align-items: center; justify-content: center; flex-direction: column; }
  .modal img { max-width: 95vw; max-height: 85vh; object-fit: contain; }
  .modal .close { position: fixed; top: 20px; right: 20px; color: #fff; font-size: 30px; cursor: pointer; z-index: 101; }
  .modal .crops { display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap; }
  .modal .crops img { width: 100px; height: 100px; object-fit: cover; border-radius: 6px; border: 2px solid #444; }

  /* Groups */
  .group-card { background: #2a2a2a; border-radius: 8px; padding: 16px; border: 2px solid #333; display: flex; align-items: center; gap: 16px; }
  .group-card .group-avatars { display: flex; flex-shrink: 0; }
  .group-card .group-avatars img { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 2px solid #1a1a1a; margin-left: -10px; }
  .group-card .group-avatars img:first-child { margin-left: 0; }
  .group-card .group-info { flex: 1; min-width: 0; }
  .group-card .group-names { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
  .group-card .group-fields { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 6px; }
  .group-card .group-fields input { padding: 4px 10px; border: 1px solid #444; background: #1a1a1a; color: #eee; border-radius: 4px; font-size: 12px; width: 200px; }
  .group-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; }
  .member-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; margin-bottom: 16px; }
  .member-card { display: flex; align-items: center; gap: 8px; padding: 8px; background: #2a2a2a; border: 2px solid #444; border-radius: 8px; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
  .member-card:hover { border-color: #666; }
  .member-card.selected { border-color: #4a7c59; background: #2a3a2e; }
  .member-card.disabled { opacity: 0.35; cursor: not-allowed; pointer-events: none; }
  .member-card img { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
  .member-card .member-name { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .member-card .member-check { margin-left: auto; color: #4a7c59; font-size: 16px; flex-shrink: 0; }

  /* Merge bar */
  .merge-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #2a2a2a; border-top: 2px solid #f59e0b; padding: 12px 20px; display: none; z-index: 50; align-items: center; gap: 12px; }
  .merge-bar.show { display: flex; }
  .merge-bar .merge-info { flex: 1; font-size: 13px; }
</style>
</head>
<body>
<h1>Face Detection Debug</h1>
<div class="tabs">
  <div class="tab active" data-tab="photos">Photos</div>
  <div class="tab" data-tab="clusters">Clusters</div>
  <div class="tab" data-tab="groups">Groups</div>
</div>

<!-- PHOTOS TAB -->
<div class="tab-content active" id="tab-photos">
  <div class="stats" id="photo-stats"></div>
  <div class="filters">
    <button class="active" data-filter="all">All</button>
    <button data-filter="no-faces">No Faces</button>
    <button data-filter="has-faces">Has Faces</button>
    <input type="text" class="search" placeholder="Search filename..." id="search">
    <select class="search" id="folder-filter"><option value="all">All Folders</option></select>
    <label style="display:flex;align-items:center;gap:6px;font-size:13px;">
      <input type="range" id="min-score" min="0" max="1" step="0.05" value="0.5" style="width:100px;">
      Min score: <span id="score-val">0.5</span>
    </label>
  </div>
  <div class="grid" id="photo-grid"></div>
</div>

<!-- CLUSTERS TAB -->
<div class="tab-content" id="tab-clusters">
  <div class="stats" id="cluster-stats"></div>
  <div class="filters" id="cluster-filters">
    <button class="active" data-cfilter="all">All</button>
    <button data-cfilter="unassigned">Unassigned</button>
    <button data-cfilter="assigned">Assigned</button>
    <button data-cfilter="skipped">Skipped</button>
    <button data-cfilter="noise">Noise</button>
    <input type="text" class="search" placeholder="Search name..." id="cluster-search">
    <button class="btn" id="merge-mode-btn" onclick="toggleMergeMode()">Merge Mode</button>
    <button class="btn save" onclick="saveMapping()">Save All</button>
  </div>
  <div class="cluster-list" id="cluster-list"></div>
</div>

<!-- GROUPS TAB -->
<div class="tab-content" id="tab-groups">
  <div class="stats" id="group-stats"></div>
  <div id="group-list" class="group-list"></div>
  <h3 style="margin: 16px 0 8px; font-size: 15px;">Create Group</h3>
  <p style="font-size: 12px; color: #888; margin-bottom: 10px;">Select 2 or more assigned guests to group into a single invite:</p>
  <div id="member-grid" class="member-grid"></div>
  <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
    <input type="text" class="search" id="group-vntitle" placeholder="VN Title (optional)" style="width:200px;">
    <input type="text" class="search" id="group-message" placeholder="Message (optional)" style="width:300px;">
    <button class="btn save" id="create-group-btn" onclick="createGroup()">Create Group</button>
  </div>
</div>

<!-- Merge bar -->
<div class="merge-bar" id="merge-bar">
  <div class="merge-info">
    <strong>Merge Mode:</strong> Click clusters to select, then merge them into one.
    Selected: <span id="merge-count">0</span>
  </div>
  <button class="btn" onclick="executeMerge()">Merge Selected</button>
  <button class="btn danger" onclick="toggleMergeMode()">Cancel</button>
</div>

<!-- Modal -->
<div class="modal" id="modal">
  <span class="close" onclick="closeModal()">&times;</span>
  <img id="modal-img">
  <div class="crops" id="modal-crops"></div>
</div>

<!-- Toast -->
<div class="toast" id="toast"></div>

<script>
const PHOTOS = __PHOTOS_JSON__;
let CLUSTERS = __CLUSTERS_JSON__;

// ---- State ----
let photoFilter = 'all';
let photoSearch = '';
let folderFilter = 'all';
let minScore = 0.5;
let clusterFilter = 'all';
let clusterSearch = '';
let mergeMode = false;
let mergeSelected = new Set();

// ---- Tabs ----
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

// ---- Photos Tab ----
const folders = [...new Set(PHOTOS.map(p => p.folder))];
const folderSelect = document.getElementById('folder-filter');
folders.forEach(f => {
  const opt = document.createElement('option');
  opt.value = f; opt.textContent = f;
  folderSelect.appendChild(opt);
});

function renderPhotos() {
  const grid = document.getElementById('photo-grid');
  const filtered = PHOTOS.filter(p => {
    const vf = p.faces.filter(f => f.score >= minScore);
    const mf = photoFilter === 'all' || (photoFilter === 'no-faces' && vf.length === 0) || (photoFilter === 'has-faces' && vf.length > 0);
    const ms = !photoSearch || p.name.toLowerCase().includes(photoSearch.toLowerCase());
    const mfo = folderFilter === 'all' || p.folder === folderFilter;
    return mf && ms && mfo;
  });

  const totalFaces = PHOTOS.reduce((s, p) => s + p.faces.filter(f => f.score >= minScore).length, 0);
  const noFace = PHOTOS.filter(p => p.faces.filter(f => f.score >= minScore).length === 0).length;
  document.getElementById('photo-stats').textContent =
    `${PHOTOS.length} photos | ${totalFaces} faces | ${noFace} with no faces | Showing ${filtered.length}`;

  grid.innerHTML = filtered.map(p => {
    const vf = p.faces.filter(f => f.score >= minScore);
    const cls = vf.length === 0 ? 'no-faces' : 'has-faces';
    const cc = vf.length === 0 ? 'zero' : '';
    return `
      <div class="card ${cls}">
        <div class="photo-container" onclick="openModal('${p.path}', ${JSON.stringify(vf).replace(/"/g, '&quot;')})">
          <img src="${p.path}" loading="lazy" onload="drawBoxes(this, ${JSON.stringify(vf).replace(/"/g, '&quot;')})">
        </div>
        <div class="card-info">
          <div class="name">${p.name}</div>
          <div class="folder">${p.folder}</div>
          <div class="face-count ${cc}">${vf.length} face${vf.length !== 1 ? 's' : ''}</div>
        </div>
      </div>`;
  }).join('');
}

function drawBoxes(img, faces) {
  const c = img.parentElement;
  c.querySelectorAll('.face-box').forEach(b => b.remove());
  const sx = img.clientWidth / img.naturalWidth;
  const sy = img.clientHeight / img.naturalHeight;
  faces.forEach(f => {
    const [top, right, bottom, left] = f.location;
    const box = document.createElement('div');
    box.className = 'face-box' + (f.score < 0.7 ? ' low-score' : '');
    box.style.left = (left * sx) + 'px'; box.style.top = (top * sy) + 'px';
    box.style.width = ((right - left) * sx) + 'px'; box.style.height = ((bottom - top) * sy) + 'px';
    box.innerHTML = `<span class="score">${f.score}</span>`;
    c.appendChild(box);
  });
}

document.querySelectorAll('#tab-photos .filters button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#tab-photos .filters button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    photoFilter = btn.dataset.filter;
    renderPhotos();
  });
});
document.getElementById('search').addEventListener('input', e => { photoSearch = e.target.value; renderPhotos(); });
document.getElementById('folder-filter').addEventListener('change', e => { folderFilter = e.target.value; renderPhotos(); });
document.getElementById('min-score').addEventListener('input', e => {
  minScore = parseFloat(e.target.value);
  document.getElementById('score-val').textContent = minScore;
  renderPhotos();
});

// ---- Clusters Tab ----
function renderClusters() {
  const list = document.getElementById('cluster-list');
  const filtered = CLUSTERS.filter(c => {
    if (clusterFilter === 'noise') return c.num === -1;
    if (c.num === -1 && clusterFilter !== 'all') return false;
    if (clusterFilter === 'unassigned') return !c.name && !c.skipped;
    if (clusterFilter === 'assigned') return !!c.name;
    if (clusterFilter === 'skipped') return c.skipped;
    return true;
  }).filter(c => {
    if (!clusterSearch) return true;
    const s = clusterSearch.toLowerCase();
    return (c.name && c.name.toLowerCase().includes(s)) || c.key.includes(s);
  });

  const total = CLUSTERS.filter(c => c.num !== -1).length;
  const assigned = CLUSTERS.filter(c => c.name).length;
  const skipped = CLUSTERS.filter(c => c.skipped).length;
  const unassigned = total - assigned - skipped;
  const noise = CLUSTERS.filter(c => c.num === -1).length;
  document.getElementById('cluster-stats').textContent =
    `${total} clusters | ${assigned} assigned | ${unassigned} unassigned | ${skipped} skipped | ${noise ? noise + ' noise faces' : ''}`;

  // Build cluster options for "Add to" dropdown
  const clusterOptions = CLUSTERS
    .filter(c => c.num !== -1)
    .map(c => `<option value="${c.key}">${c.key}${c.name ? ' (' + c.name + ')' : ''}</option>`)
    .join('');

  list.innerHTML = filtered.map(c => {
    let cls = 'cluster-card';
    if (c.num === -1) cls += ' noise';
    else if (c.name) cls += ' assigned';
    else if (c.skipped) cls += ' skipped';
    if (mergeMode && mergeSelected.has(c.key)) cls += ' merge-selected';

    let badge = '';
    if (c.name) badge = `<span class="badge assigned-badge">${c.name}</span>`;
    else if (c.skipped) badge = '<span class="badge skipped-badge">skipped</span>';

    const mergeClick = mergeMode ? `onclick="toggleMergeSelect('${c.key}')"` : '';

    const crops = c.faces.map(f =>
      `<img src="/crops/${f.crop}" title="${f.photo}" onclick="event.stopPropagation(); showClusterPhoto('${c.key}', '${f.photo}')">`
    ).join('');

    const nameVal = c.name ? c.name.replace(/"/g, '&quot;') : '';
    const vnTitleVal = c.vnTitle ? c.vnTitle.replace(/"/g, '&quot;') : '';
    const msgVal = c.message ? c.message.replace(/"/g, '&quot;') : '';

    // Noise: show each face individually with its own actions
    if (c.num === -1) {
      const noiseRows = c.faces.map(f => {
        const cropId = f.crop;
        const safeId = cropId.replace(/[^a-zA-Z0-9]/g, '_');
        return `
          <div class="noise-row" id="noise-${safeId}">
            <img src="/crops/${f.crop}" title="${f.photo}" class="noise-thumb"
              onclick="showClusterPhoto('${c.key}', '${f.photo}')">
            <span class="noise-photo">${f.photo}</span>
            <button class="btn" onclick="promoteNoise('${cropId}')">New Cluster</button>
            <select class="search" id="addto-${safeId}" style="width:200px">
              <option value="">Add to cluster...</option>
              ${clusterOptions}
            </select>
            <button class="btn" onclick="addNoiseToCluster('${cropId}', document.getElementById('addto-${safeId}').value)">Add</button>
          </div>`;
      }).join('');

      return `
        <div class="${cls}" id="cluster-${c.key}">
          <div class="cluster-header">
            <h3>Noise</h3>
            <span class="badge" style="background:#c44">${c.faceCount} unclustered faces</span>
          </div>
          <div class="noise-list">${noiseRows}</div>
        </div>`;
    }

    // Build merge options excluding self
    const mergeOptions = CLUSTERS
      .filter(x => x.num !== -1 && x.key !== c.key)
      .map(x => `<option value="${x.key}">${x.key}${x.name ? ' (' + x.name + ')' : ''}</option>`)
      .join('');

    // Build photo grid with avatar/star buttons
    const photoThumbs = (c.photoWebPaths || []).map(wp => {
      const isAvatar = c.avatar === wp;
      const isFeatured = (c.featuredPhotos || []).includes(wp);
      const wrapCls = 'photo-thumb-wrap' + (isAvatar ? ' is-avatar' : '') + (isFeatured ? ' is-featured' : '');
      const safeWp = wp.replace(/'/g, "\\\\'");
      return `
        <div class="${wrapCls}">
          <img src="${wp}" loading="lazy" onclick="event.stopPropagation(); openModal('${wp}', [])">
          <div class="photo-overlay-btns">
            <button class="avatar-btn${isAvatar ? ' active' : ''}" title="Set as avatar" onclick="event.stopPropagation(); setAvatar('${c.key}', '${safeWp}')">&#x1F464;</button>
            <button class="star-btn${isFeatured ? ' active' : ''}" title="Toggle featured" onclick="event.stopPropagation(); toggleFeatured('${c.key}', '${safeWp}')">&#x2605;</button>
          </div>
        </div>`;
    }).join('');

    return `
      <div class="${cls}" id="cluster-${c.key}" ${mergeClick}>
        <div class="cluster-header">
          <h3>${c.key}</h3>
          ${badge}
          <span style="color:#888;font-size:12px">${c.faceCount} faces · ${c.photos.length} photos</span>
        </div>
        <div class="cluster-crops">${crops}</div>
        <div class="cluster-actions">
          <input type="text" placeholder="Name..." value="${nameVal}" id="name-${c.key}" onkeydown="if(event.key==='Enter')assignCluster('${c.key}')">
          <input type="text" placeholder="VN Title (e.g. Bác Xuân Anh)..." value="${vnTitleVal}" id="vntitle-${c.key}" style="width:220px" onkeydown="if(event.key==='Enter')assignCluster('${c.key}')">
          <input type="text" placeholder="Message (optional)" value="${msgVal}" id="msg-${c.key}" style="width:300px" onkeydown="if(event.key==='Enter')assignCluster('${c.key}')">
          <button class="btn" onclick="assignCluster('${c.key}')">Assign</button>
          <button class="btn danger" onclick="skipCluster('${c.key}')">Skip</button>
          <select class="search" id="mergeto-${c.key}" style="width:200px">
            <option value="">Merge into...</option>
            ${mergeOptions}
          </select>
          <button class="btn" onclick="inlineMerge('${c.key}', document.getElementById('mergeto-${c.key}').value)">Merge</button>
        </div>
        <div class="cluster-photos">${photoThumbs}</div>
      </div>`;
  }).join('');
}

function buildMapping() {
  const mapping = {};
  CLUSTERS.forEach(c => {
    if (c.num === -1) return;
    if (c.skipped) { mapping[c.key] = null; }
    else if (c.name) {
      const entry = { name: c.name, id: c.id };
      if (c.vnTitle) entry.vnTitle = c.vnTitle;
      if (c.message) entry.message = c.message;
      if (c.avatar) entry.avatar = c.avatar;
      if (c.featuredPhotos && c.featuredPhotos.length > 0) entry.featuredPhotos = c.featuredPhotos;
      mapping[c.key] = entry;
    }
  });
  return mapping;
}

async function setAvatar(key, photoWebPath) {
  const c = CLUSTERS.find(c => c.key === key);
  if (!c) return;
  c.avatar = (c.avatar === photoWebPath) ? null : photoWebPath;
  renderClusters();
  if (await persistMapping()) {
    toast(c.avatar ? 'Avatar set' : 'Avatar cleared', 'success');
  } else {
    toast('Save failed!', 'error');
  }
}

async function toggleFeatured(key, photoWebPath) {
  const c = CLUSTERS.find(c => c.key === key);
  if (!c) return;
  if (!c.featuredPhotos) c.featuredPhotos = [];
  const idx = c.featuredPhotos.indexOf(photoWebPath);
  if (idx >= 0) {
    c.featuredPhotos.splice(idx, 1);
  } else {
    c.featuredPhotos.push(photoWebPath);
  }
  renderClusters();
  if (await persistMapping()) {
    toast(idx >= 0 ? 'Removed from featured' : 'Added to featured', 'success');
  } else {
    toast('Save failed!', 'error');
  }
}

async function persistMapping() {
  const resp = await fetch('/api/save-mapping', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildMapping()),
  });
  return resp.ok;
}

async function assignCluster(key) {
  const name = document.getElementById('name-' + key).value.trim();
  if (!name) return;
  const vnTitle = document.getElementById('vntitle-' + key).value.trim();
  const message = document.getElementById('msg-' + key).value.trim();
  const c = CLUSTERS.find(c => c.key === key);
  if (c) {
    c.name = name; c.vnTitle = vnTitle; c.message = message; c.skipped = false;
    if (!c.id) c.id = crypto.randomUUID();
  }
  renderClusters();
  if (await persistMapping()) {
    toast('Assigned: ' + name, 'success');
  } else {
    toast('Save failed!', 'error');
  }
}

async function skipCluster(key) {
  const c = CLUSTERS.find(c => c.key === key);
  if (c) { c.name = null; c.vnTitle = ''; c.message = ''; c.skipped = true; }
  renderClusters();
  if (await persistMapping()) {
    toast('Skipped ' + key, 'success');
  } else {
    toast('Save failed!', 'error');
  }
}

async function saveMapping() {
  if (await persistMapping()) {
    toast('Mapping saved!', 'success');
  } else {
    toast('Save failed!', 'error');
  }
}

// ---- Merge ----
function toggleMergeMode() {
  mergeMode = !mergeMode;
  mergeSelected.clear();
  document.getElementById('merge-mode-btn').classList.toggle('active', mergeMode);
  document.getElementById('merge-bar').classList.toggle('show', mergeMode);
  document.getElementById('merge-count').textContent = '0';
  renderClusters();
}

function toggleMergeSelect(key) {
  if (!mergeMode) return;
  if (mergeSelected.has(key)) mergeSelected.delete(key);
  else mergeSelected.add(key);
  document.getElementById('merge-count').textContent = mergeSelected.size;
  renderClusters();
}

async function executeMerge() {
  if (mergeSelected.size < 2) { toast('Select at least 2 clusters', 'error'); return; }

  const keys = [...mergeSelected].sort((a, b) => {
    const na = parseInt(a.split('_')[1]); const nb = parseInt(b.split('_')[1]);
    return na - nb;
  });

  const resp = await fetch('/api/merge-clusters', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clusters: keys }),
  });

  if (resp.ok) {
    const data = await resp.json();
    // Update local state: merge into first cluster
    const target = keys[0];
    const targetCluster = CLUSTERS.find(c => c.key === target);
    const mergedFaces = [];
    const mergedPhotos = new Set();

    keys.forEach(k => {
      const c = CLUSTERS.find(c => c.key === k);
      if (c) {
        mergedFaces.push(...c.faces);
        c.photos.forEach(p => mergedPhotos.add(p));
      }
    });

    targetCluster.faces = mergedFaces;
    targetCluster.faceCount = mergedFaces.length;
    targetCluster.photos = [...mergedPhotos].sort();

    // Remove merged clusters (except target)
    CLUSTERS = CLUSTERS.filter(c => c.key === target || !keys.includes(c.key));

    toggleMergeMode();
    toast(`Merged ${keys.length} clusters into ${target}`, 'success');
  } else {
    toast('Merge failed!', 'error');
  }
}

// ---- Inline merge: merge this cluster into another ----
async function inlineMerge(sourceKey, targetKey) {
  if (!targetKey) { toast('Select a target cluster', 'error'); return; }
  const resp = await fetch('/api/merge-clusters', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clusters: [targetKey, sourceKey] }),
  });
  if (resp.ok) {
    const source = CLUSTERS.find(c => c.key === sourceKey);
    const target = CLUSTERS.find(c => c.key === targetKey);
    if (source && target) {
      target.faces.push(...source.faces);
      target.faceCount = target.faces.length;
      target.photos = [...new Set([...target.photos, ...source.photos])].sort();
      CLUSTERS = CLUSTERS.filter(c => c.key !== sourceKey);
    }
    renderClusters();
    toast(`Merged ${sourceKey} into ${targetKey}`, 'success');
  } else {
    toast('Merge failed!', 'error');
  }
}

// ---- Noise: promote to new cluster ----
async function promoteNoise(cropId) {
  const resp = await fetch('/api/promote-noise', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cropId }),
  });
  if (resp.ok) {
    const data = await resp.json();
    const noise = CLUSTERS.find(c => c.num === -1);
    if (noise) {
      const face = noise.faces.find(f => f.crop === cropId);
      if (face) {
        noise.faces = noise.faces.filter(f => f.crop !== cropId);
        noise.faceCount = noise.faces.length;
        if (noise.faceCount === 0) {
          CLUSTERS = CLUSTERS.filter(c => c.num !== -1);
        }
        CLUSTERS.push({
          key: data.newKey, num: parseInt(data.newKey.split('_')[1]),
          faces: [face], faceCount: 1, photos: [face.photo],
          name: null, message: '', skipped: false,
        });
        CLUSTERS.sort((a, b) => (a.num >= 0 ? 0 : 1) - (b.num >= 0 ? 0 : 1) || a.num - b.num);
      }
    }
    renderClusters();
    toast(`Created ${data.newKey}`, 'success');
  } else {
    toast('Promote failed!', 'error');
  }
}

// ---- Noise: add to existing cluster ----
async function addNoiseToCluster(cropId, targetKey) {
  if (!targetKey) { toast('Select a cluster first', 'error'); return; }
  const resp = await fetch('/api/add-noise-to-cluster', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cropId, targetKey }),
  });
  if (resp.ok) {
    const noise = CLUSTERS.find(c => c.num === -1);
    const target = CLUSTERS.find(c => c.key === targetKey);
    if (noise && target) {
      const face = noise.faces.find(f => f.crop === cropId);
      if (face) {
        noise.faces = noise.faces.filter(f => f.crop !== cropId);
        noise.faceCount = noise.faces.length;
        if (noise.faceCount === 0) {
          CLUSTERS = CLUSTERS.filter(c => c.num !== -1);
        }
        target.faces.push(face);
        target.faceCount = target.faces.length;
        target.photos = [...new Set([...target.photos, face.photo])].sort();
      }
    }
    renderClusters();
    toast(`Added to ${targetKey}`, 'success');
  } else {
    toast('Add failed!', 'error');
  }
}

// ---- Show photo from cluster ----
function showClusterPhoto(clusterKey, photoName) {
  // Find the photo path
  const photo = PHOTOS.find(p => p.name === photoName);
  if (photo) {
    openModal(photo.path, photo.faces);
  }
}

// ---- Cluster filters ----
document.querySelectorAll('#cluster-filters button[data-cfilter]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#cluster-filters button[data-cfilter]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    clusterFilter = btn.dataset.cfilter;
    renderClusters();
  });
});
document.getElementById('cluster-search').addEventListener('input', e => { clusterSearch = e.target.value; renderClusters(); });

// ---- Modal ----
function openModal(path, faces) {
  document.getElementById('modal-img').src = path;
  document.getElementById('modal-crops').innerHTML = (faces || []).map(f =>
    `<img src="/crops/${f.crop}" title="Score: ${f.score}">`
  ).join('');
  document.getElementById('modal').classList.add('open');
}
function closeModal() { document.getElementById('modal').classList.remove('open'); }
document.getElementById('modal').addEventListener('click', e => { if (e.target === document.getElementById('modal')) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ---- Toast ----
function toast(msg, type) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show ' + type;
  setTimeout(() => el.className = 'toast', 2000);
}

// ---- Groups Tab ----
let GROUPS = __GROUPS_JSON__;
const ASSIGNED_CLUSTERS = __ASSIGNED_CLUSTERS_JSON__;
let groupSelected = new Set();
let groupSaveTimeout = null;

function renderGroups() {
  const list = document.getElementById('group-list');
  const grid = document.getElementById('member-grid');

  const groupedIds = new Set(GROUPS.flatMap(g => g.members));
  const totalMembers = groupedIds.size;
  document.getElementById('group-stats').textContent =
    `${GROUPS.length} groups | ${totalMembers} grouped members | ${ASSIGNED_CLUSTERS.length} assigned guests total`;

  // Existing groups
  list.innerHTML = GROUPS.length === 0
    ? '<p style="color:#888;font-size:13px;">No groups yet. Select guests below to create one.</p>'
    : GROUPS.map((g, i) => {
      const avatars = g.memberDetails.map(m =>
        m.avatar ? `<img src="${m.avatar}" title="${m.name}">` : ''
      ).join('');
      const names = g.memberDetails.map(m => m.name).join(' & ');
      const vnVal = (g.vnTitle || '').replace(/"/g, '&quot;');
      const msgVal = (g.message || '').replace(/"/g, '&quot;');
      return `
        <div class="group-card">
          <div class="group-avatars">${avatars}</div>
          <div class="group-info">
            <div class="group-names">${names}</div>
            <div class="group-fields">
              <input type="text" value="${vnVal}" placeholder="VN Title..." onchange="updateGroupField(${i}, 'vnTitle', this.value)">
              <input type="text" value="${msgVal}" placeholder="Message..." onchange="updateGroupField(${i}, 'message', this.value)" style="width:300px">
            </div>
          </div>
          <button class="btn danger" onclick="deleteGroup(${i})" style="flex-shrink:0">Delete</button>
        </div>`;
    }).join('');

  // Member selection grid
  grid.innerHTML = ASSIGNED_CLUSTERS.map(c => {
    const isGrouped = groupedIds.has(c.id);
    const isSelected = groupSelected.has(c.id);
    let cls = 'member-card';
    if (isGrouped) cls += ' disabled';
    else if (isSelected) cls += ' selected';
    const avatarHtml = c.avatar
      ? `<img src="${c.avatar}">`
      : `<span style="width:36px;height:36px;border-radius:50%;background:#444;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">${c.name.charAt(0)}</span>`;
    const check = isSelected ? '<span class="member-check">&#10003;</span>' : '';
    return `
      <div class="${cls}" onclick="toggleGroupMember('${c.id}')">
        ${avatarHtml}
        <span class="member-name">${c.name}</span>
        ${check}
      </div>`;
  }).join('');

  // Update create button state
  const btn = document.getElementById('create-group-btn');
  btn.textContent = groupSelected.size >= 2 ? `Create Group (${groupSelected.size})` : 'Create Group';
  btn.disabled = groupSelected.size < 2;
}

function toggleGroupMember(id) {
  if (groupSelected.has(id)) groupSelected.delete(id);
  else groupSelected.add(id);
  renderGroups();
}

async function persistGroups(groups) {
  const resp = await fetch('/api/save-groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ groups }),
  });
  return resp.ok;
}

async function createGroup() {
  if (groupSelected.size < 2) { toast('Select at least 2 guests', 'error'); return; }

  const members = [...groupSelected];
  const vnTitle = document.getElementById('group-vntitle').value.trim();
  const message = document.getElementById('group-message').value.trim();

  const newGroup = { members };
  if (vnTitle) newGroup.vnTitle = vnTitle;
  if (message) newGroup.message = message;

  // Resolve member details from ASSIGNED_CLUSTERS
  const lookup = Object.fromEntries(ASSIGNED_CLUSTERS.map(c => [c.id, c]));
  newGroup.memberDetails = members.map(id => lookup[id] || { id, name: id.slice(0, 8) + '…', avatar: '' });

  const allGroups = [...GROUPS, newGroup];
  // Build clean version for saving (no memberDetails)
  const saveGroups = allGroups.map(g => {
    const entry = { members: g.members };
    if (g.vnTitle) entry.vnTitle = g.vnTitle;
    if (g.message) entry.message = g.message;
    return entry;
  });

  if (await persistGroups(saveGroups)) {
    GROUPS = allGroups;
    groupSelected.clear();
    document.getElementById('group-vntitle').value = '';
    document.getElementById('group-message').value = '';
    renderGroups();
    toast('Group created', 'success');
  } else {
    toast('Save failed!', 'error');
  }
}

async function deleteGroup(index) {
  if (!confirm('Delete this group?')) return;
  GROUPS.splice(index, 1);
  const saveGroups = GROUPS.map(g => {
    const entry = { members: g.members };
    if (g.vnTitle) entry.vnTitle = g.vnTitle;
    if (g.message) entry.message = g.message;
    return entry;
  });
  if (await persistGroups(saveGroups)) {
    renderGroups();
    toast('Group deleted', 'success');
  } else {
    toast('Delete failed!', 'error');
  }
}

function updateGroupField(index, field, value) {
  GROUPS[index][field] = value;
  // Debounce save
  if (groupSaveTimeout) clearTimeout(groupSaveTimeout);
  groupSaveTimeout = setTimeout(async () => {
    const saveGroups = GROUPS.map(g => {
      const entry = { members: g.members };
      if (g.vnTitle) entry.vnTitle = g.vnTitle;
      if (g.message) entry.message = g.message;
      return entry;
    });
    if (await persistGroups(saveGroups)) {
      toast('Group updated', 'success');
    } else {
      toast('Save failed!', 'error');
    }
  }, 600);
}

// ---- Init ----
renderPhotos();
renderClusters();
renderGroups();
</script>
</body>
</html>"""


class DebugHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, photos_data=None, clusters_data=None, **kwargs):
        self.photos_data = photos_data
        self.clusters_data = clusters_data
        super().__init__(*args, **kwargs)

    def do_GET(self):
        path = unquote(self.path)

        if path == "/" or path == "/index.html":
            # Re-read from disk on every page load so data is always fresh
            photos = build_photos_data()
            clusters = build_clusters_data()
            groups = build_groups_data()
            assigned_clusters = build_assigned_clusters_list()
            html = HTML_TEMPLATE.replace(
                "__PHOTOS_JSON__", json.dumps(photos)
            ).replace(
                "__CLUSTERS_JSON__", json.dumps(clusters)
            ).replace(
                "__GROUPS_JSON__", json.dumps(groups)
            ).replace(
                "__ASSIGNED_CLUSTERS_JSON__", json.dumps(assigned_clusters)
            )
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            self.wfile.write(html.encode())
            return

        if path.startswith("/images/"):
            file_path = PROJECT_ROOT / "public" / path.lstrip("/")
            if file_path.exists():
                self.send_response(200)
                ct = "image/jpeg" if file_path.suffix.lower() in (".jpg", ".jpeg") else "image/png"
                self.send_header("Content-Type", ct)
                self.end_headers()
                self.wfile.write(file_path.read_bytes())
                return

        if path.startswith("/crops/"):
            file_path = OUTPUT_DIR / path[len("/crops/"):]
            if file_path.exists():
                self.send_response(200)
                self.send_header("Content-Type", "image/jpeg")
                self.end_headers()
                self.wfile.write(file_path.read_bytes())
                return

        self.send_error(404)

    def do_POST(self):
        path = unquote(self.path)
        content_length = int(self.headers["Content-Length"])
        body = json.loads(self.rfile.read(content_length))

        if path == "/api/save-mapping":
            with open(MAPPING_FILE, "w") as f:
                json.dump(body, f, indent=2, ensure_ascii=False)
            mapped = sum(1 for v in body.values() if v is not None)
            print(f"Saved mapping: {mapped} assigned, {sum(1 for v in body.values() if v is None)} skipped")
            self._json_response({"ok": True})
            return

        if path == "/api/merge-clusters":
            keys = body["clusters"]
            if len(keys) < 2:
                self._json_response({"error": "Need at least 2"}, 400)
                return

            # Load clusters_raw.json
            with open(CLUSTERS_RAW_FILE) as f:
                clusters_raw = json.load(f)

            target = keys[0]
            merged_faces = []
            for k in keys:
                merged_faces.extend(clusters_raw.get(k, []))
                if k != target and k in clusters_raw:
                    del clusters_raw[k]

            clusters_raw[target] = merged_faces

            # Also update mapping: remove merged keys
            mapping = {}
            if MAPPING_FILE.exists():
                with open(MAPPING_FILE) as f:
                    mapping = json.load(f)
            for k in keys[1:]:
                mapping.pop(k, None)

            with open(CLUSTERS_RAW_FILE, "w") as f:
                json.dump(clusters_raw, f, indent=2)
            with open(MAPPING_FILE, "w") as f:
                json.dump(mapping, f, indent=2, ensure_ascii=False)

            print(f"Merged {keys} into {target} ({len(merged_faces)} faces)")
            self._json_response({"ok": True, "target": target, "faceCount": len(merged_faces)})
            return

        if path == "/api/promote-noise":
            crop_id = body["cropId"]

            with open(CLUSTERS_RAW_FILE) as f:
                clusters_raw = json.load(f)

            noise_faces = clusters_raw.get("cluster_-1", [])
            face = next((f for f in noise_faces if f["crop"] == crop_id), None)
            if not face:
                self._json_response({"error": "Face not found in noise"}, 400)
                return

            noise_faces.remove(face)

            # Find next available cluster number
            max_num = -1
            for k in clusters_raw:
                try:
                    n = int(k.split("_", 1)[1])
                    if n > max_num:
                        max_num = n
                except (IndexError, ValueError):
                    pass
            new_key = f"cluster_{max_num + 1}"

            clusters_raw[new_key] = [face]
            if noise_faces:
                clusters_raw["cluster_-1"] = noise_faces
            else:
                del clusters_raw["cluster_-1"]

            with open(CLUSTERS_RAW_FILE, "w") as f:
                json.dump(clusters_raw, f, indent=2)

            print(f"Promoted noise face {crop_id} to {new_key}")
            self._json_response({"ok": True, "newKey": new_key})
            return

        if path == "/api/add-noise-to-cluster":
            crop_id = body["cropId"]
            target_key = body["targetKey"]

            with open(CLUSTERS_RAW_FILE) as f:
                clusters_raw = json.load(f)

            noise_faces = clusters_raw.get("cluster_-1", [])
            face = next((f for f in noise_faces if f["crop"] == crop_id), None)
            if not face:
                self._json_response({"error": "Face not found in noise"}, 400)
                return
            if target_key not in clusters_raw:
                self._json_response({"error": "Target cluster not found"}, 400)
                return

            noise_faces.remove(face)
            clusters_raw[target_key].append(face)

            if noise_faces:
                clusters_raw["cluster_-1"] = noise_faces
            else:
                del clusters_raw["cluster_-1"]

            with open(CLUSTERS_RAW_FILE, "w") as f:
                json.dump(clusters_raw, f, indent=2)

            print(f"Added noise face {crop_id} to {target_key}")
            self._json_response({"ok": True})
            return

        if path == "/api/save-groups":
            groups = body.get("groups", [])
            # Validate no duplicate members
            seen: set[str] = set()
            for group in groups:
                for member in group.get("members", []):
                    if member in seen:
                        self._json_response(
                            {"error": f"Duplicate member: {member}"}, 400
                        )
                        return
                    seen.add(member)

            # Clean up: only save members, vnTitle, message
            clean = []
            for group in groups:
                entry: dict = {"members": group["members"]}
                if group.get("vnTitle"):
                    entry["vnTitle"] = group["vnTitle"]
                if group.get("message"):
                    entry["message"] = group["message"]
                clean.append(entry)

            with open(GROUPS_FILE, "w") as f:
                json.dump(clean, f, indent=2, ensure_ascii=False)

            print(f"Saved {len(clean)} invite groups")
            self._json_response({"ok": True})
            return

        self.send_error(404)

    def _json_response(self, data, code=200):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def log_message(self, format, *args):
        pass


def main():
    parser = argparse.ArgumentParser(description="Debug face detection + cluster assignment")
    parser.add_argument("--port", type=int, default=8888)
    args = parser.parse_args()

    print("Building debug data...")
    photos = build_photos_data()
    clusters = build_clusters_data()

    total_faces = sum(p["faceCount"] for p in photos)
    no_face = sum(1 for p in photos if p["faceCount"] == 0)
    real_clusters = [c for c in clusters if c["num"] != -1]
    assigned = sum(1 for c in clusters if c["name"])
    print(f"  {len(photos)} photos, {total_faces} faces, {no_face} with no faces")
    print(f"  {len(real_clusters)} clusters, {assigned} assigned")

    def handler(*a, **kw):
        return DebugHandler(*a, photos_data=photos, clusters_data=clusters, **kw)

    server = HTTPServer(("localhost", args.port), handler)
    url = f"http://localhost:{args.port}"
    print(f"\nDebug UI: {url}")
    webbrowser.open(url)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
