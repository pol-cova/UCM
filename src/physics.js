export const DT = 1 / 60
export const TRAIL_LEN = 60
export const TWO_PI = Math.PI * 2

// Create initial physics state for a particle on the circle
export function createInitialPhysics(params) {
  return {
    x: params.r,
    y: 0,
    vx: 0,
    vy: params.v,
    t: 0,
    trail: [],
    accum: 0,
  }
}

// RK4 derivative: free particle (no force, position drives velocity)
function deriv(state) {
  return {
    x: state.vx,
    y: state.vy,
    vx: 0,
    vy: 0,
  }
}

// Single RK4 integration step
function rk4Step(state, dt) {
  const k1 = deriv(state)

  const s2 = {
    x: state.x + k1.x * dt * 0.5,
    y: state.y + k1.y * dt * 0.5,
    vx: state.vx + k1.vx * dt * 0.5,
    vy: state.vy + k1.vy * dt * 0.5,
  }
  const k2 = deriv(s2)

  const s3 = {
    x: state.x + k2.x * dt * 0.5,
    y: state.y + k2.y * dt * 0.5,
    vx: state.vx + k2.vx * dt * 0.5,
    vy: state.vy + k2.vy * dt * 0.5,
  }
  const k3 = deriv(s3)

  const s4 = {
    x: state.x + k3.x * dt,
    y: state.y + k3.y * dt,
    vx: state.vx + k3.vx * dt,
    vy: state.vy + k3.vy * dt,
  }
  const k4 = deriv(s4)

  return {
    x: state.x + (dt / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x),
    y: state.y + (dt / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y),
    vx: state.vx + (dt / 6) * (k1.vx + 2 * k2.vx + 2 * k3.vx + k4.vx),
    vy: state.vy + (dt / 6) * (k1.vy + 2 * k2.vy + 2 * k3.vy + k4.vy),
  }
}

// Snap position to the circle radius and enforce tangential velocity at magnitude v
export function applyConstraint(phys, params) {
  const dist = Math.sqrt(phys.x * phys.x + phys.y * phys.y)
  if (dist === 0) return

  // Snap to circle
  phys.x = (phys.x / dist) * params.r
  phys.y = (phys.y / dist) * params.r

  // Tangent direction (perpendicular to radial, CCW)
  const tx = -phys.y / params.r
  const ty = phys.x / params.r

  // Project velocity onto tangent, then rescale to params.v
  const vDotT = phys.vx * tx + phys.vy * ty
  const sign = vDotT >= 0 ? 1 : -1

  phys.vx = sign * params.v * tx
  phys.vy = sign * params.v * ty
}

// Advance physics by realDt seconds, using fixed DT substeps
export function tickPhysics(phys, params, realDt, speedMult, released) {
  phys.accum += realDt * speedMult

  while (phys.accum >= DT) {
    phys.accum -= DT

    // RK4 step
    const next = rk4Step(phys, DT)
    phys.x = next.x
    phys.y = next.y
    phys.vx = next.vx
    phys.vy = next.vy
    phys.t += DT

    // Constrain to circle if not released
    if (!released) {
      applyConstraint(phys, params)
    }

    // Record trail point
    phys.trail.push({ x: phys.x, y: phys.y })
    if (phys.trail.length > TRAIL_LEN) {
      phys.trail.shift()
    }
  }
}

// Compute derived quantities from current params
export function derived(params) {
  const { r, v, m } = params
  const omega = r > 0 ? v / r : 0
  const T = omega > 0 ? TWO_PI / omega : 0
  const ac = r > 0 ? (v * v) / r : 0
  const Fc = m * ac
  return { r, v, m, omega, T, ac, Fc }
}

export const PRESETS = {
  bola: { r: 1.0, v: 3.0, m: 0.5, label: 'Bola en cuerda' },
  auto: { r: 50.0, v: 20.0, m: 1200.0, label: 'Auto en curva' },
  satelite: { r: 4.0, v: 8.0, m: 1.0, label: 'Satélite (escala)' },
}
