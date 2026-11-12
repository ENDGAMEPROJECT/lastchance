import { useEffect, useRef } from 'react'
import './HoloTunnel.css'

/* Holographic warp tunnel, drawn live on a <canvas> (replaces the old
   abduction-scene.mp4). Loops forever; the screen that mounts it decides how
   long the trip lasts.

   It's a fake 3D tunnel: every element has an angle around the tunnel axis, a
   radius, and a depth z (1 = far, at the core; → 0 = at the camera). Each
   frame z shrinks, and the projection (radius / z) makes things rush outward
   from the core and grow as they pass. Layers, back to front:
     background glow · rotating wall spokes · dashed rings with "data blocks"
     · light streaks · the core
   Everything bright is drawn with additive blending ('lighter') so
   overlapping light glows like the reference video. No shadowBlur (too slow
   on phones); glow is a wide faint stroke under a thin bright one.

   Props:
     rampMs  — the speed builds from cruise to full warp over this long
               (match it to the trip so it peaks as the core flashes).
     paused  — freeze the animation (debug "Pause"). */

// Palette from the reference: cyan · electric blue · violet · magenta · white-lilac.
// Toned down from pure neon: same hues, less saturated and a little darker.
const COLORS = ['#3fc4d6', '#4a6fd8', '#7a5ad0', '#c548a8', '#a99ad8', '#3fc4d6', '#7a5ad0']
const NEAR = 0.06
const FAR = 7 // deep, so things are born right at the core and pile up around it
const STREAKS = 340 // few but very wide: painted pixels, not count, is what costs frames
const RINGS = 34
const SPOKES = 56

// Deterministic random, so the tunnel looks the same every run.
function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

function buildScene() {
  const r = rng(20261112)
  const pick = () => COLORS[Math.floor(r() * COLORS.length)]
  const streaks = Array.from({ length: STREAKS }, () => ({
    angle: r() * Math.PI * 2,
    radius: 0.3 + Math.pow(r(), 0.5) * 1.1, // most on the walls, a few close to the axis
    z: NEAR + r() * (FAR - NEAR),
    len: 0.35 + Math.pow(r(), 1.5) * 1.8, // relative to depth: long trails, some very long
    width: 7.2 + Math.pow(r(), 2) * 18, // 4x the previous bands, a few huge
    color: r() < 0.06 ? '#d8d2ee' : pick(),
  }))
  const rings = Array.from({ length: RINGS }, (_, i) => {
    const segments = []
    let a = r() * 0.4
    while (a < Math.PI * 2 - 0.1) {
      const block = r() < 0.35
      const span = block ? 0.02 + r() * 0.06 : 0.12 + r() * 0.9
      segments.push({ a0: a, a1: Math.min(Math.PI * 2, a + span), block })
      a += span + 0.04 + r() * 0.45
    }
    return {
      z: NEAR + ((i + r() * 0.5) / RINGS) * (FAR - NEAR),
      radius: 0.55 + r() * 0.6,
      spin: (r() - 0.5) * 0.5,
      color: [COLORS[0], COLORS[2], COLORS[3], COLORS[1]][i % 4],
      segments,
    }
  })
  return { streaks, rings }
}

