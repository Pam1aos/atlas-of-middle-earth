// Data pipeline: Markdown knowledge base -> static site data
// Run: node scripts/build-data.mjs
import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';

const HOME = 'C:/Users/yy/Documents';
const DATA_DIR = fs.readdirSync(HOME)
  .filter((d) => d.startsWith('Lord_of_the') && fs.existsSync(path.join(HOME, d, '条目')))
  .map((d) => path.join(HOME, d))[0];
if (!DATA_DIR) throw new Error('data dir not found');
const ENTRIES = path.join(DATA_DIR, '条目');
const IMAGES = path.join(DATA_DIR, '图片');
const OUT = path.resolve('src/data');
const PUB = path.resolve('public/images');
fs.mkdirSync(path.join(OUT, 'bodies'), { recursive: true });
fs.mkdirSync(PUB, { recursive: true });

// ---------------- utilities ----------------
const stripMd = (s) =>
  s.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\*\*/g, '').replace(/\*/g, '').replace(/`/g, '')
    .replace(/\[\^\d+\]/g, '').replace(/<br\s*\/?>/gi, '、').replace(/<[^>]+>/g, '')
    .replace(/\\\|/g, '|').replace(/\s+/g, ' ').trim();

const unescapeAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const titleFromHref = (href) => {
  const clean = decodeURIComponent(href.split('#')[0]);
  return (clean.split('/').pop() || '').replace(/\.md$/, '');
};
const slugify = (t) => t.replace(/[\\/:*?"<>|#]/g, '_').trim();
const parseJsonish = (v, fb) => { try { return JSON.parse(v); } catch { return fb; } };

// ---------------- read ----------------
const SECTIONS = fs.readdirSync(ENTRIES).filter((d) => fs.statSync(path.join(ENTRIES, d)).isDirectory()).sort();
const SECTION_TYPE = {
  '01-角色': 'character', '02-种族与生物': 'race', '03-地理': 'place',
  '04-历史与年表': 'event', '05-物品': 'item', '06-语言与文字': 'language',
  '07-文化与社会': 'culture', '08-音乐': 'music', '09-文学与作品': 'work',
  '10-改编与衍生': 'adaptation', '11-托尔金与学术': 'lore', '12-问答': 'qa',
  '13-维基页务': 'disambig', '14-其他': 'misc',
};

const raw = [];
for (const sec of SECTIONS) {
  for (const fn of fs.readdirSync(path.join(ENTRIES, sec))) {
    if (!fn.endsWith('.md')) continue;
    const text = fs.readFileSync(path.join(ENTRIES, sec, fn), 'utf8');
    let meta = {}, body = text;
    if (text.startsWith('---\n')) {
      const end = text.indexOf('\n---\n', 4);
      if (end > 0) {
        body = text.slice(end + 5);
        for (const line of text.slice(4, end).split('\n')) {
          const i = line.indexOf(':');
          if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
        }
      }
    }
    raw.push({ sec, fn, meta, body });
  }
}

// ---------------- entities ----------------
const byTitle = new Map();
const entities = [];
for (const r of raw) {
  const title = parseJsonish(r.meta.title || '""', r.fn.replace(/\.md$/, ''));
  const e = {
    id: Number(r.meta.pageid || 0),
    slug: slugify(title),
    title,
    english: parseJsonish(r.meta.english || '""', '') || '',
    section: r.sec,
    sectionLabel: r.sec.replace(/^\d+-/, ''),
    type: SECTION_TYPE[r.sec] || 'misc',
    cats: parseJsonish(r.meta.categories || '[]', []),
    flags: parseJsonish(r.meta.flags || '[]', []),
    source: r.meta.source || '',
    updated: r.meta.updated || '',
    aliases: [],
    summary: '',
    image: null,
    facts: [],
    era: null,
    dates: [],
    citedBy: 0,
  };
  byTitle.set(title, e);
  entities.push(e);
}

const REALM_CAT = /王国|国家|帝国|政权|领地|领土/;
const ORG_CAT = /组织|家族|议会|同盟|军团|兄弟会|团体|教会|行会/;
const REALWORLD_CAT = /现实世界/;
for (const e of entities) {
  if (e.type === 'place' && e.cats.some((c) => REALM_CAT.test(c))) e.type = 'realm';
  if (e.type === 'culture' && e.cats.some((c) => ORG_CAT.test(c))) e.type = 'org';
  if (e.type === 'event' && (/^\d{1,2}月\d{1,2}日$/.test(e.title) || /^\d{4}年$/.test(e.title) || /^(双树|第一|第二|第三|第四)纪元\d+年$/.test(e.title))) e.type = 'date';
  if (e.type === 'place' && e.cats.some((c) => REALWORLD_CAT.test(c))) e.type = 'misc';
}

// ---------------- infobox + narrative ----------------
const LINK_RE = /\[([^\]]+)\]\(([^)\s]+)\)/g;
const isTableBlock = (b) => {
  const lines = b.split('\n').filter((l) => l.trim());
  return lines.length > 0 && lines.every((l) => l.trim().startsWith('|'));
};

for (const r of raw) {
  const e = byTitle.get(parseJsonish(r.meta.title || '""', r.fn.replace(/\.md$/, '')));
  const blocks = r.body.split(/\n\s*\n/);
  let i = 0, group = '', image = null, titleLine = '';
  const facts = [];
  const startI = 0;
  while (i < blocks.length) {
    const b = blocks[i].trim();
    if (!b) { i++; continue; }
    if (b.startsWith('>') || b.startsWith('#')) { i++; continue; }
    // hatnote paragraphs (disambiguation pointers) before the infobox
    if (!titleLine && /重名或近似|消歧义页面|本文介绍|本词条叙述/.test(b) && b.length < 300) { i++; continue; }
    const bold = b.match(/^\*\*([^*]+)\*\*$/);
    if (bold) {
      if (!titleLine && facts.length === 0) titleLine = bold[1];
      else group = bold[1];
      i++; continue;
    }
    const img = b.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if (img && !image && facts.length === 0) { image = img[2]; i++; continue; }
    if (/^\*[^*]/.test(b) && !b.startsWith('**') && b.split('\n').length === 1) { i++; continue; }
    if (isTableBlock(b)) {
      for (const line of b.split('\n')) {
        const m = line.match(/^\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*$/);
        if (!m) continue;
        const label = m[1], value = m[2];
        if (!label || label === '项目' || /^-{2,}$/.test(label)) continue;
        if (/^-{2,}$/.test(value)) continue;
        const text = stripMd(value);
        if (!text) continue;
        const links = [];
        for (const lm of value.matchAll(LINK_RE)) {
          const t = titleFromHref(lm[2]);
          if (byTitle.has(t) && t !== e.title) links.push(t);
        }
        facts.push({ group, label: stripMd(label), value, text, links: [...new Set(links)] });
      }
      i++; continue;
    }
    break;
  }
  // nothing resembling an infobox: treat the whole body as narrative
  if (!titleLine && !image && facts.length === 0) i = startI;
  e.image = image;
  e.titleLine = titleLine;
  e.facts = facts;
  e.restBlocks = blocks.slice(i);
}

// ---------------- summary, era, body ----------------
const ERA_RE = /(双树纪元|第一纪元|第二纪元|第三纪元|第四纪元|太阳纪元|月亮纪元)/;
const YEAR_RE = /(\d{1,4})\s*年/;

const ERA_FROM_CAT = [
  [/双树纪元/, '双树纪元'], [/第一纪元/, '第一纪元'], [/第二纪元/, '第二纪元'],
  [/第三纪元/, '第三纪元'], [/第四纪元/, '第四纪元'],
];

for (const e of entities) {
  const rest = (e.restBlocks || []).join('\n\n').trim();
  const paras = rest.split(/\n\s*\n/);
  let summary = '';
  for (const p of paras) {
    const t = p.trim();
    if (!t || t.startsWith('|') || t.startsWith('#') || t.startsWith('![') || t.startsWith('>') || t.startsWith('<')) continue;
    if (/^\*\*[^*]+\*\*$/.test(t) || /^\*[^*]+\*$/.test(t)) continue;
    if (t.includes('重名或近似')) continue;
    const plain = stripMd(t);
    if (plain.length >= 15) { summary = plain; break; }
  }
  e.summary = summary.slice(0, 180);

  // era from category
  for (const [rx, era] of ERA_FROM_CAT) if (e.cats.some((c) => rx.test(c))) { e.era = era; break; }

  // body: strip footnote defs, trailing source, then re-attach footnotes
  let md = rest;
  const fnDefs = [];
  for (const m of md.matchAll(/^\[\^(\d+)\]:\s*(.+)$/gm)) fnDefs.push({ n: m[1], text: m[2] });
  md = md.replace(/^\[\^(\d+)\]:.*$/gm, '');
  md = md.replace(/\n---\s*\n[\s\S]*$/, '');
  e.bodyMd = md.trim();
  e.footnotes = fnDefs;

  // dates from facts
  const dateFacts = e.facts.filter((f) => /时间|出生|死亡|日期|年份|建立|成立|解散|发售|上映/.test(f.label));
  for (const f of dateFacts) {
    // "巨灯纪元3450年 - 第一纪元1年" must take the year that follows the era token,
    // otherwise a range with two epochs records the wrong year.
    const eraMatch = ERA_RE.exec(f.text);
    const era = (eraMatch && eraMatch[1]) || e.era;
    let year = null;
    if (eraMatch) {
      const after = f.text.slice(eraMatch.index + eraMatch[1].length).match(YEAR_RE);
      if (after) year = Number(after[1]);
    }
    if (year === null) {
      const ym = f.text.match(YEAR_RE);
      if (ym) year = Number(ym[1]);
    }
    if (era && year) e.dates.push({ label: f.label, era, year, text: f.text });
  }
  if (!e.era && e.dates.length) e.era = e.dates[0].era;
}

// title-based era for events like "第一纪元495年"
for (const e of entities) {
  const m = e.title.match(/^(双树纪元|第一纪元|第二纪元|第三纪元|第四纪元)(\d+)年$/);
  if (m) { e.era = m[1]; e.dates.unshift({ label: '时间', era: m[1], year: Number(m[2]), text: e.title }); }
}

// ---------------- aliases ----------------
const aliasFile = path.join(DATA_DIR, '索引', '别名与重定向索引.md');
const aliasMap = new Map();
for (const line of fs.readFileSync(aliasFile, 'utf8').split('\n')) {
  const m = line.match(/^\|\s*([^|]+?)\s*\|\s*\[([^\]]+)\]\([^)]*\)\s*\|\s*$/);
  if (!m) continue;
  const [, alias, target] = m;
  if (alias.trim() === '别名' || !byTitle.has(target.trim())) continue;
  aliasMap.set(alias.trim(), target.trim());
}
for (const [alias, target] of aliasMap) {
  const e = byTitle.get(target);
  if (e && alias !== e.title && e.aliases.length < 12) e.aliases.push(alias);
}

// ---------------- relations ----------------
const REL_RULES = [
  [/^(种族)$/, 'race', '种族', true],
  [/^(家族|氏族)$/, 'family', '家族', true],
  [/^(文化)$/, 'culture', '文化', true],
  [/^(父亲|母亲|父母)$/, 'parent', '父母', true],
  [/^(子嗣|子女|儿子|女儿)$/, 'child', '子嗣', true],
  [/^(配偶|妻子|丈夫)$/, 'spouse', '配偶', false],
  [/^(兄弟姐妹|兄弟|姐妹)$/, 'sibling', '兄弟姐妹', false],
  [/^(居住地|定居地)$/, 'residence', '居住于', true],
  [/^(头衔)$/, 'title', '头衔', true],
  [/^(国家\/地区|所属地区|所在地|所在地区|所属国家)$/, 'located', '位于', true],
  [/^(地理位置)$/, 'located', '位于', true],
  [/^(住民|人民)$/, 'inhabitant', '住民', true],
  [/^(地点)$/, 'place', '发生地点', true],
  [/^(事件)$/, 'event', '相关事件', true],
  [/^(相关角色|主要人物|主要成员|成员)$/, 'member', '成员', true],
  [/^(所有者|持有者|拥有者)$/, 'owner', '所有者', true],
  [/^(制造者|创造者)$/, 'creator', '制造者', true],
  [/^(领袖|统治者)$/, 'leader', '领袖', true],
  [/^(导演)$/, 'director', '导演', true],
  [/^(主演)$/, 'actor', '主演', true],
  [/^(收信人|写信人)$/, 'correspondence', '通信', true],
  [/^(首都|主要城镇)$/, 'contains', '包含', true],
  [/^(战役)$/, 'battle', '战役', true],
  [/^(书目|涉及书目|涉及作品|作品)$/, 'work', '出现于', true],
];

const relations = [];
const seen = new Set();
for (const e of entities) {
  for (const f of e.facts) {
    const rule = REL_RULES.find(([rx]) => rx.test(f.label));
    if (!rule) continue;
    const [, type, label, directed] = rule;
    for (const target of f.links) {
      const t = byTitle.get(target);
      if (!t) continue;
      const key = `${e.title}>${t.title}>${type}`;
      if (seen.has(key)) continue;
      seen.add(key);
      relations.push({
        id: `${e.id}-${t.id}-${type}`,
        s: e.slug,
        t: t.slug,
        type,
        label,
        directed,
        evidence: `信息框 · ${f.label}`,
        evidenceText: f.text.slice(0, 120),
      });
    }
  }
}

// ---------------- wiki link graph (page references, not facts) ----------------
const inbound = new Map();
for (const e of entities) {
  const set = new Set();
  for (const m of (e.bodyMd || '').matchAll(LINK_RE)) {
    const t = titleFromHref(m[2]);
    if (byTitle.has(t) && t !== e.title) set.add(t);
  }
  e.outlinks = set.size;
  for (const t of set) inbound.set(t, (inbound.get(t) || 0) + 1);
}
for (const e of entities) e.citedBy = inbound.get(e.title) || 0;

// ---------------- render ----------------
marked.setOptions({ gfm: true, breaks: false });

function inlineHtml(md) {
  let s = md;
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, alt, src) => {
    const name = decodeURIComponent(src.split('/').pop()).replace(/\.(jpe?g|png|gif|webp)$/i, '.webp');
    return `<img class="wiki-img" src="/images/${name}" alt="${unescapeAttr(alt)}" loading="lazy" decoding="async">`;
  });
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, text, href) => {
    if (/^https?:/.test(href)) return `<a class="ext-link" href="${unescapeAttr(href)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    if (!/\.md$/.test(href)) return text;
    const target = byTitle.get(titleFromHref(href));
    if (!target) return text;
    return `<a class="wiki-link" href="/entry/${encodeURIComponent(target.slug)}/">${text}</a>`;
  });
  s = s.replace(/\[\^(\d+)\]/g, '');
  s = s.replace(/<br\s*\/?>/gi, '<br>');
  return marked.parseInline(s);
}

