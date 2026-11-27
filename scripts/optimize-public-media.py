#!/usr/bin/env python3
"""Lossless-only public asset optimization; --apply adopts strictly smaller verified files.

No resize, quality reduction, asset creation or image-sequence conversion. Originals are
backed up outside the source/public tree. ICC/EXIF/XMP metadata is preserved on images.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import shutil
import subprocess
import tempfile
from pathlib import Path
from PIL import Image


def pixels(path: Path) -> tuple:
    with Image.open(path) as image:
        return image.size, hashlib.sha256(image.convert("RGBA").tobytes()).hexdigest()


def frames(path: Path) -> list[str]:
    output = subprocess.check_output([
        "ffmpeg", "-v", "error", "-i", str(path), "-map", "0:v:0",
        "-f", "framemd5", "-", ], text=True)
    return [line for line in output.splitlines() if line and not line.startswith("#")]


def run() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--public", type=Path, default=Path(__file__).resolve().parents[1] / "public")
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--backup", type=Path, default=Path.home() / "itclub-media-originals-20261127")
    parser.add_argument("--report", type=Path, default=Path(__file__).resolve().parents[1] / "docs/media-optimization.json")
    args = parser.parse_args()
    records = []
    with tempfile.TemporaryDirectory(prefix="itclub-lossless-") as temporary:
        temp = Path(temporary)
        for index, source in enumerate(sorted(args.public.rglob("*"))):
            if not source.is_file() or source.suffix.lower() not in {".png", ".webp", ".mp4"}:
                continue
            relative = source.relative_to(args.public)
            candidate = temp / f"{index}{source.suffix}"
            record = {"path": str(relative), "before": source.stat().st_size, "status": "unchanged"}
            try:
                if source.suffix.lower() == ".mp4":
                    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(source), "-map", "0", "-c", "copy", "-map_metadata", "-1", "-movflags", "+faststart", str(candidate)], check=True)
                    verifier = frames
                    record["method"] = "MP4 stream-copy remux + faststart"
                else:
                    with Image.open(source) as image:
                        if getattr(image, "n_frames", 1) != 1:
                            record["status"] = "skipped-animation"
                            records.append(record)
                            continue
                        metadata = {key: image.info[key] for key in ("icc_profile", "exif", "xmp") if image.info.get(key)}
                        if source.suffix.lower() == ".png":
                            # Keeping mode retains palette/transparency and decoded pixels.
                            image.save(candidate, "PNG", optimize=True, compress_level=9, **metadata)
                            record["method"] = "PNG lossless optimize"
                        else:
                            image.save(candidate, "WEBP", lossless=True, quality=100, method=6, exact=True, **metadata)
                            record["method"] = "WebP lossless exact RGBA, method6"
                    verifier = pixels
                record["candidate"] = candidate.stat().st_size
                if record["candidate"] < record["before"]:
                    if verifier(source) != verifier(candidate):
                        raise ValueError("Decoded pixel/frame verification failed")
                    record["verified"] = True
                    if args.apply:
                        backup = args.backup / relative
                        backup.parent.mkdir(parents=True, exist_ok=True)
                        if backup.exists():
                            raise FileExistsError(f"Refusing to overwrite original backup: {backup}")
                        shutil.copy2(source, backup)
                        shutil.copyfile(candidate, source)
                        record["status"] = "optimized"
                    else:
                        record["status"] = "smaller-dry-run"
                    record["after"] = record["candidate"] if args.apply else record["before"]
                    record["saved"] = record["before"] - record["candidate"]
                else:
                    record["after"] = record["before"]
                    record["status"] = "kept-smaller-original"
            except Exception as error:
                record["status"] = "error-original-kept"
                record["error"] = str(error)
            records.append(record)
            print(f"{relative}: {record['status']} ({record['before']} -> {record.get('after', record['before'])} bytes)", flush=True)
    result = {
        "policy": "unchanged decoded pixels/frames; only strictly smaller files adopted",
        "applied": args.apply,
        "backup_directory": str(args.backup),
        "saved_bytes": sum(item.get("saved", 0) for item in records if item["status"] == "optimized"),
        "records": records,
    }
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(result, indent=2) + "\n")
    print(f"Report: {args.report}; saved {result['saved_bytes']} bytes", flush=True)


if __name__ == "__main__":
    run()
