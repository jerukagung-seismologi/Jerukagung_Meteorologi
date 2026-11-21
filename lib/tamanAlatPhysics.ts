export type QualityKey = 'low' | 'balanced' | 'high'

export interface QualityPreset {
  key: QualityKey
  label: string
  maxDpr: number
  shadowSize: number
  grassCount: number
  iblMinDeltaDeg: number
  iblMinIntervalMs: number
  iblBlur: number
  iblDesc: string
}

export const QUALITY_PRESETS: Record<QualityKey, QualityPreset> = {
  low: {
    key: 'low',
    label: 'Ringan',
    maxDpr: 1.0,
    shadowSize: 512,
    grassCount: 1200,
    iblMinDeltaDeg: 5.0,
    iblMinIntervalMs: 700,
    iblBlur: 0.06,
    iblDesc: 'Hemat (Interval Lambat)',
  },
  balanced: {
    key: 'balanced',
    label: 'Seimbang',
    maxDpr: 1.5,
    shadowSize: 1024,
    grassCount: 4000,
    iblMinDeltaDeg: 2.2,
    iblMinIntervalMs: 280,
    iblBlur: 0.03,
    iblDesc: 'Aktif (Throttled)',
  },
  high: {
    key: 'high',
    label: 'Tinggi',
    maxDpr: 2.0,
    shadowSize: 2048,
    grassCount: 8500,
    iblMinDeltaDeg: 1.0,
    iblMinIntervalMs: 140,
    iblBlur: 0.012,
    iblDesc: 'Resolusi Penuh',
  },
}

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
    aSh: 6.2,
    width: 0.98,
    depth: 0.98,
    height: 1.04,
  },
}

export interface SimulationState {
  qualityKey: QualityKey

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

  // Atmosfer 24 Jam, Benda Langit & Navigasi
  moonPhase: number
  activeMood: 'morning' | 'noon' | 'sunset' | 'night' | 'storm' | 'custom'
  nightLampOverride: 'auto' | 'on' | 'off'
  navMode: 'orbit' | 'firstPerson'
}

export type MoodKey = 'morning' | 'noon' | 'sunset' | 'night' | 'storm'

export interface MoodPreset {
  key: MoodKey
  label: string
  icon: string
  hour: number
  tempAmbient: number
  rh: number
  windSpeed: number
  windDir: number
  rainIntensity: number
  cloudCover: number
  moonPhase: number
  desc: string
}

export const MOOD_PRESETS: Record<MoodKey, MoodPreset> = {
  morning: {
    key: 'morning',
    label: 'Pagi Tropis',
    icon: '🌅',
    hour: 6.5,
    tempAmbient: 24.5,
    rh: 88,
    windSpeed: 1.8,
    windDir: 60,
    rainIntensity: 0,
    cloudCover: 20,
    moonPhase: 0.25,
    desc: 'Embun pagi fajar, matahari terbit rendah, angin sejuk tenang.',
  },
  noon: {
    key: 'noon',
    label: 'Siang Terik',
    icon: '☀️',
    hour: 12.0,
    tempAmbient: 33.5,
    rh: 58,
    windSpeed: 3.5,
    windDir: 120,
    rainIntensity: 0,
    cloudCover: 15,
    moonPhase: 0.38,
    desc: 'Radiasi surya puncak, langit biru cerah, bayangan tajam.',
  },
  sunset: {
    key: 'sunset',
    label: 'Senja Emas',
    icon: '🌇',
    hour: 17.75,
    tempAmbient: 28.0,
    rh: 75,
    windSpeed: 2.2,
    windDir: 240,
    rainIntensity: 0,
    cloudCover: 35,
    moonPhase: 0.50,
    desc: 'Semburat jingga keemasan di ufuk barat, lampu stasiun mulai menyala.',
  },
  night: {
    key: 'night',
    label: 'Malam Bintang',
    icon: '🌌',
    hour: 21.5,
    tempAmbient: 25.0,
    rh: 85,
    windSpeed: 1.5,
    windDir: 310,
    rainIntensity: 0,
    cloudCover: 10,
    moonPhase: 0.85,
    desc: 'Langit malam bertabur ribuan bintang berkerlip dan bulan terang.',
  },
  storm: {
    key: 'storm',
    label: 'Badai Petir',
    icon: '⛈️',
    hour: 15.0,
    tempAmbient: 26.5,
    rh: 94,
    windSpeed: 8.5,
    windDir: 280,
    rainIntensity: 65,
    cloudCover: 90,
    moonPhase: 0.40,
    desc: 'Awan konvektif gelap tebal, hujan lebat bertiup kencang, dan kilatan petir.',
  },
}

