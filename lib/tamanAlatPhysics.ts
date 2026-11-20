export interface VolumePreset {
  key: string
  label: string
  dm3: number
  vSh: number
  aSec: number
  aSh: number
  width: number
  depth: number
  height: number
}

export const VOLUME_PRESETS: Record<string, VolumePreset> = {
  small: {
    key: 'small',
    label: 'Kecil (LBOM)',
    dm3: 180,
    vSh: 0.18,
    aSec: 0.36,
    aSh: 2.0,
    width: 0.56,
    depth: 0.56,
    height: 0.58,
  },
  casella: {
    key: 'casella',
    label: 'Standar Casella (LCAS)',
    dm3: 510,
    vSh: 0.51,
    aSec: 0.64,
    aSh: 3.8,
    width: 0.78,
    depth: 0.78,
    height: 0.84,
  },
  large: {
    key: 'large',
    label: 'Besar (LSOC)',
    dm3: 1000,
    vSh: 1.0,
    aSec: 1.0,
    aSh: 6.0,
    width: 0.98,
    depth: 0.98,
    height: 1.05,
  },
}

export interface SimulationState {
  // Stevenson Screen Parameters
  volumeKey: string
  legHeight: number
  louverTilt: number
  albedo: number
  doorOpen: boolean
  xrayMode: boolean
  showAirflow: boolean

  // Weather & Sun Parameters
  hour: number
  tempAmbient: number
  rh: number
  windSpeed: number
  windDir: number
  rainIntensity: number
  cloudCover: number
  timelapse: boolean
}

export interface PhysicsAnalytics {
  elevationDeg: number
  zenithDeg: number
  solarRad: number
  absorbedRad: number
  epsilonT: number
  tempMeasured: number
  tauSh: number
  shieldStatus: 'safe' | 'warn' | 'danger'
  shieldTitle: string
  shieldDesc: string
}

export function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val))
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI
}

export function formatHourWIB(hour: number): string {
  const hrs = Math.floor(hour)
  const mins = Math.round((hour - hrs) * 60)
  const hh = mins === 60 ? hrs + 1 : hrs
  const mm = mins === 60 ? 0 : mins
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')} WIB`
}

export function getCompassLabel(deg: number): string {
  const norm = ((deg % 360) + 360) % 360
  if (norm >= 337.5 || norm < 22.5) return 'U (Utara)'
  if (norm < 67.5) return 'TL (Timur Laut)'
  if (norm < 112.5) return 'T (Timur)'
  if (norm < 157.5) return 'TG (Tenggara)'
  if (norm < 202.5) return 'S (Selatan)'
  if (norm < 247.5) return 'BD (Barat Daya)'
  if (norm < 292.5) return 'B (Barat)'
  return 'BL (Barat Laut)'
}

export function getShortCompass(deg: number): string {
  const norm = ((deg % 360) + 360) % 360
  if (norm >= 337.5 || norm < 22.5) return 'U'
  if (norm < 67.5) return 'TL'
  if (norm < 112.5) return 'T'
  if (norm < 157.5) return 'TG'
  if (norm < 202.5) return 'S'
  if (norm < 247.5) return 'BD'
  if (norm < 292.5) return 'B'
  return 'BL'
}

export function calculateSunPosition(
  hour: number,
  latitude = -7.67,
  declination = 8.0
): { elevDeg: number; zenithDeg: number; sx: number; sy: number; sz: number; dayFactor: number; sunHeightFactor: number } {
  const latRad = degToRad(latitude)
  const decRad = degToRad(declination)
  const hourAngleRad = degToRad((hour - 12.0) * 15.0)

  const sinElev = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(hourAngleRad)
  const elevRad = Math.asin(clamp(sinElev, -1, 1))
  const elevDeg = radToDeg(elevRad)

  const cosElev = Math.max(0.001, Math.cos(elevRad))
  const sinAz = (-Math.cos(decRad) * Math.sin(hourAngleRad)) / cosElev
  const cosAz = (Math.sin(decRad) - Math.sin(latRad) * sinElev) / (Math.cos(latRad) * cosElev)

  const dist = 28
  const sx = dist * cosElev * sinAz
  const sy = dist * sinElev
  const sz = -dist * cosElev * cosAz

  const dayFactor = clamp((elevDeg + 4) / 28, 0, 1)
  const sunHeightFactor = clamp(elevDeg / 50, 0, 1)

  return {
    elevDeg,
    zenithDeg: Math.max(0, 90 - elevDeg),
    sx,
    sy,
    sz,
    dayFactor,
    sunHeightFactor,
  }
}

