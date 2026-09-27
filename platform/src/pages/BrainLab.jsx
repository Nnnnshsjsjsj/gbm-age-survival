// Brain lab: the procedural brain as an interactive viewer. Controls are real buttons and inputs with labels.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { BrainStage, LabCanvas, BrainFallback } from '../components/BrainStage.jsx';
import { reducedMotion, isMobile } from '../motion/core.js';
import { STATE_COLORS } from '../three/palette.js';

const LAYERS = ['cortex', 'hind', 'oedema', 'rim', 'core', 'cells'];
const VIEWS = [['front', '1'], ['side', '2'], ['top', '3'], ['tumour', '4']];
const INFO_KEYS = new Set(['frontal', 'parietal', 'temporal', 'occipital', 'cerebellum', 'stem', 'core', 'rim', 'oedema', 'infiltration']);

export default function BrainLab() {
  const { t, theme } = useApp();
  const api = useRef(null);
  const [env] = useState(() => ({ reduce: reducedMotion(), mobile: isMobile() }));
  const [tab, setTab] = useState('layers');
  const [ready, setReady] = useState(false);
  const [s, setS] = useState({
    layers: Object.fromEntries(LAYERS.map((l) => [l, true])),
    opacity: 0.72, cellMode: 'single', cut: false, cutX: 0.43, labels: !env.mobile, selected: null, hover: null,
  });
  const set = useCallback((patch) => setS((p) => ({ ...p, ...(typeof patch === 'function' ? patch(p) : patch) })), []);
  const [view, setView] = useState('start');

  const labels = useMemo(() => ({
    core: t('lbl_core'), rim: t('lbl_rim'), oedema: t('lbl_oedema'), infiltration: t('lbl_infiltration'),
    frontal: t('lbl_frontal'), temporal: t('lbl_temporal'), cerebellum: t('lbl_cerebellum'),
  }), [t]);

  const go = useCallback((v) => { setView(v); api.current?.fly(v); }, []);
  const select = useCallback((k) => {
    const key = k === 'cells' ? 'infiltration' : k;
    set({ selected: key && INFO_KEYS.has(key) ? key : null });
    if (key && env.mobile) setTab('info');
  }, [set, env.mobile]);

  // keyboard: arrows orbit, + / − zoom, 1–4 presets (never while typing or on a slider)
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target;
      if (el instanceof Element && el.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return;
      const a = api.current; if (!a) return;
      const map = { ArrowLeft: () => a.orbit(-0.14, 0), ArrowRight: () => a.orbit(0.14, 0), ArrowUp: () => a.orbit(0, -0.1), ArrowDown: () => a.orbit(0, 0.1), '+': () => a.zoom(0.86), '=': () => a.zoom(0.86), '-': () => a.zoom(1.16), _: () => a.zoom(1.16) };
      const preset = VIEWS.find(([, k]) => k === e.key);
      if (preset) { e.preventDefault(); go(preset[0]); return; }
      if (map[e.key]) { e.preventDefault(); map[e.key](); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  const info = s.selected || (s.hover && INFO_KEYS.has(s.hover === 'cells' ? 'infiltration' : s.hover) ? s.hover : null);
  const fallback = (
    <div className="lab-fallback">
      <BrainFallback title={t('st_brain_alt')} />
      <p className="small">{t('lab_nogl')}</p>
    </div>
  );

  const tabs = [['layers', t('lab_layers')], ['view', t('lab_view')], ['info', t('lab_info')]];
  return (
    <div className="lab" data-ready={ready || undefined}>
      <div className="lab-viewer" data-cursor="drag" data-lenis-prevent role="region" aria-label={t('lab_viewer')} data-testid="lab-viewer">
        <BrainStage fallback={fallback} loading={<div className="lab-loading"><span className="skel" /></div>}>
          <LabCanvas state={s} apiRef={api} still={env.reduce} mobile={env.mobile} theme={theme} labels={labels}
            onHover={(k) => set({ hover: k })} onSelect={select} onReady={() => setReady(true)} />
        </BrainStage>
      </div>

      <div className="lab-ui">
        <header className="lab-head">
          <div className="kicker kicker-dot">{t('lab_kicker')}</div>
          <h1 className="lab-title">{t('lab_title')}</h1>
        </header>

        <div className="lab-tabs" role="tablist" aria-label={t('lab_title')}>
          {tabs.map(([k, label]) => (
            <button key={k} type="button" role="tab" id={`lab-tab-${k}`} aria-selected={tab === k} aria-controls={`lab-p-${k}`} className="tab" onClick={() => setTab(k)}>{label}</button>
          ))}
        </div>

        <section className="lab-panel glass p-layers" id="lab-p-layers" role="tabpanel" aria-labelledby="lab-tab-layers" data-on={tab === 'layers' || undefined}>
          <h2 className="lab-h">{t('lab_layers')}</h2>
          <div className="lab-toggles" role="group" aria-label={t('lab_layers')}>
            {LAYERS.map((l) => (
              <button key={l} type="button" className={`ltoggle l-${l}`} aria-pressed={s.layers[l]} data-testid={`layer-${l}`}
                onClick={() => set((p) => ({ layers: { ...p.layers, [l]: !p.layers[l] } }))}>
                <i aria-hidden="true" />{t(`layer_${l}`)}
              </button>
            ))}
          </div>

          <h2 className="lab-h">{t('lab_colour')}</h2>
          <div className="seg" role="radiogroup" aria-label={t('lab_colour')}>
            {[['single', 'colour_single'], ['state', 'colour_state']].map(([k, key]) => (
              <button key={k} type="button" role="radio" aria-checked={s.cellMode === k} className="segbtn" data-testid={`colour-${k}`} onClick={() => set({ cellMode: k })}>{t(key)}</button>
            ))}
          </div>
          {s.cellMode === 'state' && (
            <ul className="lab-legend">
              {['MES', 'AC', 'OPC', 'NPC'].map((c, i) => <li key={c}><i style={{ background: STATE_COLORS[i] }} aria-hidden="true" />{c}</li>)}
            </ul>
          )}

          <label className="lab-h" htmlFor="lab-opacity">{t('lab_opacity')} <span className="mono">{Math.round(s.opacity * 100)}%</span></label>
          <input id="lab-opacity" type="range" min="0.1" max="1" step="0.01" value={s.opacity} className="range" onChange={(e) => set({ opacity: Number(e.target.value) })} />

          <h2 className="lab-h">{t('lab_section')}</h2>
          <label className="switch"><input type="checkbox" checked={s.cut} onChange={(e) => set({ cut: e.target.checked })} data-testid="cut-toggle" /><span className="knob" aria-hidden="true" />{t('lab_section_toggle')}</label>
          <label className="sr-only" htmlFor="lab-cut">{t('lab_section_pos')}</label>
          <input id="lab-cut" type="range" min="-0.78" max="0.78" step="0.005" value={-s.cutX} disabled={!s.cut} className="range" aria-valuetext={`${Math.round(((0.78 - s.cutX) / 1.56) * 100)}%`}
            onChange={(e) => set({ cutX: -Number(e.target.value) })} />
        </section>

        <section className="lab-panel glass p-view" id="lab-p-view" role="tabpanel" aria-labelledby="lab-tab-view" data-on={tab === 'view' || undefined}>
          <h2 className="lab-h">{t('lab_view')}</h2>
          <div className="lab-views">
            {VIEWS.map(([k, key]) => (
              <button key={k} type="button" className="vbtn" aria-pressed={view === k} onClick={() => go(k)}><span className="mono kbd" aria-hidden="true">{key}</span>{t(`view_${k}`)}</button>
            ))}
            <button type="button" className="vbtn" aria-pressed={view === 'start'} onClick={() => go('start')}>{t('view_reset')}</button>
          </div>
          <label className="switch mt-3"><input type="checkbox" checked={s.labels} onChange={(e) => set({ labels: e.target.checked })} /><span className="knob" aria-hidden="true" />{t('lab_labels')}</label>
          <p className="lab-keys mono">{t('lab_keys').split(' · ').map((k) => <span key={k}>{k}</span>)}</p>
        </section>

        <section className="lab-panel glass p-info" id="lab-p-info" role="tabpanel" aria-labelledby="lab-tab-info" data-on={tab === 'info' || undefined} aria-live="polite">
          {info ? (
            <>
              <div className="kicker kicker-dot">{t('lab_info')}</div>
              <h2 className="lab-info-t">{t(`info_${info}_t`)}</h2>
              <p className="lab-info-b">{t(`info_${info}_b`)}</p>
              {s.selected && <button type="button" className="btn btn-ghost btn-sm mt-4" onClick={() => set({ selected: null })}>{t('clear')}</button>}
            </>
          ) : (
            <>
              <div className="kicker kicker-dot">{t('lab_info')}</div>
              <h2 className="lab-info-t">{t('lab_pick_t')}</h2>
              <p className="lab-info-b">{t('lab_pick_b')}</p>
            </>
          )}
        </section>
      </div>

      <p className="lab-caption mono">{t('lab_caption')}</p>
    </div>
  );
}
