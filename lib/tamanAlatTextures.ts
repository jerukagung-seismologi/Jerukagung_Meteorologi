import * as THREE from "three"

/**
 * Membuat tekstur rumput terawat prosedural dengan garis potongan halus
 */
export function createGrassTexture(isParkPlot = true): THREE.CanvasTexture {
  if (typeof document === "undefined") {
    return new THREE.CanvasTexture({} as HTMLCanvasElement)
  }
  const size = 512
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")
  if (!ctx) return new THREE.CanvasTexture(canvas)

  ctx.fillStyle = isParkPlot ? "#3f7d3a" : "#356032"
  ctx.fillRect(0, 0, size, size)

  if (isParkPlot) {
    // Garis mowing lembut khas taman alat terawat
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 === 0 ? "rgba(134, 212, 102, 0.08)" : "rgba(20, 56, 22, 0.07)"
      ctx.fillRect((i * size) / 8, 0, size / 8, size)
    }
  }

  // Noise bilah rumput & butiran tanah halus
  for (let i = 0; i < 16000; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const shade = Math.random()
    if (shade > 0.65) {
      ctx.fillStyle = isParkPlot ? "rgba(118, 196, 86, 0.28)" : "rgba(92, 145, 72, 0.22)"
    } else if (shade > 0.3) {
      ctx.fillStyle = "rgba(34, 82, 34, 0.25)"
    } else {
      ctx.fillStyle = "rgba(84, 72, 46, 0.14)"
    }
    ctx.fillRect(x, y, 2, 3)
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(isParkPlot ? 3 : 22, isParkPlot ? 3 : 22)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/**
 * Membuat tekstur tanah gundul untuk petak suhu tanah
 */
export function createSoilTexture(): THREE.CanvasTexture {
  if (typeof document === "undefined") {
    return new THREE.CanvasTexture({} as HTMLCanvasElement)
  }
  const size = 256
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")
  if (!ctx) return new THREE.CanvasTexture(canvas)

  ctx.fillStyle = "#5c4028"
  ctx.fillRect(0, 0, size, size)

  for (let i = 0; i < 7000; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const r = Math.random() * 2.2 + 0.6
    ctx.fillStyle = Math.random() > 0.5 ? "rgba(116, 84, 52, 0.4)" : "rgba(48, 31, 18, 0.45)"
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/**
 * Membuat tekstur plakat arah mata angin (U, T, S, B)
 */
export function createCompassPlaqueTexture(letter: string, sublabel: string): THREE.CanvasTexture {
  if (typeof document === "undefined") {
    return new THREE.CanvasTexture({} as HTMLCanvasElement)
  }
  const canvas = document.createElement("canvas")
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext("2d")
  if (!ctx) return new THREE.CanvasTexture(canvas)

  ctx.fillStyle = "#e2e8f0"
  ctx.fillRect(0, 0, 256, 256)

  ctx.strokeStyle = "#475569"
  ctx.lineWidth = 14
  ctx.strokeRect(12, 12, 232, 232)

  ctx.fillStyle = letter === "U" ? "#dc2626" : "#0f172a"
  ctx.font = "bold 132px Inter, sans-serif"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(letter, 128, 114)

  ctx.fillStyle = "#475569"
  ctx.font = "bold 30px Inter, sans-serif"
  ctx.fillText(sublabel, 128, 206)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/**
 * Membuat tekstur sel surya biru gelap bergaris perak
 */
export function createSolarPanelTexture(): THREE.CanvasTexture {
  if (typeof document === "undefined") {
    return new THREE.CanvasTexture({} as HTMLCanvasElement)
  }
  const canvas = document.createElement("canvas")
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext("2d")
  if (!ctx) return new THREE.CanvasTexture(canvas)

  ctx.fillStyle = "#0f2557"
  ctx.fillRect(0, 0, 256, 256)

  ctx.strokeStyle = "rgba(186, 230, 253, 0.55)"
  ctx.lineWidth = 3
  for (let i = 1; i < 4; i++) {
    ctx.beginPath()
    ctx.moveTo((i * 256) / 4, 0)
    ctx.lineTo((i * 256) / 4, 256)
    ctx.stroke()
  }
  for (let j = 1; j < 6; j++) {
    ctx.beginPath()
    ctx.moveTo(0, (j * 256) / 6)
    ctx.lineTo(256, (j * 256) / 6)
    ctx.stroke()
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
