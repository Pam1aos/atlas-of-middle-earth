import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AgentRec, Block, SearchRow } from '../lib/agent';
import { buildAnswer, buildContext, buildLookup, resolveQuery, typeLabel } from '../lib/agent';

const GraphApp = lazy(() => import('./GraphApp.tsx'));

interface Msg { id: number; role: 'user' | 'agent'; blocks?: Block[]; text?: string }

const SUGGESTIONS = ['阿拉贡是谁？', '魔戒大战发生了什么？', '夏尔住着哪些种族？', '至尊戒在哪被销毁？', '摩瑞亚有什么？'];

export default function AgentDock() {
  const [open, setOpen] = useState(false);
  const [graphOpen, setGraphOpen] = useState(false);
  const [graphFocus, setGraphFocus] = useState<string | null>(null);
  const [mode, setMode] = useState<'brief' | 'deep'>('brief');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const recsRef = useRef<Map<string, AgentRec> | null>(null);
  const indexRef = useRef<SearchRow[] | null>(null);
  const lookupRef = useRef<Map<string, string> | null>(null);
  const [ready, setReady] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);


  // global triggers: any element with data-graph-focus / data-open-agent
  useEffect(() => {
    const onClick = (ev: MouseEvent) => {
      const target = (ev.target as HTMLElement)?.closest('[data-graph-focus],[data-open-agent]') as HTMLElement | null;
      if (!target) return;
      ev.preventDefault();
      setOpen(true);
      if (target.dataset.graphFocus !== undefined) {
        setGraphFocus(target.dataset.graphFocus || null);
        setGraphOpen(true);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // closing the conversation closes the graph window with it
  useEffect(() => {
    if (!open) setGraphOpen(false);
  }, [open]);

  useEffect(() => {
    if (!open || recsRef.current) return;
    let cancelled = false;
    (async () => {
      const [agent, search] = await Promise.all([
        fetch('/data/agent.json').then((r) => r.json()),
        fetch('/data/search.json').then((r) => r.json()),
      ]);
      if (cancelled) return;
      const map = new Map<string, AgentRec>();
      for (const r of agent as AgentRec[]) map.set(r.s, r);
      recsRef.current = map;
      indexRef.current = search as SearchRow[];
      lookupRef.current = buildLookup(search as SearchRow[]);
      setReady(true);
    })();
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  const push = (m: Omit<Msg, 'id'>) => setMessages((prev) => [...prev, { ...m, id: ++idRef.current }]);

  const ask = useCallback(async (question: string) => {
    if (!question.trim() || !recsRef.current) return;
    push({ role: 'user', text: question });
    setInput('');
    setBusy(true);

    const recs = recsRef.current;
    const slug = resolveQuery(question, indexRef.current!, lookupRef.current!);
    const answer = buildAnswer(question, slug, mode, recs);
    push({ role: 'agent', blocks: answer.blocks });
    setSources(answer.sources);

    // deep mode optionally hands the retrieved material to /api/ask, where the
    // model key lives in Vercel environment variables (never in the browser)
    if (mode === 'deep' && slug) {
      try {
        const rec = recs.get(slug)!;
        const res = await fetch('/api/ask', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ question, context: buildContext(rec, recs) }),
        });
        if (res.status === 501) {
          push({ role: 'agent', blocks: [{ kind: 'note', text: '服务端未配置模型 Key，以上为本地检索结果。' }] });
        } else if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const detail = data.message ? `：${String(data.message).slice(0, 120)}` : '';
          push({
            role: 'agent',
            blocks: [{ kind: 'note', text: `模型服务返回错误（${data.status || data.error || res.status}）${detail}。以上为本地检索结果。` }],
          });
        } else {
          const data = await res.json();
          if (data.text) push({ role: 'agent', blocks: [{ kind: 'h', text: '模型整合' }, { kind: 'p', text: data.text }] });
        }
      } catch {
        push({ role: 'agent', blocks: [{ kind: 'note', text: '模型服务不可用，以上为本地检索结果。' }] });
      }
    }

    setBusy(false);
  }, [mode]);

  const graphEntities = useMemo(() => {
    const recs = recsRef.current;
    if (!recs) return [];
    return [...recs.values()].map((r) => ({
      slug: r.s, title: r.t, english: r.e, type: r.ty, era: r.er,
      image: null as string | null, summary: r.su,
    }));
  }, [ready]);

  return (
    <>
      <button className={`agent-launcher${open ? ' is-open' : ''}`} onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label="打开资料助手">
        <span className="agent-launcher__dot" aria-hidden="true" />
        {open ? '收起助手' : '资料助手'}
      </button>

      {open && (
        <div className="agent-shell" role="dialog" aria-label="资料助手">
          <aside className="agent-sources" aria-label="原文依据">
            <header>
              <h3>原文依据</h3>
              <span>{sources.length} 条</span>
            </header>
            {sources.length === 0 ? (
              <p className="agent-empty">提问后，这里会列出回答所依据的条目。</p>
            ) : (
              <div className="agent-source-body">
                {sources.map((s, i) => {
                  const rec = recsRef.current?.get(s);
                  if (!rec) return null;
                  return (
                    <article key={s}>
                      <div className="agent-source-head">
                        <span className="agent-source-idx">{i + 1}</span>
                        <h4>{rec.t}</h4>
                      </div>
                      <div className="agent-source-meta">
                        {typeLabel(rec.ty)}{rec.er ? ` · ${rec.er}` : ''}{rec.e ? ` · ${rec.e}` : ''}
                      </div>
                      <p>{rec.su || '该条目没有摘要，可打开条目查看正文。'}</p>
                      <a className="agent-source-link" href={`/entry/${encodeURIComponent(rec.s)}/`}>打开条目 →</a>
                    </article>
                  );
                })}
              </div>
            )}
          </aside>

          <section className="agent-panel">
            <header className="agent-head">
              <div>
                <strong>资料助手</strong>
                <span>{mode === 'brief' ? '精简模式' : '深入模式'}</span>
              </div>
              <div className="agent-head-actions">
                <button className="agent-icon" onClick={() => setGraphOpen(true)} title="打开关系图谱">图谱</button>
                <button className="agent-icon" onClick={() => { setMessages([]); setSources([]); }} title="清空对话">清空</button>
                <button className="agent-icon" onClick={() => setOpen(false)} title="关闭">✕</button>
              </div>
            </header>

            <div className="agent-modes" role="group" aria-label="回答模式">
              <button aria-pressed={mode === 'brief'} onClick={() => setMode('brief')}>精简</button>
              <button aria-pressed={mode === 'deep'} onClick={() => setMode('deep')}>深入</button>
            </div>

            <div className="agent-body" ref={bodyRef}>
              {messages.length === 0 && (
                <div className="agent-intro">
                  <p>问一个关于中洲的问题。回答只依据库里的 5,303 个条目与 10,063 条关系，并在左侧列出出处。</p>
                  <div className="agent-chips">
                    {SUGGESTIONS.map((s) => (
                      <button key={s} className="chip" onClick={() => ask(s)}>{s}</button>
                    ))}
                  </div>
                  {!ready && <p className="agent-note">正在载入条目索引…</p>}
                </div>
              )}

              {messages.map((m) => (
                <div key={m.id} className={`agent-msg agent-msg--${m.role}`}>
                  {m.role === 'user' ? <p>{m.text}</p> : <Blocks blocks={m.blocks || []} />}
                </div>
              ))}

              {busy && <div className="agent-typing" aria-label="生成中"><span /><span /><span /></div>}
            </div>

            <form
              className="agent-input"
              onSubmit={(e) => { e.preventDefault(); ask(input); }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={ready ? '问点什么，例如「洛汗的国王是谁」' : '索引载入中…'}
                disabled={!ready}
                aria-label="输入问题"
              />
              <button className="btn" type="submit" disabled={!ready || !input.trim()}>发送</button>
            </form>
          </section>
        </div>
      )}

      {graphOpen && (
        <div className="agent-modal" role="dialog" aria-modal="true" aria-label="关系图谱">
          <div className="agent-modal__panel">
            <header className="agent-modal__head">
              <strong>关系知识图谱</strong>
              <div>
                <button className="agent-icon" onClick={() => { setOpen(false); setGraphOpen(false); }} title="关闭">✕</button>
              </div>
            </header>
            <div className="agent-modal__body">
              <Suspense fallback={<div className="agent-modal__loading">正在载入图谱…</div>}>
                <GraphApp entities={graphEntities} initialFocus={graphFocus} />
              </Suspense>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.kind === 'p') return <p key={i}>{b.text}</p>;
        if (b.kind === 'h') return <h4 key={i}>{b.text}</h4>;
        if (b.kind === 'note') return <p key={i} className="agent-note">{b.text}</p>;
        if (b.kind === 'facts') return (
          <dl key={i} className="agent-facts">
            {b.rows.map(([k, v], j) => (
              <div key={j}><dt>{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
        );
        if (b.kind === 'rels') return (
          <ul key={i} className="agent-rels">
            {b.items.map((it) => (
              <li key={it.slug}>
                <a href={`/entry/${encodeURIComponent(it.slug)}/`}>{it.title}</a>
                <em>{it.label}</em>
              </li>
            ))}
          </ul>
        );
        return (
          <div key={i} className="agent-links">
            {b.items.map((it) => (
              <a key={it.slug} className="chip" href={`/entry/${encodeURIComponent(it.slug)}/`}>{it.title}</a>
            ))}
          </div>
        );
      })}
    </>
  );
}
