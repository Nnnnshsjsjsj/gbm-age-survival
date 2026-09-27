// R3F wrapper around the procedural brain (see brainScene.js / anatomy.js), plus HTML label chips.
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { createBrain } from './brainScene.js';
import { ANCHORS } from './anatomy.js';

export { ANCHORS };

/** The brain group. `still` freezes shader time (reduced motion). The ref exposes the brainScene API. */
export const Brain = forwardRef(function Brain({ mobile = false, theme = 'dark', still = false, children }, ref) {
  const gl = useThree((s) => s.gl);
  const dpr = useThree((s) => s.viewport.dpr);
  const brain = useMemo(() => createBrain({ mobile, theme, pixelRatio: gl.getPixelRatio() }), [mobile]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => brain.dispose(), [brain]);
  useEffect(() => { brain.setTheme(theme); }, [brain, theme]);
  useEffect(() => { brain.cellsMaterial.uniforms.uPR.value = dpr; }, [brain, dpr]);
  useImperativeHandle(ref, () => brain, [brain]);
  useEffect(() => { if (still) brain.setTime(1.2); }, [brain, still]);
  const drawn = useRef(false);
  useFrame((state) => {
    if (!still) brain.setTime(state.clock.elapsedTime);
    if (!drawn.current) {
      drawn.current = true;
      // lets tests (and anyone curious) know the model is on screen; also reports its size
      requestAnimationFrame(() => { document.documentElement.dataset.brain = 'ready'; document.documentElement.dataset.brainTris = String(brain.triangles); });
    }
  });
  useEffect(() => () => { delete document.documentElement.dataset.brain; }, []);
  return <primitive object={brain.group}>{children}</primitive>;
});

/**
 * A glass chip with a thin leader line, anchored to a 3D point. `on` shows it; with `onClick` it is a real button
 * (keyboard reachable). `watch` lets a per-frame getter toggle it without React renders (used by the story).
 */
export function Label({ at, text, side = 'right', on = true, onClick, selected = false, watch, interactive = false }) {
  const el = useRef(null);
  useFrame(() => {
    if (!watch || !el.current) return;
    const v = !!watch();
    if (el.current.classList.contains('on') !== v) el.current.classList.toggle('on', v);
  });
  return (
    <Html position={at} zIndexRange={[30, 0]} style={{ pointerEvents: interactive ? 'auto' : 'none' }}>
      <div ref={el} className={`blabel ${side}${on && !watch ? ' on' : ''}${selected ? ' sel' : ''}`} aria-hidden={interactive ? undefined : 'true'}>
        <i className="bl-dot" /><i className="bl-line" />
        {interactive
          ? <button type="button" className="bl-chip" onClick={onClick} aria-pressed={selected} tabIndex={on ? 0 : -1}>{text}</button>
          : <span className="bl-chip">{text}</span>}
      </div>
    </Html>
  );
}
