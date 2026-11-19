/**
 * Trace the uploaded Map_of_Middle-Earth.svg into an Organic-Biophilic styled
 * vector: keep only the geographic geometry (coast, rivers, lakes, mountains,
 * forests, cities), drop frame / legend / lettering, and bake our palette in.
 *
 *   node scripts/build-map.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve('assets/Map_of_Middle-Earth.svg');
const OUT = path.resolve('public/maps/middle-earth-organic.svg');

const raw = fs.readFileSync(SRC, 'utf8');

/** return the inner markup of <g id="...">…</g>, handling nesting */
function group(id) {
  const start = raw.indexOf(`<g id="${id}"`);
  if (start < 0) return '';
  const open = raw.indexOf('>', start) + 1;
  let depth = 1;
  let i = open;
  const re = /<g\b|<\/g>/g;
  re.lastIndex = open;
  let m;
  while ((m = re.exec(raw))) {
    if (m[0].startsWith('</')) depth--;
    else depth++;
    if (depth === 0) { i = m.index; break; }
  }
  return raw.slice(open, i);
}

// keep <g> wrappers intact (nested groups would otherwise become unbalanced)
const stripPaint = (s) =>
  s.replace(/\s(fill|stroke|stroke-width|stroke-miterlimit|stroke-linecap|stroke-linejoin|opacity|style)="[^"]*"/g, '');

/** trim coordinates: 1234.5678 -> 1234.6, and tidy whitespace */
const tidy = (s) =>
  s
    .replace(/-?\d+\.\d{2,}/g, (n) => String(Math.round(Number(n) * 10) / 10))
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .trim();

const parts = {
  coastline: stripPaint(group('coastline')),
  rivers: stripPaint(group('rivers')),
  lakes: stripPaint(group('lakes')),
  mountains: stripPaint(group('mountains_and_forests')) + stripPaint(group('Berge')),
  forests: stripPaint(group('mirkwood')),
  cities: stripPaint(group('cities')),
};

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3200 2400" width="3200" height="2400">
<defs>
<linearGradient id="land" x1="0.15" y1="0" x2="0.6" y2="1">
<stop offset="0%" stop-color="#faf7ee"/><stop offset="55%" stop-color="#f3efdf"/><stop offset="100%" stop-color="#eae3ce"/>
</linearGradient>
<radialGradient id="sea" cx="50%" cy="42%" r="72%">
<stop offset="0%" stop-color="#e3ebd7"/><stop offset="100%" stop-color="#cfdcbe"/>
</radialGradient>
</defs>
<rect x="-200" y="-200" width="3600" height="2800" fill="url(#sea)"/>
<g id="coast" fill="none" stroke="#33472f" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">${parts.coastline}</g>
<g id="lakes" fill="none" stroke="#7ea3b0" stroke-width="5" stroke-linecap="round">${parts.lakes}</g>
<g id="rivers" fill="#8fb6c0" stroke="none" opacity=".85">${parts.rivers}</g>
<g id="mountains" fill="#6b5543" stroke="none" opacity=".5">${parts.mountains}</g>
<g id="forests" fill="#5f7d42" stroke="none" opacity=".55">${parts.forests}</g>
<g id="cities" fill="#2f4a2c" stroke="none" opacity=".75">${parts.cities}</g>
</svg>`;

const tidied = tidy(svg);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, tidied);
console.log('wrote', OUT, (tidied.length / 1024).toFixed(0) + ' KB');
