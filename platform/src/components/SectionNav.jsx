// Sticky "on this page" bar for the long guide pages. The current section is highlighted; on phones the bar
// swipes sideways and keeps the current chip in view.
import { useEffect, useRef, useState } from 'react';
import { scrollToEl } from '../motion/core.js';

export default function SectionNav({ items, label }) {
  const [active, setActive] = useState(items[0]?.id);
  const bar = useRef(null);
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const els = items.map((it) => document.getElementById(it.id)).filter(Boolean);
    const io = new IntersectionObserver((entries) => {
      const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (vis[0]) setActive(vis[0].target.id);
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items.map((it) => it.id).join()]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const a = bar.current?.querySelector(`a[data-id="${active}"]`);
    const box = bar.current;
    if (!a || !box) return;
    const target = a.offsetLeft - (box.clientWidth - a.offsetWidth) / 2;
    box.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }, [active]);
  return (
    <nav className="secnav" aria-label={label}>
      <div className="shell" ref={bar}>
        {items.map((it) => (
          <a key={it.id} href={`#${it.id}`} data-id={it.id} aria-current={active === it.id ? 'true' : undefined}
            onClick={(e) => { e.preventDefault(); setActive(it.id); scrollToEl(it.id, { offset: -120 }); }}>
            {it.n != null && <span className="n">{it.n}</span>}{it.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
