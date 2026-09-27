import { useId } from 'react';
import { useT } from '../context/AppContext.jsx';
import { useSize } from '../hooks/useSize.js';

export const GROUP_COLORS = ['var(--g1)', 'var(--g2)', 'var(--g3)', 'var(--g4)'];

/** Placeholder with the chart's exact footprint, so nothing moves when the data arrives. */
export function ChartSkeleton() {
  return <div className="chartbox"><span className="skel skel-block" style={{ position: 'absolute', inset: 0 }} /></div>;
}

/**
 * SVG step plot of one or more Kaplan–Meier curves, drawn at the container's pixel size so text stays readable.
 * series: [{ label, km, color, dashed? }] where km has t, s, lo, hi.
 */
export default function KMChart({ series, title, showCI = true, tmax: tmaxProp, legend = true, draw = false }) {
  const t = useT();
  const id = useId();
  const cid = `km${id.replace(/[^a-zA-Z0-9]/g, '')}`;
  const [ref, size] = useSize();
  const W = Math.max(280, size.width || 760);
  const H = Math.max(220, size.height || 400);
  const narrow = W < 520;
  const m = { l: narrow ? 44 : 56, r: 12, t: 12, b: narrow ? 40 : 46 };
  const tmax = tmaxProp || Math.max(1, ...series.map((s) => s.km.t[s.km.t.length - 1] || 0));
  const x = (v) => m.l + (v / tmax) * (W - m.l - m.r);
  const y = (v) => m.t + (1 - v) * (H - m.t - m.b);
  const step = (ts, ss) => ts.map((tt, i) => (i ? ` H${x(tt).toFixed(1)} V${y(ss[i]).toFixed(1)}` : `M${x(tt).toFixed(1)} ${y(ss[i]).toFixed(1)}`)).join('') + ` H${x(tmax).toFixed(1)}`;
  const band = (ts, lo, hi) => {
    let d = `M${x(ts[0]).toFixed(1)} ${y(hi[0]).toFixed(1)}`;
    ts.forEach((tt, i) => { d += ` H${x(tt).toFixed(1)} V${y(hi[i]).toFixed(1)}`; });
    d += ` H${x(tmax).toFixed(1)}`;
    for (let i = ts.length - 1; i >= 0; i--) d += ` V${y(lo[i]).toFixed(1)} H${x(ts[i]).toFixed(1)}`;
    return d + ' Z';
  };
  const target = narrow ? 5 : 9;
  const tickStep = [3, 6, 12, 24, 36, 48, 60].find((s) => tmax / s <= target) || 60;
  const ticks = [];
  for (let mo = 0; mo <= tmax + 1e-9; mo += tickStep) ticks.push(mo);
  const fs = narrow ? 11 : 12;

  return (
    <div>
      <div className="chartbox" ref={ref}>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={`${id}-title`} preserveAspectRatio="none">
          <title id={`${id}-title`}>{title}</title>
          <defs><clipPath id={`${cid}-clip`}><rect x={m.l} y={m.t - 4} width={W - m.l - m.r + 2} height={H - m.t - m.b + 8} /></clipPath></defs>
          {[0, 0.25, 0.5, 0.75, 1].map((p) => (
            <g key={p}>
              <line x1={m.l} x2={W - m.r} y1={y(p)} y2={y(p)} stroke={p === 0 ? 'var(--line-strong)' : 'var(--line)'} strokeDasharray={p === 0 ? undefined : '2 4'} />
              <text className="mono" x={m.l - 10} y={y(p) + 4} textAnchor="end" fontSize={fs} fill="var(--dim)">{Math.round(p * 100)}%</text>
            </g>
          ))}
          {ticks.map((mo) => (
            <text key={mo} className="mono" x={x(mo)} y={y(0) + 20} textAnchor="middle" fontSize={fs} fill="var(--dim)">{mo}</text>
          ))}
          <text x={(m.l + W - m.r) / 2} y={H - 6} textAnchor="middle" fontSize={fs} fill="var(--muted)">{t('x_months')}</text>
          {!narrow && <text transform={`translate(14 ${(m.t + H - m.b) / 2}) rotate(-90)`} textAnchor="middle" fontSize={fs} fill="var(--muted)">{t('y_share')}</text>}
          <g clipPath={`url(#${cid}-clip)`}>
          {showCI && series.map((s, i) => s.km.lo && (
            <path key={`b${i}`} className={draw ? 'km-band' : undefined} style={draw ? { '--i': i } : undefined} d={band(s.km.t, s.km.lo.map((v) => (Number.isFinite(v) ? v : 0)), s.km.hi.map((v) => (Number.isFinite(v) ? v : 1)))} fill={s.color} opacity=".14" />
          ))}
          {series.map((s, i) => (
            <path key={`l${i}`} d={step(s.km.t, s.km.s)} fill="none" stroke={s.color} strokeWidth={s.dashed ? 1.75 : 2.25} strokeDasharray={s.dashed ? '5 5' : undefined} strokeLinejoin="round" vectorEffect={draw ? undefined : 'non-scaling-stroke'}
              pathLength={draw && !s.dashed ? 1 : undefined} className={s.dashed ? undefined : `glowline${draw ? ' km-draw' : ''}`} style={{ color: s.color, '--i': i }} />
          ))}
          </g>
        </svg>
      </div>
      {legend && (
        <div className="legend">
          {series.map((s, i) => (
            <span key={i}><i style={{ background: s.color }} aria-hidden="true" />{s.label}</span>
          ))}
        </div>
      )}
    </div>
  );
}
