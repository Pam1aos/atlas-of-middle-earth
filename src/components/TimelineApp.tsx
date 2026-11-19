import { useEffect, useMemo, useState } from 'react';

export interface TimelineItem { slug: string; title: string; date?: string }
export interface TimelineGroup { year: number; items: TimelineItem[] }
export interface EraPayload {
  era: string;
  span: string;
  blurb: string;
  events: number;
  dated: number;
  groups: TimelineGroup[];
  undated: TimelineItem[];
  yearPages: TimelineItem[];
  people: { slug: string; title: string; image: string | null }[];
}

const ERAS = ['双树纪元', '第一纪元', '第二纪元', '第三纪元', '第四纪元'];

export default function TimelineApp({ eras, initial }: { eras: EraPayload[]; initial: string }) {
  const [active, setActive] = useState(initial);
  const byName = useMemo(() => new Map(eras.map((e) => [e.era, e])), [eras]);
  const era = byName.get(active) || eras[0];

  // the page is generated statically, so ?era= has to be read in the browser
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('era');
    if (q && byName.has(q)) setActive(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const select = (name: string) => {
    setActive(name);
    const url = new URL(window.location.href);
    url.searchParams.set('era', name);
    history.replaceState(null, '', url.toString());
  };

  const empty = era.groups.length === 0 && era.yearPages.length === 0;

  return (
    <>
      <div className="tabs" role="tablist" aria-label="纪元切换">
        {ERAS.map((name) => (
          <button
            key={name}
            role="tab"
            className="tab"
            aria-selected={name === era.era}
            onClick={() => select(name)}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="timeline-layout">
        <div className="timeline-main">
          <p className="muted era-blurb">{era.blurb}</p>

          {empty ? (
            <div className="empty-state" style={{ marginTop: '1.2rem' }}>
              <h3>{era.era}暂无带年份的事件</h3>
              <p>数据库里这个时代只有人物、地点等条目，没有可以落到年份轴上的事件。</p>
              <p style={{ marginTop: '1rem' }}>
                <a className="btn btn--ghost" href={`/browse/?era=${encodeURIComponent(era.era)}`}>浏览这个时代的条目</a>
              </p>
            </div>
          ) : (
            <div className="tl">
              {era.groups.map((g) => (
                <div className="tl-block" key={g.year}>
                  <h2 className="tl-year">{era.era} {g.year} 年</h2>
                  <div className="tl-items">
                    {g.items.map((it) => (
                      <a className="tl-item" href={`/entry/${encodeURIComponent(it.slug)}/`} key={it.slug}>
                        {it.date && <time>{it.date}</time>}
                        <span>{it.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              ))}

              {era.groups.length === 0 && era.yearPages.length > 0 && (
                <div className="tl-block">
                  <h2 className="tl-year">{era.era} · 仅有年份页</h2>
                  <p className="muted" style={{ fontSize: '.86rem', margin: '.2rem 0 .7rem' }}>
                    这个时代没有可定年的事件条目，下面按年份列出原站的年份页，可作为时间参照。
                  </p>
                  <div className="tl-items">
                    {era.yearPages.map((p) => (
                      <a className="tl-item" href={`/entry/${encodeURIComponent(p.slug)}/`} key={p.slug}>
                        <span>{p.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {era.undated.length > 0 && (
                <div className="tl-block">
                  <h2 className="tl-year">年份不详</h2>
                  <p className="muted" style={{ fontSize: '.86rem', margin: '.2rem 0 .7rem' }}>
                    这些事件在原条目里没有可解析的年份，按标题顺序排列，不编造具体时间。
                  </p>
                  <div className="tl-items">
                    {era.undated.map((it) => (
                      <a className="tl-item" href={`/entry/${encodeURIComponent(it.slug)}/`} key={it.slug}>
                        <span>{it.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="timeline-aside">
          <div className="side-card">
            <h3>本纪元</h3>
            <dl className="era-stats">
              <div><dt>事件</dt><dd>{era.events}</dd></div>
              <div><dt>可定年</dt><dd>{era.dated}</dd></div>
              <div><dt>跨度</dt><dd>{era.span}</dd></div>
            </dl>
          </div>

          {era.yearPages.length > 0 && (
            <div className="side-card">
              <h3>年份索引</h3>
              <div className="year-chips">
                {era.yearPages.map((p) => (
                  <a className="chip" href={`/entry/${encodeURIComponent(p.slug)}/`} key={p.slug}>
                    {p.title.replace(era.era, '')}
                  </a>
                ))}
              </div>
            </div>
          )}

          {era.people.length > 0 && (
            <div className="side-card">
              <h3>{era.era}的代表人物</h3>
              <ul>
                {era.people.map((p) => (
                  <li key={p.slug} style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    {p.image && (
                      <img src={p.image} alt="" width="26" height="26"
                        style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', flex: 'none' }}
                        loading="lazy" />
                    )}
                    <a href={`/entry/${encodeURIComponent(p.slug)}/`}>{p.title}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
