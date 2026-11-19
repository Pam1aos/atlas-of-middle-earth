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
const HOME = { x: 150, y: 120, w: 780, h: 990 };

/* ------------------------------------------------------------------ *
 * Stylised coastline and terrain. Every coordinate is hand-drawn on a
 * 1000x1250 canvas; this is a schematic, not a surveyed map.
 * ------------------------------------------------------------------ */

const COAST =
  'M300 176 C 420 148, 566 150, 668 190 C 706 206, 720 226, 742 246 ' +
  'C 786 258, 830 280, 854 322 C 880 378, 862 462, 842 520 ' +
  'C 898 556, 936 634, 918 712 C 900 800, 872 878, 846 958 ' +
  'C 822 1036, 764 1108, 682 1132 C 602 1156, 522 1138, 470 1098 ' +
  'C 420 1060, 378 1042, 328 1022 C 278 1000, 248 940, 240 878 ' +
  'C 232 802, 252 742, 242 680 C 232 602, 210 520, 220 462 ' +
  'C 228 382, 250 300, 272 232 Z';

const RANGES: { name: string; pts: [number, number][]; size?: number }[] = [
  { name: 'misty', size: 1, pts: [[498, 424], [506, 452], [500, 480], [510, 508], [504, 536], [514, 564], [508, 592], [518, 620], [512, 648], [522, 676], [516, 704], [526, 732], [520, 760]] },
  { name: 'grey', size: 0.9, pts: [[636, 296], [664, 288], [692, 296], [720, 286], [748, 296], [776, 288], [804, 300]] },
  { name: 'iron', size: 0.75, pts: [[812, 372], [836, 380], [858, 392]] },
  { name: 'white', size: 1, pts: [[416, 862], [446, 852], [476, 864], [506, 852], [536, 864], [566, 854], [596, 866], [626, 856]] },
  { name: 'ephel', size: 0.85, pts: [[664, 892], [682, 918], [694, 946], [700, 976], [696, 1006], [686, 1034], [668, 1056]] },
  { name: 'lithui', size: 0.8, pts: [[700, 862], [730, 870], [760, 862], [790, 872], [818, 866]] },
  { name: 'blue', size: 0.85, pts: [[252, 366], [262, 394], [254, 422], [266, 450], [258, 478], [270, 506]] },
  { name: 'angmar', size: 0.7, pts: [[560, 236], [582, 244], [604, 236]] },
];

const FORESTS: [number, number, number][] = [
  // Mirkwood
  [648, 372], [676, 366], [704, 374], [732, 366], [646, 404], [674, 398], [702, 406], [730, 398],
  [644, 436], [672, 430], [700, 438], [728, 430], [642, 468], [670, 462], [698, 470], [726, 462],
  [640, 500], [668, 494], [696, 502], [724, 494], [638, 532], [666, 526], [694, 534],
  // Lothlórien
  [552, 690], [568, 700], [584, 690], [560, 716], [576, 726],
  // Fangorn
  [470, 748], [486, 758], [502, 748], [478, 774], [494, 784],
  // Old Forest / Chetwood
  [352, 462], [368, 472], [384, 462], [360, 488],
  [430, 512], [446, 522],
  // Trollshaws
  [438, 478], [454, 488],
  // Druadan
  [596, 862], [612, 872],
];

const RIVERS: { d: string; w?: number }[] = [
  { d: 'M540 372 C 546 470, 530 560, 548 650 C 566 740, 566 830, 592 916 C 606 964, 612 1010, 618 1056', w: 3.4 },
  { d: 'M336 470 C 322 512, 316 548, 304 584 C 296 610, 292 632, 288 654', w: 2 },
  { d: 'M486 742 C 476 786, 470 820, 462 856', w: 2 },
  { d: 'M744 396 C 786 440, 830 492, 868 552', w: 2 },
  { d: 'M560 676 C 588 700, 610 730, 616 764', w: 1.6 },
  { d: 'M700 900 C 722 906, 744 902, 766 910', w: 1.6 },
];

const LAKES: { cx: number; cy: number; rx: number; ry: number }[] = [
  { cx: 902, cy: 566, rx: 46, ry: 38 },   // Sea of Rhûn
  { cx: 782, cy: 1018, rx: 34, ry: 26 },  // Sea of Núrnen
  { cx: 706, cy: 414, rx: 16, ry: 26 },   // Long Lake
];

