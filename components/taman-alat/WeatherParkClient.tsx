'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import {
  Wind,
  Thermometer,
  Layers,
  Compass,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Info,
} from 'lucide-react'
import Header from '@/components/Header'
import LoadingState from '@/components/graphics/LoadingState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useWeatherParkData } from '@/hooks/useWeatherParkData'
import { InstrumentId } from '@/lib/tamanAlatCatalog'
import {
  SimulationState,
  calculatePhysicsAnalytics,
  formatHourWIB,
  getWeatherConditionText,
  getShortCompass,
} from '@/lib/tamanAlatPhysics'
import ControlPanel from './ControlPanel'
import InstrumentDetailPanel from './InstrumentDetailPanel'

const WeatherParkCanvas = dynamic(() => import('./WeatherParkCanvas'), {
  ssr: false,
  loading: () => <LoadingState message="Memuat Simulasi 3D Taman Alat..." />,
})

const INITIAL_SIMULATION: SimulationState = {
  qualityKey: 'balanced',
  volumeKey: 'casella',
  legHeight: 1.5,
  louverTilt: 45,
  albedo: 0.82,
  doorOpen: false,
  xrayMode: false,
  showAirflow: false,
  hour: 14.0,
  tempAmbient: 29.5,
  rh: 72,
  windSpeed: 2.8,
  windDir: 90,
  rainIntensity: 0,
  cloudCover: 25,
  timelapse: false,
}

