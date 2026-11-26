"""Batch flatten: emblems/maps -> SVG vector, everything else -> flat raster (A).

Originals are read from assets/images-original (backup) and written into
public/images (same filename for raster, /images/vec/<name>.svg for vector).
"""
import os, re, glob, json, time, sys
import numpy as np
import cv2
import vtracer

ROOT = r"C:\Users\yy\Documents\atlas-of-middle-earth"
SRC = os.path.join(ROOT, "assets", "images-original")
DST = os.path.join(ROOT, "public", "images")
VEC_DIR = os.path.join(DST, "vec")
MAP_FILE = os.path.join(ROOT, "src", "data", "image-vec.json")

os.makedirs(VEC_DIR, exist_ok=True)

VEC_RE = re.compile(r"(flag|blason|coat|emblem|symbol|banner|seal|herald|shield|logo|map)", re.I)


def load(p):
    return cv2.imdecode(np.fromfile(p, dtype=np.uint8), cv2.IMREAD_COLOR)


def save(p, img):
    ok, buf = cv2.imencode(".webp", img, [int(cv2.IMWRITE_WEBP_QUALITY), 84])
    if ok:
        buf.tofile(p)


def palettize(bgr, colors=9):
    data = bgr.reshape(-1, 3).astype(np.float32)
    crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 12, 1.0)
    _, labels, centers = cv2.kmeans(data, colors, None, crit, 3, cv2.KMEANS_PP_CENTERS)
    return np.uint8(centers)[labels.flatten()].reshape(bgr.shape)


def flat_a(bgr):
    sm = cv2.edgePreservingFilter(bgr, flags=cv2.RECURS_FILTER, sigma_s=60, sigma_r=0.4)
    sm = cv2.pyrMeanShiftFiltering(sm, 12, 24, maxLevel=2)
    return palettize(sm, 9)


def to_svg(path, out_svg):
    im = load(path)
    h, w = im.shape[:2]
    scale = 560 / max(h, w)
    if scale < 1:
        im = cv2.resize(im, (round(w * scale), round(h * scale)), interpolation=cv2.INTER_AREA)
    tmp_png = out_svg.replace(".svg", ".__tmp.png")
    cv2.imencode(".png", im)[1].tofile(tmp_png)
    vtracer.convert_image_to_svg_py(
        tmp_png, out_svg, colormode="color", hierarchical="stacked", mode="spline",
        filter_speckle=10, color_precision=5, layer_difference=32,
        corner_threshold=64, length_threshold=5.0, max_iterations=10,
        splice_threshold=52, path_precision=1,
    )
    os.remove(tmp_png)


def main(limit=None):
    files = sorted(glob.glob(os.path.join(SRC, "*.webp")))
    if limit:
        files = files[:limit]
    mapping, vec_n, flat_n, fails = {}, 0, 0, []
    t0 = time.time()
    for i, p in enumerate(files, 1):
        name = os.path.basename(p)
        base = os.path.splitext(name)[0]
        try:
            if VEC_RE.search(base):
                out_svg = os.path.join(VEC_DIR, base + ".svg")
                to_svg(p, out_svg)
                mapping[name] = "/images/vec/" + base + ".svg"
                vec_n += 1
            else:
                img = load(p)
                if img is None:
                    fails.append(name)
                    continue
                h, w = img.shape[:2]
                scale = 420 / max(h, w)
                if scale < 1:
                    img = cv2.resize(img, (round(w * scale), round(h * scale)), interpolation=cv2.INTER_AREA)
                out = flat_a(img)
                if scale < 1:
                    out = cv2.resize(out, (w, h), interpolation=cv2.INTER_NEAREST)
                save(os.path.join(DST, name), out)
                flat_n += 1
        except Exception as exc:
            fails.append(f"{name}: {exc}")
        if i % 100 == 0:
            el = time.time() - t0
            print(f"{i}/{len(files)}  vec={vec_n} flat={flat_n}  {el/60:.1f} min  eta {el/i*(len(files)-i)/60:.1f} min", flush=True)

    json.dump(mapping, open(MAP_FILE, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    print(f"done: vector={vec_n} flat={flat_n} failed={len(fails)} in {(time.time()-t0)/60:.1f} min")
    for f in fails[:10]:
        print("  fail:", f)


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else None)
