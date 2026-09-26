// Whether the community backend answers. One stats() probe on load; any later setup/offline error flips it to "down".
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, isDown } from '../lib/api.js';

const Ctx = createContext(null);

export function CommunityProvider({ children }) {
  const [status, setStatus] = useState('loading'); // loading | ok | down
  const [stats, setStats] = useState(null);
  const probe = useCallback(() => {
    setStatus('loading');
    api.stats().then((s) => { setStats(s || null); setStatus('ok'); }).catch((e) => { setStats(null); setStatus(isDown(e) ? 'down' : 'ok'); });
  }, []);
  useEffect(() => { probe(); }, [probe]);
  const report = useCallback((e) => { if (isDown(e)) setStatus('down'); }, []);
  const value = useMemo(() => ({ status, stats, report, retry: probe, down: status === 'down' }), [status, stats, report, probe]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useCommunity = () => useContext(Ctx);
