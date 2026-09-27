// Research hub · 3D models: cell states (entropy), MRI slice explorer, and a door to the Brain lab.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import { BrainStage, CellStates, MriScene, BrainFallback } from '../../components/BrainStage.jsx';
import { useInView, Reveal } from '../../motion/components.jsx';
import { reducedMotion } from '../../motion/core.js';
import { renderSlice } from '../../lib/mriModel.js';
import { hasWebGL } from '../../three/webgl.js';
import { STATE_COLORS } from '../../three/palette.js';
import { IconArrowRight } from '../../components/Icons.jsx';

const STATES = ['MES', 'AC', 'OPC', 'NPC'];
const PRESETS = {
  mes: [0.62, 0.2, 0.1, 0.08], bal: [0.25, 0.25, 0.25, 0.25], dev: [0.08, 0.14, 0.42, 0.36], ac: [0.12, 0.64, 0.14, 0.1],
};
/** Normalised Shannon entropy (log base 4), the heterogeneity score used in the paper. */
export function entropy(w) {
  const s = w.reduce((a, b) => a + b, 0) || 1;
  return -w.reduce((h, x) => { const p = x / s; return p > 0 ? h + p * Math.log(p) : h; }, 0) / Math.log(4);
}

function Lazy3D({ children, fallback, minH = 360 }) {
  const [ref, inView] = useInView({ threshold: 0.05, rootMargin: '200px' });
  return (
    <div ref={ref} className="model-stage" style={{ minHeight: minH }}>
      {inView ? <BrainStage fallback={fallback} loading={<div className="model-loading" />}>{children}</BrainStage> : <div className="model-loading" />}
    </div>
  );
}

