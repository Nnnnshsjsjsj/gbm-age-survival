import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';

const Ctx = createContext({ configured: false, session: null, user: null, isAdmin: false, loading: false });

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(api.configured);

  useEffect(() => {
    if (!api.configured) return undefined;
    let unsub = () => {};
    let alive = true;
    api.getSession().then((s) => { if (alive) { setSession(s); setLoading(false); } }).catch(() => setLoading(false));
    api.onAuthChange((s) => { if (alive) setSession(s); }).then((u) => { unsub = u; });
    return () => { alive = false; unsub(); };
  }, []);

  useEffect(() => {
    if (!session) { setIsAdmin(false); return; }
    let alive = true;
    api.isAdmin().then((a) => { if (alive) setIsAdmin(a); });
    return () => { alive = false; };
  }, [session]);

  const value = useMemo(() => ({ configured: api.configured, session, user: session?.user ?? null, isAdmin, loading }), [session, isAdmin, loading]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
