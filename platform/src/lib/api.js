// Every Supabase call lives here. Functions return data or throw an ApiError whose `kind` says how to react:
//   setup   – the project is not switched on yet (schema not exposed, email confirmation still required)
//   offline – the request never reached Supabase (network blocked, timeout)
//   user    – a readable refusal (trigger message, RLS, validation); show it inline
import { getSupabase } from './supabase.js';

export class ApiError extends Error {
  constructor(message, kind = 'user', code) { super(message); this.kind = kind; this.code = code; }
}

const SETUP_RE = /schema must be one of|invalid schema|PGRST106|email not confirmed|email_not_confirmed|signups? not allowed/i;
const OFFLINE_RE = /failed to fetch|networkerror|load failed|fetch failed|network request failed|err_|aborted|aborterror|timeout|timed out|AuthRetryableFetchError|the user aborted/i;

export function classify(err) {
  if (err instanceof ApiError) return err;
  const msg = String(err?.message || err?.error_description || err || 'unknown error');
  const code = err?.code || err?.status;
  if (SETUP_RE.test(msg) || code === 'PGRST106' || code === 'email_not_confirmed') return new ApiError(msg, 'setup', code);
  if (OFFLINE_RE.test(msg) || err?.name === 'AuthRetryableFetchError' || err?.status === 0 || err?.name === 'AbortError') return new ApiError(msg, 'offline', code);
  return new ApiError(msg, 'user', code);
}
export const isDown = (e) => e && (e.kind === 'setup' || e.kind === 'offline');

/** Map known server messages to i18n keys so users see a short friendly sentence. */
const FRIENDLY = [
  [/daily limit of 8 new posts/i, 'err_daily_limit'],
  [/slow down/i, 'err_slow'],
  [/finish setting up your account/i, 'err_finish_setup'],
  [/belongs to the other space/i, 'err_other_space'],
  [/only possible on approved posts/i, 'err_not_approved'],
  [/profiles_handle_key|duplicate key.*handle/i, 'err_handle_taken'],
  [/profiles_pkey/i, 'err_profile_exists'],
  [/already registered|already been registered|user_already_exists/i, 'err_email_taken'],
  [/invalid login credentials/i, 'err_bad_login'],
  [/password should be|weak_password|password is too weak/i, 'err_weak_password'],
  [/only research accounts can share/i, 'err_research_only'],
  [/ethics approval/i, 'err_ethics'],
  [/not a moderator/i, 'err_not_mod'],
  [/row-level security|permission denied|not allowed/i, 'err_not_allowed'],
  [/space cannot be changed/i, 'err_space_locked'],
  [/violates check constraint/i, 'err_invalid'],
  [/rate limit|too many requests/i, 'err_rate'],
  [/not signed in|jwt|not authenticated/i, 'err_signed_out'],
];
export function friendly(err, t) {
  const e = classify(err);
  if (e.kind === 'setup') return t('err_setup');
  if (e.kind === 'offline') return t('err_offline');
  for (const [re, key] of FRIENDLY) if (re.test(e.message)) return t(key);
  return t('err_generic', { msg: e.message });
}

async function client() {
  try { return await getSupabase(); } catch (e) { throw new ApiError(String(e?.message || e), 'offline'); }
}
async function run(fn) {
  const sb = await client();
  let res;
  try { res = await fn(sb); } catch (e) { throw classify(e); }
  if (res && res.error) throw classify(res.error);
  return res ? res.data : undefined;
}
/** PostgREST returns `setof json` as an array of values; older versions wrap each in { fn_name: value }. */
const unwrapSet = (rows, fn) => (Array.isArray(rows) ? rows.map((r) => (r && typeof r === 'object' && fn in r && !('id' in r) ? r[fn] : r)) : []);

