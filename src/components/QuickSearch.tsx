import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TYPE_META } from '../lib/types';

type Row = [string, string, string, string, string]; // slug, title, english, aliases, type

let cache: Row[] | null = null;

async function loadIndex(): Promise<Row[]> {
  if (cache) return cache;
  const res = await fetch('/data/search.json');
  cache = (await res.json()) as Row[];
  return cache;
}

function score(row: Row, q: string): number {
  const [slug, title, english, aliases] = row;
  const hay = [title, english, ...aliases.split('|')].filter(Boolean);
  const t = title.toLowerCase();
  if (t === q) return 100;
  if (t.startsWith(q)) return 90;
  if (t.includes(q)) return 70;
  for (const h of hay) {
    const v = h.toLowerCase();
    if (v === q) return 85;
    if (v.startsWith(q)) return 60;
    if (v.includes(q)) return 40;
  }
  if (slug.toLowerCase().includes(q)) return 20;
  return 0;
}

export default function QuickSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    inputRef.current?.focus();
    loadIndex().then(setRows).catch(() => setRows([]));
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return rows.slice(0, 8);
    const scored: Array<{ row: Row; s: number }> = [];
    for (const r of rows) {
      const s = score(r, query);
      if (s > 0) scored.push({ row: r, s });
    }
    scored.sort((a, b) => b.s - a.s);
    return scored.slice(0, 12).map((x) => x.row);
  }, [q, rows]);

  useEffect(() => setActive(0), [q]);

  const go = useCallback((slug?: string) => {
    const target = slug ?? results[active]?.[0];
    if (!target) return;
    window.location.href = `/entry/${encodeURIComponent(target)}/`;
  }, [results, active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter') { e.preventDefault(); go(); }
  };

  useEffect(() => {
    const el = listRef.current?.children[active] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  return (
    <>
      <button className="qs-trigger" onClick={() => setOpen(true)} aria-label="搜索条目（Ctrl K）">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
          <path d="m13.5 13.5 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <span className="qs-trigger__label">搜索</span>
        <kbd>⌘K</kbd>
      </button>

      {open && (
        <div className="qs-overlay" role="dialog" aria-modal="true" aria-label="站内搜索" onClick={() => setOpen(false)}>
          <div className="qs-panel" onClick={(e) => e.stopPropagation()}>
            <div className="qs-inputrow">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
                <path d="m13.5 13.5 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="搜索人物、地点、事件、物品…"
                className="qs-input"
                aria-label="搜索关键词"
                autoComplete="off"
                spellCheck={false}
              />
              <button className="qs-esc" onClick={() => setOpen(false)} aria-label="关闭搜索">ESC</button>
            </div>

            <ul className="qs-list" ref={listRef} role="listbox" aria-label="搜索结果">
              {results.length === 0 && (
                <li className="qs-empty">
                  没有找到匹配的条目。试试「阿拉贡」「夏尔」「魔戒大战」，或到
                  <a href="/browse/">百科页</a>按分类浏览。
                </li>
              )}
              {results.map((r, i) => {
                const [slug, title, english, , type] = r;
                const meta = TYPE_META[type] || TYPE_META.misc;
                return (
                  <li key={slug}>
                    <button
                      className={`qs-item${i === active ? ' is-active' : ''}`}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(slug)}
                      role="option"
                      aria-selected={i === active}
                    >
                      <span className="qs-dot" style={{ background: meta.color }} aria-hidden="true" />
                      <span className="qs-title">{title}</span>
                      {english && <span className="qs-en">{english}</span>}
                      <span className="qs-type">{meta.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="qs-foot">
              <span><kbd>↑</kbd><kbd>↓</kbd> 选择</span>
              <span><kbd>↵</kbd> 打开</span>
              <span><kbd>esc</kbd> 关闭</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
