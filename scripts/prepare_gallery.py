#!/usr/bin/env python3
"""Convert the supplied wedding gallery archive into web-ready WebP assets."""
from __future__ import annotations

import argparse
import io
import json
import zipfile
from pathlib import Path

from PIL import Image, ImageOps


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path, help="Path to the original gallery ZIP")
    parser.add_argument("--output", type=Path, default=Path("public"), help="Static site root")
    parser.add_argument("--max-edge", type=int, default=1440, help="Maximum image edge in pixels")
    parser.add_argument("--quality", type=int, default=77, help="WebP quality (0–100)")
    args = parser.parse_args()

    site_root = args.output.resolve()
    photo_root = site_root / "photos"
    data_root = site_root / "data"
    photo_root.mkdir(parents=True, exist_ok=True)
    data_root.mkdir(parents=True, exist_ok=True)

    records: list[dict[str, object]] = []
    with zipfile.ZipFile(args.archive) as archive:
        members = [
            info for info in archive.infolist()
            if not info.is_dir()
            and info.filename.lower().endswith((".jpg", ".jpeg"))
            and info.filename.split("/", 1)[0] in {"1", "2"}
        ]
        members.sort(key=lambda info: (info.filename.split("/", 1)[0], info.filename.lower()))
        for position, info in enumerate(members, start=1):
            album, _, original_name = info.filename.partition("/")
            stem = Path(original_name).stem
            relative_path = Path("photos") / album / f"{stem}.webp"
            output_path = site_root / relative_path
            output_path.parent.mkdir(parents=True, exist_ok=True)

            raw = archive.read(info)
            with Image.open(io.BytesIO(raw)) as source:
                image = ImageOps.exif_transpose(source).convert("RGB")
                image.thumbnail((args.max_edge, args.max_edge), Image.Resampling.LANCZOS)
                width, height = image.size
                image.save(output_path, format="WEBP", quality=args.quality, method=4)

            records.append({
                "id": position,
                "album": album,
                "name": original_name,
                "src": "/" + relative_path.as_posix(),
                "width": width,
                "height": height,
            })
            if position % 50 == 0 or position == len(members):
                print(f"Processed {position}/{len(members)} photos", flush=True)

    manifest_path = data_root / "photos.json"
    manifest_path.write_text(json.dumps(records, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    total_bytes = sum(path.stat().st_size for path in photo_root.rglob("*.webp"))
    print(f"Wrote {len(records)} photos to {manifest_path}; optimized images: {total_bytes:,} bytes")


if __name__ == "__main__":
    main()
