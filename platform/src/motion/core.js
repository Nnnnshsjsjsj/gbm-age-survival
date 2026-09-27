// Motion core: GSAP + ScrollTrigger + Lenis, wired once per route.
// Lenis drives the native scroll position, so window.scrollY, IntersectionObserver and anchors keep working.
import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);
export { gsap, ScrollTrigger };

export function reducedMotion() {
  try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return true; }
}
export function finePointer() {
  try { return matchMedia('(hover: hover) and (pointer: fine)').matches; } catch { return false; }
}
export function isMobile() {
  try { return matchMedia('(max-width: 767px)').matches; } catch { return false; }
}

/** One scroll helper for the whole site: smooth through Lenis when it runs, native otherwise. */
export function scrollToEl(target, { offset = -80, immediate = false, duration = 1.2 } = {}) {
  const el = typeof target === 'string' ? document.getElementById(target.replace(/^#/, '')) : target;
  if (window.lenis) {
    window.lenis.scrollTo(el ?? 0, { offset: el ? offset : 0, immediate, duration });
    return;
  }
  if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY + (offset || 0);
    window.scrollTo({ top: Math.max(0, top), behavior: immediate || reducedMotion() ? 'auto' : 'smooth' });
  } else {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
}
if (typeof window !== 'undefined') window.scrollToEl = scrollToEl;

/**
 * Smooth scroll for the current route. A fresh Lenis instance per route; on route change every ScrollTrigger and
 * the Lenis instance are destroyed, so nothing leaks between pages. Off under reduced motion.
 */
export function useSmoothScroll(routeKey) {
  useEffect(() => {
    window.scrollTo(0, 0);
    let lenis = null;
    let raf = null;
    if (!reducedMotion()) {
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1, anchors: false, autoRaf: false });
      window.lenis = lenis;
      lenis.on('scroll', ScrollTrigger.update);
      raf = (time) => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
    }
    // refresh trigger positions once fonts and late images have settled
    const refresh = () => ScrollTrigger.refresh();
    const t1 = setTimeout(refresh, 400);
    document.fonts?.ready?.then(refresh).catch(() => {});
    window.addEventListener('load', refresh);
    return () => {
      clearTimeout(t1);
      window.removeEventListener('load', refresh);
      if (raf) gsap.ticker.remove(raf);
      if (lenis) lenis.destroy();
      if (window.lenis === lenis) delete window.lenis;
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, [routeKey]);
}

/** Pause smooth scrolling while something modal is open. */
export function lockScroll(on) {
  if (!window.lenis) return;
  if (on) window.lenis.stop(); else window.lenis.start();
}

/** gsap.context bound to a ref: every tween and trigger made inside is reverted on unmount. */
export function useGsapContext(ref, setup, deps = []) {
  useEffect(() => {
    if (!ref.current) return undefined;
    const ctx = gsap.context(() => setup(ref.current), ref.current);
    return () => ctx.revert();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}
