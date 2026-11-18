# -*- coding: utf-8 -*-
"""Survey the infobox fact labels per section so relation rules match reality."""
import os, re, json, collections, glob

CAND = [d for d in glob.glob(r"C:\Users\yy\Documents\Lord_of_the*") if os.path.isdir(os.path.join(d, "条目"))]
ROOT = os.path.join(CAND[0], "条目") if CAND else None
print("data dir:", ROOT)
LINK = re.compile(r"\[([^\]]*)\]\(([^)]+)\)")

def parse(path):
    s = open(path, encoding="utf-8").read()
    meta, body = {}, s
    if s.startswith("---\n"):
        end = s.find("\n---\n", 4)
        head, body = s[4:end], s[end+5:]
        for line in head.splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                meta[k.strip()] = v.strip()
    return meta, body

def facts(body):
    """Extract (group,label,value) triples from the leading infobox tables."""
    out = []
    group = ""
    for line in body.splitlines():
        line = line.strip()
        if line.startswith("**") and line.endswith("**") and "：" not in line:
            group = line.strip("*")
            continue
        m = re.match(r"^\|\s*([^|]+?)\s*\|\s*(.+?)\s*\|$", line)
        if m and m.group(1) not in ("项目", "---"):
            out.append((group, m.group(1).strip(), m.group(2).strip()))
    return out

by_section = collections.defaultdict(collections.Counter)
counts = collections.Counter()
nfiles = 0
for sec in os.listdir(ROOT):
    d = os.path.join(ROOT, sec)
    if not os.path.isdir(d):
        continue
    for fn in os.listdir(d):
        if not fn.endswith(".md"):
            continue
        nfiles += 1
        meta, body = parse(os.path.join(d, fn))
        fs = facts(body)
        counts[sec] += 1
        for g, l, v in fs:
            by_section[sec][l] += 1

print("files:", nfiles)
for sec, c in counts.most_common():
    print(f"\n=== {sec} ({c}) top labels ===")
    print(", ".join(f"{l}({n})" for l, n in by_section[sec].most_common(18)))
