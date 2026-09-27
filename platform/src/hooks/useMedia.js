import { useEffect, useState } from 'react';

/** Live media-query match (e.g. useMedia('(max-width: 899px)')). */
export function useMedia(query) {
  const get = () => { try { return matchMedia(query).matches; } catch { return false; } };
  const [on, setOn] = useState(get);
  useEffect(() => {
    let mq; try { mq = matchMedia(query); } catch { return undefined; }
    const f = () => setOn(mq.matches);
    f();
    mq.addEventListener?.('change', f);
    return () => mq.removeEventListener?.('change', f);
  }, [query]);
  return on;
}