function bodyHtml(e) {
  let md = e.bodyMd || '';
  // images / links to HTML first so marked keeps them intact
  md = md.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, alt, src) => {
    const name = decodeURIComponent(src.split('/').pop()).replace(/\.(jpe?g|png|gif|webp)$/i, '.webp');
    return `<img class="wiki-img" src="/images/${name}" alt="${unescapeAttr(alt)}" loading="lazy" decoding="async" />`;
  });
  md = md.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, text, href) => {
    if (/^https?:/.test(href)) return `<a class="ext-link" href="${unescapeAttr(href)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    if (!/\.md$/.test(href)) return text;
    const target = byTitle.get(titleFromHref(href));
    if (!target) return text;
    return `<a class="wiki-link" href="/entry/${encodeURIComponent(target.slug)}/">${text}</a>`;
  });
  // footnote refs
  md = md.replace(/\[\^(\d+)\]/g, (m, n) => `<sup class="fn-ref"><a href="#fn-${n}" id="fnref-${n}">${n}</a></sup>`);
  let html = marked.parse(md);
  if (e.footnotes.length) {
    html += '<section class="footnotes"><h2 class="fn-title">注释</h2><ol>' +
      e.footnotes.map((f) => `<li id="fn-${f.n}">${inlineHtml(f.text)} <a class="fn-back" href="#fnref-${f.n}">↩</a></li>`).join('') +
      '</ol></section>';
  }
  return html;
}

// ---------------- write ----------------
const missingImages = new Set();
for (const e of entities) {
  e.bodyHtml = bodyHtml(e);
  fs.writeFileSync(path.join(OUT, 'bodies', `${e.slug}.html`), e.bodyHtml);
  if (e.image) {
    const name = decodeURIComponent(e.image.split('/').pop()).replace(/\.(jpe?g|png|gif|webp)$/i, '.webp');
    e.image = `/images/${name}`;
    if (!fs.existsSync(path.join(PUB, name))) missingImages.add(name);
  }
  // facts html
  for (const f of e.facts) f.html = inlineHtml(f.value);
  e.factGroups = [];
  let g = null;
  for (const f of e.facts) {
    const gname = f.group || '基本信息';
    if (!g || g.name !== gname) { g = { name: gname, rows: [] }; e.factGroups.push(g); }
    g.rows.push({ label: f.label, html: f.html, text: f.text });
  }
  delete e.facts;
  delete e.bodyMd;
  delete e.footnotes;
  delete e.outlinks;
  delete e.titleLine;
}

const slim = entities.map((e) => ({
  id: e.id, slug: e.slug, title: e.title, english: e.english,
  type: e.type, section: e.section, sectionLabel: e.sectionLabel,
  cats: e.cats, flags: e.flags, aliases: e.aliases, summary: e.summary,
  image: e.image, era: e.era, dates: e.dates, source: e.source,
  updated: e.updated, citedBy: e.citedBy, factGroups: e.factGroups,
}));

fs.writeFileSync(path.join(OUT, 'entities.json'), JSON.stringify(slim));
fs.writeFileSync(path.join(OUT, 'relations.json'), JSON.stringify(relations));

// ---------------- graph payload (public, lazy loaded) ----------------
const bySlug = new Map(slim.map((e) => [e.slug, e]));

// keep parent->child, drop mirrored child edges; dedupe symmetric pairs
const SYN = new Set(['spouse', 'sibling']);
const kept = [];
const seenEdge = new Set();
const pairKey = (a, b) => [a, b].sort().join('|');
for (const r of relations) {
  if (r.type === 'child') {
    const mirrored = relations.some((x) => x.type === 'parent' && x.s === r.t && x.t === r.s);
    if (mirrored) continue;
  }
  let key;
  if (SYN.has(r.type)) key = r.type + ':' + pairKey(r.s, r.t);
  else key = `${r.type}:${r.s}:${r.t}`;
  if (seenEdge.has(key)) continue;
  seenEdge.add(key);
  kept.push(r);
}
const deg = new Map();
for (const r of kept) {
  deg.set(r.s, (deg.get(r.s) || 0) + 1);
  deg.set(r.t, (deg.get(r.t) || 0) + 1);
}
const graphNodes = slim
  .filter((e) => (deg.get(e.slug) || 0) > 0)
  .map((e) => ({ id: e.slug, label: e.title, type: e.type, deg: deg.get(e.slug) || 0 }));
const graph = { nodes: graphNodes, edges: kept.map((r) => ({ s: r.s, t: r.t, type: r.type, label: r.label, dir: r.directed })) };
fs.mkdirSync(path.resolve('public/data'), { recursive: true });
fs.writeFileSync(path.resolve('public/data/graph.json'), JSON.stringify(graph));
fs.writeFileSync(path.resolve('public/data/search.json'), JSON.stringify(entities.map((e) => [e.slug, e.title, e.english, e.aliases.join('|'), e.type])));

// curated home subgraph: highest-degree character + 1 hop
const hero =
  slim.filter((e) => e.type === 'character' && (deg.get(e.slug) || 0) > 20).sort((a, b) => (deg.get(b.slug) || 0) - (deg.get(a.slug) || 0))[0] ||
  slim.filter((e) => (deg.get(e.slug) || 0) > 0).sort((a, b) => (deg.get(b.slug) || 0) - (deg.get(a.slug) || 0))[0];
const ego = (center, hops = 1, cap = 46) => {
  const nodes = new Set([center.slug]);
  let frontier = [center.slug];
  for (let h = 0; h < hops; h++) {
    const next = [];
    for (const r of kept) {
      if (frontier.includes(r.s) && !nodes.has(r.t) && nodes.size < cap) { nodes.add(r.t); next.push(r.t); }
      else if (frontier.includes(r.t) && !nodes.has(r.s) && nodes.size < cap) { nodes.add(r.s); next.push(r.s); }
    }
    frontier = next;
  }
  return {
    center: center.slug,
    nodes: [...nodes].map((s) => ({ id: s, label: bySlug.get(s).title, type: bySlug.get(s).type })),
    edges: kept.filter((r) => nodes.has(r.s) && nodes.has(r.t)).map((r) => ({ s: r.s, t: r.t, label: r.label, type: r.type, dir: r.directed })),
  };
};
fs.writeFileSync(path.resolve('public/data/home-graph.json'), JSON.stringify(ego(hero, 1, 30)));

// search index
const search = entities.map((e) => [e.slug, e.title, e.english, e.aliases.join('|'), e.type]);
fs.writeFileSync(path.join(OUT, 'search.json'), JSON.stringify(search));

// ---------------- stats + quality report ----------------
const typeCount = {};
for (const e of entities) typeCount[e.type] = (typeCount[e.type] || 0) + 1;
const relType = {};
for (const r of relations) relType[r.type] = (relType[r.type] || 0) + 1;

const noImage = entities.filter((e) => !e.image).length;
const noSummaries = entities.filter((e) => !e.summary).length;
const noSource = entities.filter((e) => !e.source).length;
const titleCount = {};
for (const e of entities) titleCount[e.title] = (titleCount[e.title] || 0) + 1;
const dupTitles = Object.entries(titleCount).filter(([, n]) => n > 1);

// dangling relations
let dangling = 0;
const slugs = new Set(entities.map((e) => e.slug));
for (const r of relations) if (!slugs.has(r.s) || !slugs.has(r.t)) dangling++;

const stats = {
  entities: entities.length,
  relations: relations.length,
  types: typeCount,
  relationTypes: relType,
  noImage,
  noSummary: noSummaries,
  noSource,
  dupeTitles: dupTitles.length,
  danglingRelations: dangling,
  missingImageFiles: [...missingImages].length,
  totalFacts: entities.reduce((n, e) => n + e.factGroups.reduce((m, g) => m + g.rows.length, 0), 0),
  withFacts: entities.filter((e) => e.factGroups.length).length,
  aliases: aliasMap.size,
  generatedAt: new Date().toISOString(),
};
fs.writeFileSync(path.join(OUT, 'stats.json'), JSON.stringify(stats, null, 2));

console.log(JSON.stringify(stats, null, 1));
