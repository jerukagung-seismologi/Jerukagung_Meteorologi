import * as THREE from 'three'

function seededNoise(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123
  return n - Math.floor(n)
}

/** 1. Kayu Cat Putih Berpori & Berserat (Albedo + Bump + Roughness) */
export function createPaintedWoodPBR(repeatX = 2, repeatY = 2) {
  if (typeof document === 'undefined') return {} as any
  const size = 512
  const cMap = document.createElement('canvas')
  const cBump = document.createElement('canvas')
  const cRough = document.createElement('canvas')
  cMap.width = cBump.width = cRough.width = size
  cMap.height = cBump.height = cRough.height = size

  const ctxM = cMap.getContext('2d')!
  const ctxB = cBump.getContext('2d')!
  const ctxR = cRough.getContext('2d')!

  ctxM.fillStyle = '#f6f7f9'
  ctxM.fillRect(0, 0, size, size)
  ctxB.fillStyle = '#808080'
  ctxB.fillRect(0, 0, size, size)
  ctxR.fillStyle = '#929292'
  ctxR.fillRect(0, 0, size, size)

  // Serat kayu halus memanjang
  for (let y = 0; y < size; y += 2) {
    const wave = Math.sin(y * 0.08) * 6 + Math.sin(y * 0.31) * 3
    const delta = Math.round(wave)
    const shadeM = 240 + Math.max(-10, Math.min(12, delta))
    const shadeB = 128 + delta * 3
    const shadeR = 148 - delta * 2

    ctxM.fillStyle = `rgb(${shadeM},${shadeM},${shadeM - 1})`
    ctxM.fillRect(0, y, size, 2)

    ctxB.fillStyle = `rgb(${shadeB},${shadeB},${shadeB})`
    ctxB.fillRect(0, y, size, 2)

    ctxR.fillStyle = `rgb(${shadeR},${shadeR},${shadeR})`
    ctxR.fillRect(0, y, size, 2)
  }

  // Pori serat halus & sapuan kuas cat
  for (let i = 0; i < 3200; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const len = 18 + Math.random() * 68
    const dark = Math.random() > 0.5
    ctxM.fillStyle = dark ? 'rgba(205,212,220,0.18)' : 'rgba(255,255,255,0.22)'
    ctxM.fillRect(x, y, len, 1.3)

    ctxB.fillStyle = dark ? 'rgba(85,85,85,0.35)' : 'rgba(175,175,175,0.25)'
    ctxB.fillRect(x, y, len, 1.3)

    ctxR.fillStyle = dark ? 'rgba(185,185,185,0.3)' : 'rgba(115,115,115,0.25)'
    ctxR.fillRect(x, y, len, 1.3)
  }

  const setupTex = (canvas: HTMLCanvasElement, isColor: boolean) => {
    const t = new THREE.CanvasTexture(canvas)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(repeatX, repeatY)
    if (isColor) t.colorSpace = THREE.SRGBColorSpace
    return t
  }
  return {
    map: setupTex(cMap, true),
    bumpMap: setupTex(cBump, false),
    roughnessMap: setupTex(cRough, false),
  }
}

