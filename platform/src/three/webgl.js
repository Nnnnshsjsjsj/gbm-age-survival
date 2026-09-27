// Tiny checks that stay in the main chunk (the 3D code itself is lazy-loaded).
let cached = null;
/** True when a WebGL context can be created. `?nogl` in the URL forces the SVG fallback (for testing). */
export function hasWebGL() {
  if (cached != null) return cached;
  try {
    if (/[?&]nogl\b/.test(window.location.search + window.location.hash)) return (cached = false);
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    cached = !!gl;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch { cached = false; }
  return cached;
}
