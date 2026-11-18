import entitiesData from '../data/entities.json';

export const all = entitiesData as any[];

/** Region is inferred from wiki categories such as "夏尔地点" / "刚铎地点". */
export function regionOf(e: any): string | null {
  let best: string | null = null;
  for (const c of e.cats || []) {
    const m = c.match(/^(.+?)(地点|地区)$/);
    if (m && (!best || m[1].length > best.length)) best = m[1];
  }
  return best;
}

export const regions = new Map<string, any[]>();
for (const e of all) {
  if (e.type !== 'place' && e.type !== 'realm') continue;
  const r = regionOf(e);
  if (!r) continue;
  if (!regions.has(r)) regions.set(r, []);
  regions.get(r)!.push(e);
}

export const regionList = [...regions.entries()]
  .map(([name, list]) => ({ name, list, count: list.length }))
  .sort((a, b) => b.count - a.count);
