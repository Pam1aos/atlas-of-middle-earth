import entitiesData from '../data/entities.json';
import relationsData from '../data/relations.json';
import { REL_LABEL } from './relations';

export const entities = entitiesData as any[];
export const relations = relationsData as any[];

export const bySlug = new Map<string, any>(entities.map((e) => [e.slug, e]));

export const outBy = new Map<string, any[]>();
export const inBy = new Map<string, any[]>();
for (const r of relations) {
  if (!outBy.has(r.s)) outBy.set(r.s, []);
  outBy.get(r.s)!.push(r);
  if (!inBy.has(r.t)) inBy.set(r.t, []);
  inBy.get(r.t)!.push(r);
}

export function egoFor(e: any, cap = 26) {
  const out = outBy.get(e.slug) || [];
  const inc = inBy.get(e.slug) || [];
  const nodes = new Map<string, any>();
  const edges: any[] = [];
  nodes.set(e.slug, { id: e.slug, label: e.title, type: e.type });
  for (const r of [...out, ...inc]) {
    if (nodes.size > cap) break;
    const other = r.s === e.slug ? r.t : r.s;
    const o = bySlug.get(other);
    if (!o) continue;
    nodes.set(o.slug, { id: o.slug, label: o.title, type: o.type });
    if (nodes.has(r.s) && nodes.has(r.t)) {
      edges.push({ s: r.s, t: r.t, label: REL_LABEL[r.type] || '', type: r.type, dir: r.directed });
    }
  }
  return { center: e.slug, nodes: [...nodes.values()], edges };
}
