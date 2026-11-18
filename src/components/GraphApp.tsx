import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TYPE_META } from '../lib/types';
import { REL_LABEL, REL_REVERSE } from '../lib/relations';

interface GNode { id: string; label: string; type: string; deg: number }
interface GEdge { s: string; t: string; type: string; label: string; dir: boolean }
interface Graph { nodes: GNode[]; edges: GEdge[] }

interface EntityLite {
  slug: string; title: string; english: string; type: string;
  era: string; image: string | null; summary: string;
}

const DEFAULT_NODES = 150;

function bfs(start: string, depth: number, edges: GEdge[], relFilter: Set<string>, nodeOk: (id: string) => boolean) {
  const seen = new Set([start]);
  let frontier = [start];
  const used: GEdge[] = [];
  for (let d = 0; d < depth; d++) {
    const next: string[] = [];
    for (const e of edges) {
      if (!relFilter.has(e.type)) continue;
      if (frontier.includes(e.s) && !seen.has(e.t) && nodeOk(e.t)) { seen.add(e.t); next.push(e.t); used.push(e); }
      else if (frontier.includes(e.t) && !seen.has(e.s) && nodeOk(e.s)) { seen.add(e.s); next.push(e.s); used.push(e); }
    }
    frontier = next;
    if (frontier.length === 0) break;
  }
  return { nodes: seen, edges: used };
}

