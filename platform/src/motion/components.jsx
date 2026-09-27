// Reusable motion components. Each one renders its final state immediately under prefers-reduced-motion.
import { Children, useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, reducedMotion, finePointer } from './core.js';

/** True once the element has been in view (or immediately under reduced motion / without IO). */
export function useInView({ threshold = 0.25, once = true, rootMargin = '0px' } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([en]) => {
      if (en.isIntersecting) { setInView(true); if (once) io.disconnect(); } else if (!once) setInView(false);
    }, { threshold, rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, once, rootMargin]);
  return [ref, inView];
}

/**
 * Words rise from under a mask with a stagger. `lines` is an array of strings or { text, className } — each line
 * breaks. Screen readers get the plain text once.
 */
export function SplitText({ lines, as: Tag = 'span', className = '', play, delay = 0, stagger = 70, id }) {
  const [ref, inView] = useInView({ threshold: 0.2 });
  const shown = play ?? inView;
  const list = (Array.isArray(lines) ? lines : [lines]).map((l) => (typeof l === 'string' ? { text: l } : l));
  const label = list.map((l) => l.text).join(' ');
  let k = 0;
  return (
    <Tag ref={ref} id={id} className={`split ${shown ? 'is-in' : ''} ${className}`}>
      <span className="sr-only">{label}</span>
      {list.map((line, li) => (
        <span key={li} className={`split-line ${line.className || ''}`} aria-hidden="true">
          {line.text.split(' ').map((w, wi, arr) => {
            const i = k++;
            return (
              <span key={wi} className="split-mask">
                <span className="split-word" style={{ transitionDelay: `${delay + i * stagger}ms` }}>{w}{wi < arr.length - 1 ? ' ' : ''}</span>
              </span>
            );
          })}
        </span>
      ))}
    </Tag>
  );
}

/** Fade-up on first view; uses the site-wide .reveal system (armed by Layout only when motion is allowed). */
export function Reveal({ as: Tag = 'div', i = 0, className = '', style, children, ...rest }) {
  return <Tag className={`reveal ${className}`} style={{ '--i': i, ...style }} {...rest}>{children}</Tag>;
}

/** The child follows the pointer a little and springs back when it leaves. Fine pointers only. */
export function Magnetic({ children, strength = 0.28, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion() || !finePointer()) return undefined;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
    const move = (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    };
    const leave = () => gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.38)' });
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); gsap.killTweensOf(el); };
  }, [strength]);
  return <span ref={ref} className={`magnetic ${className}`}>{children}</span>;
}

/** A slow, seamless strip. Content is duplicated (the copy is aria-hidden). Static under reduced motion. */
export function Marquee({ items, speed = 48, className = '', label }) {
  const row = (hidden) => (
    <ul className="marquee-row" aria-hidden={hidden || undefined}>
      {items.map((it, i) => <li key={i}>{it}</li>)}
    </ul>
  );
  return (
    <div className={`marquee ${className}`} style={{ '--dur': `${speed}s` }} aria-label={label} role={label ? 'region' : undefined}>
      <div className="marquee-track">{row(false)}{row(true)}</div>
    </div>
  );
}

/** Counts up once when visible. `decimals` for values like 14.6; screen readers get the final value. */
export function CountUp({ value, decimals = 0, format, duration = 1.4, className = '' }) {
  const [ref, inView] = useInView({ threshold: 0.15 });
  const fmt = format || ((v) => v.toFixed(decimals));
  // start at the real value: a reader who stops mid-scroll or a failed observer never sees a wrong number
  const [shown, setShown] = useState(value);
  const played = useRef(false);
  useEffect(() => {
    if (!inView || played.current) return undefined;
    played.current = true;
    if (reducedMotion()) { setShown(value); return undefined; }
    const o = { v: 0 };
    const tw = gsap.to(o, { v: value, duration, ease: 'power2.out', onUpdate: () => setShown(o.v) });
    return () => tw.kill();
  }, [inView, value, duration]);
  return (
    <span ref={ref} className={className}>
      <span aria-hidden="true">{fmt(shown)}</span><span className="sr-only">{fmt(value)}</span>
    </span>
  );
}

