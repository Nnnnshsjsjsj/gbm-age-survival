// Static illustration used when WebGL is unavailable: a lateral view of the brain with the tumour layers.
export default function BrainFallback({ title, className = '' }) {
  return (
    <svg className={`brain-fallback ${className}`} viewBox="0 0 640 480" role="img" aria-label={title} data-testid="brain-fallback">
      <title>{title}</title>
      <defs>
        <linearGradient id="bf-rim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5EF2B8" /><stop offset="1" stopColor="#4CC9F0" /></linearGradient>
        <radialGradient id="bf-fill" cx="0.45" cy="0.4" r="0.7"><stop offset="0" stopColor="#15302b" /><stop offset="1" stopColor="#070c0c" /></radialGradient>
        <radialGradient id="bf-oed" cx="0.5" cy="0.5" r="0.5"><stop offset="0.55" stopColor="#4CC9F0" stopOpacity="0" /><stop offset="1" stopColor="#4CC9F0" stopOpacity=".45" /></radialGradient>
      </defs>
      {/* cerebellum and brainstem */}
      <path d="M392 330c36-8 92-4 118 16 20 16 12 48-18 60-40 16-96 12-126-8-18-12-12-58 26-68z" fill="url(#bf-fill)" stroke="url(#bf-rim)" strokeOpacity=".7" strokeWidth="1.5" />
      {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M${378 + i * 4} ${346 + i * 10}c40-6 90-2 122 ${12 - i}`} fill="none" stroke="#4CC9F0" strokeOpacity=".3" strokeWidth="1" />)}
      <path d="M318 330c-6 40-2 84 10 118h36c-4-36 4-72 18-104z" fill="url(#bf-fill)" stroke="url(#bf-rim)" strokeOpacity=".6" strokeWidth="1.5" />
      {/* cerebrum */}
      <path d="M92 250c-18-78 26-160 116-190 84-28 190-22 272 20 70 36 104 108 88 170-10 40-40 72-86 84-44 12-96 6-132-6-26 20-70 28-106 20-40-8-60-30-72-50-40-6-72-20-80-48z"
        fill="url(#bf-fill)" stroke="url(#bf-rim)" strokeWidth="2" />
      {/* Sylvian fissure and central sulcus */}
      <path d="M150 292c40-20 104-30 170-38 40-4 70-16 92-42" fill="none" stroke="#5EF2B8" strokeOpacity=".55" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M318 68c-10 40-4 74-22 110-10 20-6 44-18 70" fill="none" stroke="#5EF2B8" strokeOpacity=".5" strokeWidth="2" strokeLinecap="round" />
      {/* gyri */}
      <g fill="none" stroke="#5EF2B8" strokeOpacity=".22" strokeWidth="1.4" strokeLinecap="round">
        <path d="M120 200c30-20 40 10 70-6s34-30 64-18" /><path d="M110 160c26-30 60-8 84-30s50-24 80-12" />
        <path d="M150 110c30-10 50 10 80-4" /><path d="M360 90c30 6 40 30 70 30s40 20 60 40" /><path d="M350 140c24 10 40 40 70 40s44 30 60 50" />
        <path d="M340 200c20 10 30 30 60 30s40 20 60 30" /><path d="M200 330c30 6 60-6 90 2s50 4 70-6" /><path d="M170 300c40-6 80-2 120-10" />
        <path d="M240 180c10-30 30-40 40-70" /><path d="M200 240c20-20 20-40 50-60" />
      </g>
      {/* tumour: oedema, enhancing rim, necrotic core */}
      <circle cx="196" cy="262" r="48" fill="url(#bf-oed)" stroke="#4CC9F0" strokeOpacity=".55" strokeDasharray="3 4" />
      <path d="M196 234c18 0 30 12 30 28s-12 30-30 30-32-12-30-30 12-28 30-28z" fill="#3a1511" stroke="#FF8A5B" strokeWidth="7" />
      <path d="M196 248c8 0 14 6 14 14s-6 14-14 14-14-6-14-14 6-14 14-14z" fill="#140606" />
      <g fill="#FF8A5B" opacity=".7">
        {[[250, 230], [262, 250], [240, 300], [150, 222], [140, 290], [230, 212], [272, 276], [168, 318], [120, 250]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2" />)}
      </g>
    </svg>
  );
}
