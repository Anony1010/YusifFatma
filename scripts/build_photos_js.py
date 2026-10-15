#!/usr/bin/env python3
"""public/data/photos.json -> public/js/photos-data.js (sayt qovluğu fayl kimi açılanda da işləsin deyə)."""
import json
from pathlib import Path

root = Path(__file__).resolve().parent.parent / "public"
data = [p for p in json.loads((root / "data" / "photos.json").read_text(encoding="utf-8")) if p["album"] == "2"]
items = [{"s": p["src"].lstrip("/"), "w": p["width"], "h": p["height"]} for p in data]
out = "/* Avtomatik yaradılıb: scripts/build_photos_js.py */\nwindow.PHOTOS = " + json.dumps(items, ensure_ascii=False, separators=(",", ":")) + ";\n"
(root / "js" / "photos-data.js").write_text(out, encoding="utf-8")
print(len(items), "foto yazıldı")
