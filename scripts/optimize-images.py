# -*- coding: utf-8 -*-
"""Convert wiki thumbnails to web-sized WebP for the static site."""
import os, glob, sys, time
from PIL import Image

CAND = [d for d in glob.glob(os.path.join(r"C:\Users\yy\Documents", "Lord_of_the*"))
        if os.path.isdir(os.path.join(d, "图片"))]
SRC = os.path.join(CAND[0], "图片") if CAND else None
if not SRC:
    raise SystemExit("image source not found")
DST = r"C:\Users\yy\Documents\atlas-of-middle-earth\public\images"
os.makedirs(DST, exist_ok=True)

MAXW = 720
QUALITY = 78
files = [f for f in os.listdir(SRC) if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp", ".gif"))]
print("source images:", len(files))

done = skip = fail = 0
t0 = time.time()
total_in = total_out = 0
for i, fn in enumerate(files):
    stem, ext = os.path.splitext(fn)
    out = os.path.join(DST, stem + ".webp")
    sp = os.path.join(SRC, fn)
    total_in += os.path.getsize(sp)
    if os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(sp):
        skip += 1
        total_out += os.path.getsize(out)
        continue
    try:
        im = Image.open(sp)
        im = im.convert("RGBA") if im.mode in ("P", "LA") else im.convert("RGB")
        w, h = im.size
        if w > MAXW:
            im = im.resize((MAXW, max(1, round(h * MAXW / w))), Image.LANCZOS)
        if im.mode == "RGBA":
            bg = Image.new("RGB", im.size, (244, 240, 230))
            bg.paste(im, mask=im.split()[-1])
            im = bg
        im.save(out, "WEBP", quality=QUALITY, method=4)
        total_out += os.path.getsize(out)
        done += 1
    except Exception as e:
        fail += 1
        if fail < 6:
            print("FAIL", fn, e)
    if (i + 1) % 400 == 0:
        print(f"{i+1}/{len(files)} done={done} skip={skip} fail={fail} {time.time()-t0:.0f}s", flush=True)

print(f"done={done} skip={skip} fail={fail} time={time.time()-t0:.0f}s")
print(f"input {total_in/1e6:.1f} MB -> output {total_out/1e6:.1f} MB")
