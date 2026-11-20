#!/usr/bin/env python3
"""Make lightweight plan previews for the category summary cards."""
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parents[1]
destination = root / 'plans/thumbs'
destination.mkdir(exist_ok=True)
for source in sorted((root / 'plans/2x').glob('*.png')):
    subprocess.run(['magick', str(source), '-resize', '480x480>', '-strip', '-quality', '85', str(destination / (source.stem + '.webp'))], check=True)
print('Plan thumbnails prepared.')
