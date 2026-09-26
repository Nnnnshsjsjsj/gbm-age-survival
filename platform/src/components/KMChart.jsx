import { useId } from 'react';
import { useT } from '../context/AppContext.jsx';

export const GROUP_COLORS = ['var(--g1)', 'var(--g2)', 'var(--g3)', 'var(--g4)'];

/**
 * SVG step plot of one or more Kaplan–Meier curves.
 * series: [{ label, km, color, dashed? }] where km has t, s, lo, hi.
 */
export default function KMChart({ series, title, showCI = true, tmax: tmaxProp, legend = true }) {
  const t = useT();
  const id = useId();
  const W = 760, H = 400, m = { l: 54, r: 16, t: 14, b: 46 };
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
  const tickStep = tmax > 120 ? 24 : tmax > 60 ? 12 : tmax > 24 ? 6 : 3;
  const ticks = [];
  for (let mo = 0; mo <= tmax; mo += tickStep) ticks.push(mo);

  return (
    <div>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={`${id}-title`}>
        <title id={`${id}-title`}>{title}</title>
        {[0, 0.25, 0.5, 0.75, 1].map((p) => (
          <g key={p}>
            <line x1={m.l} x2={W - m.r} y1={y(p)} y2={y(p)} stroke="var(--line)" />
            <text className="mono" x={m.l - 8} y={y(p) + 4} textAnchor="end" fontSize="11.5" fill="var(--muted)">{Math.round(p * 100)}%</text>
          </g>
        ))}
        {ticks.map((mo) => (
          <g key={mo}>
            <line x1={x(mo)} x2={x(mo)} y1={y(0)} y2={y(0) + 5} stroke="var(--line-strong)" />
            <text className="mono" x={x(mo)} y={y(0) + 18} textAnchor="middle" fontSize="11.5" fill="var(--muted)">{mo}</text>
          </g>
        ))}
        <text x={(m.l + W - m.r) / 2} y={H - 8} textAnchor="middle" fontSize="12.5" fill="var(--muted)">{t('x_months')}</text>
        <text transform={`translate(14 ${(m.t + H - m.b) / 2}) rotate(-90)`} textAnchor="middle" fontSize="12.5" fill="var(--muted)">{t('y_share')}</text>
        {showCI && series.map((s, i) => s.km.lo && (
          <path key={`b${i}`} d={band(s.km.t, s.km.lo.map((v) => (Number.isFinite(v) ? v : 0)), s.km.hi.map((v) => (Number.isFinite(v) ? v : 1)))} fill={s.color} opacity=".13" />
        ))}
        {series.map((s, i) => (
          <path key={`l${i}`} d={step(s.km.t, s.km.s)} fill="none" stroke={s.color} strokeWidth={s.dashed ? 2 : 2.4} strokeDasharray={s.dashed ? '5 4' : undefined} strokeLinejoin="round" />
        ))}
      </svg>
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
