import { useState, useEffect, useRef, useCallback } from 'react'
import {
  createInitialPhysics,
  tickPhysics,
  applyConstraint,
  derived,
  PRESETS,
} from './physics.js'

const DEFAULT_PARAMS = { r: PRESETS.bola.r, v: PRESETS.bola.v, m: PRESETS.bola.m }
import { drawScene } from './draw.js'
import Readout from './components/Readout.jsx'
import Controls from './components/Controls.jsx'
import Plots from './components/Plots.jsx'

// ── URL helpers ───────────────────────────────────────────────────────────────
function readURLParams() {
  const sp = new URLSearchParams(window.location.search)
  const r = parseFloat(sp.get('r'))
  const v = parseFloat(sp.get('v'))
  const m = parseFloat(sp.get('m'))
  const spd = parseFloat(sp.get('spd'))
  return {
    r: isFinite(r) && r > 0 ? r : 1.0,
    v: isFinite(v) && v > 0 ? v : 3.0,
    m: isFinite(m) && m > 0 ? m : 0.5,
    spd: isFinite(spd) && spd > 0 ? spd : 1,
  }
}

function serializeToURL(params, speedMult) {
  const sp = new URLSearchParams()
  sp.set('r', params.r.toFixed(2))
  sp.set('v', params.v.toFixed(2))
  sp.set('m', params.m.toFixed(2))
  sp.set('spd', speedMult)
  history.replaceState(null, '', '?' + sp.toString())
}

const MAX_PLOT_POINTS = 300

