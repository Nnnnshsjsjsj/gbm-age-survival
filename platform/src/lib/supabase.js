// Supabase client. Returns null in local mode (no env vars). The SDK is loaded only when configured.
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(url && key);

let clientPromise = null;
/** @returns {Promise<import('@supabase/supabase-js').SupabaseClient|null>} */
export function getSupabase() {
  if (!isConfigured) return Promise.resolve(null);
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) => createClient(url, key, { auth: { flowType: 'pkce', persistSession: true, detectSessionInUrl: true } }));
  }
  return clientPromise;
}
