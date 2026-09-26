import { useLayoutEffect, useRef, useState } from 'react';

/** Measures an element's content box; re-measures on resize. */
export function useSize(initial = { width: 0, height: 0 }) {
  const ref = useRef(null);
  const [size, setSize] = useState(initial);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const read = () => {
      const r = el.getBoundingClientRect();
      setSize((s) => (Math.abs(s.width - r.width) < 0.5 && Math.abs(s.height - r.height) < 0.5 ? s : { width: r.width, height: r.height }));
    };
    read();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size];
}
