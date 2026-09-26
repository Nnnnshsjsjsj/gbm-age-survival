// Recess-style forum shared by the research and family spaces. The space picks the boards and the accent.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCommunity } from '../context/CommunityContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { api, friendly, isDown, classify } from '../lib/api.js';
import { boardsOf, boardByKey, spaceBase } from '../lib/boards.js';
import { relTime, fullTime } from '../lib/time.js';
import { Modal, CalmBanner, EmptyState, Skel, Tip, RoleBadge, Counter } from './ui.jsx';
import { IconSearch, IconPlus, IconThumb, IconMessage, IconUsers, IconInbox, IconCompass, IconChart, IconCheckCircle, IconClock, IconBook, IconHeart, IconX } from './Icons.jsx';

/** Can the current viewer write in this space? Returns { ok, reason, action } */
export function useWriteAccess(space) {
  const { t } = useApp();
  const auth = useAuth();
  const ui = useUI();
  if (!auth.user) return { ok: false, reason: t('need_login'), action: () => ui.openJoin({ space }) };
  if (!auth.profile) return { ok: false, reason: t('need_profile'), action: () => ui.openJoin({ step: 3, space }) };
  if (auth.profile.banned) return { ok: false, reason: t('need_unbanned') };
  if (auth.profile.space !== space && !auth.isAdmin) return { ok: false, reason: t(space === 'family' ? 'need_family' : 'need_research') };
  return { ok: true };
}

export function UsefulButton({ item, space, row = false, onChange }) {
  const { t } = useApp();
  const auth = useAuth();
  const community = useCommunity();
  const access = useWriteAccess(space);
  const [busy, setBusy] = useState(false);
  const pending = item.status && item.status !== 'approved';
  const disabledReason = !access.ok ? access.reason : pending ? t('useful_pending') : null;
  const toggle = async () => {
    if (disabledReason || busy) return;
    const on = !item.voted;
    onChange({ voted: on, votes: Math.max(0, (item.votes || 0) + (on ? 1 : -1)) });
    setBusy(true);
    try { await api.setVote(item.id, auth.user.id, on); } catch (e) {
      community.report(e);
      onChange({ voted: !on, votes: item.votes || 0 });
    } finally { setBusy(false); }
  };
  const label = t(item.voted ? 'useful_on' : 'useful');
  const btn = (describedBy) => (
    <button type="button" className={`useful${row ? ' row' : ''}`} aria-pressed={!!item.voted} aria-disabled={disabledReason ? 'true' : undefined}
      aria-describedby={disabledReason ? describedBy : undefined} onClick={toggle} aria-label={`${label}, ${item.votes || 0}`}>
      <IconThumb aria-hidden="true" /><b>{item.votes || 0}</b>{row && <span>{t('useful')}</span>}
    </button>
  );
  if (!disabledReason) return btn();
  return <Tip text={disabledReason} left={row}>{(id) => btn(id)}</Tip>;
}

function PostItem({ item, space, note, onPatch }) {
  const { t, lang } = useApp();
  const board = boardByKey(item.board);
  const base = spaceBase(space);
  return (
    <article className="card post" data-testid="post">
      <UsefulButton item={item} space={space} onChange={(p) => onPatch(item.id, p)} />
      <div className="min-w-0">
        {(item.status === 'pending' || item.status === 'rejected' || item.status === 'removed') && (
          <div className="mb-2 flex flex-wrap gap-2 items-center">
            {item.status === 'pending' && <span className="badge badge-pending"><IconClock />{t('waiting_review')}</span>}
            {item.status !== 'pending' && <span className="badge badge-rejected">{t(item.status === 'removed' ? 'status_removed' : 'status_rejected')}</span>}
          </div>
        )}
        <h3><Link to={`${base}/t/${item.id}`}>{item.title}</Link></h3>
        <p className="excerpt">{item.excerpt}</p>
        {note && <p className="small mt-2 p-3 rounded-[8px] bg-red-soft text-ink"><b>{t('mod_note')}:</b> {note}</p>}
        <div className="meta">
          {board && <span className="bchip"><span className="dot" style={{ background: board.color }} aria-hidden="true" />{t(`board_${board.key}_t`)}</span>}
          <span className="sep" aria-hidden="true" />
          <span className="hdl">@{item.author?.handle || 'member'}</span>
          <RoleBadge role={item.author?.role} />
          <span className="sep" aria-hidden="true" />
          <time dateTime={item.created_at} title={fullTime(item.created_at, lang)}>{relTime(item.created_at, lang)}</time>
          <span className="sep" aria-hidden="true" />
          <span className="mi"><IconMessage />{t('n_replies', { n: item.replies || 0 })}</span>
        </div>
      </div>
    </article>
  );
}