/** 2. Logam Galvanis Bercorak Spangle Kristalin */
export function createGalvanizedSpanglePBR(repeatX = 3, repeatY = 2) {
  if (typeof document === 'undefined') return {} as any
  const size = 512
  const cMap = document.createElement('canvas')
  const cBump = document.createElement('canvas')
  const cRough = document.createElement('canvas')
  cMap.width = cBump.width = cRough.width = size
  cMap.height = cBump.height = cRough.height = size

  const ctxM = cMap.getContext('2d')!
  const ctxB = cBump.getContext('2d')!
  const ctxR = cRough.getContext('2d')!

  ctxM.fillStyle = '#cfd6de'
  ctxM.fillRect(0, 0, size, size)
  ctxB.fillStyle = '#808080'
  ctxB.fillRect(0, 0, size, size)
  ctxR.fillStyle = '#6e6e6e'
  ctxR.fillRect(0, 0, size, size)

  // Kristal spangle seng poligonal
  for (let i = 0; i < 420; i++) {
    const cx = Math.random() * size
    const cy = Math.random() * size
    const sides = 5 + Math.floor(Math.random() * 4)
    const rad = 10 + Math.random() * 24
    const tone = 175 + Math.floor(Math.random() * 68)
    const roughVal = 65 + Math.floor(Math.random() * 110)
    const bumpVal = 108 + Math.floor(Math.random() * 44)

    const drawPoly = (ctx: CanvasRenderingContext2D, fill: string) => {
      ctx.beginPath()
      for (let s = 0; s < sides; s++) {
        const a = (s / sides) * Math.PI * 2 + (i % 7) * 0.4
        const r = rad * (0.72 + seededNoise(i + s, s) * 0.45)
        const px = cx + Math.cos(a) * r
        const py = cy + Math.sin(a) * r
        if (s === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.fillStyle = fill
      ctx.fill()
    }

    drawPoly(ctxM, `rgba(${tone},${tone + 4},${tone + 9},0.75)`)
    drawPoly(ctxB, `rgba(${bumpVal},${bumpVal},${bumpVal},0.65)`)
    drawPoly(ctxR, `rgba(${roughVal},${roughVal},${roughVal},0.75)`)
  }

  // Goresan mikro
  for (let i = 0; i < 1200; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    ctxR.fillStyle = 'rgba(210,210,210,0.12)'
    ctxR.fillRect(x, y, 24, 1)
  }

  const setup = (c: HTMLCanvasElement, isColor: boolean) => {
    const t = new THREE.CanvasTexture(c)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(repeatX, repeatY)
    if (isColor) t.colorSpace = THREE.SRGBColorSpace
    return t
  }
  return { map: setup(cMap, true), bumpMap: setup(cBump, false), roughnessMap: setup(cRough, false) }
}

/** 3. Brushed Stainless Steel */
export function createBrushedSteelPBR() {
  if (typeof document === 'undefined') return {} as any
  const size = 256
  const cMap = document.createElement('canvas')
  const cRough = document.createElement('canvas')
  cMap.width = cRough.width = size
  cMap.height = cRough.height = size
  const ctxM = cMap.getContext('2d')!
  const ctxR = cRough.getContext('2d')!

  ctxM.fillStyle = '#dde3ea'
  ctxM.fillRect(0, 0, size, size)
  ctxR.fillStyle = '#525252'
  ctxR.fillRect(0, 0, size, size)

  for (let y = 0; y < size; y++) {
    const v = 205 + Math.floor(Math.random() * 35)
    const r = 55 + Math.floor(Math.random() * 55)
    ctxM.fillStyle = `rgb(${v},${v + 2},${v + 5})`
    ctxM.fillRect(0, y, size, 1)
    ctxR.fillStyle = `rgb(${r},${r},${r})`
    ctxR.fillRect(0, y, size, 1)
  }

  const map = new THREE.CanvasTexture(cMap)
  const roughnessMap = new THREE.CanvasTexture(cRough)
  map.wrapS = map.wrapT = roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping
  map.colorSpace = THREE.SRGBColorSpace
  return { map, roughnessMap }
}

/** 4. Beton Cor Beragregat Kasar */
export function createConcretePBR(repeatX = 2, repeatY = 2) {
  if (typeof document === 'undefined') return {} as any
  const size = 512
  const cMap = document.createElement('canvas')
  const cBump = document.createElement('canvas')
  const cRough = document.createElement('canvas')
  cMap.width = cBump.width = cRough.width = size
  cMap.height = cBump.height = cRough.height = size

  const ctxM = cMap.getContext('2d')!
  const ctxB = cBump.getContext('2d')!
  const ctxR = cRough.getContext('2d')!

  ctxM.fillStyle = '#b9c0c8'
  ctxM.fillRect(0, 0, size, size)
  ctxB.fillStyle = '#808080'
  ctxB.fillRect(0, 0, size, size)
  ctxR.fillStyle = '#d8d8d8'
  ctxR.fillRect(0, 0, size, size)

  for (let i = 0; i < 65; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const r = 20 + Math.random() * 55
    const g = ctxM.createRadialGradient(x, y, 2, x, y, r)
    const dark = Math.random() > 0.5
    g.addColorStop(0, dark ? 'rgba(110,118,128,0.18)' : 'rgba(226,232,240,0.2)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctxM.fillStyle = g
    ctxM.fillRect(x - r, y - r, r * 2, r * 2)
  }

  for (let i = 0; i < 12000; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const s = Math.random() * 2.4 + 0.7
    const v = 125 + Math.floor(Math.random() * 100)
    const bv = 70 + Math.floor(Math.random() * 125)
    ctxM.fillStyle = `rgba(${v},${v},${v - 2},0.55)`
    ctxM.fillRect(x, y, s, s)
    ctxB.fillStyle = `rgb(${bv},${bv},${bv})`
    ctxB.fillRect(x, y, s, s)
    ctxR.fillStyle = `rgb(${180 + (bv % 65)},${180 + (bv % 65)},${180 + (bv % 65)})`
    ctxR.fillRect(x, y, s, s)
  }

  const setup = (c: HTMLCanvasElement, isColor: boolean) => {
    const t = new THREE.CanvasTexture(c)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(repeatX, repeatY)
    if (isColor) t.colorSpace = THREE.SRGBColorSpace
    return t
  }
  return { map: setup(cMap, true), bumpMap: setup(cBump, false), roughnessMap: setup(cRough, false) }
}

/** 5. Rumput Lapangan & Petak Taman */
export function createGrassGroundPBR(isParkPlot = true) {
  if (typeof document === 'undefined') return {} as any
  const size = 512
  const cMap = document.createElement('canvas')
  const cBump = document.createElement('canvas')
  cMap.width = cBump.width = size
  cMap.height = cBump.height = size
  const ctxM = cMap.getContext('2d')!
  const ctxB = cBump.getContext('2d')!

  ctxM.fillStyle = isParkPlot ? '#3c7736' : '#31592d'
  ctxM.fillRect(0, 0, size, size)
  ctxB.fillStyle = '#7a7a7a'
  ctxB.fillRect(0, 0, size, size)

  if (isParkPlot) {
    for (let i = 0; i < 8; i++) {
      ctxM.fillStyle = i % 2 === 0 ? 'rgba(130,205,98,0.09)' : 'rgba(18,52,20,0.08)'
      ctxM.fillRect((i * size) / 8, 0, size / 8, size)
    }
  }

  for (let i = 0; i < 20000; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const r = Math.random()
    if (r > 0.65) ctxM.fillStyle = isParkPlot ? 'rgba(112,188,78,0.34)' : 'rgba(84,136,64,0.26)'
    else if (r > 0.25) ctxM.fillStyle = 'rgba(28,74,28,0.32)'
    else ctxM.fillStyle = 'rgba(78,64,38,0.22)'
    ctxM.fillRect(x, y, 2, 3.5)

    const bv = r > 0.5 ? 165 : 92
    ctxB.fillStyle = `rgb(${bv},${bv},${bv})`
    ctxB.fillRect(x, y, 2, 3)
  }

  const map = new THREE.CanvasTexture(cMap)
  const bumpMap = new THREE.CanvasTexture(cBump)
  map.wrapS = map.wrapT = bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping
  map.repeat.set(isParkPlot ? 3 : 24, isParkPlot ? 3 : 24)
  bumpMap.repeat.set(isParkPlot ? 3 : 24, isParkPlot ? 3 : 24)
  map.colorSpace = THREE.SRGBColorSpace
  return { map, bumpMap }
}

/** 6. Petak Tanah Gundul */
export function createSoilPBR() {
  if (typeof document === 'undefined') return {} as any
  const size = 512
  const cMap = document.createElement('canvas')
  const cBump = document.createElement('canvas')
  cMap.width = cBump.width = size
  cMap.height = cBump.height = size
  const ctxM = cMap.getContext('2d')!
  const ctxB = cBump.getContext('2d')!

  ctxM.fillStyle = '#573c25'
  ctxM.fillRect(0, 0, size, size)
  ctxB.fillStyle = '#757575'
  ctxB.fillRect(0, 0, size, size)

  for (let i = 0; i < 14000; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const rad = Math.random() * 2.6 + 0.6
    const pick = Math.random()
    if (pick > 0.72) ctxM.fillStyle = 'rgba(122,88,54,0.48)'
    else if (pick > 0.2) ctxM.fillStyle = 'rgba(46,30,17,0.52)'
    else ctxM.fillStyle = 'rgba(155,136,112,0.35)'
    ctxM.beginPath()
    ctxM.arc(x, y, rad, 0, Math.PI * 2)
    ctxM.fill()

    const b = pick > 0.5 ? 175 : 70
    ctxB.fillStyle = `rgb(${b},${b},${b})`
    ctxB.beginPath()
    ctxB.arc(x, y, rad, 0, Math.PI * 2)
    ctxB.fill()
  }
  const map = new THREE.CanvasTexture(cMap)
  const bumpMap = new THREE.CanvasTexture(cBump)
  map.colorSpace = THREE.SRGBColorSpace
  return { map, bumpMap }
}

/** 7. Panel Surya Monokristalin */
export function createSolarPanelPBR() {
  if (typeof document === 'undefined') return {} as any
  const w = 512, h = 512
  const cMap = document.createElement('canvas')
  const cRough = document.createElement('canvas')
  const cBump = document.createElement('canvas')
  cMap.width = cRough.width = cBump.width = w
  cMap.height = cRough.height = cBump.height = h

  const ctxM = cMap.getContext('2d')!
  const ctxR = cRough.getContext('2d')!
  const ctxB = cBump.getContext('2d')!

  ctxM.fillStyle = '#cbd5e1'
  ctxM.fillRect(0, 0, w, h)
  ctxR.fillStyle = '#1e1e1e'
  ctxR.fillRect(0, 0, w, h)
  ctxB.fillStyle = '#888888'
  ctxB.fillRect(0, 0, w, h)

  const cols = 4, rows = 6
  const pad = 4
  const cellW = w / cols
  const cellH = h / rows

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cellW + pad
      const y = r * cellH + pad
      const cw = cellW - pad * 2
      const ch = cellH - pad * 2
      const chm = 9

      const grad = ctxM.createLinearGradient(x, y, x + cw, y + ch)
      grad.addColorStop(0, '#0a1c47')
      grad.addColorStop(0.5, '#102d6e')
      grad.addColorStop(1, '#08173b')

      ctxM.beginPath()
      ctxM.moveTo(x + chm, y)
      ctxM.lineTo(x + cw - chm, y)
      ctxM.lineTo(x + cw, y + chm)
      ctxM.lineTo(x + cw, y + ch - chm)
      ctxM.lineTo(x + cw - chm, y + ch)
      ctxM.lineTo(x + chm, y + ch)
      ctxM.lineTo(x, y + ch - chm)
      ctxM.lineTo(x, y + chm)
      ctxM.closePath()
      ctxM.fillStyle = grad
      ctxM.fill()

      ctxM.fillStyle = 'rgba(148, 197, 255, 0.18)'
      for (let fy = y + 6; fy < y + ch - 4; fy += 6) {
        ctxM.fillRect(x + 2, fy, cw - 4, 1)
      }

      ctxM.fillStyle = 'rgba(226, 232, 240, 0.85)'
      ;[0.22, 0.5, 0.78].forEach((frac) => {
        ctxM.fillRect(x + cw * frac - 1, y, 2, ch)
        ctxB.fillStyle = '#b4b4b4'
        ctxB.fillRect(x + cw * frac - 1, y, 2, ch)
      })
    }
  }

  const map = new THREE.CanvasTexture(cMap)
  const roughnessMap = new THREE.CanvasTexture(cRough)
  const bumpMap = new THREE.CanvasTexture(cBump)
  map.colorSpace = THREE.SRGBColorSpace
  return { map, roughnessMap, bumpMap }
}

/** 8. PCB Gelap dengan Trace & Pad */
export function createDarkPcbTexture(baseHex = '#0c3b2e') {
  if (typeof document === 'undefined') return {} as any
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = baseHex
  ctx.fillRect(0, 0, size, size)

  ctx.strokeStyle = 'rgba(56, 189, 148, 0.38)'
  ctx.lineWidth = 2.5
  for (let i = 0; i < 24; i++) {
    const x1 = 16 + (i % 6) * 38
    const y1 = 16 + Math.floor(i / 6) * 58
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x1 + 26, y1)
    ctx.lineTo(x1 + 42, y1 + 18)
    ctx.stroke()
  }

  ctx.fillStyle = '#eab308'
  for (let p = 18; p < size - 16; p += 16) {
    ctx.beginPath()
    ctx.arc(p, 14, 4.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(p, size - 14, 4.5, 0, Math.PI * 2)
    ctx.fill()
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** 9. Plakat Kompas */
export function createCompassPlaqueTexture(letter: string, sublabel: string) {
  if (typeof document === 'undefined') return {} as any
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#e2e8f0'
  ctx.fillRect(0, 0, 256, 256)
  ctx.strokeStyle = '#334155'
  ctx.lineWidth = 14
  ctx.strokeRect(12, 12, 232, 232)

  ctx.fillStyle = letter === 'U' ? '#dc2626' : '#0f172a'
  ctx.font = 'bold 132px Inter, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(letter, 128, 112)

  ctx.fillStyle = '#475569'
  ctx.font = 'bold 30px Inter, sans-serif'
  ctx.fillText(sublabel, 128, 206)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** 10. Kayu Palet Alami */
export function createNaturalWoodPBR() {
  if (typeof document === 'undefined') return {} as any
  const size = 256
  const cMap = document.createElement('canvas')
  const cBump = document.createElement('canvas')
  cMap.width = cBump.width = size
  cMap.height = cBump.height = size
  const ctxM = cMap.getContext('2d')!
  const ctxB = cBump.getContext('2d')!

  ctxM.fillStyle = '#92633b'
  ctxM.fillRect(0, 0, size, size)
  ctxB.fillStyle = '#808080'
  ctxB.fillRect(0, 0, size, size)

  for (let y = 0; y < size; y += 2) {
    const w = Math.sin(y * 0.14) * 14 + Math.cos(y * 0.42) * 6
    ctxM.fillStyle = `rgb(${146 + w},${99 + w * 0.7},${59 + w * 0.45})`
    ctxM.fillRect(0, y, size, 2)
    const b = 128 + w * 2.5
    ctxB.fillStyle = `rgb(${b},${b},${b})`
    ctxB.fillRect(0, y, size, 2)
  }
  const map = new THREE.CanvasTexture(cMap)
  const bumpMap = new THREE.CanvasTexture(cBump)
  map.wrapS = map.wrapT = bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping
  map.colorSpace = THREE.SRGBColorSpace
  return { map, bumpMap }
}
