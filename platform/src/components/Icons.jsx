import { useId } from 'react';
// Inline SVG icons, Lucide-style: 24px grid, 1.75 stroke, round caps. Always aria-hidden next to text.
const base = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: 'false' };
const mk = (paths) => function Icon(props) { return <svg {...base} {...props}>{paths}</svg>; };

export const IconSearch = mk(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>);
export const IconMoon = mk(<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />);
export const IconSun = mk(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>);
export const IconMenu = mk(<path d="M4 7h16M4 12h16M4 17h16" />);
export const IconX = mk(<path d="M6 6l12 12M18 6 6 18" />);
export const IconChevronRight = mk(<path d="m9 6 6 6-6 6" />);
export const IconChevronDown = mk(<path d="m6 9 6 6 6-6" />);
export const IconArrowRight = mk(<path d="M5 12h14M13 6l6 6-6 6" />);
export const IconArrowDown = mk(<path d="M12 5v14M6 13l6 6 6-6" />);
export const IconArrowLeft = mk(<path d="M19 12H5M11 18l-6-6 6-6" />);
export const IconUpload = mk(<><path d="M12 15V4M7 9l5-5 5 5" /><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></>);
export const IconCheck = mk(<path d="M5 12.5 10 17 19 7" />);
export const IconCheckCircle = mk(<><circle cx="12" cy="12" r="9" /><path d="m8.5 12.5 2.5 2.5 4.5-5" /></>);
export const IconAlert = mk(<><path d="M12 4 2.8 19.5h18.4Z" /><path d="M12 10v4M12 17h.01" /></>);
export const IconInfo = mk(<><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>);
export const IconMessage = mk(<path d="M20 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2Z" />);
export const IconThumb = mk(<><path d="M7 10v11" /><path d="M15 5.9 14 10h5.8a2 2 0 0 1 1.9 2.6l-2.3 7A2 2 0 0 1 17.5 21H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h2.8a2 2 0 0 0 1.8-1.1L12 2a3.1 3.1 0 0 1 3 3.9Z" /></>);
export const IconFlag = mk(<><path d="M4 22V4" /><path d="M4 4h12l-2 4 2 4H4" /></>);
export const IconTrash = mk(<><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13M9 7V4h6v3" /></>);
export const IconLock = mk(<><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>);
export const IconUsers = mk(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6" /></>);
export const IconPlus = mk(<path d="M12 5v14M5 12h14" />);
export const IconClock = mk(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>);
export const IconExternal = mk(<><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></>);
export const IconDownload = mk(<><path d="M12 4v11M7 10l5 5 5-5" /><path d="M4 18v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1" /></>);
export const IconCopy = mk(<><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" /></>);
export const IconShield = mk(<><path d="M12 3 4 6v6c0 4.5 3.4 8.2 8 9 4.6-.8 8-4.5 8-9V6Z" /><path d="m9 12 2 2 4-4" /></>);
export const IconHeart = mk(<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z" />);
export const IconBook = mk(<><path d="M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2Z" /><path d="M4 21V5M8 7h8" /></>);
export const IconDatabase = mk(<><ellipse cx="12" cy="5.5" rx="8" ry="2.5" /><path d="M4 5.5v13c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v-13M4 12c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5" /></>);
export const IconLayers = mk(<><path d="m12 3 9 5-9 5-9-5Z" /><path d="m3 13 9 5 9-5" /></>);
export const IconUser = mk(<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>);
export const IconLogOut = mk(<><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 17l-5-5 5-5M5 12h11" /></>);
export const IconChart = mk(<><path d="M4 4v16h16" /><path d="M7 7h3v4h3v3h3v2h3" /></>);
export const IconCompass = mk(<><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5Z" /></>);
export const IconHome = mk(<><path d="M4 11 12 4l8 7" /><path d="M6 10v10h12V10" /></>);
export const IconFile = mk(<><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8Z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>);
export const IconGlobe = mk(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>);
export const IconPhone = mk(<path d="M21 16.5v3a1.5 1.5 0 0 1-1.6 1.5A17 17 0 0 1 3 4.6 1.5 1.5 0 0 1 4.5 3h3a1.5 1.5 0 0 1 1.5 1.3c.1 1 .4 2 .8 2.9a1.5 1.5 0 0 1-.4 1.6L8.1 10a13 13 0 0 0 5.9 5.9l1.2-1.3a1.5 1.5 0 0 1 1.6-.3c.9.4 1.9.7 2.9.8a1.5 1.5 0 0 1 1.3 1.4Z" />);
export const IconGithub = mk(<path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" />);
export const IconSettings = mk(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></>);
export const IconInbox = mk(<><path d="M3 13h5l1.5 3h5L16 13h5" /><path d="M5.5 5h13L21 13v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6Z" /></>);
export const IconSparkle = mk(<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />);

export const IconBrain = mk(<><path d="M9 4.5a3 3 0 0 0-3 3 3 3 0 0 0-2 5.2A3 3 0 0 0 7 18a2.5 2.5 0 0 0 5 .5V5.5A2.5 2.5 0 0 0 9 4.5Z" /><path d="M15 4.5a3 3 0 0 1 3 3 3 3 0 0 1 2 5.2A3 3 0 0 1 17 18a2.5 2.5 0 0 1-5 .5" /><path d="M9 9.5h1M14 9.5h1M8.5 14H10M14 14h1.5" /></>);
export const IconArrowUpRight = mk(<path d="M7 17 17 7M8 7h9v9" />);
export const IconCpu = mk(<><rect x="6" y="6" width="12" height="12" rx="2" /><path d="M10 10h4v4h-4zM9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" /></>);

/**
 * The cohortex mark, drawn inline so it follows the theme: a 5×5 dot matrix whose lit dots trace a
 * Kaplan–Meier step curve. Colours come from --logo-* and --brand-* tokens.
 */
const LIT = [[12, 12], [22, 12], [22, 22], [32, 22], [32, 32], [42, 32], [42, 42], [52, 42]];
const STEP = 'M12 12 L22 12 L22 22 L32 22 L32 32 L42 32 L42 42 L52 42';
export function Logo({ size = 26, className = '', glow = true }) {
  const raw = useId();
  const id = `lg${raw.replace(/[^a-zA-Z0-9]/g, '')}`;
  const lit = new Set(LIT.map(([x, y]) => `${x},${y}`));
  const dots = [];
  for (const x of [12, 22, 32, 42, 52]) for (const y of [12, 22, 32, 42, 52]) if (!lit.has(`${x},${y}`)) dots.push([x, y]);
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false" className={`logo-mark ${className}`}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--brand-1)' }} />
          <stop offset="1" style={{ stopColor: 'var(--brand-2)' }} />
        </linearGradient>
        <filter id={`${id}-f`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" /></filter>
      </defs>
      <rect width="64" height="64" rx="16" style={{ fill: 'var(--logo-bg)' }} />
      <rect x="0.5" y="0.5" width="63" height="63" rx="15.5" fill="none" style={{ stroke: 'var(--logo-stroke)' }} />
      {dots.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2" style={{ fill: 'var(--logo-dot)' }} />)}
      {glow && <path d={STEP} fill="none" stroke={`url(#${id}-g)`} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" opacity=".55" filter={`url(#${id}-f)`} />}
      <path d={STEP} fill="none" stroke={`url(#${id}-g)`} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity=".9" />
      {LIT.map(([x, y]) => <circle key={`l${x}-${y}`} cx={x} cy={y} r="3.3" fill={`url(#${id}-g)`} />)}
    </svg>
  );
}
/** Kept for older imports. */
export const Mark = Logo;
