// Shared, mutable state between the scroll story (DOM) and the 3D canvas. Written by ScrollTriggers, read every
// frame by the canvas — no React re-renders on scroll.
export const POSES = {
  // x, y: offset of the brain from the viewport centre as a fraction of viewport width / height
  // s: scale, yaw / pitch: radians, focus: 0 = brain centred, 1 = tumour centred, op: cortex opacity,
  // cells: 0 single colour → 1 by state, alpha: canvas opacity, xray: tumour glow through the cortex
  hero:    { x: 0.0,   y: 0.07,  s: 1.02, yaw: -0.55, pitch: 0.14, focus: 0,   op: 0.96, cells: 0, alpha: 1,    xray: 0.14 },
  tumour:  { x: 0.24,  y: -0.02, s: 2.3,  yaw: -1.2,  pitch: 0.1,  focus: 1,   op: 0.34, cells: 0, alpha: 1,    xray: 0.5 },
  states:  { x: 0.22,  y: 0.0,   s: 1.9,  yaw: -0.95, pitch: 0.18, focus: 0.8, op: 0.4,  cells: 1, alpha: 1,    xray: 0.25 },
  words:   { x: 0.3,   y: 0.0,   s: 1.1,  yaw: -0.7,  pitch: 0.12, focus: 0.3, op: 0.8,  cells: 1, alpha: 0.35, xray: 0.2 },
  age:     { x: -0.3,  y: -0.02, s: 0.8,  yaw: 1.2,   pitch: 0.12, focus: 0,   op: 0.94, cells: 0, alpha: 0.85, xray: 0.14 },
  cohorts: { x: -0.44, y: 0.24,  s: 0.5,  yaw: 1.0,   pitch: 0.1,  focus: 0,   op: 0.94, cells: 0, alpha: 0.08, xray: 0.1 },
  you:     { x: -0.28, y: 0.0,   s: 0.86, yaw: 0.9,   pitch: 0.16, focus: 0,   op: 0.94, cells: 0, alpha: 0.9,  xray: 0.14 },
  people:  { x: 0.08,  y: 0.02,  s: 1.35, yaw: -0.2,  pitch: 0.12, focus: 0,   op: 0.96, cells: 0, alpha: 0.32, xray: 0.12 },
};

export const story = {
  frames: [{ at: 0, pose: POSES.hero }], // [{ at: scrollY, pose }] sorted by `at`
  labels: {}, // key → true when the label should show
  pointer: { x: 0, y: 0 },
  travel: true, // false on mobile / reduced motion: the brain stays in the hero
  still: false, // reduced motion: no autorotation, no pulsing
};

const smooth = (t) => t * t * (3 - 2 * t);
/** Pose at a scroll position, blending smoothly between neighbouring keyframes. */
export function poseAt(y, out = {}) {
  const f = story.frames;
  if (!f.length) return Object.assign(out, POSES.hero);
  if (y <= f[0].at) return Object.assign(out, f[0].pose);
  if (y >= f[f.length - 1].at) return Object.assign(out, f[f.length - 1].pose);
  let i = 0;
  while (i < f.length - 2 && y > f[i + 1].at) i++;
  const a = f[i], b = f[i + 1];
  const t = smooth(Math.min(1, Math.max(0, (y - a.at) / Math.max(1, b.at - a.at))));
  for (const k of Object.keys(a.pose)) out[k] = a.pose[k] + (b.pose[k] - a.pose[k]) * t;
  return out;
}
