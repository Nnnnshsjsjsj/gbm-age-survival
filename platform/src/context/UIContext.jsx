// Opens the Join and Log in dialogs from anywhere.
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const Ctx = createContext(null);
export function UIProvider({ children }) {
  const [join, setJoin] = useState(null);   // null | { space, step }
  const [login, setLogin] = useState(false);
  const openJoin = useCallback((opts = {}) => { setLogin(false); setJoin({ space: opts.space || null, step: opts.step || 1 }); }, []);
  const openLogin = useCallback(() => { setJoin(null); setLogin(true); }, []);
  const close = useCallback(() => { setJoin(null); setLogin(false); }, []);
  const value = useMemo(() => ({ join, login, openJoin, openLogin, close }), [join, login, openJoin, openLogin, close]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useUI = () => useContext(Ctx);