export const api = {
  // ---------- auth ----------
  async getSession() {
    const sb = await client();
    const { data } = await sb.auth.getSession();
    return data?.session ?? null;
  },
  async onAuthChange(cb) {
    const sb = await client();
    const { data } = sb.auth.onAuthStateChange((_e, s) => cb(s));
    return () => data.subscription.unsubscribe();
  },
  async signUp(email, password, space) {
    const data = await run((sb) => sb.auth.signUp({ email, password, options: { data: { space } } }));
    // With email confirmation still switched on, sign-up succeeds but returns no session.
    if (!data?.session) throw new ApiError('Email not confirmed', 'setup');
    return data.session;
  },
  async signIn(email, password) {
    const data = await run((sb) => sb.auth.signInWithPassword({ email, password }));
    return data?.session ?? null;
  },
  async signOut() { const sb = await client(); try { await sb.auth.signOut(); } catch { /* local session is cleared anyway */ } },
  async updatePassword(password) { return run((sb) => sb.auth.updateUser({ password })); },
  async deleteMyAccount() { await run((sb) => sb.rpc('delete_my_account')); await api.signOut(); },

  // ---------- me ----------
  async myProfile(uid) { return run((sb) => sb.from('profiles').select('*').eq('id', uid).maybeSingle()); },
  async createProfile(row) { return run((sb) => sb.from('profiles').insert(row)); },
  async updateProfile(uid, patch) { return run((sb) => sb.from('profiles').update(patch).eq('id', uid)); },
  async handleAvailable(handle) { return !!(await run((sb) => sb.rpc('handle_available', { p_handle: handle }))); },
  async isAdmin() { try { return !!(await run((sb) => sb.rpc('is_admin'))); } catch { return false; } },
  async myThreads(uid) {
    return run((sb) => sb.from('threads').select('id,board_key,title,status,mod_note,created_at,reply_count').eq('author', uid).order('created_at', { ascending: false }).limit(50));
  },

  // ---------- public ----------
  async stats() { return run((sb) => sb.rpc('stats')); },
  async directory() {
    return run((sb) => sb.from('profiles').select('handle,role_label,display_name,institution,country,tags,works_with,bio,created_at')
      .eq('space', 'research').eq('is_public', true).eq('banned', false).order('created_at', { ascending: false }).limit(300));
  },

  // ---------- forum ----------
  async feed({ board = null, space = 'research', sort = 'active', query = null, limit = 30, offset = 0 }) {
    const rows = await run((sb) => sb.rpc('feed', { p_board: board, p_space: space, p_sort: sort, p_query: query || null, p_limit: limit, p_offset: offset }));
    return unwrapSet(rows, 'feed');
  },
  async thread(id) {
    const data = await run((sb) => sb.rpc('thread', { p_id: id }));
    return data && typeof data === 'object' && 'thread' in data && !('id' in data) ? data.thread : data;
  },
  async myNotes(uid) {
    return run((sb) => sb.from('threads').select('id,mod_note').eq('author', uid).in('status', ['rejected', 'removed']));
  },
  async createThread({ board_key, title, body }, uid) { return run((sb) => sb.from('threads').insert({ board_key, title, body, author: uid })); },
  async createReply(thread_id, body, uid) { return run((sb) => sb.from('replies').insert({ thread_id, body, author: uid })); },
  async deleteReply(id) { return run((sb) => sb.from('replies').delete().eq('id', id)); },
  async setVote(thread_id, uid, on) {
    return on
      ? run((sb) => sb.from('votes').insert({ thread_id, user_id: uid }))
      : run((sb) => sb.from('votes').delete().eq('thread_id', thread_id).eq('user_id', uid));
  },
  async report({ target_type, target_id, reason }, uid) { return run((sb) => sb.from('reports').insert({ target_type, target_id, reason, reporter: uid })); },

  // ---------- cohort summaries ----------
  async approvedSummaries() { return run((sb) => sb.from('cohort_summaries').select('*').eq('status', 'approved').order('created_at')); },
  async insertSummary(row) { return run((sb) => sb.from('cohort_summaries').insert(row)); },

  // ---------- moderation ----------
  async modQueue() { return run((sb) => sb.rpc('mod_queue')); },
  async moderateThread(id, status, note) { return run((sb) => sb.rpc('moderate_thread', { p_id: id, p_status: status, p_note: note || null })); },
  async removeReply(id, note) { return run((sb) => sb.rpc('remove_reply', { p_id: id, p_note: note || null })); },
  async reviewSummary(id, status, note) { return run((sb) => sb.rpc('review_summary', { p_id: id, p_status: status, p_note: note || null })); },
  async resolveReport(id, status) { return run((sb) => sb.rpc('resolve_report', { p_id: id, p_status: status })); },
  async banUser(handle, reason) { return run((sb) => sb.rpc('ban_user', { p_handle: handle, p_reason: reason })); },
  async unbanUser(handle) { return run((sb) => sb.rpc('unban_user', { p_handle: handle })); },
};