/** Manifesto: words light up as the paragraph scrolls through the viewport. All lit under reduced motion. */
export function ScrollWords({ text, as: Tag = 'p', className = '', accent = '' }) {
  const ref = useRef(null);
  const words = text.split(' ');
  // accent: a phrase inside the text (works in any language); its words get the gradient
  const hl = new Set();
  if (accent) {
    const aw = accent.split(' ');
    for (let i = 0; i + aw.length <= words.length; i++) {
      if (aw.every((w, j) => words[i + j].replace(/[.,;:]$/, '') === w)) { aw.forEach((_, j) => hl.add(i + j)); break; }
    }
  }
  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return undefined;
    const spans = [...el.querySelectorAll('.sw')];
    const st = ScrollTrigger.create({
      trigger: el, start: 'top 82%', end: 'bottom 42%', scrub: true,
      onUpdate: (self) => {
        const p = self.progress * (spans.length + 2);
        spans.forEach((s, i) => { s.style.setProperty('--lit', String(Math.max(0, Math.min(1, p - i)))); });
      },
    });
    return () => st.kill();
  }, [text]);
  return (
    <Tag ref={ref} className={`scrollwords ${className}`}>
      {words.map((w, i) => (
        <span key={i} className={`sw${hl.has(i) ? ' acc' : ''}`}>{w}{i < words.length - 1 ? ' ' : ''}</span>
      ))}
    </Tag>
  );
}

/**
 * Horizontal strip inside vertical scroll: pinned on wide screens with motion allowed, a plain grid otherwise.
 * `onProgress(p)` reports 0..1 while pinned.
 */
export function HorizontalStrip({ children, className = '', onProgress, label, head = null }) {
  const wrap = useRef(null);
  const track = useRef(null);
  const [pinned, setPinned] = useState(false);
  useEffect(() => {
    if (reducedMotion()) return undefined;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1024px)', () => {
      setPinned(true);
      const travel = () => Math.max(0, track.current.scrollWidth - wrap.current.clientWidth);
      const tw = gsap.to(track.current, {
        x: () => -travel(), ease: 'none',
        scrollTrigger: {
          trigger: wrap.current, start: 'top top', end: () => `+=${travel()}`, pin: true, scrub: 0.6,
          invalidateOnRefresh: true, anticipatePin: 1, onUpdate: (s) => onProgress?.(s.progress),
        },
      });
      return () => { tw.scrollTrigger?.kill(); tw.kill(); setPinned(false); };
    });
    return () => mm.revert();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div ref={wrap} className={`hstrip ${pinned ? 'is-pinned' : ''} ${className}`} aria-label={label} role={label ? 'region' : undefined}>
      {head && <div className="hstrip-head">{head}</div>}
      <div ref={track} className="hstrip-track">{Children.toArray(children)}</div>
    </div>
  );
}

/**
 * Custom cursor: a small ring that trails the pointer, grows over links and buttons and reads "drag" over the 3D
 * viewer. Fine pointers only, never under reduced motion, hidden over text fields. The native cursor stays.
 */
export function Cursor({ dragLabel = 'drag' }) {
  const ring = useRef(null);
  const [on] = useState(() => typeof window !== 'undefined' && finePointer() && !reducedMotion());
  useEffect(() => {
    if (!on) return undefined;
    const el = ring.current;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3.out' });
    let state = '';
    const set = (s) => { if (s !== state) { state = s; el.dataset.state = s; } };
    const move = (e) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      xTo(e.clientX); yTo(e.clientY);
      const t = e.target instanceof Element ? e.target : null;
      if (!t) return;
      if (t.closest('input, textarea, select, [contenteditable="true"]')) set('hidden');
      else if (t.closest('[data-cursor="drag"]')) set('drag');
      else if (t.closest('a, button, [role="button"], label, summary')) set('hover');
      else set('');
      el.classList.add('live');
    };
    const leave = () => el.classList.remove('live');
    const down = () => el.classList.add('down');
    const up = () => el.classList.remove('down');
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerleave', leave);
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move); document.removeEventListener('pointerleave', leave);
      window.removeEventListener('pointerdown', down); window.removeEventListener('pointerup', up);
    };
  }, [on]);
  if (!on) return null;
  return <div ref={ring} className="cursor" aria-hidden="true"><span className="cursor-label">{dragLabel}</span></div>;
}
