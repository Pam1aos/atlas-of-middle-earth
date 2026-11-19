import { useEffect, useMemo, useRef, useState } from 'react';
import { REGION_POINTS, EVENT_POINTS } from '../lib/mapPoints';

export interface RegionDatum {
  name: string;
  count: number;
  entities: { slug: string; title: string; image: string | null }[];
  people: string[];
  events: { slug: string; title: string }[];
  notes: { slug: string; title: string }[];
}

const W = 1000;
const H = 1250;
const MIN_W = 220;

export default function MapExplorer({ regions }: { regions: RegionDatum[] }) {
  const [vb, setVb] = useState({ x: 40, y: 160, w: 880, h: 1000 });
  const [selected, setSelected] = useState<string | null>(null);
  const [showEvents, setShowEvents] = useState(true);
  const [query, setQuery] = useState('');
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const points = useMemo(() => {
    const known = new Set(regions.map((r) => r.name));
    return REGION_POINTS.filter((p) => known.has(p.name));
  }, [regions]);

  const byName = useMemo(() => new Map(regions.map((r) => [r.name, r])), [regions]);
  const active = selected ? byName.get(selected) : null;

  const focus = (name: string) => {
    const p = REGION_POINTS.find((r) => r.name === name);
    setSelected(name);
    if (!p) return;
    const w = 300;
    const h = w * (H / W);
    setVb({ x: clamp(p.x - w / 2, -100, W - w + 100), y: clamp(p.y - h / 2, -100, H - h + 100), w, h });
  };

  const reset = () => { setVb({ x: 40, y: 160, w: 880, h: 1000 }); setSelected(null); };

  const zoom = (factor: number, cx?: number, cy?: number) => {
    setVb((v) => {
      const nw = clamp(v.w * factor, MIN_W, W);
      const ratio = nw / v.w;
      const nh = v.h * ratio;
      const px = cx ?? v.x + v.w / 2;
      const py = cy ?? v.y + v.h / 2;
      return {
        x: clamp(px - (px - v.x) * ratio, -120, W - nw + 120),
        y: clamp(py - (py - v.y) * ratio, -120, H - nh + 120),
        w: nw,
        h: nh,
      };
    });
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const cx = vb.x + ((e.clientX - rect.left) / rect.width) * vb.w;
    const cy = vb.y + ((e.clientY - rect.top) / rect.height) * vb.h;
    zoom(e.deltaY > 0 ? 1.14 : 0.88, cx, cy);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, vx: vb.x, vy: vb.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const dx = ((e.clientX - d.x) / rect.width) * vb.w;
    const dy = ((e.clientY - d.y) / rect.height) * vb.h;
    setVb((v) => ({ ...v, x: d.vx - dx, y: d.vy - dy }));
  };
  const onPointerUp = () => { drag.current = null; };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const list = regions
    .filter((r) => !query || r.name.includes(query))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="map-window">
      <div className="map-canvas">
        <svg
          ref={svgRef}
          viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          role="img"
          aria-label="中洲示意地图"
        >
          <defs>
            <radialGradient id="seaGlow" cx="50%" cy="40%" r="70%">
              <stop offset="0%" stopColor="#dfe8d2" />
              <stop offset="100%" stopColor="#cfdcbe" />
            </radialGradient>
            <linearGradient id="landFill" x1="0" y1="0" x2="0.4" y2="1">
              <stop offset="0%" stopColor="#f6f2e7" />
              <stop offset="100%" stopColor="#eee8d8" />
            </linearGradient>
          </defs>

          <rect x={-400} y={-400} width={W + 800} height={H + 800} fill="url(#seaGlow)" />

          {/* overseas / sunken lands, kept faint and separate */}
          <g className="map-faded">
            <path d="M40 120c40-30 90-20 100 20s-10 90-40 130-70 60-80 30 -10-160 20-180z" />
            <path d="M70 420c30-16 60 0 60 30s-20 70-45 74-45-30-45-56 8-40 30-48z" />
            <path d="M60 640c50-14 100 10 96 60s-40 130-70 170-60 40-62-10 6-206 36-220z" />
            <text x="96" y="150">阿门洲</text>
            <text x="128" y="560">努门诺尔</text>
            <text x="132" y="700">贝烈瑞安德</text>
          </g>

          {/* main landmass */}
          <path
            className="map-land"
            d="M258 300 Q 420 196 620 236 Q 800 268 848 452 Q 884 612 830 780 Q 790 936 700 1030 Q 610 1124 480 1112 Q 330 1098 262 964 Q 208 852 226 700 Q 244 540 236 420 Q 232 348 258 300 Z"
          />
          {/* misty mountains */}
          <g className="map-ridge">
            {Array.from({ length: 9 }).map((_, i) => (
              <path key={i} d={`M${498 + i * 4} ${500 + i * 26}l14 22h-28z`} />
            ))}
          </g>
          {/* grey mountains (north-east) */}
          <g className="map-ridge">
            {Array.from({ length: 6 }).map((_, i) => (
              <path key={`g${i}`} d={`M${640 + i * 26} ${470}l13 20h-26z`} />
            ))}
          </g>
          {/* blue mountains (west) */}
          <g className="map-ridge">
            {Array.from({ length: 5 }).map((_, i) => (
              <path key={`b${i}`} d={`M${300 + i * 4} ${400 + i * 26}l11 17h-22z`} />
            ))}
          </g>
          {/* white mountains */}
          <g className="map-ridge">
            {Array.from({ length: 7 }).map((_, i) => (
              <path key={i} d={`M${470 + i * 30} ${852}l12 18h-24z`} />
            ))}
          </g>
          {/* mirkwood + lothlorien + fangorn */}
          <g className="map-forest">
            {Array.from({ length: 14 }).map((_, i) => (
              <circle key={`m${i}`} cx={676 + (i % 3) * 22} cy={560 + Math.floor(i / 3) * 30} r={9} />
            ))}
            {Array.from({ length: 6 }).map((_, i) => (
              <circle key={`l${i}`} cx={556 + (i % 3) * 16} cy={690 + Math.floor(i / 3) * 18} r={7} />
            ))}
            {Array.from({ length: 6 }).map((_, i) => (
              <circle key={`f${i}`} cx={468 + (i % 3) * 16} cy={742 + Math.floor(i / 3) * 18} r={7} />
            ))}
          </g>
          {/* anduin */}
          <path className="map-river" d="M520 380c10 80-30 150-10 230s30 150 10 240-10 120 0 180" />
          {/* mordor */}
          <path className="map-mordor" d="M690 940c40-20 90-10 100 30s10 80-30 96-90 10-96-30 6-80 26-96z" />

          {/* soft tinted halos give the landmass some structure */}
          <g className="map-halo">
            <ellipse cx={348} cy={506} rx={78} ry={58} fill="#7fa25b" />
            <ellipse cx={560} cy={800} rx={92} ry={70} fill="#c8a86a" />
            <ellipse cx={588} cy={936} rx={86} ry={64} fill="#8fa878" />
            <ellipse cx={748} cy={978} rx={86} ry={72} fill="#8a6a52" />
            <ellipse cx={730} cy={614} rx={92} ry={70} fill="#6f8f4f" />
            <ellipse cx={382} cy={420} rx={96} ry={74} fill="#9db77f" />
          </g>

          {showEvents &&
            EVENT_POINTS.map((ev) => (
              <g key={ev.title} className="map-event">
                <rect x={ev.x - 5} y={ev.y - 5} width="10" height="10" transform={`rotate(45 ${ev.x} ${ev.y})`} />
                <text x={ev.x + 10} y={ev.y + 4}>{ev.title}</text>
              </g>
            ))}

          {points.map((p) => {
            const data = byName.get(p.name);
            const isActive = selected === p.name;
            return (
              <g
                key={p.name}
                className={`map-pin${p.faded ? ' is-faded' : ''}${isActive ? ' is-active' : ''}`}
                onClick={() => focus(p.name)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') focus(p.name); }}
              >
                <circle cx={p.x} cy={p.y} r={p.dotOnly ? 4 : isActive ? 10 : 7} />
                {!p.dotOnly && (
                  <text x={p.x + (isActive ? 15 : 12)} y={p.y + 5}>
                    {p.name}
                    {data ? ` ${data.count}` : ''}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        <div className="map-toolbar">
          <button className="icon-btn" onClick={() => zoom(0.8)} aria-label="放大">＋</button>
          <button className="icon-btn" onClick={() => zoom(1.25)} aria-label="缩小">－</button>
          <button className="icon-btn" onClick={reset} aria-label="重置视图">↺</button>
          <button
            className="icon-btn"
            aria-pressed={showEvents}
            onClick={() => setShowEvents((v) => !v)}
            title="显示或隐藏事件标记"
          >
            ◈
          </button>
        </div>

        <p className="map-hint">示意地图：位置按相对方位手工标注，不是精确坐标 · 拖拽平移 · 滚轮缩放</p>
      </div>

      <aside className="map-side">
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
            <p className="map-detail__meta">{active.count} 处地点 · 由原站分类归并</p>

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
            {list.map((r) => (
              <li key={r.name}>
                <button onClick={() => focus(r.name)}>
                  <span>{r.name}</span>
                  <em>{r.count}</em>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}