export default function App() {
  // ── Initial state from URL ────────────────────────────────────────────────
  const urlInit = readURLParams()

  const [params, setParams] = useState({ r: urlInit.r, v: urlInit.v, m: urlInit.m })
  const [running, setRunning] = useState(true)
  const [speedMult, setSpeedMult] = useState(urlInit.spd)
  const [released, setReleased] = useState(false)
  const [displayOpts, setDisplayOpts] = useState({ vel: true, acc: true, radius: true, trail: true })
  const [preset, setPreset] = useState('bola')
  const [readout, setReadout] = useState(derived({ r: urlInit.r, v: urlInit.v, m: urlInit.m }))
  const [plotsOpen, setPlotsOpen] = useState(false)

  // ── Mutable refs (avoids stale closures in RAF) ───────────────────────────
  const paramsRef = useRef({ r: urlInit.r, v: urlInit.v, m: urlInit.m })
  const runningRef = useRef(true)
  const speedMultRef = useRef(urlInit.spd)
  const releasedRef = useRef(false)
  const displayOptsRef = useRef({ vel: true, acc: true, radius: true, trail: true })
  const physicsRef = useRef(createInitialPhysics({ r: urlInit.r, v: urlInit.v, m: urlInit.m }))
  const canvasRef = useRef(null)
  const plotsRef = useRef(null)
  const plotDataRef = useRef({ times: [], xs: [], ys: [], spds: [] })
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(null)
  const rafRef = useRef(null)

  // ── Canvas resize ─────────────────────────────────────────────────────────
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
  }, [])

  useEffect(() => {
    resizeCanvas()
    const ro = new ResizeObserver(resizeCanvas)
    if (canvasRef.current) ro.observe(canvasRef.current)
    return () => ro.disconnect()
  }, [resizeCanvas])

  // ── RAF loop ──────────────────────────────────────────────────────────────
  useEffect(() => {
    function loop(now) {
      rafRef.current = requestAnimationFrame(loop)

      const canvas = canvasRef.current
      if (!canvas) return

      // Delta time
      if (lastTimeRef.current === null) lastTimeRef.current = now
      const rawDt = (now - lastTimeRef.current) / 1000
      lastTimeRef.current = now
      const realDt = Math.min(rawDt, 0.1)

      const phys = physicsRef.current
      const currentParams = paramsRef.current

      // Tick physics
      if (runningRef.current) {
        tickPhysics(phys, currentParams, realDt, speedMultRef.current, releasedRef.current)
      }

      // Draw
      drawScene(canvas, phys, currentParams, displayOptsRef.current, releasedRef.current)

      frameCountRef.current++

      // Update readout every 2 frames
      if (frameCountRef.current % 2 === 0) {
        setReadout(derived(currentParams))
      }

      // Update plots every 6 frames
      if (frameCountRef.current % 6 === 0 && plotsRef.current) {
        const pd = plotDataRef.current
        const speed = Math.sqrt(phys.vx * phys.vx + phys.vy * phys.vy)
        const t = parseFloat(phys.t.toFixed(2))

        pd.times.push(t)
        pd.xs.push(parseFloat(phys.x.toFixed(3)))
        pd.ys.push(parseFloat(phys.y.toFixed(3)))
        pd.spds.push(parseFloat(speed.toFixed(3)))

        // Keep last MAX_PLOT_POINTS entries
        if (pd.times.length > MAX_PLOT_POINTS) {
          pd.times.shift()
          pd.xs.shift()
          pd.ys.shift()
          pd.spds.shift()
        }

        const { xyChart, vChart } = plotsRef.current
        if (xyChart) {
          xyChart.data.labels = pd.times
          xyChart.data.datasets[0].data = pd.xs
          xyChart.data.datasets[1].data = pd.ys
          xyChart.update('none')
        }
        if (vChart) {
          vChart.data.labels = pd.times
          vChart.data.datasets[0].data = pd.spds
          vChart.update('none')
        }
      }
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [plotsOpen])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleParamChange = useCallback((key, value) => {
    const next = { ...paramsRef.current, [key]: value }
    paramsRef.current = next
    setParams(next)
    setPreset('custom')

    // Reapply constraint to keep particle valid
    if (!releasedRef.current) {
      applyConstraint(physicsRef.current, next)
    }

    serializeToURL(next, speedMultRef.current)
  }, [])

  const handleReset = useCallback(() => {
    paramsRef.current = { ...DEFAULT_PARAMS }
    setParams({ ...DEFAULT_PARAMS })
    setPreset('bola')
    physicsRef.current = createInitialPhysics(DEFAULT_PARAMS)
    plotDataRef.current = { times: [], xs: [], ys: [], spds: [] }
    lastTimeRef.current = null
    releasedRef.current = false
    setReleased(false)
    runningRef.current = true
    setRunning(true)
    serializeToURL(DEFAULT_PARAMS, speedMultRef.current)
  }, [])

  const handleTogglePlay = useCallback(() => {
    const next = !runningRef.current
    runningRef.current = next
    if (next) lastTimeRef.current = null // reset dt on resume
    setRunning(next)
  }, [])

  const handleSpeedMult = useCallback((val) => {
    speedMultRef.current = val
    setSpeedMult(val)
    serializeToURL(paramsRef.current, val)
  }, [])

  const handleRelease = useCallback(() => {
    releasedRef.current = true
    setReleased(true)
  }, [])

  const handlePreset = useCallback((key) => {
    if (key === 'custom') {
      setPreset('custom')
      return
    }
    const p = PRESETS[key]
    if (!p) return
    const next = { r: p.r, v: p.v, m: p.m }
    paramsRef.current = next
    setParams(next)
    setPreset(key)

    // Reset physics with new params
    physicsRef.current = createInitialPhysics(next)
    plotDataRef.current = { times: [], xs: [], ys: [], spds: [] }
    lastTimeRef.current = null
    releasedRef.current = false
    setReleased(false)
    runningRef.current = true
    setRunning(true)

    serializeToURL(next, speedMultRef.current)
  }, [])

  const handleDisplayOpt = useCallback((key, value) => {
    const next = { ...displayOptsRef.current, [key]: value }
    displayOptsRef.current = next
    setDisplayOpts(next)
  }, [])

  const handleShare = useCallback(() => {
    serializeToURL(paramsRef.current, speedMultRef.current)
    navigator.clipboard.writeText(window.location.href).catch(() => {})
    const toast = document.getElementById('share-toast')
    if (toast) {
      toast.classList.add('show')
      setTimeout(() => toast.classList.remove('show'), 2200)
    }
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="app">
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 className="header-title">MCU</h1>
          <span className="header-sub">Movimiento Circular Uniforme</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <a
            className="btn btn-ghost btn-sm github-btn"
            href="https://github.com/pol-cova"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub de Paul Contreras"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            pol-cova
          </a>
          <a
            className="btn btn-ghost btn-sm github-btn"
            href="https://instagram.com/paulcontr_"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram de Paul Contreras"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
            paulcontr_
          </a>
          <button className="btn btn-ghost btn-sm" onClick={handleShare}>
            Compartir ↗
          </button>
        </div>
      </header>

      <main className="layout">
        <div className="col-left">
          <div className="canvas-wrap">
            <canvas ref={canvasRef} />
          </div>
          <Readout data={readout} />
          {released && (
            <div className="release-banner">
              ⚠ Restricción liberada — partícula en vuelo libre
            </div>
          )}
        </div>

        <div className="col-right">
          <Controls
            params={params}
            running={running}
            speedMult={speedMult}
            released={released}
            displayOpts={displayOpts}
            preset={preset}
            onParamChange={handleParamChange}
            onReset={handleReset}
            onTogglePlay={handleTogglePlay}
            onSpeedMult={handleSpeedMult}
            onRelease={handleRelease}
            onPreset={handlePreset}
            onDisplayOpt={handleDisplayOpt}
          />
        </div>
      </main>

      <Plots
        open={plotsOpen}
        onToggle={() => setPlotsOpen((o) => !o)}
        plotsRef={plotsRef}
      />

      <footer className="footer">
        <span>Created by&nbsp;<strong>paulcontreras</strong></span>
        <span className="footer-sep">·</span>
        <a
          href="https://github.com/pol-cova"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          pol-cova
        </a>
        <span className="footer-sep">·</span>
        <a
          href="https://instagram.com/paulcontr_"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
          </svg>
          paulcontr_
        </a>
        <span className="footer-sep">·</span>
        <span>Simulador MCU — Física Universitaria</span>
      </footer>

      <div id="share-toast" className="toast">
        ¡Enlace copiado!
      </div>
    </div>
  )
}
