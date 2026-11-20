"use client"

import { useEffect, useState, useMemo } from "react"
import { fetchAstronomicalData, type AstronomicalDataType } from "@/lib/FetchingAstronomical"
import { fetchCurrentWeather, JERUKAGUNG_LOCATION } from "@/lib/FetchingMeteo"
import { useWeatherData } from "@/lib/FetchingSensorData"

export interface WeatherParkLiveData {
  temperature: number
  humidity: number
  pressure: number
  windSpeed: number
  windDirection: number
  rainRate: number
  solarRadiation: number
  astronomical: AstronomicalDataType | null
  updatedAt: Date | null
  source: "sensor" | "open-meteo" | "fallback"
  loading: boolean
  error: string | null
}

const FALLBACK = { temperature: 29, humidity: 72, pressure: 1010, windSpeed: 2.5, windDirection: 90, rainRate: 0, solarRadiation: 650 }

export function useWeatherParkData(sensorId = "id-03"): WeatherParkLiveData {
  const sensor = useWeatherData(sensorId, 1)
  const [meteo, setMeteo] = useState<Awaited<ReturnType<typeof fetchCurrentWeather>>>(null)
  const [astronomical, setAstronomical] = useState<AstronomicalDataType | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([fetchCurrentWeather(JERUKAGUNG_LOCATION), fetchAstronomicalData(JERUKAGUNG_LOCATION.latitude, JERUKAGUNG_LOCATION.longitude)])
      .then(([current, astronomy]) => { if (active) { setMeteo(current); setAstronomical(astronomy) } })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Sumber cuaca tidak tersedia") })
    return () => { active = false }
  }, [])

  const index = sensor.data.temperatures.length - 1
  const hasSensor = index >= 0
  const temperature = hasSensor ? sensor.data.temperatures[index] : meteo?.temperature_2m ?? FALLBACK.temperature
  const humidity = hasSensor ? sensor.data.humidity[index] : meteo?.relative_humidity_2m ?? FALLBACK.humidity
  const pressure = hasSensor ? sensor.data.pressure[index] : meteo?.surface_pressure ?? FALLBACK.pressure
  const windSpeed = hasSensor ? sensor.data.windspeed[index] / 3.6 : (meteo?.wind_speed_10m ?? FALLBACK.windSpeed * 3.6) / 3.6
  const windDirection = hasSensor ? sensor.data.windir[index] : meteo?.wind_direction_10m ?? FALLBACK.windDirection
  const rainRate = hasSensor ? sensor.data.rainrate[index] : meteo?.precipitation ?? FALLBACK.rainRate
  const solarRadiation = hasSensor ? sensor.data.sunlight[index] : Math.max(0, 1000 - (meteo?.cloud_cover ?? 35) * 8)

  return useMemo<WeatherParkLiveData>(() => ({
    temperature,
    humidity,
    pressure,
    windSpeed,
    windDirection,
    rainRate,
    solarRadiation,
    astronomical,
    updatedAt: hasSensor ? new Date() : meteo?.time ? new Date(meteo.time) : null,
    source: hasSensor ? "sensor" : meteo ? "open-meteo" : "fallback",
    loading: sensor.loading || (!meteo && !error),
    error: sensor.error?.message ?? error,
  }), [
    temperature,
    humidity,
    pressure,
    windSpeed,
    windDirection,
    rainRate,
    solarRadiation,
    astronomical,
    hasSensor,
    meteo,
    sensor.loading,
    sensor.error?.message,
    error,
  ])
}