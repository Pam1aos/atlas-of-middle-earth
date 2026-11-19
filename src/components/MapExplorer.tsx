import { useEffect, useMemo, useRef, useState } from 'react';
import { MAP_VIEWBOX, REGION_POINTS, EVENT_POINTS, NATURE_POINTS } from '../lib/mapPoints';

export interface RegionDatum {
  name: string;
  count: number;
  entities: { slug: string; title: string; image: string | null }[];
  people: string[];
  events: { slug: string; title: string }[];
  notes: { slug: string; title: string }[];
}

const W = MAP_VIEWBOX.w;
const H = MAP_VIEWBOX.h;
const MIN_SCALE = 1;
const MAX_SCALE = 6;
const HOME = { scale: 1.32, x: -210, y: -120 };

export default function MapExplorer({ regions }: { regions: RegionDatum[] }) {
  const [view, setView] = useState(HOME);
  const [selected, setSelected] = useState<string | null>(null);
  const [showEvents, setShowEvents] = useState(true);
  const [showNature, setShowNature] = useState(true);
  const [panelOpen, setPanelOpen] = useState(true);
  const [query, setQuery] = useState('');
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const pins = useMemo(() => {
    const known = new Set(regions.map((r) => r.name));
    return REGION_POINTS.filter((p) => known.has(p.name) && !p.offmap);
  }, [regions]);

  const byName = useMemo(() => new Map(regions.map((r) => [r.name, r])), [regions]);
  const active = selected ? byName.get(selected) : null;

  const focus = (name: string) => {
    setSelected(name);
    setPanelOpen(true);
    const p = REGION_POINTS.find((r) => r.name === name);
    if (!p || p.offmap) { setView(HOME); return; }
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const scale = 2.6;
    // centre the pin: translate so (x,y) lands in the middle of the stage
    setView({
      scale,
      x: rect.width / 2 - p.x * (rect.width / W) * scale,
      y: rect.height / 2 - p.y * (rect.height / H) * scale,
    });
  };

  const reset = () => { setView(HOME); setSelected(null); };

  const zoomAt = (factor: number, cx?: number, cy?: number) => {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = cx ?? rect.width / 2;
    const py = cy ?? rect.height / 2;
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
    zoomAt(e.deltaY > 0 ? 1.15 : 0.87, e.clientX - rect.left, e.clientY - rect.top);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    setView((v) => ({ ...v, x: d.vx + (e.clientX - d.x), y: d.vy + (e.clientY - d.y) }));
  };
  const onPointerUp = () => { drag.current = null; };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const list = regions
    .filter((r) => !query || r.name.includes(query))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="map-window" data-panel={panelOpen ? 'open' : 'closed'}>
      <div className="map-canvas">
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
            style={{ transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})` }}
          >
            <img className="map-base" src="/maps/middle-earth.svg" alt="中洲地图（手工描绘版）" draggable={false} />
            <svg className="map-overlay" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
              {showEvents &&
                EVENT_POINTS.map((ev) => (
                  <g key={ev.title} className="map-event">
                    <rect x={ev.x - 11} y={ev.y - 11} width="22" height="22" transform={`rotate(45 ${ev.x} ${ev.y})`} />
                    <text x={ev.x + 20} y={ev.y + 8}>{ev.title}</text>
                  </g>
                ))}

              {showNature &&
                NATURE_POINTS.map((n) => (
                  <g key={n.title} className={`map-nature map-nature--${n.kind}`}>
                    <title>{n.title}</title>
                    <circle cx={n.x} cy={n.y} r={16} />
                    {n.kind === 'plant'
                      ? <path d={`M${n.x} ${n.y + 9} q-9 -6 0 -17 q9 11 0 17`} />
                      : <path d={`M${n.x} ${n.y + 9} l8 -13 l8 8 z`} />}
                  </g>
                ))}

              {pins.map((p) => {
                const data = byName.get(p.name);
                const isActive = selected === p.name;
                return (
                  <g
                    key={p.name}
                    className={`map-pin${isActive ? ' is-active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); focus(p.name); }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') focus(p.name); }}
                  >
                    <circle cx={p.x} cy={p.y} r={isActive ? 30 : 23} />
                    <text x={p.x + (isActive ? 40 : 33)} y={p.y + 14}>
                      {p.name}
                      {data ? ` ${data.count}` : ''}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        <div className="map-toolbar">
          <button className="icon-btn" onClick={() => zoomAt(0.75)} aria-label="放大">＋</button>
          <button className="icon-btn" onClick={() => zoomAt(1.33)} aria-label="缩小">－</button>
          <button className="icon-btn" onClick={reset} aria-label="重置视图">↺</button>
          <button className="icon-btn" aria-pressed={showEvents} onClick={() => setShowEvents((v) => !v)} title="历史事件标记">◈</button>
          <button className="icon-btn" aria-pressed={showNature} onClick={() => setShowNature((v) => !v)} title="风物与生物标记">❧</button>
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

        <p className="map-hint">底图：Map of Middle-earth（手工描绘，第三方素材）· 拖拽平移 · 滚轮缩放 · 标记为叠加层</p>
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
              {REGION_POINTS.find((p) => p.name === active.name)?.offmap && ' · 不在这张地图范围内'}
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
              const off = REGION_POINTS.find((p) => p.name === r.name)?.offmap;
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
