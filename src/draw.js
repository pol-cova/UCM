import { TRAIL_LEN } from './physics.js'

// Draw a filled arrowhead at (x2,y2) pointing from (x1,y1)
function drawArrow(ctx, x1, y1, x2, y2, color, dpr) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len < 1) return

  const ux = dx / len
  const uy = dy / len
  const headLen = 10 * dpr
  const spread = 0.35

  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 2 * dpr
  ctx.lineCap = 'round'

  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()

  const ax = x2 - ux * headLen
  const ay = y2 - uy * headLen
  const bx = ax - uy * headLen * Math.tan(spread)
  const by = ay + ux * headLen * Math.tan(spread)
  const cx2 = ax + uy * headLen * Math.tan(spread)
  const cy2 = ay - ux * headLen * Math.tan(spread)

  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(bx, by)
  ctx.lineTo(cx2, cy2)
  ctx.closePath()
  ctx.fill()

  ctx.restore()
}

export function drawScene(canvas, phys, params, displayOpts, released) {
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const W = canvas.width
  const H = canvas.height
  const cx = W / 2
  const cy = H / 2

  // Scale: map physics radius to 42% of canvas width
  const scale = (W * 0.42) / Math.max(params.r, 5.0)

  // Particle position in canvas coords
  const px = cx + phys.x * scale
  const py = cy - phys.y * scale // Y axis flipped

  // ── 1. Clear canvas ──────────────────────────────────────────────────────────
  ctx.fillStyle = '#f0f2ff'
  ctx.fillRect(0, 0, W, H)

  // ── 2. Dot grid ──────────────────────────────────────────────────────────────
  const gridStep = 48 * dpr
  ctx.fillStyle = 'rgba(99,102,241,0.18)'
  for (let gx = gridStep / 2; gx < W; gx += gridStep) {
    for (let gy = gridStep / 2; gy < H; gy += gridStep) {
      ctx.beginPath()
      ctx.arc(gx, gy, 1.5 * dpr, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // ── 3. Center cross ───────────────────────────────────────────────────────────
  const crossSize = 8 * dpr
  ctx.strokeStyle = 'rgba(99,102,241,0.45)'
  ctx.lineWidth = 1 * dpr
  ctx.beginPath()
  ctx.moveTo(cx - crossSize, cy)
  ctx.lineTo(cx + crossSize, cy)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx, cy - crossSize)
  ctx.lineTo(cx, cy + crossSize)
  ctx.stroke()

  // ── 4. Orbit circle ───────────────────────────────────────────────────────────
  const orbitR = params.r * scale

  if (released) {
    ctx.strokeStyle = 'rgba(220,38,38,0.25)'
    ctx.lineWidth = 1.5 * dpr
    ctx.setLineDash([8 * dpr, 8 * dpr])
    ctx.beginPath()
    ctx.arc(cx, cy, orbitR, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
  } else {
    ctx.strokeStyle = 'rgba(99,102,241,0.55)'
    ctx.lineWidth = 1.5 * dpr
    ctx.setLineDash([8 * dpr, 8 * dpr])
    ctx.beginPath()
    ctx.arc(cx, cy, orbitR, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
  }

  // ── 5. Trail ──────────────────────────────────────────────────────────────────
  if (displayOpts.trail && phys.trail.length > 1) {
    for (let i = 1; i < phys.trail.length; i++) {
      const alpha = (i / phys.trail.length) * 0.6
      const tx1 = cx + phys.trail[i - 1].x * scale
      const ty1 = cy - phys.trail[i - 1].y * scale
      const tx2 = cx + phys.trail[i].x * scale
      const ty2 = cy - phys.trail[i].y * scale

      ctx.strokeStyle = `rgba(85,87,232,${alpha})`
      ctx.lineWidth = 2 * dpr
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(tx1, ty1)
      ctx.lineTo(tx2, ty2)
      ctx.stroke()
    }
  }

  const arrowUnit = (W * 0.22) / 10 // same px/unit for v and aᶜ
  const maxArrow = W * 0.30

  // ── 6. Radius vector (center → particle) ──────────────────────────────────────
  if (displayOpts.radius) {
    drawArrow(ctx, cx, cy, px, py, '#059669', dpr)
    ctx.fillStyle = '#059669'
    ctx.font = `bold ${12 * dpr}px Inter, sans-serif`
    ctx.fillText('r\u20D7', cx + (px - cx) * 0.55 + 6 * dpr, cy + (py - cy) * 0.55 - 4 * dpr)
  }

  // ── 7. Velocity arrow ─────────────────────────────────────────────────────────
  if (displayOpts.vel) {
    const speed = Math.sqrt(phys.vx * phys.vx + phys.vy * phys.vy)
    if (speed > 0) {
      const arrowLen = Math.min(speed * arrowUnit, maxArrow)
      const uvx = phys.vx / speed
      const uvy = phys.vy / speed

      const vax2 = px + uvx * arrowLen
      const vay2 = py - uvy * arrowLen // flip Y

      drawArrow(ctx, px, py, vax2, vay2, '#2563eb', dpr)

      ctx.fillStyle = '#2563eb'
      ctx.font = `bold ${12 * dpr}px Inter, sans-serif`
      ctx.fillText('v\u20D7', vax2 + 6 * dpr, vay2 - 4 * dpr)
    }
  }

  // ── 8. Centripetal acceleration arrow ─────────────────────────────────────────
  if (displayOpts.acc && !released) {
    const ac = params.v * params.v / Math.max(params.r, 0.001)
    if (ac > 0) {
      const arrowLen = Math.min(ac * arrowUnit, maxArrow)

      const drx = cx - px
      const dry = cy - py
      const drLen = Math.sqrt(drx * drx + dry * dry)
      if (drLen > 0) {
        const uax = drx / drLen
        const uay = dry / drLen

        const aax2 = px + uax * arrowLen
        const aay2 = py + uay * arrowLen

        drawArrow(ctx, px, py, aax2, aay2, '#dc2626', dpr)

        ctx.fillStyle = '#dc2626'
        ctx.font = `bold ${12 * dpr}px Inter, sans-serif`
        ctx.fillText('a\u20D7\u1D04', aax2 + 6 * dpr, aay2 - 4 * dpr)
      }
    }
  }

  // ── 9. Particle ───────────────────────────────────────────────────────────────
  const particleR = 7 * dpr

  ctx.save()
  ctx.shadowBlur = 18 * dpr
  ctx.shadowColor = 'rgba(245,158,11,0.6)'
  ctx.fillStyle = '#f59e0b'
  ctx.beginPath()
  ctx.arc(px, py, particleR, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  ctx.strokeStyle = 'rgba(120,60,0,0.2)'
  ctx.lineWidth = 1.5 * dpr
  ctx.beginPath()
  ctx.arc(px, py, particleR, 0, Math.PI * 2)
  ctx.stroke()
}
