export interface WeatherParkValues {
  temperature: number
  humidity: number
  windSpeed: number
  windDirection: number
  rainRate: number
  solarRadiation: number
  hour: number
}

export interface ShelterAnalytics {
  radiationError: number
  responseTime: number
  shadowSafe: boolean
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function lerpAngle(current: number, target: number, amount: number): number {
  const delta = ((target - current + 540) % 360) - 180
  return current + delta * amount
}

export function getSunPosition(hour: number, latitude = -7.6936): { azimuth: number; elevation: number } {
  const daylight = clamp((hour - 5) / 13, 0, 1)
  const elevation = Math.sin(daylight * Math.PI) * (72 - Math.abs(latitude) * 0.35)
  const azimuth = 90 + daylight * 180
  return { azimuth, elevation: Math.max(-8, elevation) }
}

export function calculateShelterAnalytics(
  volumeDm3: number,
  louverTilt: number,
  albedo: number,
  windSpeed: number,
  solarRadiation: number,
  sunElevation: number
): ShelterAnalytics {
  const windProtection = 1 / (1 + windSpeed * 0.12)
  const surfaceFactor = clamp((1 - albedo) * 1.8, 0.1, 1)
  const openingFactor = clamp(Math.sin((louverTilt * Math.PI) / 180) * 0.85, 0.25, 0.85)
  const radiationError = clamp((solarRadiation / 1000) * surfaceFactor * openingFactor * windProtection * 2.4, 0, 4)
  const responseTime = clamp((volumeDm3 / 75) / (1 + windSpeed * 0.08) + 8, 8, 35)
  const shadowSafe = sunElevation < 25 || louverTilt >= sunElevation + 10
  return { radiationError, responseTime, shadowSafe }
}

export function formatHour(hour: number): string {
  const hours = Math.floor(hour)
  const minutes = Math.round((hour - hours) * 60)
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
}