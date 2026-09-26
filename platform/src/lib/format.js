export const fmtP = (p) => (p == null || Number.isNaN(p) ? '—' : p < 0.001 ? '< 0.001' : p.toFixed(3));
export const fmt = (x, d = 3) => (x == null || Number.isNaN(x) ? '—' : Number(x).toFixed(d));
export const fmt1 = (x) => fmt(x, 1);
export const pct = (x) => (x == null || Number.isNaN(x) ? '—' : `${Math.round(x * 100)} %`);
export const hrText = (m, i = 0) => `${fmt(m.hr[i])} (${fmt(m.lo[i])}–${fmt(m.hi[i])})`;
export const round = (x, d = 4) => (x == null || Number.isNaN(x) ? null : Number(Number(x).toFixed(d)));
export const pText = (p) => (p == null || Number.isNaN(p) ? 'p —' : p < 0.001 ? 'p < 0.001' : `p = ${p.toFixed(3)}`);
