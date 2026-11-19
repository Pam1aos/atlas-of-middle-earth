import { useEffect, useMemo, useRef, useState } from 'react';
import { MAP_VIEWBOX } from '../lib/mapPoints';

export interface RegionDatum {
  name: string;
  count: number;
  entities: { slug: string; title: string; image: string | null }[];
  people: string[];
  events: { slug: string; title: string }[];
  notes: { slug: string; title: string }[];
}

export interface MapMarker {
  title: string;
  x: number;
  y: number;
  kind: 'region' | 'people' | 'event' | 'nature' | 'plant';
  slug: string | null;
  image: string | null;
  summary: string;
  type: string | null;
}

const W = MAP_VIEWBOX.w;
const H = MAP_VIEWBOX.h;
const MIN_SCALE = 1;
const MAX_SCALE = 7;

interface Tip { x: number; y: number; m: MapMarker }

export default function MapExplorer({ regions, markers }: { regions: RegionDatum[]; markers: MapMarker[] }) {
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const [touched, setTouched] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [showEvents, setShowEvents] = useState(true);
  const [showNature, setShowNature] = useState(true);
  const [showPeoples, setShowPeoples] = useState(true);
  const [panelOpen, setPanelOpen] = useState(true);
  const [query, setQuery] = useState('');
  const [tip, setTip] = useState<Tip | null>(null);
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const byName = useMemo(() => new Map(regions.map((r) => [r.name, r])), [regions]);
  const active = selected ? byName.get(selected) : null;

  const visible = useMemo(
    () =>
      markers.filter((m) => {
        if (m.kind === 'event') return showEvents;
        if (m.kind === 'nature' || m.kind === 'plant') return showNature;
        if (m.kind === 'people') return showPeoples;
        return true;
      }),
    [markers, showEvents, showNature, showPeoples],
  );

  const focus = (name: string) => {
    setSelected(name);
    setPanelOpen(true);
    const m = markers.find((k) => k.title === name && k.kind === 'region');
    if (!m) return;
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const scale = 2.2;
    setTouched(true);
    setView({
      scale,
      x: rect.width / 2 - m.x * (rect.width / W) * scale,
      y: rect.height / 2 - m.y * (rect.height / H) * scale,
    });
  };

  const reset = () => { setTouched(false); setView({ scale: 1, x: 0, y: 0 }); setSelected(null); };

  const zoomAt = (factor: number, cx?: number, cy?: number) => {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = cx ?? rect.width / 2;
    const py = cy ?? rect.height / 2;
    setTouched(true);
    setView((v) => {
      const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.scale * factor));
      const k = scale / v.scale;
      return { scale, x: px - (px - v.x) * k, y: py - (py - v.y) * k };
    });
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    zoomAt(e.deltaY > 0 ? 0.87 : 1.15, e.clientX - rect.left, e.clientY - rect.top);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    setTouched(true);
    setView((v) => ({ ...v, x: d.vx + (e.clientX - d.x), y: d.vy + (e.clientY - d.y) }));
  };
  const onPointerUp = () => { drag.current = null; };

  const showTip = (e: React.MouseEvent, m: MapMarker) => {
    const host = stageRef.current?.parentElement;
    if (!host) return;
    const rect = host.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX - rect.left, 110), rect.width - 110);
    const y = Math.min(Math.max(e.clientY - rect.top, 90), rect.height - 90);
    setTip({ x, y, m });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setSelected(null); setTip(null); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const list = regions
    .filter((r) => !query || r.name.includes(query))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="map-window" data-panel={panelOpen ? 'open' : 'closed'}>
      <div className="map-canvas" onClick={() => setTip(null)}>
        <div
          className="map-stage"
          ref={stageRef}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <div
            className="map-zoom"
            style={touched ? { transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})` } : undefined}
          >
            <img className="map-base" src="/maps/middle-earth-organic.svg" alt="中洲地图" draggable={false} />
            <svg className="map-overlay" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
              {visible.map((m) => {
                const isRegion = m.kind === 'region';
                const isActive = selected === m.title;
                const cls = `marker marker--${m.kind}${isActive ? ' is-active' : ''}`;
                return (
                  <g
                    key={`${m.kind}-${m.title}`}
                    className={cls}
                    onClick={(e) => { e.stopPropagation(); showTip(e, m); }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' && m.slug) window.location.href = `/entry/${encodeURIComponent(m.slug)}/`; }}
                  >
                    {isRegion && <circle cx={m.x} cy={m.y} r={isActive ? 30 : 23} />}
                    {m.kind === 'people' && <circle cx={m.x} cy={m.y} r={14} />}
                    {m.kind === 'event' && <rect x={m.x - 11} y={m.y - 11} width="22" height="22" transform={`rotate(45 ${m.x} ${m.y})`} />}
                    {m.kind === 'nature' && <rect x={m.x - 9} y={m.y - 9} width="18" height="18" rx="5" />}
                    {m.kind === 'plant' && <path d={`M${m.x} ${m.y + 11} q-11 -8 0 -21 q11 13 0 21`} />}
                    {isRegion && (
                      <text x={m.x + (isActive ? 40 : 33)} y={m.y + 14}>
                        {m.title}
                        {byName.get(m.title) ? ` ${byName.get(m.title)!.count}` : ''}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {tip && (
          <div
            className="map-card"
            style={{ left: tip.x, top: tip.y }}
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              if (tip.m.slug) window.location.href = `/entry/${encodeURIComponent(tip.m.slug)}/`;
              else focus(tip.m.title);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && tip.m.slug) window.location.href = `/entry/${encodeURIComponent(tip.m.slug)}/`;
            }}
          >
            <span className="map-card__leaf" aria-hidden="true">
              <svg viewBox="0 0 60 60"><path d="M30 56C14 44 12 20 30 4c18 16 16 40 0 52Z" /></svg>
            </span>

            <span className="map-card__art">
              {tip.m.image ? (
                <img className="map-card__img" src={tip.m.image} alt="" loading="lazy" />
              ) : (
                <span className="map-card__glyph" aria-hidden="true">
                  {tip.m.kind === 'region' ? '◉' : tip.m.kind === 'people' ? '◍' : tip.m.kind === 'event' ? '◈' : '❧'}
                </span>
              )}
            </span>

            <span className="map-card__body">
              <span className="map-card__kind">
                {tip.m.kind === 'region' ? '地区' : tip.m.kind === 'people' ? '住民' : tip.m.kind === 'event' ? '事件' : tip.m.kind === 'plant' ? '植物' : '生物'}
              </span>
              <strong className="map-card__title">{tip.m.title}</strong>
              <span className="map-card__sum">{tip.m.summary || '条目库里没有这条摘要。'}</span>
              <span className="map-card__cta">{tip.m.slug ? '查看词条 →' : '查看地区 →'}</span>
            </span>
          </div>
        )}

        <div className="map-toolbar">
          <button className="icon-btn" onClick={() => zoomAt(1.3)} aria-label="放大">＋</button>
          <button className="icon-btn" onClick={() => zoomAt(0.77)} aria-label="缩小">－</button>
          <button className="icon-btn" onClick={reset} aria-label="重置视图">↺</button>
          <button className="icon-btn" aria-pressed={showEvents} onClick={() => setShowEvents((v) => !v)} title="历史事件">◈</button>
          <button className="icon-btn" aria-pressed={showNature} onClick={() => setShowNature((v) => !v)} title="风物与生物">❧</button>
          <button className="icon-btn" aria-pressed={showPeoples} onClick={() => setShowPeoples((v) => !v)} title="住民">◍</button>
          <button
            className="icon-btn map-panel-toggle"
            onClick={() => setPanelOpen((v) => !v)}
            aria-expanded={panelOpen}
            aria-label={panelOpen ? '收起地区栏' : '展开地区栏'}
            title={panelOpen ? '收起地区栏' : '展开地区栏'}
          >
            {panelOpen ? '⟩' : '⟨'}
          </button>
        </div>

        <p className="map-hint">底图：按中洲地图矢量稿描摹重绘 · 悬停标记看条目 · 拖拽平移 · 滚轮缩放</p>
      </div>

      <aside className="map-side" aria-hidden={!panelOpen}>
        <header>
          <h3>地区</h3>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="筛选地区…" aria-label="筛选地区" />
        </header>

        {active ? (
          <div className="map-detail">
            <div className="map-detail__head">
              <h4>{active.name}</h4>
              <button className="agent-icon" onClick={() => setSelected(null)} aria-label="关闭地区详情">✕</button>
            </div>
            <p className="map-detail__meta">
              {active.count} 处地点 · 由原站分类归并
              {markers.every((m) => m.title !== active.name) && ' · 不在这张地图范围内'}
            </p>

            {active.people.length > 0 && (
              <>
                <div className="map-detail__label">住民</div>
                <div className="map-chips">
                  {active.people.map((p) => <span key={p} className="chip">{p}</span>)}
                </div>
              </>
            )}

            {active.notes.length > 0 && (
              <>
                <div className="map-detail__label">风物与生物</div>
                <div className="map-chips">
                  {active.notes.map((n) => (
                    <a key={n.slug} className="chip" href={`/entry/${encodeURIComponent(n.slug)}/`}>{n.title}</a>
                  ))}
                </div>
              </>
            )}

            {active.events.length > 0 && (
              <>
                <div className="map-detail__label">此地发生的事件</div>
                <ul className="map-events">
                  {active.events.map((e) => (
                    <li key={e.slug}><a href={`/entry/${encodeURIComponent(e.slug)}/`}>{e.title}</a></li>
                  ))}
                </ul>
              </>
            )}

            <div className="map-detail__label">代表性条目</div>
            <ul className="map-entities">
              {active.entities.slice(0, 6).map((e) => (
                <li key={e.slug}><a href={`/entry/${encodeURIComponent(e.slug)}/`}>{e.title}</a></li>
              ))}
            </ul>

            <a className="btn btn--ghost" style={{ width: '100%', marginTop: '.6rem' }} href={`/atlas/${encodeURIComponent(active.name)}/`}>
              查看该地区全部条目
            </a>
          </div>
        ) : (
          <ul className="map-list">
            {list.map((r) => {
              const off = markers.every((m) => m.title !== r.name);
              return (
                <li key={r.name}>
                  <button onClick={() => focus(r.name)}>
                    <span>{r.name}{off ? <em className="map-off"> 海外</em> : null}</span>
                    <em>{r.count}</em>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>
    </div>
  );
}
