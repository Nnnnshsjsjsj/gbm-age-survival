// Supabase client for the plateau schema. The URL and publishable key are public by design;
// VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY override them (for a fork or a staging project).
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://knvzabdifwvyvdsajsji.supabase.co';
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_KFJoAiBMRUQHD175VIyA8Q_bnkm1NG5';

// Every request gives up after 15 s so a blocked network turns into a calm fallback instead of an endless skeleton.
const timeoutFetch = (url, opts = {}) => {
  if (opts.signal || typeof AbortController === 'undefined') return fetch(url, opts);
  const ctl = new AbortController();
  const id = setTimeout(() => ctl.abort(), 15000);
  return fetch(url, { ...opts, signal: ctl.signal }).finally(() => clearTimeout(id));
};

let clientPromise = null;
/** The SDK is loaded lazily so the first paint does not wait for it. */
export function getSupabase() {
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_KEY, {
      db: { schema: 'plateau', retry: false }, // fail fast so the calm fallback appears at once
      global: { fetch: timeoutFetch },
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'plateau-auth' },
    }));
  }
  return clientPromise;
}
