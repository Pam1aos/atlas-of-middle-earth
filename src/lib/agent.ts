export interface AgentRec {
  s: string; t: string; e: string; ty: string; er: string; su: string;
  f: string[]; r: string[];
}

export type SearchRow = [string, string, string, string, string];

export type Block =
  | { kind: 'p'; text: string }
  | { kind: 'h'; text: string }
  | { kind: 'facts'; rows: [string, string][] }
  | { kind: 'rels'; items: { title: string; slug: string; label: string }[] }
  | { kind: 'links'; items: { title: string; slug: string }[] }
  | { kind: 'note'; text: string };

export interface Answer {
  blocks: Block[];
  sources: string[];
  entity: string | null;
}

const TYPE_LABEL: Record<string, string> = {
  character: '人物', race: '种族', place: '地点', realm: '势力', org: '组织', event: '事件',
  item: '物品', language: '语言', culture: '文化', music: '音乐', work: '作品', adaptation: '改编',
  lore: '研究', date: '年代', qa: '问答', disambig: '消歧义', misc: '其他',
};

export const typeLabel = (t: string) => TYPE_LABEL[t] || '条目';

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '').trim();

/** long titles first so "阿拉贡一世" wins over "阿拉贡" */
export function buildLookup(index: SearchRow[]) {
  const map = new Map<string, string>();
  const rows = [...index].sort((a, b) => b[1].length - a[1].length);
  for (const [slug, title, english, aliases] of rows) {
    map.set(norm(title), slug);
    if (english) map.set(norm(english), slug);
    for (const a of (aliases || '').split('|')) if (a.trim()) map.set(norm(a), slug);
  }
  return map;
}

/** find the entity the question is about; falls back to keyword scoring */
export function resolveQuery(q: string, index: SearchRow[], lookup: Map<string, string>): string | null {
  const raw = q.trim();
  if (!raw) return null;
  const n = norm(raw);
  if (lookup.has(n)) return lookup.get(n)!;

  // longest title contained in the question ("阿拉贡的父亲是谁" -> 阿拉贡)
  let best: { slug: string; len: number } | null = null;
  for (const [slug, title] of index.map((r) => [r[0], r[1]] as const)) {
    const t = norm(title);
    if (t.length >= 2 && n.includes(t) && (!best || t.length > best.len)) best = { slug, len: t.length };
  }
  if (best) return best.slug;

  // keyword overlap against title + summary
  const tokens = raw.split(/[\s，。,.、?？!！:：;；"“”()（）]+/).filter((t) => t.length >= 2);
  let top: { slug: string; score: number } | null = null;
  for (const row of index) {
    const hay = norm(row[1] + (row[3] || ''));
    let score = 0;
    for (const tk of tokens) if (hay.includes(norm(tk))) score += norm(tk).length;
    if (score > 0 && (!top || score > top.score)) top = { slug: row[0], score };
  }
  return top ? top.slug : null;
}

const relTitle = (r: string) => r.split('|')[1] || '关联';

export function buildAnswer(
  question: string,
  entitySlug: string | null,
  mode: 'brief' | 'deep',
  recs: Map<string, AgentRec>,
  opts: { llm?: boolean } = {},
): Answer {
  if (!entitySlug) {
    return {
      blocks: [
        { kind: 'p', text: '我没有在条目库里找到与这个问题直接对应的条目。可以换成具体的名字再试一次，比如「阿拉贡」「夏尔」「魔戒大战」「摩瑞亚」。' },
        { kind: 'note', text: '这个问题只在本地的 5,303 个条目与 10,063 条关系中检索，没有联网。' },
      ],
      sources: [],
      entity: null,
    };
  }

  const rec = recs.get(entitySlug)!;
  const label = typeLabel(rec.ty);
  const sources: string[] = [rec.s];
  const blocks: Block[] = [];

  const lead = rec.su
    ? rec.su
    : `${rec.t}${rec.e ? `（${rec.e}）` : ''}是数据库中的一个${label}条目。`;

  blocks.push({ kind: 'p', text: lead });

  if (mode === 'brief') {
    if (rec.f.length) {
      blocks.push({ kind: 'facts', rows: rec.f.slice(0, 3).map((f) => f.split('|') as [string, string]) });
    }
    return { blocks, sources, entity: rec.s };
  }

  // ---- deep mode: structured expansion over the local graph ----
  if (rec.f.length) {
    blocks.push({ kind: 'h', text: '关键事实' });
    blocks.push({ kind: 'facts', rows: rec.f.map((f) => f.split('|') as [string, string]) });
  }

  const rels = rec.r
    .map((r) => {
      const [slug, lbl, dir] = r.split('|');
      const other = recs.get(slug);
      if (!other) return null;
      sources.push(slug);
      return { title: other.t, slug, label: dir === 'in' ? `${lbl}（反向）` : lbl };
    })
    .filter(Boolean) as { title: string; slug: string; label: string }[];

  if (rels.length) {
    blocks.push({ kind: 'h', text: '与它相连的条目' });
    blocks.push({ kind: 'rels', items: rels.slice(0, 8) });
  }

  // second hop: the neighbours of the neighbours, as "联想"
  const second = new Map<string, number>();
  for (const r of rec.r) {
    const [slug] = r.split('|');
    const other = recs.get(slug);
    if (!other) continue;
    for (const rr of other.r) {
      const [s2] = rr.split('|');
      if (s2 === rec.s || rec.r.some((x) => x.split('|')[0] === s2)) continue;
      second.set(s2, (second.get(s2) || 0) + 1);
    }
  }
  const related = [...second.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([slug]) => recs.get(slug))
    .filter(Boolean)
    .map((r) => ({ title: r!.t, slug: r!.s }));
  if (related.length) {
    blocks.push({ kind: 'h', text: '可能相关的条目' });
    blocks.push({ kind: 'links', items: related });
  }

  if (opts.llm) {
    blocks.push({ kind: 'note', text: '以上为本地结构化结果，正在用大模型整合…' });
  } else {
    blocks.push({
      kind: 'note',
      text: '深入模式沿关系图谱做一跳、两跳的关联展开，只使用本地条目与关系，不调用语言模型。',
    });
  }

  return { blocks, sources: [...new Set(sources)].slice(0, 10), entity: rec.s };
}

/** context string handed to an optional LLM */
export function buildContext(rec: AgentRec, recs: Map<string, AgentRec>): string {
  const lines = [
    `条目：${rec.t}${rec.e ? `（${rec.e}）` : ''}`,
    `类型：${typeLabel(rec.ty)}${rec.er ? `；纪元：${rec.er}` : ''}`,
    rec.su ? `摘要：${rec.su}` : '',
    rec.f.length ? `信息框：\n${rec.f.map((f) => `- ${f.replace('|', '：')}`).join('\n')}` : '',
  ].filter(Boolean);

  const rels = rec.r
    .map((r) => {
      const [slug, lbl, dir] = r.split('|');
      const o = recs.get(slug);
      if (!o) return '';
      return `- ${o.t}（${dir === 'in' ? '反向' : ''}${lbl}）`;
    })
    .filter(Boolean);
  if (rels.length) lines.push(`关系：\n${rels.join('\n')}`);
  return lines.join('\n');
}
