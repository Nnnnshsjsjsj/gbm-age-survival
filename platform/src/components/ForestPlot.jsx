import { useId } from 'react';
import { fmt } from '../lib/format.js';
import { useSize } from '../hooks/useSize.js';

/** Placeholder with roughly the plot's footprint. */
export function ForestSkeleton({ rows = 6 }) {
  return (
    <div className="grid gap-3" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4 items-center" style={{ height: 18 }}>
          <span className="skel skel-line" style={{ width: `${55 + ((i * 17) % 35)}%` }} />
          <span className="skel skel-line" style={{ width: `${30 + ((i * 23) % 40)}%`, marginLeft: `${10 + ((i * 13) % 30)}%` }} />
        </div>
      ))}
    </div>
  );
}

/**
 * items: array of
 *  { type: 'header', label }
 *  { type: 'row', label, sub, hr, lo, hi, color, highlight }
 *  { type: 'pooled', label, sub, hr, lo, hi }
 *  { type: 'pred', label, lo, hi }
 * Drawn at the container's pixel width (min 600, scrolls sideways below that).
 */
export default function ForestPlot({ items, title }) {
  const id = useId();
  const [ref, size] = useSize();
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

  const W = Math.max(600, Math.round(size.width || 860));
  const rowH = 30, top = 16;
  const left = Math.min(340, Math.round(W * 0.36)), right = 168;
  const H = top + items.length * rowH + 36;
  const x = (v) => left + (Math.min(Math.max(v, xmin), xmax) - xmin) / (xmax - xmin) * (W - left - right);
  const pooled = items.find((r) => r.type === 'pooled');
  const dec = stepSize < 0.01 ? 3 : 2;

  return (
    <div ref={ref} className="tw">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-labelledby={`${id}-t`} style={{ display: 'block', maxWidth: 'none' }}>
        <title id={`${id}-t`}>{title}</title>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={x(v)} x2={x(v)} y1={top - 6} y2={H - 28} stroke="var(--line)" strokeDasharray="3 5" />
            <text className="mono" x={x(v)} y={H - 10} textAnchor="middle" fontSize="11.5" fill="var(--dim)">{v.toFixed(dec)}</text>
          </g>
        ))}
        {xmin <= 1 && xmax >= 1 && <line x1={x(1)} x2={x(1)} y1={top - 6} y2={H - 28} stroke="var(--line-strong)" strokeWidth="1.5" />}
        {pooled && <line x1={x(pooled.hr)} x2={x(pooled.hr)} y1={top - 6} y2={H - 28} stroke="var(--ink)" strokeDasharray="2 4" opacity=".45" />}
        {items.map((r, i) => {
          const yy = top + i * rowH + rowH / 2;
          if (r.type === 'header') return <text key={i} x={4} y={yy + 4} fontSize="11" fontWeight="700" letterSpacing=".06em" fill="var(--dim)">{r.label.toUpperCase()}</text>;
          if (r.type === 'pred') return (
            <g key={i}>
              <text x={left - 14} y={yy + 4} textAnchor="end" fontSize="12.5" fill="var(--muted)">{r.label}</text>
              <line x1={x(r.lo)} x2={x(r.hi)} y1={yy} y2={yy} stroke="var(--ink)" strokeWidth="6" strokeLinecap="round" opacity=".18" />
              <text className="mono" x={W - right + 14} y={yy + 4} fontSize="12" fill="var(--muted)">{fmt(r.lo)}–{fmt(r.hi)}</text>
            </g>
          );
          if (r.type === 'pooled') return (
            <g key={i}>
              <line x1={4} x2={W - 4} y1={yy - rowH / 2} y2={yy - rowH / 2} stroke="var(--line)" />
              <text x={left - 14} y={yy + 4} textAnchor="end" fontSize="13" fontWeight="700" fill="var(--ink)">{r.label}{r.sub && <tspan fill="var(--dim)" fontSize="11.5" fontWeight="400">{`  ${r.sub}`}</tspan>}</text>
              <polygon points={`${x(r.lo)},${yy} ${x(r.hr)},${yy - 8} ${x(r.hi)},${yy} ${x(r.hr)},${yy + 8}`} fill="var(--ink)" />
              <text className="mono" x={W - right + 14} y={yy + 4} fontSize="12" fontWeight="600" fill="var(--ink)">{fmt(r.hr)} ({fmt(r.lo)}–{fmt(r.hi)})</text>
            </g>
          );
          const col = r.color || 'var(--accent)';
          const sq = r.highlight ? 11 : r.weight != null ? 6 + Math.sqrt(r.weight) * 10 : 8;
          return (
            <g key={i}>
              {r.highlight && <rect x={0} y={yy - rowH / 2 + 2} width={W} height={rowH - 4} fill="var(--accent-soft)" rx="8" />}
              <text x={left - 14} y={yy + 4} textAnchor="end" fontSize="13" fontWeight={r.highlight ? 700 : 500} fill="var(--ink)">
                {r.label}{r.sub && <tspan fill="var(--dim)" fontSize="11.5" fontWeight="400">{`  ${r.sub}`}</tspan>}
              </text>
              <line x1={x(r.lo)} x2={x(r.hi)} y1={yy} y2={yy} stroke={col} strokeWidth={r.highlight ? 2.5 : 2} strokeLinecap="round" />
              <rect x={x(r.hr) - sq / 2} y={yy - sq / 2} width={sq} height={sq} rx="2" fill={col} />
              <text className="mono" x={W - right + 14} y={yy + 4} fontSize="12" fill="var(--ink)">{fmt(r.hr)} ({fmt(r.lo)}–{fmt(r.hi)})</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