export default function WeatherParkClient() {
  const live = useWeatherParkData()
  const [mode, setMode] = useState<'live' | 'simulation'>('live')
  const [state, setState] = useState<SimulationState>(INITIAL_SIMULATION)
  const [activeCamPreset, setActiveCamPreset] = useState<string>('overview')
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentId | null>(null)

  // Simulation rain tipping statistics
  const [tipCount, setTipCount] = useState<number>(0)
  const [rainAccumMm, setRainAccumMm] = useState<number>(0)

  // When live data updates and mode === 'live', sync ambient weather parameters
  useEffect(() => {
    if (mode === 'live') {
      const now = new Date()
      const liveHour = now.getHours() + now.getMinutes() / 60
      setState((prev) => {
        const nextTemp = live.temperature
        const nextRh = live.humidity
        const nextWindSpeed = live.windSpeed
        const nextWindDir = live.windDirection
        const nextRain = live.rainRate
        const nextCloud = Math.max(0, Math.min(100, (1000 - live.solarRadiation) / 8))
        const nextHour = Math.min(19, Math.max(5, liveHour))

        if (
          prev.tempAmbient === nextTemp &&
          prev.rh === nextRh &&
          prev.windSpeed === nextWindSpeed &&
          prev.windDir === nextWindDir &&
          prev.rainIntensity === nextRain &&
          prev.cloudCover === nextCloud &&
          Math.abs(prev.hour - nextHour) < 0.05
        ) {
          return prev
        }

        return {
          ...prev,
          hour: nextHour,
          tempAmbient: nextTemp,
          rh: nextRh,
          windSpeed: nextWindSpeed,
          windDir: nextWindDir,
          rainIntensity: nextRain,
          cloudCover: nextCloud,
        }
      })
    }
  }, [
    mode,
    live.temperature,
    live.humidity,
    live.windSpeed,
    live.windDirection,
    live.rainRate,
    live.solarRadiation,
  ])

  const handleStateChange = useCallback((patch: Partial<SimulationState>) => {
    setState((prev) => ({ ...prev, ...patch }))
  }, [])

  const handleReset = useCallback(() => {
    setState(INITIAL_SIMULATION)
    setTipCount(0)
    setRainAccumMm(0)
    setActiveCamPreset('overview')
    setSelectedInstrument(null)
  }, [])

  const handleRainTip = useCallback(() => {
    setTipCount((c) => c + 1)
    setRainAccumMm((a) => a + 0.2)
  }, [])

  const handleHourTick = useCallback((newHour: number) => {
    setState((prev) => ({ ...prev, hour: newHour }))
  }, [])

  // Recalculate physics analytics
  const analytics = useMemo(() => {
    return calculatePhysicsAnalytics({
      volumeKey: state.volumeKey,
      louverTilt: state.louverTilt,
      albedo: state.albedo,
      doorOpen: state.doorOpen,
      hour: state.hour,
      tempAmbient: state.tempAmbient,
      windSpeed: state.windSpeed,
      rainIntensity: state.rainIntensity,
      cloudCover: state.cloudCover,
    })
  }, [
    state.volumeKey,
    state.louverTilt,
    state.albedo,
    state.doorOpen,
    state.hour,
    state.tempAmbient,
    state.windSpeed,
    state.rainIntensity,
    state.cloudCover,
  ])

  // Camera Presets
  const cameraPresets = [
    { key: 'overview', label: 'Overview Taman' },
    { key: 'stevenson', label: 'Sangkar Meteo' },
    { key: 'anemometer', label: 'Anemometer' },
    { key: 'raingauge', label: 'Penakar Hujan' },
    { key: 'pyranometer', label: 'Pyranometer' },
    { key: 'evappan', label: 'Panci Penguapan' },
  ]

  const handleSelectPreset = (key: string) => {
    setActiveCamPreset(key)
    if (key === 'overview') {
      setSelectedInstrument(null)
    } else {
      setSelectedInstrument(key as InstrumentId)
    }
  }

  // Header status indicator dot color
  const getDotColor = () => {
    if (state.rainIntensity > 0) return 'bg-blue-400 animate-pulse'
    if (state.cloudCover > 60) return 'bg-slate-300'
    if (state.hour < 6 || state.hour > 18) return 'bg-indigo-400'
    return 'bg-amber-300'
  }

  const condText = getWeatherConditionText(state.hour, state.rainIntensity, state.cloudCover)

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      <Header />

      <main className="relative flex-1 w-full h-[calc(100vh-4rem)] overflow-hidden">
        {/* 3D Canvas Layer */}
        <div className="absolute inset-0 z-0">
          <WeatherParkCanvas
            state={state}
            activeCamPreset={activeCamPreset}
            selectedInstrument={selectedInstrument}
            onSelectInstrument={setSelectedInstrument}
            onCamPresetChange={setActiveCamPreset}
            onTipRainGauge={handleRainTip}
            onHourTick={handleHourTick}
          />
        </div>

        {/* Top Header HUD */}
        <div className="pointer-events-none absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3">
          {/* Status Badge */}
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/85 px-4 py-2 shadow-xl backdrop-blur-md">
            <span className={`h-2 w-2 rounded-full ${getDotColor()}`} />
            <span className="text-xs font-semibold text-white">
              {formatHourWIB(state.hour)} • {condText}
            </span>
          </div>

          {/* Quick Badges: Wind & Temp */}
          <div className="pointer-events-auto flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-slate-700/60 bg-slate-900/85 px-3.5 py-1.5 text-xs font-medium text-slate-200 shadow-xl backdrop-blur-md">
              <Wind className="h-3.5 w-3.5 text-sky-400" />
              <span>
                Angin {state.windSpeed.toFixed(1)} m/s ({getShortCompass(state.windDir)})
              </span>
            </div>

            <div className="flex items-center gap-1.5 rounded-full border border-slate-700/60 bg-slate-900/85 px-3.5 py-1.5 text-xs font-medium text-slate-200 shadow-xl backdrop-blur-md">
              <Thermometer className="h-3.5 w-3.5 text-amber-400" />
              <span>{state.tempAmbient.toFixed(1)} °C</span>
            </div>

            <button
              onClick={() => setMode(mode === 'live' ? 'simulation' : 'live')}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition shadow-xl backdrop-blur-md ${
                mode === 'live'
                  ? 'border border-emerald-500/50 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                  : 'border border-sky-500/50 bg-sky-500/20 text-sky-300 hover:bg-sky-500/30'
              }`}
            >
              {mode === 'live' ? '● LIVE OBSERVASI' : '⚡ SIMULASI'}
            </button>
          </div>
        </div>

        {/* Floating Side Panels */}
        <div className="pointer-events-none absolute inset-x-4 top-20 bottom-20 z-20 flex justify-between items-start gap-4 overflow-hidden">
          {/* Left: Instrument Detail Modal */}
          <div className="max-h-full overflow-y-auto">
            {selectedInstrument && (
              <InstrumentDetailPanel
                instrumentId={selectedInstrument}
                onClose={() => setSelectedInstrument(null)}
                onFocusCamera={(preset) => handleSelectPreset(preset)}
                telemetry={{
                  tempAmbient: state.tempAmbient,
                  tempMeasured: analytics.tempMeasured,
                  rh: state.rh,
                  windSpeed: state.windSpeed,
                  windDir: state.windDir,
                  rainIntensity: state.rainIntensity,
                  solarRad: analytics.solarRad,
                  solarElevation: analytics.elevationDeg,
                  volumeKey: state.volumeKey,
                  louverTilt: state.louverTilt,
                  epsilonT: analytics.epsilonT,
                  tipCount,
                  rainAccumMm,
                }}
              />
            )}
          </div>

          {/* Right: Control Panel */}
          <div className="max-h-full overflow-y-auto">
            <ControlPanel
              mode={mode}
              onModeChange={setMode}
              state={state}
              analytics={analytics}
              onChange={handleStateChange}
              onReset={handleReset}
              liveSource={live.source}
            />
          </div>
        </div>

        {/* Bottom Camera Presets Navigation */}
        <div className="pointer-events-none absolute bottom-4 inset-x-0 z-20 flex justify-center px-4">
          <div className="pointer-events-auto flex max-w-full items-center gap-1.5 overflow-x-auto rounded-full border border-slate-700/60 bg-slate-900/85 p-1.5 shadow-2xl backdrop-blur-xl">
            {cameraPresets.map((preset) => {
              const active = activeCamPreset === preset.key
              return (
                <button
                  key={preset.key}
                  onClick={() => handleSelectPreset(preset.key)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'bg-sky-500 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