function CellModel() {
  const { t, theme } = useApp();
  const [w, setW] = useState(PRESETS.mes);
  const [preset, setPreset] = useState('mes');
  const H = entropy(w);
  const sum = w.reduce((a, b) => a + b, 0) || 1;
  const setOne = (i, v) => { const n = [...w]; n[i] = Math.max(0.001, v); setW(n); setPreset(null); };
  const still = useMemo(() => reducedMotion(), []);
  return (
    <Reveal className="card card-lg model" id="model-cells">
      <div className="model-grid">
        <div className="model-copy">
          <span className="kicker kicker-dot">3D · 01</span>
          <h3 className="h3 mt-3">{t('m_cells_t')}</h3>
          <p className="small mt-2">{t('m_cells_b')}</p>
          <div className="mt-5" role="group" aria-label={t('m_cells_preset')}>
            <div className="flabel mb-2">{t('m_cells_preset')}</div>
            <div className="chips">
              {Object.keys(PRESETS).map((k) => (
                <button key={k} type="button" className="chip" aria-pressed={preset === k} onClick={() => { setW(PRESETS[k]); setPreset(k); }}>{t(`m_p_${k}`)}</button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 mt-5">
            {STATES.map((s, i) => (
              <label key={s} className="cs-slider" style={{ '--c': STATE_COLORS[i] }}>
                <span className="cs-name"><i aria-hidden="true" />{t(`st_${s}`)}</span>
                <input type="range" min="0" max="1" step="0.01" value={w[i]} onChange={(e) => setOne(i, Number(e.target.value))} aria-valuetext={`${Math.round((w[i] / sum) * 100)}%`} />
                <span className="mono cs-pct">{Math.round((w[i] / sum) * 100)}%</span>
              </label>
            ))}
          </div>
          <div className="cs-entropy mt-5" aria-live="polite">
            <div>
              <div className="flabel">{t('m_cells_entropy')}</div>
              <div className="tiny">{t('m_cells_entropy_help')}</div>
            </div>
            <div className="cs-meter"><span style={{ width: `${H * 100}%` }} /></div>
            <b className="mono cs-h">{H.toFixed(2)}</b>
          </div>
        </div>
        <Lazy3D fallback={<p className="model-nogl small">{t('m_nogl')}</p>}>
          <CellStates weights={w} still={still} light={theme === 'light'} names={STATES} />
        </Lazy3D>
      </div>
      <p className="tiny mono model-note">{t('model_note')}</p>
    </Reveal>
  );
}

const SIZE = 256;
function MriModel() {
  const { t, theme } = useApp();
  const [plane, setPlane] = useState('axial');
  const [seq, setSeq] = useState('t1c');
  const [pos, setPos] = useState(0.12);
  const [version, setVersion] = useState(0);
  const off = useMemo(() => { const c = document.createElement('canvas'); c.width = SIZE; c.height = SIZE; return c; }, []);
  const view = useRef(null);
  const raf = useRef(0);
  useEffect(() => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const ctx = off.getContext('2d');
      const img = ctx.createImageData(SIZE, SIZE);
      renderSlice(img, plane, pos, seq);
      ctx.putImageData(img, 0, 0);
      const v = view.current?.getContext('2d');
      if (v) { v.fillStyle = '#000'; v.fillRect(0, 0, SIZE, SIZE); v.drawImage(off, 0, 0); }
      setVersion((n) => n + 1);
    });
    return () => cancelAnimationFrame(raf.current);
  }, [plane, seq, pos, off]);
  const still = useMemo(() => reducedMotion(), []);
  const [top, bottom, left, right] = plane === 'sagittal' ? ['S', 'I', 'P', 'A'] : plane === 'coronal' ? ['S', 'I', 'R', 'L'] : ['A', 'P', 'R', 'L'];
  const seg = (value, set, opts, label) => (
    <div role="group" aria-label={label}>
      <div className="flabel mb-2">{label}</div>
      <div className="segs">
        {opts.map(([k, l]) => <button key={k} type="button" aria-pressed={value === k} onClick={() => set(k)}>{l}</button>)}
      </div>
    </div>
  );
  return (
    <Reveal className="card card-lg model" id="model-mri">
      <div className="model-grid mri-grid">
        <div className="model-copy">
          <span className="kicker kicker-dot">3D · 02</span>
          <h3 className="h3 mt-3">{t('m_mri_t')}</h3>
          <p className="small mt-2">{t('m_mri_b')}</p>
          <div className="grid gap-4 mt-5">
            {seg(seq, setSeq, [['t1c', t('seq_t1c')], ['flair', t('seq_flair')]], t('m_mri_seq'))}
            {seg(plane, setPlane, [['axial', t('pl_axial')], ['coronal', t('pl_coronal')], ['sagittal', t('pl_sagittal')]], t('m_mri_plane'))}
            <label className="field">
              <span className="flabel">{t('m_mri_pos')}</span>
              <input type="range" min="-1" max="1" step="0.01" value={pos} onChange={(e) => setPos(Number(e.target.value))} className="range" />
            </label>
          </div>
          <ul className="mri-legend tiny mt-5">
            <li><i style={{ background: '#fff' }} />{t('m_mri_legend_rim')}</li>
            <li><i style={{ background: '#555' }} />{t('m_mri_legend_core')}</li>
            <li><i style={{ background: seq === 'flair' ? '#e6e6e6' : '#6a6a6a' }} />{t('m_mri_legend_oedema')}</li>
          </ul>
        </div>
        <div className="mri-views">
          <figure className="mri-flat">
            <div className="mri-frame">
              <canvas ref={view} width={SIZE} height={SIZE} role="img" aria-label={`${t(`pl_${plane}`)} · ${t(`seq_${seq}`)}`} />
              <span className="ori t">{top}</span><span className="ori b">{bottom}</span><span className="ori l">{left}</span><span className="ori r">{right}</span>
              <span className="mri-tag mono">{t(`seq_${seq}`)}</span>
            </div>
            <figcaption className="tiny">{t('m_mri_conv')}</figcaption>
          </figure>
          {hasWebGL() ? (
            <Lazy3D fallback={null} minH={300}>
              <MriScene plane={plane} s={pos} source={off} version={version} still={still} light={theme === 'light'} />
            </Lazy3D>
          ) : null}
        </div>
      </div>
      <p className="tiny mono model-note">{t('model_note')}</p>
    </Reveal>
  );
}

function BrainDoor() {
  const { t } = useApp();
  return (
    <Reveal className="card card-lg spot model model-door" id="model-brain">
      <div className="door-art" aria-hidden="true"><BrainFallback title="" /></div>
      <div className="model-copy">
        <span className="kicker kicker-dot">3D · 03</span>
        <h3 className="h3 mt-3">{t('m_brain_t')}</h3>
        <p className="small mt-2">{t('m_brain_b')}</p>
        <Link to="/brain" className="btn btn-primary mt-5">{t('m_brain_cta')}<IconArrowRight /></Link>
      </div>
    </Reveal>
  );
}

export default function Models() {
  return (
    <div className="grid gap-5">
      <CellModel />
      <MriModel />
      <BrainDoor />
    </div>
  );
}