export default function HoloTunnel({ rampMs = 9000, paused = false, className = '' }) {
  const canvasRef = useRef(null)
  const pausedRef = useRef(paused)
  pausedRef.current = paused

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const { streaks, rings } = buildScene()
    let W = 0, H = 0, focal = 0, bg = null, vignette = null

    // Size the backing store to what's actually on screen (the stage is
    // CSS-scaled), capped so a big monitor doesn't melt a laptop GPU.
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const scale = Math.min(dpr, 1600 / Math.max(1, rect.width))
      W = canvas.width = Math.max(1, Math.round(rect.width * scale))
      H = canvas.height = Math.max(1, Math.round(rect.height * scale))
      focal = Math.min(W, H) * 0.42
      const cx = W / 2, cy = H / 2, far = Math.hypot(cx, cy)
      bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, far)
      // White at the heart → bluish violet → dark blue at the edges.
      bg.addColorStop(0, '#ffffff')
      bg.addColorStop(0.06, '#e4defc')
      bg.addColorStop(0.2, '#8577e6')
      bg.addColorStop(0.42, '#3e3caa')
      bg.addColorStop(0.72, '#141b5c')
      bg.addColorStop(1, '#060a24')
      vignette = ctx.createRadialGradient(cx, cy, far * 0.35, cx, cy, far)
      vignette.addColorStop(0, 'rgba(0,0,0,0)')
      vignette.addColorStop(1, 'rgba(0,0,8,0.75)')
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    let raf = 0
    let last = performance.now()
    let clock = 0 // ms of unpaused animation
    let travel = 0 // accumulated depth travelled (drives the loop)

    const frame = (now) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(50, now - last) // a hidden tab / hitch must not teleport the tunnel
      last = now
      if (pausedRef.current) return
      clock += dt

      // Cruise → full warp over rampMs (eased), then hold at full warp.
      const ramp = smooth(0, 1, clock / rampMs)
      const speed = (1.44 + ramp * 3.9) * (dt / 1000) // depth units per frame
      travel += speed
      const t = clock / 1000
      const rot = t * (0.12 + ramp * 0.25) // slow spiral of the whole tunnel
      // A gentle drift of the vanishing point: you're being pulled, not on rails.
      const cx = W / 2 + Math.sin(t * 0.9) * W * 0.006
      const cy = H / 2 + Math.cos(t * 0.7) * H * 0.008
      const px = (angle, radius, z) => cx + Math.cos(angle) * radius * focal / z
      const py = (angle, radius, z) => cy + Math.sin(angle) * radius * focal / z
      const unit = focal / 300 // line widths scale with the canvas size

      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)
      ctx.globalCompositeOperation = 'lighter'
      ctx.lineCap = 'butt' // square ends everywhere: hard-edged light bands, not pills

      // Wall spokes: faint fixed lines along the tunnel, rotating slowly.
      ctx.lineWidth = 1.6 * unit
      for (let i = 0; i < SPOKES; i++) {
        const a = rot * 0.6 + (i / SPOKES) * Math.PI * 2
        ctx.globalAlpha = 0.05 + (i % 3 === 0 ? 0.05 : 0)
        ctx.strokeStyle = i % 2 ? '#3d7bff' : '#8f5bff'
        ctx.beginPath()
        ctx.moveTo(px(a, 0.9, FAR * 0.8), py(a, 0.9, FAR * 0.8))
        ctx.lineTo(px(a, 0.9, NEAR * 2), py(a, 0.9, NEAR * 2))
        ctx.stroke()
      }

      // Rings: dashed arcs plus short thick "data blocks", flying at the camera.
      const span = FAR - NEAR
      for (const ring of rings) {
        const z = NEAR + ((((ring.z - NEAR - travel) % span) + span) % span)
        const alpha = smooth(FAR, FAR * 0.8, z) * smooth(NEAR, 0.22, z)
        if (alpha <= 0.01) continue
        const radius = ring.radius * focal / z
        const width = Math.min(22, 0.8 / z + 0.9) * unit
        const spin = rot + t * ring.spin
        ctx.strokeStyle = ring.color
        for (const seg of ring.segments) {
          const w = seg.block ? width * 3.2 : width
          ctx.globalAlpha = alpha * (seg.block ? 0.22 : 0.1)
          ctx.lineWidth = w * 2.4 // glow pass
          ctx.beginPath()
          ctx.arc(cx, cy, radius, seg.a0 + spin, seg.a1 + spin)
          ctx.stroke()
          ctx.globalAlpha = alpha * (seg.block ? 0.6 : 0.5)
          ctx.lineWidth = w
          ctx.stroke()
        }
      }

      // Streaks: the light trails. Far end near the core, near end flung outward.
      const warp = 1 + ramp * 2.2 // trails stretch as speed builds
      for (const s of streaks) {
        const z0 = NEAR + ((((s.z - NEAR - travel * 1.35) % span) + span) % span)
        const z1 = Math.min(FAR, z0 * (1 + s.len * warp))
        const alpha = smooth(FAR, FAR * 0.75, z0)
        if (alpha <= 0.01) continue
        const a = s.angle + rot
        const x0 = px(a, s.radius, z0), y0 = py(a, s.radius, z0)
        const x1 = px(a, s.radius, z1), y1 = py(a, s.radius, z1)
        const w = s.width * Math.min(7, 0.3 / z0 + 0.6) * unit
        // One stroke only: at this width a separate glow pass would double
        // the painted area for little visible gain.
        ctx.strokeStyle = s.color
        ctx.globalAlpha = alpha * 0.42
        ctx.lineWidth = w
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x0, y0)
        ctx.stroke()
      }

      // The core: a hot white-violet light the whole tunnel pours out of.
      const pulse = 1 + Math.sin(t * 5.2) * 0.06 + ramp * 0.35
      const halo = focal * 0.55 * pulse
      let g = ctx.createRadialGradient(cx, cy, 0, cx, cy, halo)
      g.addColorStop(0, 'rgba(140,105,230,0.4)')
      g.addColorStop(0.35, 'rgba(85,60,190,0.13)')
      g.addColorStop(1, 'rgba(40,20,120,0)')
      ctx.globalAlpha = 1
      ctx.fillStyle = g
      ctx.fillRect(cx - halo, cy - halo, halo * 2, halo * 2)
      const core = focal * 0.11 * pulse
      g = ctx.createRadialGradient(cx, cy, 0, cx, cy, core)
      g.addColorStop(0, 'rgba(250,246,255,0.9)')
      g.addColorStop(0.3, 'rgba(220,205,250,0.7)')
      g.addColorStop(0.65, 'rgba(170,120,255,0.35)')
      g.addColorStop(1, 'rgba(120,80,255,0)')
      ctx.fillStyle = g
      ctx.fillRect(cx - core, cy - core, core * 2, core * 2)

      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, W, H)
    }
    raf = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [rampMs])

  return (
    <div className={`holo-tunnel ${className}`} aria-hidden="true">
      <canvas ref={canvasRef} className="holo-tunnel-canvas" />
      <div className="holo-tunnel-scan" />
    </div>
  )
}