function FeedSkeleton() {
  return (
    <div className="feedlist" aria-busy="true" aria-label="…">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="card post" aria-hidden="true">
          <div className="flex justify-center pt-2"><Skel w={28} h={36} r={8} /></div>
          <div>
            <Skel w={`${60 + (i * 11) % 30}%`} h={16} />
            <Skel w="96%" h={11} style={{ marginTop: 12 }} />
            <Skel w="72%" h={11} style={{ marginTop: 8 }} />
            <div className="flex gap-3 mt-4"><Skel w={90} h={10} /><Skel w={70} h={10} /><Skel w={50} h={10} /></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function NewPostModal({ open, onClose, space, board, onSent }) {
  const { t } = useApp();
  const auth = useAuth();
  const community = useCommunity();
  const boards = boardsOf(space);
  const [key, setKey] = useState(board || boards[0].key);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [down, setDown] = useState(false);
  useEffect(() => { if (open) { setKey(board || boards[0].key); setErr(''); setDown(false); } }, [open, board]); // eslint-disable-line react-hooks/exhaustive-deps
  const ok = title.trim().length >= 4 && title.length <= 140 && body.trim().length >= 1 && body.length <= 6000;
  const submit = async (e) => {
    e.preventDefault();
    if (!ok) return;
    setBusy(true); setErr(''); setDown(false);
    try {
      await api.createThread({ board_key: key, title: title.trim(), body: body.trim() }, auth.user.id);
      setTitle(''); setBody('');
      onSent(key);
    } catch (ex) {
      const c = classify(ex);
      community.report(c);
      if (isDown(c)) setDown(true); else setErr(friendly(c, t));
    } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title={t('new_post')} sub={t('new_post_sub')} wide>
      <form onSubmit={submit} className="grid gap-4 mt-6" data-space={space}>
        {down && <CalmBanner />}
        <div className="field">
          <label htmlFor="np-board">{t('board')}</label>
          <select id="np-board" className="select" value={key} onChange={(e) => setKey(e.target.value)}>
            {boards.map((b) => <option key={b.key} value={b.key}>{t(`board_${b.key}_t`)}</option>)}
          </select>
        </div>
        <div className="field">
          <div className="flex justify-between items-baseline gap-2"><label htmlFor="np-title">{t('post_title')}</label><Counter value={title} max={140} min={4} /></div>
          <input id="np-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} required data-autofocus />
        </div>
        <div className="field">
          <div className="flex justify-between items-baseline gap-2"><label htmlFor="np-body">{t('post_body')}</label><Counter value={body} max={6000} /></div>
          <textarea id="np-body" className="textarea" rows={7} value={body} onChange={(e) => setBody(e.target.value)} maxLength={6200} required />
          <p className="hint">{t(space === 'family' ? 'post_hint_family' : 'post_hint_research')}</p>
        </div>
        <div className="banner"><IconClock /><p>{t('post_mod_note')}</p></div>
        {err && <p className="inline-err" role="alert">{err}</p>}
        <div className="actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>{t('cancel')}</button>
          <button type="submit" className="btn btn-primary" disabled={!ok || busy}>{busy ? t('working') : t('send_for_review')}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Forum({ space, board = null, extraRail = null }) {
  const { t } = useApp();
  const auth = useAuth();
  const community = useCommunity();
  const access = useWriteAccess(space);
  const base = spaceBase(space);
  const boards = boardsOf(space);
  const current = board ? boardByKey(board) : null;
  const [sort, setSort] = useState('active');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState(null);
  const [state, setState] = useState('loading'); // loading | ok | down | error
  const [errMsg, setErrMsg] = useState('');
  const [more, setMore] = useState(false);
  const [notes, setNotes] = useState({});
  const [composer, setComposer] = useState(false);
  const [sent, setSent] = useState(false);
  const [tick, setTick] = useState(0);
  const PAGE = 20;

  useEffect(() => { const id = setTimeout(() => setQuery(q.trim()), 300); return () => clearTimeout(id); }, [q]);

  const load = useCallback(async (offset = 0) => {
    if (offset === 0) { setState('loading'); setItems(null); }
    try {
      const rows = await api.feed({ board, space, sort, query: query || null, limit: PAGE, offset });
      setItems((cur) => (offset === 0 ? rows : [...(cur || []), ...rows]));
      setMore(rows.length === PAGE);
      setState('ok');
    } catch (e) {
      const c = classify(e);
      community.report(c);
      if (offset === 0) { setState(isDown(c) ? 'down' : 'error'); setErrMsg(friendly(c, t)); }
    }
  }, [board, space, sort, query]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(0); }, [load, auth.user?.id, tick]);
  useEffect(() => {
    if (!auth.user) { setNotes({}); return; }
    api.myNotes(auth.user.id).then((rows) => setNotes(Object.fromEntries((rows || []).filter((r) => r.mod_note).map((r) => [r.id, r.mod_note])))).catch(() => {});
  }, [auth.user, tick]);
  useEffect(() => { setSent(false); }, [board]);

  const patch = (id, p) => setItems((cur) => cur.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const median = community.stats?.median_review_minutes;
  const down = state === 'down' || community.down;
  const title = current ? t(`board_${current.key}_t`) : t(space === 'family' ? 'family_all_t' : 'research_all_t');
  const blurb = current ? t(`board_${current.key}_b`) : t(space === 'family' ? 'family_all_b' : 'research_all_b');
  const keypill = current ? current.key : space;
  const groups = space === 'research' ? [['general', t('group_general')], ['datasets', t('group_datasets')]] : [['family', t('group_boards')]];

  const newPostBtn = access.ok
    ? <button type="button" className="btn btn-primary" onClick={() => setComposer(true)}><IconPlus />{t('new_post')}</button>
    : access.action
      ? <button type="button" className="btn btn-primary" onClick={access.action}><IconPlus />{t('new_post')}</button>
      : <Tip text={access.reason}>{(id) => <button type="button" className="btn btn-primary" aria-disabled="true" aria-describedby={id}><IconPlus />{t('new_post')}</button>}</Tip>;

  return (
    <div className="shell forum" data-space={space}>
      <aside className="rail" aria-label={t('boards')}>
        <div className="rail-sticky">
          <div className="searchbox">
            <IconSearch />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search_posts')} aria-label={t('search_posts')} />
            {q && <button type="button" className="iconbtn" style={{ width: 28, height: 28 }} onClick={() => setQ('')} aria-label={t('clear')}><IconX width={14} height={14} /></button>}
          </div>
          <div className="rlists">
            <div className="rlist rlist-first">
              <Link to={base} className="railitem" aria-current={!board ? 'page' : undefined}>
                {space === 'family' ? <IconHeart /> : <IconBook />}{t('all_posts')}
              </Link>
            </div>
            {groups.map(([g, label]) => (
              <div key={g} className="rgroup">
                <p className="rh">{label}</p>
                <div className="rlist">
                  {boards.filter((b) => b.group === g).map((b) => (
                    <Link key={b.key} to={`${base}/${b.key}`} className="railitem" aria-current={board === b.key ? 'page' : undefined}>
                      <span className="dot" style={{ background: b.color }} aria-hidden="true" />{t(`board_${b.key}_t`)}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            {extraRail && (
              <div className="rgroup">
                <p className="rh">{t('group_more')}</p>
                <div className="rlist">{extraRail}</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="feedmain">
        <div className="feedhead">
          <div className="min-w-0">
            <div className="t"><h1>{title}</h1><span className="keypill">{keypill}</span></div>
            <p className="feeddesc">{blurb}</p>
          </div>
          {!down && newPostBtn}
        </div>

        {down ? <CalmBanner className="mt-6" /> : (
          <div className="banner mt-6" data-testid="premod-banner">
            <span className="pulse" aria-hidden="true" />
            <p><b>{t('premod_tag')}</b> {t('premod_body')}{median != null && ` ${t('premod_median', { n: Math.round(median) })}`}</p>
          </div>
        )}
        {sent && <div className="banner banner-accent mt-3" role="status"><IconCheckCircle /><p><b>{t('post_sent_t')}</b> {t('post_sent_b')}</p></div>}

        {!down && (
          <div className="feedbar">
            <div className="tabs" role="tablist" aria-label={t('sort_label')}>
              {['active', 'new', 'top'].map((s) => (
                <button key={s} type="button" role="tab" className="tab" aria-selected={sort === s} onClick={() => setSort(s)}>{t(`sort_${s}`)}</button>
              ))}
            </div>
            {query && state === 'ok' && <p className="small">{t('search_results', { n: items?.length || 0, q: query })}</p>}
          </div>
        )}

        {down ? (
          <div className="card mt-4">
            <EmptyState icon={space === 'family' ? IconHeart : IconUsers} title={t(space === 'family' ? 'fb_family_t' : 'fb_research_t')} body={t(space === 'family' ? 'fb_family_b' : 'fb_research_b')}>
              <Link to="/analyse" className="btn btn-primary"><IconChart />{t('home_cta1')}</Link>
              <Link to="/explore" className="btn btn-ghost"><IconCompass />{t('home_cta2')}</Link>
            </EmptyState>
          </div>
        ) : state === 'loading' ? <FeedSkeleton /> : state === 'error' ? (
          <div className="card"><EmptyState icon={IconInbox} title={t('feed_error_t')} body={errMsg}><button type="button" className="btn btn-ghost" onClick={() => load(0)}>{t('try_again')}</button></EmptyState></div>
        ) : items && items.length === 0 ? (
          <div className="card">
            {query ? <EmptyState icon={IconSearch} title={t('search_empty_t')} body={t('search_empty_b', { q: query })}><button type="button" className="btn btn-ghost" onClick={() => setQ('')}>{t('clear_search')}</button></EmptyState>
              : <EmptyState icon={IconInbox} title={t(current ? 'board_empty_t' : 'space_empty_t')} body={t(space === 'family' ? 'board_empty_family' : 'board_empty_research')}>{access.ok || access.action ? <button type="button" className="btn btn-primary" onClick={access.ok ? () => setComposer(true) : access.action}><IconPlus />{t('first_post')}</button> : null}</EmptyState>}
          </div>
        ) : (
          <>
            <div className="feedlist">
              {items.map((it) => <PostItem key={it.id} item={it} space={space} note={notes[it.id]} onPatch={patch} />)}
            </div>
            {more && <div className="flex justify-center mt-6"><button type="button" className="btn btn-ghost" onClick={() => load(items.length)}>{t('load_more')}</button></div>}
          </>
        )}
      </div>

      <NewPostModal open={composer} onClose={() => setComposer(false)} space={space} board={board}
        onSent={() => { setComposer(false); setSent(true); setSort('new'); setTick((x) => x + 1); }} />
    </div>
  );
}
