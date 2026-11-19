#!/usr/bin/env python3
"""Generate WebP display sizes from production JPEGs; retain originals for zoom."""
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
media = json.loads((ROOT / '_data/unit_media.json').read_text())
sources = {photo['src'].replace('.jpg', '-medium.jpg') for gallery in media.values() for photo in gallery.get('photos', [])}
sources.add('/photos/interior/hall-medium.jpg')
images = {}
for source in sorted(sources):
    path = ROOT / source.lstrip('/')
    width, height = map(int, subprocess.check_output(['magick', 'identify', '-format', '%w %h', str(path)], text=True).split())
    variants = []
    for target in sorted({min(width, size) for size in (480, 800, 1200)}):
        dest = path.with_name(f'{path.stem}-{target}.webp')
        subprocess.run(['magick', str(path), '-auto-orient', '-resize', f'{target}x>', '-strip', '-quality', '80', str(dest)], check=True)
        variants.append({'src': '/' + str(dest.relative_to(ROOT)), 'width': target})
    images[source] = {'width': width, 'height': height, 'variants': variants}
# Keep hero resolution and framing; the preloaded WebP is also used by CSS.
subprocess.run(['magick', str(ROOT / 'photos/facade02.jpg'), '-strip', '-quality', '80', str(ROOT / 'photos/facade02.webp')], check=True)
(ROOT / '_data/responsive_images.json').write_text(json.dumps(images, ensure_ascii=False, indent=2) + '\n')
print(f'Prepared {len(images)} responsive images and the hero WebP.')
