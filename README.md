# Résidence LE 25 website

## Preview locally

From the repository folder:

```sh
bundle install
bundle exec jekyll serve --livereload
```

Open http://localhost:4000. Jekyll rebuilds after edits; LiveReload refreshes the browser.
Restart the command after changing `_config.yml`. Stop with Ctrl+C.
This preview does not publish anything. Check desktop and mobile layouts before pushing.
The site is built with Jekyll, so opening `index.html` directly will not work.

## Prepare unit photos

Keep originals in `photos/units-originals/<unit>/` (ignored by Git).
Install ImageMagick once on macOS:

```sh
brew install imagemagick
```

Run from the repository folder, using a separate source folder for each unit:

```sh
python3 scripts/prepare-photos.py photos/units-originals/apartment-a
```

This automatically creates `photos/units/apartment-a/`, ready to add to Git.
The unit folder name is preserved; your existing folder and photo names are suitable.
The script can also be called from elsewhere with absolute paths and always writes
to this repository's `photos/units/` directory.
The destination must not exist. The script reads supported images directly inside the
source folder (not subfolders) and writes three progressive JPEGs per photo:

| Filename example | Maximum longest edge | JPEG quality | Use |
| --- | --- | --- | --- |
| `living-room.jpg` | 2400 px | 85 | Full-screen viewing / download |
| `living-room-medium.jpg` | 1200 px | 82 | Inline gallery / mobile |
| `living-room-thumb.jpg` | 400 px | 78 | Thumbnail strip |

Images retain their proportions and are never enlarged. Rotation is applied before
metadata is removed (including GPS information). Output uses sRGB color; transparent
images receive a white background. Original files remain untouched. File sizes vary
with image detail; full-size JPEGs above 600 KB are flagged for review.

Use simple descriptive source names such as `01-living-room.jpg`, `02-bedroom.jpg`,
and `03-terrace.jpg`. Names are converted to lowercase ASCII with hyphens. Conflicting
names are rejected. Supported inputs: JPEG, PNG, HEIC/HEIF, TIFF, WebP; support for
HEIC/HEIF depends on your ImageMagick installation. Only the first frame/page is used.
Videos are ignored and should be hosted externally. A video poster can be prepared
by placing a still image named `video-poster.jpg` among the source photos.

Review the output visually before adding it to Git. These exports do not automatically
add photos to the website; gallery entries still need to be connected to the unit data.
To regenerate, move the existing production folder aside first, run the same command,
then review the new exports before discarding the previous ones.
