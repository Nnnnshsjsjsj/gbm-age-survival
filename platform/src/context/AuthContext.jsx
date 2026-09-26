// Session, profile and admin flag. Everything degrades to "signed out" when Supabase cannot be reached.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileState, setProfileState] = useState('none'); // none | loading | ready | error
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let alive = true;
    let unsub = () => {};
    api.getSession().then((s) => { if (alive) setSession(s); }).catch(() => {}).finally(() => { if (alive) setReady(true); });
    api.onAuthChange((s) => { if (alive) setSession(s); }).then((u) => { unsub = u; }).catch(() => {});
    return () => { alive = false; unsub(); };
  }, []);

  const uid = session?.user?.id || null;
  const loadProfile = useCallback(async (id) => {
    if (!id) { setProfile(null); setProfileState('none'); return null; }
    setProfileState('loading');
    try {
      const p = await api.myProfile(id);
      setProfile(p || null); setProfileState('ready');
      return p || null;
    } catch {
      setProfile(null); setProfileState('error');
      return null;
    }
  }, []);

  useEffect(() => {
    let alive = true;
    loadProfile(uid);
    if (uid) api.isAdmin().then((a) => alive && setIsAdmin(a)); else setIsAdmin(false);
    return () => { alive = false; };
  }, [uid, loadProfile]);

  const signOut = useCallback(async () => { await api.signOut(); setSession(null); }, []);
  const value = useMemo(() => ({
    ready, session, user: session?.user ?? null, profile, profileState, isAdmin,
    space: profile?.space || null,
    canPost: !!profile && !profile.banned && !!profile.rules_accepted_at && !!profile.adult_confirmed,
    needsProfile: !!uid && profileState === 'ready' && !profile,
    refreshProfile: () => loadProfile(uid),
    setSession, signOut,
  }), [ready, session, profile, profileState, isAdmin, uid, loadProfile, signOut]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
