import { useId } from 'react';
import { fmt } from '../lib/format.js';

/**
 * items: array of
 *  { type: 'header', label }
 *  { type: 'row', label, sub, hr, lo, hi, color, highlight }
 *  { type: 'pooled', label, sub, hr, lo, hi }
 *  { type: 'pred', label, lo, hi }
 */
export default function ForestPlot({ items, title }) {
  const id = useId();
  const nums = items.filter((r) => r.lo != null && r.hi != null);
  let xmin = Math.min(...nums.map((r) => r.lo)), xmax = Math.max(...nums.map((r) => r.hi));
  if (!Number.isFinite(xmin) || !Number.isFinite(xmax)) { xmin = 0.99; xmax = 1.05; }
  const pad = Math.max(0.004, (xmax - xmin) * 0.08);
  xmin = Math.min(xmin - pad, 0.995); xmax = xmax + pad;
  const raw = (xmax - xmin) / 6;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const stepSize = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((s) => s >= raw) || mag * 10;
  const ticks = [];
  for (let v = Math.ceil(xmin / stepSize) * stepSize; v <= xmax + 1e-9; v += stepSize) ticks.push(Number(v.toFixed(4)));

  const W = 860, rowH = 26, left = 330, right = 175, top = 22;
  const H = top + items.length * rowH + 34;
  const x = (v) => left + (Math.min(Math.max(v, xmin), xmax) - xmin) / (xmax - xmin) * (W - left - right);
  const pooled = items.find((r) => r.type === 'pooled');
  const dec = stepSize < 0.01 ? 3 : 2;

  return (
    <div className="tw">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={`${id}-t`} style={{ width: '100%', minWidth: 720, height: 'auto', display: 'block' }}>
        <title id={`${id}-t`}>{title}</title>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={x(v)} x2={x(v)} y1={top - 8} y2={H - 26} stroke="var(--line)" />
            <text className="mono" x={x(v)} y={H - 10} textAnchor="middle" fontSize="11" fill="var(--muted)">{v.toFixed(dec)}</text>
          </g>
        ))}
        {xmin <= 1 && xmax >= 1 && <line x1={x(1)} x2={x(1)} y1={top - 8} y2={H - 26} stroke="var(--ref)" strokeDasharray="4 3" />}
        {pooled && <line x1={x(pooled.hr)} x2={x(pooled.hr)} y1={top - 8} y2={H - 26} stroke="var(--text)" strokeDasharray="2 3" opacity=".6" />}
        {items.map((r, i) => {
          const yy = top + i * rowH + rowH / 2;
          if (r.type === 'header') return <text key={i} x={6} y={yy + 4} fontSize="11.5" fontWeight="600" fill="var(--muted)">{r.label}</text>;
          if (r.type === 'pred') return (
            <g key={i}>
              <text x={left - 10} y={yy + 4} textAnchor="end" fontSize="12" fill="var(--muted)">{r.label}</text>
              <line x1={x(r.lo)} x2={x(r.hi)} y1={yy} y2={yy} stroke="var(--text)" strokeWidth="5" opacity=".3" />
              <text className="mono" x={W - right + 10} y={yy + 4} fontSize="11.5" fill="var(--muted)">{fmt(r.lo)}–{fmt(r.hi)}</text>
            </g>
          );
          if (r.type === 'pooled') return (
            <g key={i}>
              <text x={left - 10} y={yy + 4} textAnchor="end" fontSize="12.5" fontWeight="600" fill="var(--text)">{r.label} {r.sub && <tspan fill="var(--muted)" fontSize="10.5" fontWeight="400">{r.sub}</tspan>}</text>
              <polygon points={`${x(r.lo)},${yy} ${x(r.hr)},${yy - 7} ${x(r.hi)},${yy} ${x(r.hr)},${yy + 7}`} fill="var(--text)" />
              <text className="mono" x={W - right + 10} y={yy + 4} fontSize="11.5" fontWeight="600" fill="var(--text)">{fmt(r.hr)} ({fmt(r.lo)}–{fmt(r.hi)})</text>
            </g>
          );
          const col = r.color || 'var(--accent)';
          return (
            <g key={i}>
              {r.highlight && <rect x={2} y={yy - rowH / 2 + 1} width={W - 4} height={rowH - 2} fill="var(--accent-soft)" rx="4" />}
              <text x={left - 10} y={yy + 4} textAnchor="end" fontSize="12" fontWeight={r.highlight ? 600 : 400} fill="var(--text)">
                {r.label} {r.sub && <tspan fill="var(--muted)" fontSize="10.5" fontWeight="400">{r.sub}</tspan>}
              </text>
              <line x1={x(r.lo)} x2={x(r.hi)} y1={yy} y2={yy} stroke={col} strokeWidth={r.highlight ? 2.4 : 1.8} />
              <rect x={x(r.hr) - (r.highlight ? 5 : 4)} y={yy - (r.highlight ? 5 : 4)} width={r.highlight ? 10 : 8} height={r.highlight ? 10 : 8} fill={col} />
              <text className="mono" x={W - right + 10} y={yy + 4} fontSize="11.5" fill="var(--text)">{fmt(r.hr)} ({fmt(r.lo)}–{fmt(r.hi)})</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