export default function GraphApp({ entities }: { entities: EntityLite[] }) {
  const [graph, setGraph] = useState<Graph | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const [depth, setDepth] = useState(1);
  const [types, setTypes] = useState<Set<string>>(new Set(Object.keys(TYPE_META)));
  const [rels, setRels] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('载入中…');
  const [pathFrom, setPathFrom] = useState('');
  const [pathTo, setPathTo] = useState('');
  const [pathInfo, setPathInfo] = useState<string | null>(null);
  const [pinned, setPinned] = useState<Set<string>>(new Set());
  const [mobileOpen, setMobileOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<any>(null);
  const graphRef = useRef<Graph | null>(null);
  const entRef = useRef<Map<string, EntityLite>>(new Map());
  const layoutRef = useRef<any>(null);

  const ent = useMemo(() => new Map(entities.map((e) => [e.slug, e])), [entities]);
  entRef.current = ent;

  // ---------- load graph ----------
  useEffect(() => {
    fetch('/data/graph.json')
      .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then((g: Graph) => {
        graphRef.current = g;
        const rt = new Set(g.edges.map((e) => e.type));
        setRels(rt);
        setGraph(g);
      })
      .catch((e) => setError(String(e)));
  }, []);

  // ---------- initial params ----------
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const f = p.get('focus');
    if (f && ent.has(f)) { setFocus(f); setDepth(1); setSelected(f); }
    const d = Number(p.get('depth'));
    if (d >= 1 && d <= 3) setDepth(d);
  }, [ent]);

  // ---------- element set derivation ----------
  const nodeOk = useCallback((id: string) => {
    const e = entRef.current.get(id);
    return !!e && types.has(e.type);
  }, [types]);

  const view = useMemo(() => {
    if (!graph) return null;
    const relFilter = rels;
    if (focus) {
      const r = bfs(focus, depth, graph.edges, relFilter, nodeOk);
      return { nodes: r.nodes, edges: r.edges };
    }
    // default view: highest-degree nodes, plus their mutual edges
    const pool = graph.nodes.filter((n) => types.has(n.type)).sort((a, b) => b.deg - a.deg);
    const nodes = new Set(pool.slice(0, DEFAULT_NODES).map((n) => n.id));
    const edges = graph.edges.filter((e) => nodes.has(e.s) && nodes.has(e.t) && relFilter.has(e.type));
    for (const e of edges) { nodes.add(e.s); nodes.add(e.t); }
    return { nodes, edges };
  }, [graph, focus, depth, rels, types, nodeOk]);

  // ---------- cytoscape lifecycle ----------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!view || !wrapRef.current) return;
      const el = wrapRef.current;
      const [{ default: cytoscape }] = await Promise.all([import('cytoscape')]);
      if (cancelled) return;

      if (!cyRef.current) {
        cyRef.current = cytoscape({
          container: el,
          elements: [],
          wheelSensitivity: 0.2,
          minZoom: 0.15,
          maxZoom: 3,
          style: [
            {
              selector: 'node',
              style: {
                'background-color': 'data(color)',
                width: 'data(size)',
                height: 'data(size)',
                label: 'data(label)',
                'font-size': 10,
                'font-family': 'PingFang SC, Microsoft YaHei, sans-serif',
                color: '#243A2C',
                'text-valign': 'bottom',
                'text-margin-y': 5,
                'text-max-width': '96px',
                'text-wrap': 'ellipsis',
                'text-outline-width': 2,
                'text-outline-color': '#f4f0e6',
                'border-width': 1.5,
                'border-color': 'rgba(36,58,44,.25)',
                'overlay-opacity': 0,
                'transition-property': 'background-color, border-color, opacity',
                'transition-duration': 180,
              },
            },
            { selector: 'node[type="place"]', style: { shape: 'round-rectangle' } },
            { selector: 'node[type="realm"]', style: { shape: 'hexagon' } },
            { selector: 'node[type="event"]', style: { shape: 'diamond' } },
            { selector: 'node[type="item"]', style: { shape: 'triangle' } },
            { selector: 'node[type="org"]', style: { shape: 'octagon' } },
            { selector: 'node[type="work"]', style: { shape: 'rectangle' } },
            { selector: 'node[type="adaptation"]', style: { shape: 'rectangle' } },
            { selector: 'node[type="language"]', style: { shape: 'pentagon' } },
            { selector: 'node[type="music"]', style: { shape: 'star' } },
            { selector: 'node.dim', style: { opacity: 0.18, 'text-opacity': 0 } },
            {
              selector: 'edge',
              style: {
                width: 1,
                'line-color': 'rgba(102,117,82,.42)',
                'curve-style': 'bezier',
                'target-arrow-shape': 'none',
                'overlay-opacity': 0,
              },
            },
            { selector: 'edge.dim', style: { opacity: 0.1 } },
            { selector: 'edge.path', style: { 'line-color': '#B79A5B', width: 3, 'target-arrow-shape': 'triangle', 'target-arrow-color': '#B79A5B' } },
            { selector: 'node.path', style: { 'border-width': 3, 'border-color': '#B79A5B' } },
            { selector: 'node:selected', style: { 'border-width': 4, 'border-color': '#B79A5B' } },
            { selector: 'node.pinned', style: { 'border-color': '#6B5543', 'border-width': 2.5, 'border-style': 'dashed' } },
            { selector: 'node.hide-label', style: { 'text-opacity': 0 } },
          ],
          layout: { name: 'preset' },
        });

        cyRef.current.on('tap', 'node', (evt: any) => {
          setSelected(evt.target.id());
          setMobileOpen(true);
          fitWithDrawer(evt.target.id());
        });
        cyRef.current.on('tap', 'edge', (evt: any) => {
          const d = evt.target.data();
          setPathInfo(`关系：${d.label || d.type} · ${entRef.current.get(d.source)?.title} → ${entRef.current.get(d.target)?.title}`);
        });
        cyRef.current.on('tap', (evt: any) => {
          if (evt.target === cyRef.current) setSelected(null);
        });
        let labelState = true;
        cyRef.current.on('zoom', () => {
          const show = cyRef.current.zoom() >= 0.38;
          if (show === labelState) return;
          labelState = show;
          cyRef.current.nodes().toggleClass('hide-label', !show);
        });
        cyRef.current.on('dragfree', 'node', (evt: any) => {
          setPinned((p) => new Set(p).add(evt.target.id()));
          evt.target.addClass('pinned');
        });
      }

      const cy = cyRef.current;
      const nodes = [...view.nodes].filter((id) => entRef.current.has(id));
      const elements = [
        ...nodes.map((id) => {
          const e = entRef.current.get(id)!;
          const g = graph?.nodes.find((n) => n.id === id);
          return {
            data: {
              id,
              label: e.title,
              type: e.type,
              color: (TYPE_META[e.type] || TYPE_META.misc).color,
              size: Math.max(14, Math.min(34, 12 + Math.sqrt(g?.deg || 1) * 2.6)),
            },
          };
        }),
        ...view.edges
          .filter((e) => view.nodes.has(e.s) && view.nodes.has(e.t))
          .map((e, i) => ({
            data: { id: `${e.s}--${e.t}--${i}`, source: e.s, target: e.t, type: e.type, label: e.label },
          })),
      ];

      cy.elements().remove();
      cy.add(elements);
      const layout = cy.layout({
        name: focus ? 'concentric' : 'cose',
        animate: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        animationDuration: 420,
        padding: 40,
        nodeRepulsion: 9000,
        idealEdgeLength: 90,
        fit: true,
        ...(focus ? { concentric: (n: any) => (n.id() === focus ? 100 : 10), levelWidth: () => [1], minNodeSpacing: 34, spacingFactor: 1.12 } : {}),
      } as any);
      layout.one('layoutstop', () => { try { cy.fit(undefined, 56); if (focus && window.innerWidth > 1024) shiftForDrawer(); } catch {} });
      layout.run();
      layoutRef.current = layout;

      const short = window.innerWidth < 700;
      setStatus(short
        ? `${nodes.length} 节点 · ${elements.length - nodes.length} 关系`
        : `当前显示 ${nodes.length} 个节点 · ${elements.length - nodes.length} 条关系（全库 ${graph?.nodes.length} 节点 / ${graph?.edges.length} 关系）`);
    })();
    return () => { cancelled = true; };
  }, [view, focus, graph]);

  useEffect(() => () => { try { cyRef.current?.destroy(); } catch {} }, []);

  // ---------- actions ----------
  const zoom = (f: number) => { const cy = cyRef.current; if (!cy) return; cy.zoom({ level: cy.zoom() * f, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } }); };
  const fit = () => cyRef.current?.fit(undefined, 60);
  const reset = () => {
    setFocus(null); setSelected(null); setDepth(1); setPathInfo(null);
    const cy = cyRef.current;
    if (cy) { cy.elements().removeClass('path dim pinned'); }
    history.replaceState(null, '', '/graph/');
  };
  const focusNode = (id: string) => { setFocus(id); setSelected(id); setMobileOpen(true); };
  const expand = (n: number) => { setFocus(selected || focus); setDepth(Math.min(3, n)); };

  const share = async () => {
    const p = new URLSearchParams();
    if (focus) p.set('focus', focus);
    if (depth !== 1) p.set('depth', String(depth));
    const url = `${window.location.origin}/graph/${p.toString() ? '?' + p.toString() : ''}`;
    try { await navigator.clipboard.writeText(url); setPathInfo('已复制当前视图链接：' + url); }
    catch { setPathInfo(url); }
  };

  const runPath = () => {
    const g = graphRef.current;
    if (!g) return;
    const a = ent.get(pathFrom.trim());
    const b = ent.get(pathTo.trim());
    if (!a || !b) { setPathInfo('请填写两个已存在的条目名称（可先在上方搜索）。'); return; }
    if (a.slug === b.slug) { setPathInfo('起点与终点相同。'); return; }
    // BFS over allowed relation types, ignoring direction (undirected reachability)
    const adj = new Map<string, Array<{ id: string; edge: GEdge }>>();
    for (const e of g.edges) {
      if (!rels.has(e.type)) continue;
      if (!adj.has(e.s)) adj.set(e.s, []);
      if (!adj.has(e.t)) adj.set(e.t, []);
      adj.get(e.s)!.push({ id: e.t, edge: e });
      adj.get(e.t)!.push({ id: e.s, edge: e });
    }
    const prev = new Map<string, { from: string; edge: GEdge }>();
    const q = [a.slug];
    const seen = new Set([a.slug]);
    while (q.length) {
      const cur = q.shift()!;
      if (cur === b.slug) break;
      for (const nx of adj.get(cur) || []) {
        if (seen.has(nx.id)) continue;
        seen.add(nx.id);
        prev.set(nx.id, { from: cur, edge: nx.edge });
        q.push(nx.id);
      }
    }
    if (!prev.has(b.slug)) {
      setPathInfo(`在已启用的关系类型（${[...rels].map((r) => REL_LABEL[r] || r).join('、')}）中，两节点之间没有通路。`);
      return;
    }
    const chainNodes = [b.slug];
    const chainEdges: GEdge[] = [];
    let cur = b.slug;
    while (cur !== a.slug) {
      const p = prev.get(cur)!;
      chainEdges.push(p.edge);
      chainNodes.push(p.from);
      cur = p.from;
    }
    chainNodes.reverse(); chainEdges.reverse();

    // make sure the whole chain is rendered
    const cy = cyRef.current;
    if (cy) {
      cy.elements().removeClass('path dim');
      const missingNodes = chainNodes.filter((id) => cy.getElementById(id).empty());
      const missingEdges = chainEdges.filter((e) => {
        return !cy.edges().some((x: any) => {
          const d = x.data();
          return (d.source === e.s && d.target === e.t) || (d.source === e.t && d.target === e.s);
        });
      });
      if (missingNodes.length || missingEdges.length) {
        cy.add([
          ...missingNodes.map((id) => {
            const en = entRef.current.get(id)!;
            return { data: { id, label: en.title, type: en.type, color: (TYPE_META[en.type] || TYPE_META.misc).color, size: 22 } };
          }),
          ...missingEdges.map((e, i) => ({ data: { id: `path-${i}`, source: e.s, target: e.t, type: e.type, label: e.label } })),
        ]);
      }
      cy.elements().addClass('dim');
      chainNodes.forEach((id) => cy.getElementById(id).removeClass('dim').addClass('path'));
      cy.edges().forEach((x: any) => {
        const d = x.data();
        if (chainEdges.some((e) => (e.s === d.source && e.t === d.target) || (e.s === d.target && e.t === d.source))) {
          x.removeClass('dim').addClass('path');
        }
      });
      cy.fit(cy.nodes('.path'), 80);
    }
    setPathInfo(
      `最短连接：${chainNodes.map((id) => ent.get(id)?.title).join(' → ')}（共 ${chainEdges.length} 条关系，按已启用的关系类型计算，不区分方向；"最短"指关系边数最少。这是算法发现的连通路径，不代表两者在设定中有直接关系。）`
    );
  };

  function shiftForDrawer() {
    const cy = cyRef.current;
    if (!cy) return;
    const p = cy.pan();
    cy.pan({ x: p.x - 170, y: p.y });
  }
  function fitWithDrawer(id?: string) {
    const cy = cyRef.current;
    if (!cy) return;
    try {
      const target = id ? cy.getElementById(id) : cy.elements();
      cy.fit(target, 80);
      if (window.innerWidth > 1024) shiftForDrawer();
    } catch {}
  }

  const selectedEntity = selected ? ent.get(selected) : null;
  const selectedRels = useMemo(() => {
    if (!selected || !graph) return { out: [] as GEdge[], in: [] as GEdge[] };
    return {
      out: graph.edges.filter((e) => e.s === selected).slice(0, 12),
      in: graph.edges.filter((e) => e.t === selected).slice(0, 12),
    };
  }, [selected, graph]);

  const searchHits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return entities
      .filter((e) => e.title.toLowerCase().includes(q) || e.english.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, entities]);

  const allRelTypes = graph ? [...new Set(graph.edges.map((e) => e.type))] : [];

  const toggle = <T,>(set: Set<T>, v: T) => {
    const n = new Set(set);
    if (n.has(v)) n.delete(v); else n.add(v);
    return n;
  };

  if (error) {
    return <div className="wrap" style={{ padding: '4rem 0' }}><p>图谱数据加载失败：{error}</p></div>;
  }

  return (
    <div className="graph-shell">
      <aside className="graph-panel" data-open={panelOpen} aria-label="图谱控制面板">
        <h2>搜索节点</h2>
        <label className="search-field" style={{ flex: '1 1 auto' }}>
          <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
            <path d="m13.5 13.5 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="阿拉贡、夏尔…" aria-label="搜索节点" />
        </label>
        {searchHits.length > 0 && (
          <ul style={{ listStyle: 'none', padding: '.4rem 0 0', margin: 0, display: 'flex', flexDirection: 'column', gap: '.15rem' }}>
            {searchHits.map((h) => (
              <li key={h.slug}>
                <button className="dg-rel button" onClick={() => { focusNode(h.slug); setQuery(''); }}
                  style={{ background: 'none', border: 0, padding: '.3rem 0', cursor: 'pointer', font: 'inherit', color: 'var(--forest-2)', display: 'flex', gap: '.4rem', width: '100%', textAlign: 'left' }}>
                  <span className="qs-dot" style={{ background: (TYPE_META[h.type] || TYPE_META.misc).color, marginTop: '.55em' }} />
                  {h.title}
                  <em style={{ marginLeft: 'auto', fontSize: '.72rem', color: 'var(--bark)' }}>{(TYPE_META[h.type] || TYPE_META.misc).label}</em>
                </button>
              </li>
            ))}
          </ul>
        )}

        <h2>实体类型</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
          {Object.entries(TYPE_META)
            .filter(([k]) => graph?.nodes.some((n) => n.type === k))
            .map(([k, m]) => (
              <button key={k} className="chip" aria-pressed={types.has(k)} onClick={() => setTypes((s) => toggle(s, k))}
                style={{ fontSize: '.72rem', padding: '.28rem .6rem' }}>
                <span className="qs-dot" style={{ background: m.color }} />{m.label}
              </button>
            ))}
        </div>

        <h2>关系类型</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem', maxHeight: 190, overflowY: 'auto' }}>
          {allRelTypes.map((t) => (
            <button key={t} className="chip" aria-pressed={rels.has(t)} onClick={() => setRels((s) => toggle(s, t))}
              style={{ fontSize: '.72rem', padding: '.28rem .6rem' }}>
              {REL_LABEL[t] || t}
            </button>
          ))}
        </div>

        <h2>展开范围</h2>
        <div style={{ display: 'flex', gap: '.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {[1, 2, 3].map((d) => (
            <button key={d} className="chip" aria-pressed={depth === d} onClick={() => { if (!focus && selected) setFocus(selected); setDepth(d); }}>
              {d} 跳
            </button>
          ))}
          <span style={{ fontSize: '.72rem', color: 'var(--bark)' }}>{focus ? '以当前节点为中心' : '未选中时展示高连接度节点'}</span>
        </div>

        <h2>两点之间的路径</h2>
        <div className="path-box">
          <input value={pathFrom} onChange={(e) => setPathFrom(e.target.value)} placeholder="起点名称" aria-label="路径起点" />
          <input value={pathTo} onChange={(e) => setPathTo(e.target.value)} placeholder="终点名称" aria-label="路径终点" />
          <button className="btn" style={{ width: '100%', minHeight: 38, padding: '.4rem .8rem', fontSize: '.84rem' }} onClick={runPath}>
            查找最短连接
          </button>
          <p className="path-result" style={{ fontSize: '.72rem' }}>
            按已启用的关系类型、不区分方向，计算边数最少的通路。
          </p>
        </div>
      </aside>

      <div className="graph-canvas-wrap">
        <div id="cy" ref={wrapRef} />

        <div className="graph-toolbar">
          <button className="icon-btn only-mobile" onClick={() => setPanelOpen((v) => !v)} aria-label="筛选与搜索" title="筛选与搜索">
            {panelOpen ? '✕' : '☰'}
          </button>
          <button className="icon-btn" onClick={() => zoom(1.25)} aria-label="放大" title="放大">＋</button>
          <button className="icon-btn" onClick={() => zoom(0.8)} aria-label="缩小" title="缩小">－</button>
          <button className="icon-btn" onClick={fit} aria-label="适应画布" title="适应画布">⤢</button>
          <button className="icon-btn" onClick={reset} aria-label="重置视图" title="重置视图">↺</button>
          <button className="icon-btn" onClick={share} aria-label="复制当前视图链接" title="复制链接">⧉</button>
          <button className="icon-btn" onClick={() => { const el = wrapRef.current?.parentElement; if (!el) return; if (document.fullscreenElement) document.exitFullscreen(); else el.requestFullscreen?.(); }}
            aria-label="全屏" title="全屏">⛶</button>
        </div>

        <div className="graph-status" role="status">{status}</div>

        <div className="graph-legend" aria-label="图例">
          <ul>
            {Object.entries(TYPE_META).filter(([k]) => graph?.nodes.some((n) => n.type === k)).map(([k, m]) => (
              <li key={k}><i style={{ background: m.color }} />{m.label}</li>
            ))}
          </ul>
        </div>

        {selectedEntity && (
          <div className="graph-drawer" role="dialog" aria-label={`${selectedEntity.title} 详情`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '.5rem' }}>
              <div>
                <h3>{selectedEntity.title}</h3>
                {selectedEntity.english && <div className="dg-en">{selectedEntity.english}</div>}
              </div>
              <button className="icon-btn" onClick={() => { setSelected(null); setMobileOpen(false); }} aria-label="关闭详情">✕</button>
            </div>
            {selectedEntity.summary && <p className="dg-sum">{selectedEntity.summary}</p>}
            <div className="dg-actions">
              <a className="btn" href={`/entry/${encodeURIComponent(selectedEntity.slug)}/`}>打开条目</a>
              <button className="btn btn--ghost" onClick={() => focusNode(selectedEntity.slug)}>以此为中心</button>
              <button className="btn btn--ghost" onClick={() => expand(depth + 1)}>展开一跳</button>
            </div>

            {selectedRels.out.length > 0 && (
              <div className="dg-rel">
                <h4>指向</h4>
                <ul>
                  {selectedRels.out.map((r, i) => (
                    <li key={i}>
                      <button onClick={() => focusNode(r.t)}>
                        {ent.get(r.t)?.title} <em>{REL_LABEL[r.type] || r.type}</em>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {selectedRels.in.length > 0 && (
              <div className="dg-rel">
                <h4>来自</h4>
                <ul>
                  {selectedRels.in.map((r, i) => (
                    <li key={i}>
                      <button onClick={() => focusNode(r.s)}>
                        {ent.get(r.s)?.title} <em>{REL_REVERSE[r.type] || r.type}</em>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {pathInfo && (
          <div className="graph-drawer" style={{ top: 'auto', bottom: '4.5rem', maxHeight: '40%' }} role="status">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '.5rem' }}>
              <strong style={{ fontSize: '.8rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--moss)' }}>路径 / 提示</strong>
              <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => setPathInfo(null)} aria-label="关闭提示">✕</button>
            </div>
            <p className="path-result">{pathInfo}</p>
          </div>
        )}
      </div>
    </div>
  );
}
