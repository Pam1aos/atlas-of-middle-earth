import { useEffect, useMemo, useRef, useState } from 'react';
import { TYPE_META, ERAS } from '../lib/types';

export interface Row {
  slug: string;
  title: string;
  english: string;
  type: string;
  era: string;
  image: string | null;
  aliases: string;
  summary: string;
  cited: number;
}

const PAGE = 24;

const norm = (s: string) => s.toLowerCase().trim();

function score(r: Row, q: string): number {
  const t = norm(r.title);
  if (t === q) return 100;
  if (t.startsWith(q)) return 85;
  if (t.includes(q)) return 65;
  if (r.english && norm(r.english).includes(q)) return 55;
  if (r.aliases) {
    for (const a of r.aliases.split('|')) {
      if (norm(a).includes(q)) return 45;
    }
  }
  if (r.summary && r.summary.toLowerCase().includes(q)) return 20;
  return 0;
}

function readUrl() {
  const p = new URLSearchParams(window.location.search);
  return {
    q: p.get('q') || '',
    type: p.get('type') || '',
    era: p.get('era') || '',
    sort: p.get('sort') || 'relevance',
  };
}

export default function BrowseApp({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [era, setEra] = useState('');
  const [sort, setSort] = useState('relevance');
  const [limit, setLimit] = useState(PAGE);
  const [ready, setReady] = useState(false);
  const timer = useRef<number | null>(null);
  const [input, setInput] = useState('');

  useEffect(() => {
    const s = readUrl();
    setQ(s.q); setInput(s.q); setType(s.type); setEra(s.era); setSort(s.sort);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (type) p.set('type', type);
    if (era) p.set('era', era);
    if (sort !== 'relevance') p.set('sort', sort);
    const qs = p.toString();
    history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, [q, type, era, sort, ready]);

  useEffect(() => { setLimit(PAGE); }, [q, type, era, sort]);

  const onInput = (v: string) => {
    setInput(v);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setQ(v.trim()), 220);
  };

  const typeCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of rows) c[r.type] = (c[r.type] || 0) + 1;
    return c;
  }, [rows]);

  /**
   * Era coverage differs per entity type: only characters, places, events, items…
   * carry an era in the wiki categories. Options are therefore computed from the
   * currently selected type so that an impossible combination can never be chosen.
   */
  const eraOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of rows) {
      if (!r.era) continue;
      if (type && r.type !== type) continue;
      counts[r.era] = (counts[r.era] || 0) + 1;
    }
    return ERAS.filter((e) => counts[e] > 0).map((e) => ({ era: e, count: counts[e] }));
  }, [rows, type]);

  // keep the era filter valid when the type changes
  useEffect(() => {
    if (era && !eraOptions.some((o) => o.era === era)) setEra('');
  }, [eraOptions, era]);

  const filtered = useMemo(() => {
    const query = norm(q);
    let out = rows;
    if (type) out = out.filter((r) => r.type === type);
    if (era) out = out.filter((r) => r.era === era);
    if (query) {
      const scored = out
        .map((r) => ({ r, s: score(r, query) }))
        .filter((x) => x.s > 0);
      scored.sort((a, b) => b.s - a.s || b.r.cited - a.r.cited);
      out = scored.map((x) => x.r);
      if (sort !== 'relevance') out = sortRows(out, sort);
      return out;
    }
    return sortRows(out, sort);
  }, [rows, q, type, era, sort]);

  function sortRows(list: Row[], mode: string) {
    const copy = [...list];
    if (mode === 'name') copy.sort((a, b) => a.title.localeCompare(b.title, 'zh-Hans-CN'));
    else if (mode === 'cited') copy.sort((a, b) => b.cited - a.cited);
    else copy.sort((a, b) => (b.image ? 1 : 0) - (a.image ? 1 : 0) || b.cited - a.cited);
    return copy;
  }

  const visible = filtered.slice(0, limit);
  const hasFilters = !!(q || type || era || sort !== 'relevance');

  const clearAll = () => { setQ(''); setInput(''); setType(''); setEra(''); setSort('relevance'); };

  return (
    <div>
      <div className="filterbar">
        <div className="wrap">
          <div className="filterbar__row">
            <label className="search-field">
              <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
                <path d="m13.5 13.5 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <span className="sr-only">搜索名称或别名</span>
              <input
                value={input}
                onChange={(e) => onInput(e.target.value)}
                placeholder="搜索名称、英文名或别名，例如「阿拉贡」「Shire」"
                autoComplete="off"
                spellCheck={false}
              />
              {input && (
                <button className="clear-btn" onClick={() => { setInput(''); setQ(''); }} aria-label="清空搜索">清空</button>
              )}
            </label>

            {eraOptions.length > 0 && (
              <label>
                <span className="sr-only">时代</span>
                <select className="select" value={era} onChange={(e) => setEra(e.target.value)}>
                  <option value="">全部时代</option>
                  {eraOptions.map((o) => (
                    <option key={o.era} value={o.era}>{o.era}（{o.count}）</option>
                  ))}
                </select>
              </label>
            )}

            <label>
              <span className="sr-only">排序</span>
              <select className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="relevance">默认排序</option>
                <option value="name">按名称</option>
                <option value="cited">按被引用次数</option>
              </select>
            </label>
          </div>

          <div className="chip-scroll" role="group" aria-label="按类型筛选">
            <button className="chip" aria-pressed={type === ''} onClick={() => setType('')}>
              全部 <span className="count">{rows.length}</span>
            </button>
            {Object.entries(typeCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([t, n]) => (
                <button
                  key={t}
                  className="chip"
                  aria-pressed={type === t}
                  onClick={() => setType(type === t ? '' : t)}
                >
                  <span className="qs-dot" style={{ background: (TYPE_META[t] || TYPE_META.misc).color }} aria-hidden="true" />
                  {(TYPE_META[t] || TYPE_META.misc).label} <span className="count">{n}</span>
                </button>
              ))}
          </div>
        </div>
      </div>

      <div className="wrap">
        <div className="result-meta">
          <span>共 <strong>{filtered.length.toLocaleString('zh-CN')}</strong> 条</span>
          {q && <span>关键词「{q}」</span>}
          {type && <span>类型：{(TYPE_META[type] || TYPE_META.misc).label}</span>}
          {era && <span>时代：{era}</span>}
          {hasFilters && <button className="clear-btn" onClick={clearAll}>清除全部筛选</button>}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <h3>没有符合条件的条目</h3>
            <p>试试更短的关键词，或放宽类型与时代筛选。</p>
            <p style={{ marginTop: '1rem' }}><button className="btn btn--ghost" onClick={clearAll}>清除筛选条件</button></p>
          </div>
        ) : (
          <>
            <div className="card-grid">
              {visible.map((r) => (
                <a className="ecard" key={r.slug} href={`/entry/${encodeURIComponent(r.slug)}/`}>
                  <div className="ecard__media">
                    {r.image
                      ? <img src={r.image} alt={`${r.title} — 魔戒中文维基插图`} width="480" height="360" loading="lazy" decoding="async" />
                      : <div className="ecard__placeholder" aria-hidden="true">{(TYPE_META[r.type] || TYPE_META.misc).glyph}</div>}
                  </div>
                  <div className="ecard__body">
                    <div className="row" style={{ gap: '.35rem' }}>
                      <span className="tbadge" style={{ '--tb': (TYPE_META[r.type] || TYPE_META.misc).color } as any}>
                        {(TYPE_META[r.type] || TYPE_META.misc).label}
                      </span>
                      {r.era && <span className="tbadge">{r.era}</span>}
                    </div>
                    <h3 className="ecard__title">{r.title}</h3>
                    {r.english && <div className="ecard__en">{r.english}</div>}
                    {r.summary && <p className="ecard__sum">{r.summary}</p>}
                  </div>
                </a>
              ))}
            </div>

            {limit < filtered.length && (
              <div className="load-more">
                <button className="btn" onClick={() => setLimit((l) => l + PAGE * 2)}>
                  加载更多（还有 {(filtered.length - limit).toLocaleString('zh-CN')} 条）
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