export default function MapExplorer({ regions }: { regions: RegionDatum[] }) {
  const [vb, setVb] = useState(HOME);
  const [selected, setSelected] = useState<string | null>(null);
  const [showEvents, setShowEvents] = useState(true);
  const [panelOpen, setPanelOpen] = useState(true);
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
    setPanelOpen(true);
    if (!p) return;
    const w = 300;
    const h = w * (H / W);
    setVb({ x: clamp(p.x - w / 2, -100, W - w + 100), y: clamp(p.y - h / 2, -100, H - h + 100), w, h });
  };

  const reset = () => { setVb(HOME); setSelected(null); };

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
            <radialGradient id="seaGlow" cx="50%" cy="40%" r="72%">
              <stop offset="0%" stopColor="#dfe8d2" />
              <stop offset="100%" stopColor="#c9d8b6" />
            </radialGradient>
            <linearGradient id="landFill" x1="0.1" y1="0" x2="0.5" y2="1">
              <stop offset="0%" stopColor="#f8f5ec" />
              <stop offset="55%" stopColor="#f1ecdd" />
              <stop offset="100%" stopColor="#e9e2cf" />
            </linearGradient>
            <linearGradient id="mordorFill" x1="0" y1="0" x2="0.6" y2="1">
              <stop offset="0%" stopColor="#c9b7a2" />
              <stop offset="100%" stopColor="#b7a38c" />
            </linearGradient>
            <pattern id="waves" width="26" height="18" patternUnits="userSpaceOnUse">
              <path d="M0 9 q6.5 -5 13 0 t13 0" fill="none" stroke="rgba(94,140,160,.16)" strokeWidth="1.1" />
            </pattern>
          </defs>

          <rect x={-500} y={-500} width={W + 1000} height={H + 1000} fill="url(#seaGlow)" />
          <rect x={-500} y={-500} width={W + 1000} height={H + 1000} fill="url(#waves)" />

          {/* overseas / sunken lands — deliberately faint and detached */}
          <g className="map-faded">
            <path d="M40 128c34-26 84-16 92 22s-14 92-42 128-66 44-74 12 0-142 24-162z" />
            <path d="M74 428c28-14 54 2 54 30s-18 66-42 70-42-28-42-52 8-38 30-48z" />
            <path d="M64 636c46-12 92 8 88 56s-38 124-66 162-56 38-58-10 6-196 36-208z" />
            <text x="110" y="176">阿门洲</text>
            <text x="150" y="566">努门诺尔</text>
            <text x="150" y="706">贝烈瑞安德</text>
          </g>

          {/* landmass */}
          <path className="map-land" d={COAST} />
          {/* Mordor basin */}
          <path className="map-mordor" d="M676 890 C 736 862, 800 876, 822 916 C 844 956, 826 1010, 776 1032 C 726 1054, 672 1036, 660 998 C 650 962, 650 912, 676 890 Z" />

          {/* lakes */}
          <g className="map-lake">
            {LAKES.map((l, i) => (
              <ellipse key={i} cx={l.cx} cy={l.cy} rx={l.rx} ry={l.ry} />
            ))}
          </g>

          {/* rivers */}
          <g className="map-river">
            {RIVERS.map((r, i) => (
              <path key={i} d={r.d} strokeWidth={r.w || 2} />
            ))}
          </g>

          {/* forests */}
          <g className="map-forest">
            {FORESTS.map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r={7.5} />
            ))}
          </g>

          {/* mountain ranges */}
          <g className="map-ridge">
            {RANGES.map((range) =>
              range.pts.map(([x, y], i) => {
                const s = 15 * (range.size || 1);
                return <path key={`${range.name}-${i}`} d={`M${x - s / 2} ${y} L${x} ${y - s} L${x + s / 2} ${y} Z`} />;
              }),
            )}
          </g>

          {/* soft region halos for orientation */}
          <g className="map-halo">
            <ellipse cx={348} cy={506} rx={78} ry={58} fill="#7fa25b" />
            <ellipse cx={540} cy={800} rx={92} ry={70} fill="#c8a86a" />
            <ellipse cx={588} cy={938} rx={86} ry={64} fill="#8fa878" />
            <ellipse cx={746} cy={962} rx={86} ry={72} fill="#8a6a52" />
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

        <p className="map-hint">示意地图：海岸、山脉、河流按相对方位手工绘制，不是精确坐标 · 拖拽平移 · 滚轮缩放</p>
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
