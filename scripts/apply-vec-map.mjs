/**
 * Apply the vector-image map (produced by scripts/flatten-images.py) to the
 * generated data, so pages point at /images/vec/*.svg for emblems and maps.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('.');
const MAP_FILE = path.join(ROOT, 'src/data/image-vec.json');
if (!fs.existsSync(MAP_FILE)) {
  console.log('no image-vec.json, nothing to do');
  process.exit(0);
}
const map = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));
const entries = Object.entries(map);
console.log('vector entries:', entries.length);

let touched = 0;

// 1) entities.json — the `image` field
const entFile = path.join(ROOT, 'src/data/entities.json');
let ent = fs.readFileSync(entFile, 'utf8');
for (const [name, url] of entries) {
  const before = ent;
  ent = ent.split(`"/images/${name}"`).join(`"${url}"`);
  if (before !== ent) touched++;
}
fs.writeFileSync(entFile, ent);

// 2) prerendered bodies — inline <img src="/images/...">
const bodiesDir = path.join(ROOT, 'src/data/bodies');
let files = 0;
for (const f of fs.readdirSync(bodiesDir)) {
  const p = path.join(bodiesDir, f);
  let html = fs.readFileSync(p, 'utf8');
  const original = html;
  for (const [name, url] of entries) {
    if (html.includes(name)) html = html.split(`/images/${name}`).join(url);
  }
  if (html !== original) {
    fs.writeFileSync(p, html);
    files++;
  }
}

console.log(`entities updated: ${touched}; body files updated: ${files}`);