export function calculatePhysicsAnalytics(state: {
  volumeKey: string
  louverTilt: number
  albedo: number
  doorOpen: boolean
  hour: number
  tempAmbient: number
  windSpeed: number
  rainIntensity: number
  cloudCover: number
}): PhysicsAnalytics {
  const preset = VOLUME_PRESETS[state.volumeKey] || VOLUME_PRESETS.casella
  const sun = calculateSunPosition(state.hour)
  const elevDeg = sun.elevDeg
  const zenithDeg = sun.zenithDeg
  const elevRad = degToRad(Math.max(0, elevDeg))

  // 1. Radiasi surya global aktual (W/m²)
  const cloudFrac = state.cloudCover / 100
  const rainAtten = 1 - Math.min(0.45, state.rainIntensity * 0.006)
  let solarRad = 0
  if (elevDeg > 0) {
    const clearSkyRad = 1080 * Math.pow(Math.sin(elevRad), 1.15)
    const cloudFactor = 1 - 0.74 * Math.pow(cloudFrac, 1.35)
    solarRad = Math.max(0, clearSkyRad * cloudFactor * rainAtten)
  }

  // 2. Radiasi terserap permukaan sangkar = (1 - albedo) * Rad
  const absorbedRad = (1 - state.albedo) * solarRad

  // 3. Kecepatan angin efektif di dalam sangkar & Response Time (tau_sh)
  // Persamaan keseimbangan energi: zeta_1 = (A_sec * C_v) / (m_sen*C_sen + V_sh*C_v)
  const Cv = 1200 // J/(m^3 K)
  const sensorThermalMass = 45 // J/K
  const uEff = Math.max(0.16, 0.26 * state.windSpeed + 0.14)
  const zeta1 = (preset.aSec * Cv) / (sensorThermalMass + preset.vSh * Cv)
  const tauSh = Math.round((1 / (zeta1 * uEff)) * 42) // skala detik (~20–280 dtk)

  // 4. Evaluasi Proteksi Bayangan & Kebocoran Sinar Langsung
  let leakRad = 0
  let shieldStatus: 'safe' | 'warn' | 'danger' = 'safe'
  let shieldTitle = 'Aman — Sinar Langsung Terblokir'
  let shieldDesc = `Sudut kisi-kisi ${state.louverTilt}° efektif memblokir radiasi langsung pada elevasi ${elevDeg.toFixed(1)}°.`

  if (elevDeg <= 2) {
    shieldTitle = 'Malam / Senja — Tanpa Radiasi Langsung'
    shieldDesc = 'Elevasi matahari sangat rendah; radiasi surya hampir nol dan error radiasi minimal.'
  } else if (state.doorOpen) {
    shieldStatus = 'danger'
    shieldTitle = 'Peringatan — Pintu Sangkar Terbuka'
    shieldDesc = 'Pintu terbuka memungkinkan radiasi difus/pantulan tanah masuk langsung ke ruang sensor.'
    leakRad = 0.24 * solarRad
  } else if (state.louverTilt < 34 && elevDeg < 62) {
    shieldStatus = 'danger'
    shieldTitle = 'Risiko Paparan — Perbesar Sudut Kisi-Kisi'
    shieldDesc = `Sudut kisi-kisi ${state.louverTilt}° terlalu datar terhadap elevasi ${elevDeg.toFixed(1)}°, sinar miring berisiko menembus celah.`
    leakRad = 0.18 * solarRad * ((36 - state.louverTilt) / 11)
  } else if (state.louverTilt < 42 && elevDeg < 58) {
    shieldStatus = 'warn'
    shieldTitle = 'Proteksi Parsial — Optimal ≥ 45°'
    shieldDesc = `Sebagian pantulan radiasi masih bisa masuk pada sudut ${state.louverTilt}°. Naikkan ke 45°–55° untuk blokir optimal.`
    leakRad = 0.065 * solarRad * ((43 - state.louverTilt) / 10)
  }

  // 5. Estimasi Error Pemanasan Radiasi (epsilon_T, °C)
  const geomRatio = preset.aSh / preset.aSec
  const zenithFactor = 0.65 + 0.35 * Math.cos(degToRad(Math.min(85, zenithDeg)))
  const windCooling = Math.pow(state.windSpeed + 0.55, 0.72)
  const rainCooling = 1 - Math.min(0.45, state.rainIntensity * 0.012)

  const rawEpsilon = ((absorbedRad * 0.00145 * (geomRatio / 5.9) * zenithFactor) + (leakRad * 0.0042)) / windCooling
  const epsilonT = Math.max(0, rawEpsilon * rainCooling)

  return {
    elevationDeg: elevDeg,
    zenithDeg,
    solarRad,
    absorbedRad,
    epsilonT,
    tempMeasured: state.tempAmbient + epsilonT,
    tauSh,
    shieldStatus,
    shieldTitle,
    shieldDesc,
  }
}

export function getWeatherConditionText(hour: number, rainIntensity: number, cloudCover: number): string {
  if (hour < 5.7 || hour > 18.2) return rainIntensity > 0 ? 'Hujan Malam' : 'Malam/Senja'
  if (rainIntensity >= 50) return 'Hujan Lebat'
  if (rainIntensity >= 15) return 'Hujan Sedang'
  if (rainIntensity > 0) return 'Hujan Ringan'
  if (cloudCover >= 75) return 'Mendung'
  if (cloudCover >= 35) return 'Berawan'
  return 'Cerah'
}
