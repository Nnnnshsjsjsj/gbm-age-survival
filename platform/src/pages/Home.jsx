import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { useCommunity } from '../context/CommunityContext.jsx';
import { SectionHead } from '../components/ui.jsx';
import { IconArrowRight, IconUpload, IconChart, IconLayers, IconCheck } from '../components/Icons.jsx';

/** The logo idea drawn big: a Kaplan–Meier step curve that falls, then settles into a flat tail. Draws once. */
function HeroCurve({ label }) {
  // step points (x, y) in a 480×400 box
  const pts = [[28, 44], [58, 44], [58, 70], [84, 70], [84, 104], [104, 104], [104, 138], [128, 138], [128, 166], [150, 166], [150, 196], [178, 196],
    [178, 222], [204, 222], [204, 246], [236, 246], [236, 264], [272, 264], [272, 280], [320, 280], [320, 290], [452, 290]];
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
  const hi = pts.map(([x, y]) => [x, Math.max(30, y - 26 + x * 0.02)]);
  const lo = pts.map(([x, y]) => [x, Math.min(352, y + 22 + x * 0.05)]);
  const band = `${hi.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ')} ${[...lo].reverse().map(([x, y]) => `L${x} ${y}`).join(' ')} Z`;
  return (
    <svg className="hero-art" viewBox="0 0 480 400" aria-hidden="true" focusable="false">
      {[80, 150, 220, 290, 360].map((y) => <line key={y} x1="28" x2="452" y1={y} y2={y} stroke="var(--line)" strokeDasharray="2 6" />)}
      <line x1="28" x2="452" y1="360" y2="360" stroke="var(--line-strong)" />
      <g className="fade-late"><path d={band} fill="var(--accent)" fillOpacity=".08" /></g>
      <path d={d} fill="none" stroke="var(--accent)" strokeOpacity=".15" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" className="draw" style={{ '--len': 1100 }} />
      <path d={d} fill="none" stroke="var(--accent)" strokeOpacity=".55" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="draw" style={{ '--len': 1100 }} />
      {[[196, 222], [262, 264], [300, 280], [372, 290], [414, 290]].map(([x, y]) => <line key={x} x1={x} x2={x} y1={y - 8} y2={y + 8} stroke="var(--accent)" strokeOpacity=".45" strokeWidth="2" className="fade-late" />)}
      <g className="fade-late">
        <rect x="336" y="306" width="116" height="30" rx="15" fill="var(--card)" stroke="var(--line)" />
        <circle cx="354" cy="321" r="4" fill="var(--accent)" />
        <text x="366" y="325.5" fontSize="12.5" fontWeight="600" fill="var(--muted)">{label}</text>
      </g>
    </svg>
  );
}

export default function Home() {
  const { t } = useApp();
  const { stats } = useCommunity();
  const researchers = stats && Number(stats.researchers) > 0 ? Number(stats.researchers) : 0;

  return (
    <div>
      <section className="hero">
        <div className="hero-glow" aria-hidden="true" />
        <div className="shell hero-grid">
          <div>
            <span className="kicker-pill">{t('home_kicker')}</span>
            <h1 className="display mt-6">
              {t('home_h1_a')}<br />
              <span className="hl">{t('home_h1_hl')}</span>{t('home_h1_b')}
            </h1>
            <p className="lede mt-6">{t('home_lede')}</p>
            <div className="btnrow mt-8">
              <Link to="/analyse" className="btn btn-primary">{t('home_cta1')}<IconArrowRight /></Link>
              <Link to="/explore" className="btn btn-ghost">{t('home_cta2')}</Link>
            </div>
            <ul className="statchips mt-10 list-none p-0" aria-label={t('home_numbers')}>
              <li className="statchip"><b>4</b>{t('chip_refs')}</li>
              <li className="statchip"><b>{t('chip_patients_n')}</b>{t('chip_patients')}</li>
              <li className="statchip"><b>13</b>{t('chip_pool')}</li>
              <li className="statchip"><b>0</b>{t('chip_rows')}</li>
              {researchers > 0 && <li className="statchip" data-testid="chip-researchers"><span className="live" aria-hidden="true" /><b>{researchers}</b>{t('chip_researchers')}</li>}
            </ul>
          </div>
          <HeroCurve label={t('hero_tail')} />
        </div>
      </section>

      <section className="section" aria-labelledby="how-h">
        <div className="shell">
          <SectionHead kicker={t('how_kicker')} title={t('how_title')} sub={t('how_sub')} id="how-h" />
          <div className="how">
            {[['01', IconUpload, 'how1'], ['02', IconChart, 'how2'], ['03', IconLayers, 'how3']].map(([n, Icon, k]) => (
              <div key={k} className="card card-pad">
                <div className="num"><span className="ic" aria-hidden="true"><Icon /></span>{n}</div>
                <h3 className="h4">{t(`${k}_t`)}</h3>
                <p>{t(`${k}_b`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="spaces-h">
        <div className="shell">
          <SectionHead kicker={t('spaces_kicker')} title={t('spaces_title')} sub={t('spaces_sub')} id="spaces-h" />
          <div className="spaces">
            {['research', 'family'].map((s) => (
              <div key={s} data-space={s} className="card spacecard">
                <span className="kicker-pill self-start">{t(s === 'research' ? 'space_research' : 'space_family')}</span>
                <h3 className="h3">{t(`spaces_${s}_t`)}</h3>
                <ul>
                  {[1, 2, 3].map((i) => <li key={i}><IconCheck />{t(`spaces_${s}_${i}`)}</li>)}
                </ul>
                <div>
                  <Link to={s === 'research' ? '/research' : '/families'} className="btn btn-primary">{t(s === 'research' ? 'spaces_research_btn' : 'spaces_family_btn')}<IconArrowRight /></Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="fine-h">
        <div className="shell duo">
          <div>
            <div className="kicker">{t('fine_kicker')}</div>
            <h2 className="h2 mt-3" id="fine-h">{t('fine_title')}</h2>
            <ul className="quietlist mt-6">
              {['data', 'prog', 'mod', 'sep'].map((k) => (
                <li key={k}><span className="tag">{t(`fine_${k}_tag`)}</span><p><b>{t(`fine_${k}_b`)}</b> {t(`fine_${k}`)}</p></li>
              ))}
            </ul>
          </div>
          <figure className="card card-lg quote m-0">
            <span className="kicker-pill">{t('quote_kicker')}</span>
            <blockquote className="q m-0">{t('quote')}</blockquote>
            <figcaption className="a">{t('quote_by')}</figcaption>
            <Link to="/rules" className="btn btn-ghost">{t('read_rules')}</Link>
          </figure>
        </div>
      </section>
    </div>
  );
}
