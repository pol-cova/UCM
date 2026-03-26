import { PRESETS } from '../physics.js'

const SPEED_OPTIONS = [
  { label: '¼×', value: 0.25 },
  { label: '½×', value: 0.5 },
  { label: '1×', value: 1 },
  { label: '2×', value: 2 },
  { label: '4×', value: 4 },
]

export default function Controls({
  params,
  running,
  speedMult,
  released,
  displayOpts,
  preset,
  onParamChange,
  onReset,
  onTogglePlay,
  onSpeedMult,
  onRelease,
  onPreset,
  onDisplayOpt,
}) {
  return (
    <>
      {/* ── Reproducción ─────────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-title">Reproducción</div>

        <div className="btn-row">
          <button className={`btn ${running ? 'active' : ''}`} onClick={onTogglePlay}>
            {running ? '⏸ Pausar' : '▶ Reproducir'}
          </button>
          <button className="btn" onClick={onReset}>
            ↺ Reiniciar
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="slider-label">Velocidad de simulación</span>
          <div className="seg-control">
            {SPEED_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`seg-btn ${speedMult === opt.value ? 'active' : ''}`}
                onClick={() => onSpeedMult(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button
          className={`btn danger ${released ? 'active' : ''}`}
          onClick={onRelease}
          disabled={released}
          style={{ opacity: released ? 0.6 : 1 }}
        >
          {released ? '🔓 Restricción liberada' : '🔗 Liberar restricción'}
        </button>
      </div>

      {/* ── Parámetros ───────────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-title">Parámetros</div>

        <div className="slider-row">
          <div className="slider-header">
            <span className="slider-label">Radio <em>r</em></span>
            <span className="slider-val">{params.r.toFixed(1)} m</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={50}
            step={0.5}
            value={params.r}
            onChange={(e) => onParamChange('r', parseFloat(e.target.value))}
          />
        </div>

        <div className="slider-row">
          <div className="slider-header">
            <span className="slider-label">Velocidad <em>v</em></span>
            <span className="slider-val">{params.v.toFixed(1)} m/s</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={10}
            step={0.1}
            value={params.v}
            onChange={(e) => onParamChange('v', parseFloat(e.target.value))}
          />
        </div>

        <div className="slider-row">
          <div className="slider-header">
            <span className="slider-label">Masa <em>m</em></span>
            <span className="slider-val">{params.m.toFixed(1)} kg</span>
          </div>
          <input
            type="range"
            min={0.1}
            max={1200}
            step={0.5}
            value={params.m}
            onChange={(e) => onParamChange('m', parseFloat(e.target.value))}
          />
        </div>
      </div>

      {/* ── Visualización ────────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-title">Visualización</div>

        <label className="check-row">
          <input
            type="checkbox"
            checked={displayOpts.radius}
            onChange={(e) => onDisplayOpt('radius', e.target.checked)}
          />
          <span className="check-dot" style={{ background: '#059669' }} />
          <span style={{ fontSize: 13, color: 'var(--text)' }}>Vector radio <em>r</em></span>
        </label>

        <label className="check-row">
          <input
            type="checkbox"
            checked={displayOpts.vel}
            onChange={(e) => onDisplayOpt('vel', e.target.checked)}
          />
          <span className="check-dot" style={{ background: '#2563eb' }} />
          <span style={{ fontSize: 13, color: 'var(--text)' }}>Vector velocidad <em>v</em></span>
        </label>

        <label className="check-row">
          <input
            type="checkbox"
            checked={displayOpts.acc}
            onChange={(e) => onDisplayOpt('acc', e.target.checked)}
          />
          <span className="check-dot" style={{ background: '#dc2626' }} />
          <span style={{ fontSize: 13, color: 'var(--text)' }}>Aceleración centrípeta <em>aᶜ</em></span>
        </label>

        <label className="check-row">
          <input
            type="checkbox"
            checked={displayOpts.trail}
            onChange={(e) => onDisplayOpt('trail', e.target.checked)}
          />
          <span className="check-dot" style={{ background: '#5557e8' }} />
          <span style={{ fontSize: 13, color: 'var(--text)' }}>Rastro de posición</span>
        </label>
      </div>

      {/* ── Escenario ────────────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-title">Escenario</div>
        <select
          value={preset}
          onChange={(e) => onPreset(e.target.value)}
        >
          <option value="custom">Personalizado</option>
          {Object.entries(PRESETS).map(([key, val]) => (
            <option key={key} value={key}>
              {val.label}
            </option>
          ))}
        </select>
      </div>
    </>
  )
}