export interface SoilTemperatures {
  t0: number
  t5: number
  t10: number
  t20: number
  t50: number
  inversionActive: boolean
}

export interface PsychrometricData {
  tempDry: number
  tempWet: number
  depression: number
  vaporPressureActual: number
  vaporPressureSat: number
  dewPoint: number
}

export interface CampbellStokesState {
  dni: number
  isBurning: boolean
  burnFraction: number
  thresholdWMO: number
}

export interface PanWaterState {
  evapRateMmPerDay: number
  netWaterChangeMmPerHour: number
  waveAmplitude: number
  waterTemp: number
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
  soil: SoilTemperatures
  psychrometric: PsychrometricData
  campbell: CampbellStokesState
  pan: PanWaterState
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

/**
 * 1. Model Difusi Termal Suhu Tanah 1-Dimensi (arXiv:2405.15284)
 * Solusi analitik persamaan konduksi panas dengan redaman eksponensial dan pergeseran fase (phase lag).
 */
export function calculateSoilTemperatureProfiles(
  hour: number,
  tempAmbient: number,
  tMean = 27.2,
  a0 = 8.2,
  dampingDepth = 0.14,
  tPeak = 13.0
): SoilTemperatures {
  const omega = (2 * Math.PI) / 24.0

  const getT = (z: number) => {
    const decay = Math.exp(-z / dampingDepth)
    const lag = z / dampingDepth
    return tMean + a0 * decay * Math.cos(omega * (hour - tPeak) - lag)
  }

  const t0 = Math.round(getT(0.0) * 10) / 10
  const t5 = Math.round(getT(0.05) * 10) / 10
  const t10 = Math.round(getT(0.10) * 10) / 10
  const t20 = Math.round(getT(0.20) * 10) / 10
  const t50 = Math.round(getT(0.50) * 10) / 10

  // Inversi suhu malam hari terjadi saat tanah dalam (50 cm) lebih hangat dari permukaan (0/5 cm)
  const inversionActive = t50 > t5

  return { t0, t5, t10, t20, t50, inversionActive }
}

/**
 * 2. Termodinamika Psikrometer August-Roche-Magnus (BMKG Standard)
 * Menghitung tekanan uap jenuh, tekanan uap aktual, titik embun, dan suhu bola basah (Tw).
 */
export function calculatePsychrometrics(
  tempDry: number,
  rh: number,
  pressureHpa = 1013.25
): PsychrometricData {
  const satVp = (t: number) => 6.112 * Math.exp((17.67 * t) / (t + 243.5))

  const es = satVp(tempDry)
  const e = (clamp(rh, 1, 100) / 100.0) * es

  // Titik embun (Dew Point, Td)
  const alpha = Math.log(e / 6.112)
  const dewPoint = (243.5 * alpha) / (17.67 - alpha)

  // Inversi numerik Newton-Raphson untuk suhu bola basah (Tw)
  const A = 0.000662 // Konstanta psikrometer ventilasi alami
  let tw = tempDry
  for (let i = 0; i < 20; i++) {
    const f = satVp(tw) - A * pressureHpa * (tempDry - tw) - e
    const df = satVp(tw) * ((17.67 * 243.5) / Math.pow(tw + 243.5, 2)) + A * pressureHpa
    const nextTw = tw - f / df
    if (Math.abs(nextTw - tw) < 0.01) {
      tw = nextTw
      break
    }
    tw = nextTw
  }

  const tempWet = Math.round(tw * 10) / 10
  const depression = Math.round((tempDry - tempWet) * 10) / 10

  return {
    tempDry,
    tempWet,
    depression,
    vaporPressureActual: Math.round(e * 100) / 100,
    vaporPressureSat: Math.round(es * 100) / 100,
    dewPoint: Math.round(dewPoint * 10) / 10,
  }
}

/**
 * 3. Kinetika Jejak Bakar Campbell-Stokes & Ambang Batas WMO 120 W/m²
 */
export function calculateCampbellStokesDNI(
  hour: number,
  solarRad: number,
  cloudCover: number,
  solarElevationDeg: number
): CampbellStokesState {
  const thresholdWMO = 120 // W/m²
  const sinElev = Math.sin(degToRad(Math.max(2, solarElevationDeg)))
  const dni = solarElevationDeg > 2 ? Math.round(solarRad / Math.max(0.12, sinElev)) : 0

  const isBurning =
    dni >= thresholdWMO &&
    solarElevationDeg >= 3.0 &&
    cloudCover < 80 &&
    hour >= 6.0 &&
    hour <= 18.0

  // Fraksi posisi lintasan matahari harian dari Timur (0) ke Barat (1)
  const burnFraction = clamp((hour - 6.0) / 12.0, 0, 1)

  return { dni, isBurning, burnFraction, thresholdWMO }
}

/**
 * 4. Fisika Panci Penguapan Kelas A (Dalton Aerodinamis & Neraca Air P - E)
 */
export function calculatePanWaterBalance(
  rainIntensity: number,
  windSpeed: number,
  solarRad: number,
  rh: number,
  tempAmbient: number
): PanWaterState {
  // Inersia termal air: suhu air panci sedikit berbeda dari suhu udara
  const waterTemp = Math.round((tempAmbient - 0.8 + (solarRad / 1000) * 1.4) * 10) / 10

  const esWater = 6.112 * Math.exp((17.67 * waterTemp) / (waterTemp + 243.5))
  const eaAir = (clamp(rh, 1, 100) / 100.0) * (6.112 * Math.exp((17.67 * tempAmbient) / (tempAmbient + 243.5)))
  const vpd = Math.max(0, esWater - eaAir)

  // Penguapan harian menurut rumus Dalton (mm/hari)
  const u05 = windSpeed * 0.72 // Estimasi angin di ketinggian panci (0.5 m)
  const evapRateMmPerDay = Math.max(0.2, (0.24 + 0.16 * u05) * vpd * (0.85 + (solarRad / 1000) * 0.4))

  // Neraca air per jam: Hujan menambah (+ mm/jam), evaporasi mengurangi (- mm/jam)
  const evapMmPerHour = evapRateMmPerDay / 24.0
  const netWaterChangeMmPerHour = Math.round((rainIntensity - evapMmPerHour) * 100) / 100

  // Amplitudo gelombang kapiler akibat terpaan angin
  const waveAmplitude = clamp(0.0015 + windSpeed * 0.0022, 0.0015, 0.024)

  return {
    evapRateMmPerDay: Math.round(evapRateMmPerDay * 10) / 10,
    netWaterChangeMmPerHour,
    waveAmplitude,
    waterTemp,
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
  rh?: number
}): PhysicsAnalytics {
  const currentRh = state.rh ?? 72
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
  const Cv = 1200 // J/(m^3 K)
  const sensorThermalMass = 45 // J/K
  const uEff = Math.max(0.16, 0.26 * state.windSpeed + 0.14)
  const zeta1 = (preset.aSec * Cv) / (sensorThermalMass + preset.vSh * Cv)
  const tauSh = Math.round((1 / (zeta1 * uEff)) * 42)

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

  // 6. Fisika Turunan Tambahan
  const soil = calculateSoilTemperatureProfiles(state.hour, state.tempAmbient)
  const psychrometric = calculatePsychrometrics(state.tempAmbient, currentRh)
  const campbell = calculateCampbellStokesDNI(state.hour, solarRad, state.cloudCover, elevDeg)
  const pan = calculatePanWaterBalance(state.rainIntensity, state.windSpeed, solarRad, currentRh, state.tempAmbient)

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
    soil,
    psychrometric,
    campbell,
    pan,
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
