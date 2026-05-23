# Icons

Place your extension icons here:

- `icon16.png` — 16x16 pixels (toolbar icon)
- `icon48.png` — 48x48 pixels (extensions page)
- `icon128.png` — 128x128 pixels (Chrome Web Store)

## Generating Icons

You can create icons from an SVG source using any image editor, or use a script like:

```bash
# Using ImageMagick
convert source.svg -resize 16x16 icon16.png
convert source.svg -resize 48x48 icon48.png
convert source.svg -resize 128x128 icon128.png
```
