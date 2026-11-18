import { useEffect, useRef } from 'react';
import { TYPE_META } from '../lib/types';

interface GNode { id: string; label: string; type: string }
interface GEdge { s: string; t: string; label?: string; type?: string; dir?: boolean }
interface GData { nodes: GNode[]; edges: GEdge[]; center?: string }

export default function MiniGraph({
  src,
  data: inlineData,
  height = '420px',
  layout = 'concentric',
}: {
  src?: string;
  data?: GData;
  height?: string;
  layout?: 'concentric' | 'cose' | 'circle';
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cy: any;
    let disposed = false;
    const el = ref.current;
    if (!el) return;

    (async () => {
      const [{ default: cytoscape }, data] = await Promise.all([
        import('cytoscape'),
        inlineData ? Promise.resolve(inlineData) : fetch(src!).then((r) => r.json() as Promise<GData>),
      ]);
      if (disposed || !el) return;

      const elements = [
        ...data.nodes.map((n) => ({
          data: { id: n.id, label: n.label, type: n.type, color: (TYPE_META[n.type] || TYPE_META.misc).color },
        })),
        ...data.edges.map((e, i) => ({ data: { id: `e${i}`, source: e.s, target: e.t, label: e.label || '' } })),
      ];

      cy = cytoscape({
        container: el,
        elements,
        wheelSensitivity: 0.18,
        minZoom: 0.4,
        maxZoom: 2.4,
        style: [
          {
            selector: 'node',
            style: {
              'background-color': 'data(color)',
              width: 22, height: 22,
              label: 'data(label)',
              'font-size': 9,
              'font-family': 'PingFang SC, Microsoft YaHei, sans-serif',
              color: '#243A2C',
              'text-valign': 'bottom',
              'text-margin-y': 5,
              'text-max-width': '88px',
              'text-wrap': 'ellipsis',
              'border-width': 2,
              'border-color': '#faf7f0',
              'overlay-opacity': 0,
            },
          },
          { selector: 'node[type="place"]', style: { shape: 'round-rectangle' } },
          { selector: 'node[type="realm"]', style: { shape: 'hexagon' } },
          { selector: 'node[type="event"]', style: { shape: 'diamond' } },
          { selector: 'node[type="item"]', style: { shape: 'triangle' } },
          { selector: 'node[type="race"]', style: { shape: 'ellipse' } },
          { selector: 'node[type="org"]', style: { shape: 'octagon' } },
          { selector: 'node[type="work"]', style: { shape: 'rectangle' } },
          {
            selector: 'edge',
            style: {
              width: 1,
              'line-color': 'rgba(102,117,82,.45)',
              'curve-style': 'bezier',
              'target-arrow-shape': 'none',
              'overlay-opacity': 0,
            },
          },
          { selector: 'node:selected', style: { 'border-width': 3, 'border-color': '#B79A5B' } },
        ],
        layout: {
          name: layout,
          animate: false,
          padding: 30,
          minNodeSpacing: layout === 'concentric' ? 30 : 22,
          ...(layout === 'concentric'
            ? { concentric: (n: any) => (n.data('id') === data.center ? 60 : 10), levelWidth: () => [1] }
            : {}),
          ...(layout === 'cose'
            ? { nodeRepulsion: 14000, idealEdgeLength: 78, gravity: 0.55, numIter: 900, nodeOverlap: 12 }
            : {}),
        } as any,
      });

      cy.on('tap', 'node', (evt: any) => {
        const id = evt.target.id();
        window.location.href = `/entry/${encodeURIComponent(id)}/`;
      });
      cy.on('mouseover', 'node', (evt: any) => { el.style.cursor = 'pointer'; evt.target.addClass('hover'); });
      cy.on('mouseout', 'node', () => { el.style.cursor = 'grab'; });
    })();

    return () => { disposed = true; try { cy?.destroy(); } catch {} };
  }, [src, layout, inlineData]);

  return <div ref={ref} style={{ height, width: '100%' }} aria-label="关系图谱" role="img" />;
}
