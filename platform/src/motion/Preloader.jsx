import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { gsap, reducedMotion } from './core.js';

const KEY = 'cohortex-intro';
/** Show once per browser session, never under reduced motion. */
export function shouldShowPreloader() {
  if (reducedMotion()) return false;
  try { return sessionStorage.getItem(KEY) !== '1'; } catch { return false; }
}

// A Kaplan–Meier-like step curve across the screen (viewBox 0..1000 × 0..300).
const STEPS = [[0, 30], [70, 30], [70, 46], [140, 46], [140, 70], [205, 70], [205, 98], [260, 98], [260, 124], [330, 124], [330, 150], [400, 150],
  [400, 172], [470, 172], [470, 192], [545, 192], [545, 210], [620, 210], [620, 226], [700, 226], [700, 238], [790, 238], [790, 248], [880, 248], [880, 254], [1000, 254]];
const D = STEPS.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');

/**
 * Preloader: a survival curve draws across the screen while a mono counter runs 0 → 100, then the curtain lifts.
 * Total ≤ 1.6 s. Click, tap or Escape skips it.
 */
export default function Preloader({ onDone, label }) {
  const root = useRef(null);
  const path = useRef(null);
  const [n, setN] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    try { sessionStorage.setItem(KEY, '1'); } catch { /* storage off */ }
    const finish = () => { if (done.current) return; done.current = true; onDone?.(); };
    const el = root.current;
    const len = path.current.getTotalLength?.() || 1400;
    gsap.set(path.current, { strokeDasharray: len, strokeDashoffset: len });
    const st = { v: 0 };
    const tl = gsap.timeline({ onComplete: finish });
    tl.to(st, { v: 100, duration: 1.05, ease: 'power2.inOut', onUpdate: () => setN(Math.round(st.v)) }, 0)
      .to(path.current, { strokeDashoffset: 0, duration: 1.05, ease: 'power2.inOut' }, 0)
      .to(el, { yPercent: -100, duration: 0.5, ease: 'expo.inOut' }, 1.1);
    const skip = () => { tl.progress(1); finish(); };
    const onKey = (e) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') skip(); };
    el.addEventListener('click', skip);
    window.addEventListener('keydown', onKey);
    return () => { tl.kill(); el.removeEventListener('click', skip); window.removeEventListener('keydown', onKey); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return createPortal(
    <div ref={root} className="preloader" role="status" aria-live="polite" aria-label={label} data-testid="preloader">
      <div className="pre-top"><span className="kicker kicker-dot">cohortex</span><span className="kicker">GBM · KM</span></div>
      <svg className="pre-curve" viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="pre-g" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor="#5EF2B8" /><stop offset="1" stopColor="#4CC9F0" /></linearGradient>
        </defs>
        <path ref={path} d={D} fill="none" stroke="url(#pre-g)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="pre-bottom">
        <span className="pre-count mono" aria-hidden="true">{String(n).padStart(3, '0')}</span>
        <span className="kicker">{label}</span>
      </div>
    </div>,
    document.body,
  );
}
