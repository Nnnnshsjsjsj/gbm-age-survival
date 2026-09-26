// Every Supabase query lives here. Each function returns data or throws an Error with a readable message.
import { getSupabase, isConfigured } from './supabase.js';

async function client() {
  const sb = await getSupabase();
  if (!sb) throw new Error('not configured');
  return sb;
}
function unwrap({ data, error }) {
  if (error) throw new Error(error.message || String(error));
  return data;
}

export const api = {
  configured: isConfigured,

  // ---- auth ----
  async getSession() { if (!isConfigured) return null; const sb = await client(); return unwrap(await sb.auth.getSession())?.session ?? null; },
  async onAuthChange(cb) { if (!isConfigured) return () => {}; const sb = await client(); const { data } = sb.auth.onAuthStateChange((_e, s) => cb(s)); return () => data.subscription.unsubscribe(); },
  async signInWithEmail(email) {
    const sb = await client();
    const redirect = `${location.origin}${location.pathname}${location.hash || '#/'}`;
    return unwrap(await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect } }));
  },
  async signOut() { const sb = await client(); unwrap(await sb.auth.signOut()); },
  async isAdmin() { const sb = await client(); try { return !!unwrap(await sb.rpc('is_admin')); } catch { return false; } },

  // ---- summaries ----
  async listApprovedSummaries() { const sb = await client(); return unwrap(await sb.from('cohort_summaries').select('*').eq('status', 'approved').order('created_at')); },
  async listPendingSummaries() { const sb = await client(); return unwrap(await sb.from('cohort_summaries').select('*').eq('status', 'pending').order('created_at')); },
  async insertSummary(row) { const sb = await client(); return unwrap(await sb.from('cohort_summaries').insert(row).select().single()); },
  async reviewSummary(id, status, note) { const sb = await client(); unwrap(await sb.rpc('review_summary', { p_id: id, p_status: status, p_note: note || null })); },

  // ---- profiles ----
  async getMyProfile(userId) { const sb = await client(); return unwrap(await sb.from('profiles').select('*').eq('id', userId).maybeSingle()); },
  async upsertProfile(row) { const sb = await client(); return unwrap(await sb.from('profiles').upsert(row, { onConflict: 'id' }).select().single()); },
  async listProfiles() { const sb = await client(); return unwrap(await sb.from('profiles').select('*').eq('is_public', true).order('updated_at', { ascending: false })); },

  // ---- threads ----
  async listThreads(datasetKey) { const sb = await client(); return unwrap(await sb.from('threads').select('*').eq('dataset_key', datasetKey).neq('status', 'removed').order('created_at', { ascending: false })); },
  async listPendingThreads() { const sb = await client(); return unwrap(await sb.from('threads').select('*').eq('status', 'pending').order('created_at')); },
  async createThread(row) { const sb = await client(); return unwrap(await sb.from('threads').insert({ ...row, status: 'pending' }).select().single()); },
  async moderateThread(id, status) { const sb = await client(); unwrap(await sb.rpc('moderate_thread', { p_id: id, p_status: status })); },
  async listReplies(threadId) { const sb = await client(); return unwrap(await sb.from('replies').select('*').eq('thread_id', threadId).eq('removed', false).order('created_at')); },
  async listRecentReplies(limit = 50) { const sb = await client(); return unwrap(await sb.from('replies').select('*').eq('removed', false).order('created_at', { ascending: false }).limit(limit)); },
  async createReply(row) { const sb = await client(); return unwrap(await sb.from('replies').insert(row).select().single()); },
  async removeReply(id) { const sb = await client(); unwrap(await sb.rpc('remove_reply', { p_id: id })); },
};
