// Loads the 3D code lazily (own chunk) and falls back to the SVG illustration when WebGL is missing or fails.
import { Component, lazy, Suspense } from 'react';
import { hasWebGL } from '../three/webgl.js';
import BrainFallback from './BrainFallback.jsx';

export const StoryCanvas = lazy(() => import('../three/StoryCanvas.jsx'));
export const LabCanvas = lazy(() => import('../three/LabCanvas.jsx'));
export const Constellation = lazy(() => import('../three/hub/Constellation.jsx'));
export const CellStates = lazy(() => import('../three/hub/CellStates.jsx'));
export const MriScene = lazy(() => import('../three/hub/MriScene.jsx'));
export const Globe = lazy(() => import('../three/hub/Globe.jsx'));

/** Catches a failed GL context or chunk load and shows the fallback instead. */
export class GLBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err) { if (typeof console !== 'undefined') console.warn('[cohortex] 3D view unavailable:', err?.message || err); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

/** Wraps a lazy canvas: fallback when there is no WebGL, when it fails, and (optionally) while loading. */
export function BrainStage({ children, fallback, loading = null }) {
  if (!hasWebGL()) return fallback;
  return (
    <GLBoundary fallback={fallback}>
      <Suspense fallback={loading}>{children}</Suspense>
    </GLBoundary>
  );
}

export { BrainFallback };
