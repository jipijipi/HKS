#!/usr/bin/env python3
"""Create web-ready JPEGs with ImageMagick; originals are never modified."""

import argparse
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import unicodedata


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="Folder containing one unit's original photos")
    args = parser.parse_args()
    repository = Path(__file__).resolve().parent.parent
    originals = (repository / "photos" / "units-originals").resolve()
    source = args.source.expanduser().resolve()
    if not source.is_dir():
        parser.error(f"Source folder does not exist: {source}")
    if source.parent != originals:
        parser.error(f"Select a unit folder directly inside {originals}")
    output = repository / "photos" / "units" / source.name
    if output.exists():
        parser.error(f"Output already exists: {output}. Move it aside before regenerating.")
    if not shutil.which("magick"):
        parser.error("ImageMagick is required. On macOS install with: brew install imagemagick")

    extensions = {".jpg", ".jpeg", ".png", ".heic", ".heif", ".tif", ".tiff", ".webp"}
    photos = sorted(p for p in source.iterdir() if p.is_file() and p.suffix.lower() in extensions)
    if not photos:
        parser.error("No supported photos found directly inside the source folder.")
    names = []
    for photo in photos:
        name = unicodedata.normalize("NFKD", photo.stem).encode("ascii", "ignore").decode()
        names.append(re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "photo")
    generated_names = [f"{name}{suffix}.jpg" for name in names for suffix in ("", "-medium", "-thumb")]
    if len(set(generated_names)) != len(generated_names):
        parser.error("Some filenames become identical after normalization. Rename them first.")

    output.parent.mkdir(parents=True, exist_ok=True)
    # Stage the complete batch so failed conversions do not leave a partial gallery.
    with tempfile.TemporaryDirectory(prefix=".prepare-photos-", dir=output.parent) as temporary:
        staging = Path(temporary) / "gallery"
        staging.mkdir()
        try:
            for photo, name in zip(photos, names):
                print(f"Preparing {photo.name}", flush=True)
                for suffix, edge, quality in (("", 2400, 85), ("-medium", 1200, 82), ("-thumb", 400, 78)):
                    destination = staging / f"{name}{suffix}.jpg"
                    subprocess.run([
                        "magick", f"{photo}[0]", "-auto-orient", "-colorspace", "sRGB",
                        "-resize", f"{edge}x{edge}>", "-background", "white",
                        "-alpha", "remove", "-alpha", "off", "-strip",
                        "-interlace", "Plane", "-sampling-factor", "4:2:0",
                        "-quality", str(quality), str(destination),
                    ], check=True)
            staging.rename(output)
        except subprocess.CalledProcessError:
            parser.exit(1, "Conversion failed. No output gallery was created; originals are untouched.\n")

    files = list(output.glob("*.jpg"))
    total = sum(p.stat().st_size for p in files)
    print(f"Created {len(files)} JPEGs in {output} ({total / 1024 / 1024:.1f} MB)")
    for photo, name in zip(photos, names):
        size = (output / f"{name}.jpg").stat().st_size
        if size > 600 * 1024:
            print(f"Review size: {name}.jpg is {size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
