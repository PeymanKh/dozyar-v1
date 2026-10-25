#!/usr/bin/env python3
"""
Square glass step icon: trim the transparent border, center on a square canvas, 384px
(4x the 96px slot) so every step icon sits at the same visual size.

  python3 scripts/prep_icon.py design/assets/steps/name-2.png public/onboarding/name.png

Needs Pillow (pip install pillow).
"""

import sys
from PIL import Image


def prep(src: str, dest: str, size: int = 384) -> None:
    im = Image.open(src).convert("RGBA")
    im = im.crop(im.getchannel("A").point(lambda a: 255 if a > 12 else 0).getbbox())
    side = max(im.size)
    square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    square.alpha_composite(im, ((side - im.width) // 2, (side - im.height) // 2))
    square.resize((size, size), Image.LANCZOS).save(dest, optimize=True)
    print(dest)


if __name__ == "__main__":
    prep(sys.argv[1], sys.argv[2])
