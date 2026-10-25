#!/usr/bin/env python3
"""
Turn cut-out renders into web assets: trim the transparent border, cap the size, save to public/.

  python3 scripts/prep_assets.py design/assets/objects/pen-violet-cut.png public/welcome/pen-violet.png

Needs Pillow (pip install pillow).
"""

import sys
from PIL import Image

MAX_SIDE = 1100  # enough for ~3x on a 360px-wide object
PAD = 8


def prep(src: str, dest: str) -> None:
    im = Image.open(src).convert("RGBA")
    # Ignore nearly invisible fringe pixels when finding the object's bounds.
    alpha = im.getchannel("A").point(lambda a: 255 if a > 12 else 0)
    x0, y0, x1, y1 = alpha.getbbox()
    im = im.crop((max(0, x0 - PAD), max(0, y0 - PAD), min(im.width, x1 + PAD), min(im.height, y1 + PAD)))
    im.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
    im.save(dest, optimize=True)
    print(f"{dest}: {im.width}x{im.height}")


if __name__ == "__main__":
    prep(sys.argv[1], sys.argv[2])
