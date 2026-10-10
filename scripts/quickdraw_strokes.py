"""Our own simple line drawings for the 16 Quick Draw words (Liquid AI's System One Arcade).

Coordinates are 0..1 in a square canvas; each drawing is a list of strokes, each stroke a list of
(x, y) points, drawn in order like a person would. Written once, before the test, and checked
only by rendering them locally (scripts/quickdraw_strokes.py --preview out.png), never against the
model, so the test stays a first attempt.
"""
import math
import sys


def circle(cx, cy, r, n=40, a0=0.0, a1=2 * math.pi, ry=None):
    ry = r if ry is None else ry
    return [(cx + r * math.cos(a0 + (a1 - a0) * i / (n - 1)), cy + ry * math.sin(a0 + (a1 - a0) * i / (n - 1))) for i in range(n)]


def line(*pts):
    return list(pts)


def star_pts(cx, cy, r):
    pts = []
    for i in range(6):
        a = -math.pi / 2 + i * 4 * math.pi / 5
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


DRAWINGS = {
    "cat": [circle(.5, .55, .25), line((.3, .4), (.3, .18), (.43, .32)), line((.57, .32), (.7, .18), (.7, .4)),
            circle(.42, .5, .025, 12), circle(.58, .5, .025, 12), line((.47, .6), (.5, .63), (.53, .6)),
            line((.38, .62), (.12, .58)), line((.38, .66), (.12, .7)), line((.62, .62), (.88, .58)), line((.62, .66), (.88, .7))],
    "house": [line((.2, .45), (.2, .85), (.8, .85), (.8, .45)), line((.15, .48), (.5, .15), (.85, .48)),
              line((.43, .85), (.43, .65), (.57, .65), (.57, .85)), line((.27, .55), (.37, .55), (.37, .63), (.27, .63), (.27, .55))],
    "tree": [line((.45, .9), (.45, .6)), line((.55, .9), (.55, .6)),
             circle(.5, .38, .26, 50)],
    "car": [line((.1, .65), (.1, .5), (.28, .5), (.38, .33), (.65, .33), (.75, .5), (.9, .52), (.9, .65), (.1, .65)),
            circle(.28, .68, .08, 24), circle(.72, .68, .08, 24), line((.4, .36), (.4, .5)), line((.56, .35), (.56, .5))],
    "fish": [circle(.45, .5, .28, 50, ry=.16), line((.72, .5), (.92, .32), (.92, .68), (.72, .5)), circle(.3, .46, .025, 12)],
    "sun": [circle(.5, .5, .18, 40)] + [line((.5 + .25 * math.cos(a), .5 + .25 * math.sin(a)), (.5 + .38 * math.cos(a), .5 + .38 * math.sin(a)))
                                         for a in [i * math.pi / 4 for i in range(8)]],
    "bicycle": [circle(.25, .65, .16, 36), circle(.75, .65, .16, 36), line((.25, .65), (.45, .65), (.6, .42), (.36, .42), (.25, .65)),
                line((.45, .65), (.36, .42), (.34, .34)), line((.29, .34), (.4, .34)), line((.6, .42), (.75, .65)), line((.6, .42), (.58, .3), (.66, .28))],
    "clock": [circle(.5, .5, .35, 50), line((.5, .5), (.5, .27)), line((.5, .5), (.66, .58)),
              line((.5, .17), (.5, .21)), line((.83, .5), (.79, .5)), line((.5, .83), (.5, .79)), line((.17, .5), (.21, .5))],
    "star": [star_pts(.5, .53, .38)],
    "umbrella": [circle(.5, .45, .38, 40, a0=math.pi, a1=2 * math.pi),
                 line((.12, .45), (.25, .4), (.37, .45), (.5, .4), (.63, .45), (.75, .4), (.88, .45)),
                 line((.5, .45), (.5, .82)) + circle(.44, .82, .06, 12, a0=0, a1=math.pi)],
    "airplane": [circle(.5, .5, .4, 40, ry=.07), line((.45, .45), (.3, .15), (.38, .15), (.6, .45)), line((.45, .55), (.3, .85), (.38, .85), (.6, .55)),
                 line((.15, .45), (.1, .3), (.17, .3), (.24, .45))],
    "flower": [circle(.5, .35, .07, 20)] + [circle(.5 + .13 * math.cos(a), .35 + .13 * math.sin(a), .07, 20) for a in [i * 2 * math.pi / 5 - math.pi / 2 for i in range(5)]]
              + [line((.5, .48), (.5, .9)), line((.5, .72), (.62, .62), (.66, .66), (.5, .72))],
    "guitar": [circle(.5, .7, .18, 36), circle(.5, .45, .13, 30), circle(.5, .62, .05, 16), line((.47, .33), (.47, .08), (.53, .08), (.53, .33)),
               line((.44, .08), (.56, .08))],
    "apple": [circle(.5, .58, .27, 50), line((.5, .32), (.53, .17)), line((.53, .22), (.66, .15), (.62, .25), (.53, .22))],
    "snowman": [circle(.5, .75, .17, 36), circle(.5, .47, .12, 30), circle(.5, .25, .09, 24), circle(.47, .23, .012, 8), circle(.53, .23, .012, 8),
                line((.39, .47), (.2, .38)), line((.61, .47), (.8, .38))],
    "eyeglasses": [circle(.3, .52, .15, 36), circle(.7, .52, .15, 36), line((.45, .5), (.5, .46), (.55, .5)), line((.15, .5), (.05, .42)), line((.85, .5), (.95, .42))],
}


def preview(path, size=256):
    from PIL import Image, ImageDraw
    words = list(DRAWINGS)
    sheet = Image.new("RGB", (size * 4, size * 4), "white")
    for i, w in enumerate(words):
        im = Image.new("RGB", (size, size), "white")
        d = ImageDraw.Draw(im)
        for s in DRAWINGS[w]:
            d.line([(x * size, y * size) for x, y in s], fill="black", width=4)
        d.text((6, 4), w, fill="red")
        sheet.paste(im, ((i % 4) * size, (i // 4) * size))
    sheet.save(path)


if __name__ == "__main__" and "--preview" in sys.argv:
    preview(sys.argv[-1])
