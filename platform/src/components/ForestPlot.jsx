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
 * compact: denser rows and a narrower minimum (hides the numbers column when very narrow).
 * animate: whiskers draw in once, squares pop, the pooled diamond glows and settles (CSS; off under reduced motion).
 */
export default function ForestPlot({ items, title, compact = false, animate = false }) {
  const raw = useId();
  const id = `fp${raw.replace(/[^a-zA-Z0-9]/g, '')}`;
  const [ref, size] = useSize();
  const nums = items.filter((r) => r.lo != null && r.hi != null);
  let xmin = Math.min(...nums.map((r) => r.lo)), xmax = Math.max(...nums.map((r) => r.hi));
  if (!Number.isFinite(xmin) || !Number.isFinite(xmax)) { xmin = 0.99; xmax = 1.05; }
  const pad = Math.max(0.004, (xmax - xmin) * 0.08);
  xmin = Math.min(xmin - pad, 0.995); xmax = xmax + pad;
  const raw6 = (xmax - xmin) / (compact ? 5 : 6);
  const mag = 10 ** Math.floor(Math.log10(raw6));
  const stepSize = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((s) => s >= raw6) || mag * 10;
  const ticks = [];
  for (let v = Math.ceil(xmin / stepSize) * stepSize; v <= xmax + 1e-9; v += stepSize) ticks.push(Number(v.toFixed(4)));

  const minW = compact ? 320 : 600;
  const W = Math.max(minW, Math.round(size.width || 860));
  const tight = compact && W < 560;
  const rowH = compact ? 25 : 30, top = compact ? 10 : 16;
  const fs = compact ? 12 : 13, fsSub = compact ? 10.5 : 11.5, fsNum = compact ? 11.5 : 12;
  const left = tight ? Math.round(W * 0.42) : Math.min(compact ? 250 : 340, Math.round(W * (compact ? 0.3 : 0.36)));
  const right = tight ? 12 : compact ? 150 : 168;
  const H = top + items.length * rowH + 34;
  const x = (v) => left + (Math.min(Math.max(v, xmin), xmax) - xmin) / (xmax - xmin) * (W - left - right);
  const pooled = items.find((r) => r.type === 'pooled');
  const dec = stepSize < 0.01 ? 3 : 2;
  // When very narrow, keep labels inside the label column instead of letting them run off the left edge.
  const maxChars = tight ? Math.max(8, Math.floor((left - 18) / (fs * 0.56))) : Infinity;
  const fit = (label) => {
    let l = tight ? String(label).replace(/\s*\([^)]*\)$/, '') : String(label);
    if (l.length > maxChars) l = `${l.slice(0, maxChars - 1).trimEnd()}…`;
    return l;
  };
  const anim = (cls, i, extra = {}) => (animate ? { className: cls, style: { '--d': `${200 + i * 55}ms`, ...extra } } : {});

  return (
    <div ref={ref} className="tw">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-labelledby={`${id}-t`} style={{ display: 'block', maxWidth: 'none', overflow: 'visible' }}>
        <title id={`${id}-t`}>{title}</title>
        <defs>
          <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" style={{ stopColor: 'var(--accent)' }} />
            <stop offset="1" style={{ stopColor: 'var(--accent-2)' }} />
          </linearGradient>
        </defs>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={x(v)} x2={x(v)} y1={top - 6} y2={H - 26} stroke="var(--line)" strokeDasharray="2 4" />
            <text className="mono" x={x(v)} y={H - 8} textAnchor="middle" fontSize={compact ? 10.5 : 11.5} fill="var(--dim)">{v.toFixed(dec)}</text>
          </g>
        ))}
        <line x1={left} x2={W - right} y1={H - 26} y2={H - 26} stroke="var(--line-strong)" />
        {xmin <= 1 && xmax >= 1 && <line x1={x(1)} x2={x(1)} y1={top - 6} y2={H - 26} stroke="var(--line-strong)" strokeWidth="1.25" />}
        {pooled && <line x1={x(pooled.hr)} x2={x(pooled.hr)} y1={top - 6} y2={H - 26} stroke="var(--accent)" strokeDasharray="2 4" opacity=".55" {...anim('fp-fade', items.length)} />}
        {items.map((r, i) => {
          const yy = top + i * rowH + rowH / 2;
          if (r.type === 'header') return <text key={i} className="mono" x={4} y={yy + 4} fontSize={compact ? 10 : 10.5} fontWeight="500" letterSpacing=".12em" fill="var(--dim)">{r.label.toUpperCase()}</text>;
          if (r.type === 'pred') return (
            <g key={i}>
              <text x={left - 14} y={yy + 4} textAnchor="end" fontSize={fs - 0.5} fill="var(--muted)">{fit(r.label)}</text>
              <line x1={x(r.lo)} x2={x(r.hi)} y1={yy} y2={yy} stroke="var(--accent-2)" strokeWidth="5" strokeLinecap="round" opacity=".28" {...anim('fp-fade', i)} />
              {!tight && <text className="mono" x={W - right + 14} y={yy + 4} fontSize={fsNum} fill="var(--muted)">{fmt(r.lo)}–{fmt(r.hi)}</text>}
            </g>
          );
          if (r.type === 'pooled') {
            const g = anim('fp-glow', i);
            return (
              <g key={i}>
                <line x1={4} x2={W - 4} y1={yy - rowH / 2} y2={yy - rowH / 2} stroke="var(--line)" />
                <text x={left - 14} y={yy + 4} textAnchor="end" fontSize={fs} fontWeight="600" fill="var(--ink)">{fit(r.label)}{r.sub && !tight && <tspan fill="var(--dim)" fontSize={fsSub} fontWeight="400">{`  ${r.sub}`}</tspan>}</text>
                <polygon points={`${x(r.lo)},${yy} ${x(r.hr)},${yy - 8} ${x(r.hi)},${yy} ${x(r.hr)},${yy + 8}`} fill={`url(#${id}-g)`} className={g.className} style={g.style} />
                {!tight && <text className="mono" x={W - right + 14} y={yy + 4} fontSize={fsNum} fontWeight="500" fill="var(--ink)">{fmt(r.hr)} ({fmt(r.lo)}–{fmt(r.hi)})</text>}
              </g>
            );
          }
          const col = r.color || 'var(--accent)';
          const sq = r.highlight ? 11 : r.weight != null ? (compact ? 5 : 6) + Math.sqrt(r.weight) * (compact ? 9 : 10) : 8;
          const len = Math.max(1, x(r.hi) - x(r.lo));
          return (
            <g key={i}>
              {r.highlight && <rect x={0} y={yy - rowH / 2 + 2} width={W} height={rowH - 4} fill="var(--accent-soft)" rx="7" />}
              {r.highlight && <rect x={0} y={yy - rowH / 2 + 2} width={2} height={rowH - 4} fill="var(--accent)" rx="1" />}
              <text x={left - 14} y={yy + 4} textAnchor="end" fontSize={fs} fontWeight={r.highlight ? 600 : 400} fill={r.highlight ? 'var(--ink)' : 'var(--ink)'} fillOpacity={r.highlight ? 1 : 0.88}>
                {fit(r.label)}{r.sub && !tight && <tspan fill="var(--dim)" fontSize={fsSub} fontWeight="400" fillOpacity="1">{`  ${r.sub}`}</tspan>}
              </text>
              <line x1={x(r.lo)} x2={x(r.hi)} y1={yy} y2={yy} stroke={col} strokeWidth={r.highlight ? 2.25 : 1.75} strokeLinecap="round" {...anim('fp-draw', i, { '--len': len.toFixed(1) })} />
              <rect x={x(r.hr) - sq / 2} y={yy - sq / 2} width={sq} height={sq} rx="2" fill={col} {...anim('fp-pop', i)} />
              {!tight && <text className="mono" x={W - right + 14} y={yy + 4} fontSize={fsNum} fill="var(--ink)" fillOpacity=".9">{fmt(r.hr)} ({fmt(r.lo)}–{fmt(r.hi)})</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
