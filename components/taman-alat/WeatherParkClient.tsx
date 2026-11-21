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
  Gamepad2,
  Eye,
} from 'lucide-react'
import Header from '@/components/Header'
import LoadingState from '@/components/graphics/LoadingState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useWeatherParkData } from '@/hooks/useWeatherParkData'
import { InstrumentId } from '@/lib/tamanAlatCatalog'
import { InstrumentProximityInfo, SurfaceInfo } from './FirstPersonController'
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
  moonPhase: 0.38,
  activeMood: 'noon',
  nightLampOverride: 'auto',
  navMode: 'orbit',
}

export default function WeatherParkClient() {
  const live = useWeatherParkData()
  const [mode, setMode] = useState<'live' | 'simulation'>('live')
  const [state, setState] = useState<SimulationState>(INITIAL_SIMULATION)
  const [activeCamPreset, setActiveCamPreset] = useState<string>('overview')
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentId | null>(null)
  const [proximityInfo, setProximityInfo] = useState<InstrumentProximityInfo | null>(null)
  const [surfaceInfo, setSurfaceInfo] = useState<SurfaceInfo | null>(null)

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
  const cameraViews = [
    { key: 'overview', label: 'Overview' },
    { key: 'top', label: 'Denah (Atas)' },
    { key: 'iso', label: 'Isometrik' },
    { key: 'front', label: 'Depan' },
    { key: 'side', label: 'Samping' },
  ]

  const instrumentPresets: { key: InstrumentId; label: string }[] = [
    { key: 'stevenson', label: 'Sangkar' },
    { key: 'anemometer', label: 'Anemometer' },
    { key: 'raingauge', label: 'Penakar Hujan' },
    { key: 'pyranometer', label: 'Pyranometer' },
    { key: 'evappan', label: 'Panci Penguapan' },
    { key: 'campbell', label: 'Campbell–Stokes' },
    { key: 'barometer', label: 'Barometer Digital' },
  ]

  const handleSelectPreset = (key: string) => {
    setActiveCamPreset(key)
    if (['overview', 'top', 'iso', 'front', 'side'].includes(key)) {
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
            onProximityChange={setProximityInfo}
            onSurfaceChange={setSurfaceInfo}
          />
        </div>

        {/* First-Person Surface & Conservation Status (WMO-No. 8) */}
        {state.navMode === 'firstPerson' && surfaceInfo && (
          <div className="pointer-events-none absolute top-14 left-1/2 -translate-x-1/2 z-20 transition-all duration-300">
            <div
              className={`flex items-center gap-2 rounded-full px-3.5 py-1 text-[11px] font-semibold shadow-xl backdrop-blur-md border ${
                surfaceInfo.isOnWalkway
                  ? 'border-emerald-500/50 bg-emerald-950/85 text-emerald-300'
                  : 'border-rose-500/60 bg-rose-950/90 text-rose-200 animate-pulse'
              }`}
            >
              <span>{surfaceInfo.isOnWalkway ? '🟢 Jalur Setapak WMO (SOP Sah)' : '⚠️ Menginjak Rumput Konservasi (Dilarang WMO)'}</span>
            </div>
          </div>
        )}

        {/* First-Person Center Crosshair */}
        {state.navMode === 'firstPerson' && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <div className="h-1.5 w-1.5 rounded-full border border-white/70 bg-white/50 shadow-sm" />
          </div>
        )}

        {/* Proximity Interaction Banner [E] */}
        {proximityInfo && state.navMode === 'firstPerson' && (
          <div className="pointer-events-auto absolute top-20 left-1/2 -translate-x-1/2 z-30 animate-bounce">
            <button
              onClick={() => setSelectedInstrument(proximityInfo.instrumentId)}
              className="flex items-center gap-2 rounded-2xl border border-amber-400/80 bg-slate-950/95 px-4 py-2 text-xs font-bold text-amber-200 shadow-2xl backdrop-blur-xl hover:bg-slate-900 transition"
            >
              <span className="rounded-lg bg-amber-500/30 px-1.5 py-0.5 font-mono text-[10px] text-amber-300 border border-amber-400/40">
                [E]
              </span>
              <span>Periksa {proximityInfo.name}</span>
            </button>
          </div>
        )}

        {/* Top Header HUD */}
        <div className="pointer-events-none absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3">
          {/* Status Badge */}
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/85 px-4 py-2 shadow-xl backdrop-blur-md">
            <span className={`h-2 w-2 rounded-full ${getDotColor()}`} />
            <span className="text-xs font-semibold text-white">
              {formatHourWIB(state.hour)} • {condText}
            </span>
          </div>

          {/* Quick Badges: Nav Mode, Wind & Temp */}
          <div className="pointer-events-auto flex items-center gap-2">
            {/* Nav Mode Toggle: Orbit vs First-Person WASD */}
            <button
              onClick={() => {
                const nextMode = state.navMode === 'firstPerson' ? 'orbit' : 'firstPerson'
                handleStateChange({ navMode: nextMode })
              }}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition shadow-xl backdrop-blur-md ${
                state.navMode === 'firstPerson'
                  ? 'border border-amber-400/80 bg-amber-500/25 text-amber-200 shadow-amber-500/20'
                  : 'border border-slate-700/60 bg-slate-900/85 text-slate-300 hover:border-sky-400/50 hover:text-white'
              }`}
            >
              <Gamepad2 className="h-3.5 w-3.5" />
              <span>{state.navMode === 'firstPerson' ? 'JELAJAH WASD' : 'ORBIT DRONE'}</span>
            </button>

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

        {/* First-Person Navigation Helper Guide */}
        {state.navMode === 'firstPerson' && (
          <div className="pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2 z-20 hidden sm:flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-950/85 px-4 py-1.5 text-[11px] text-slate-300 shadow-2xl backdrop-blur-md">
            <span className="font-semibold text-amber-300">[W][A][S][D]</span>
            <span>Jalan</span>
            <span>•</span>
            <span className="font-semibold text-amber-300">[Shift]</span>
            <span>Lari</span>
            <span>•</span>
            <span>Geser Mouse Menoleh</span>
            <span>•</span>
            <span>Klik Kanvas Kunci Kursor</span>
          </div>
        )}

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
                  pressure: live.pressure,
                  sunshineDuration: live.solarRadiation > 120 ? 6.8 : 3.5,
                  soil: analytics.soil,
                  psychrometric: analytics.psychrometric,
                  campbell: analytics.campbell,
                  pan: analytics.pan,
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
          <div className="pointer-events-auto flex max-w-full items-center gap-1.5 overflow-x-auto rounded-full border border-slate-700/60 bg-slate-900/90 p-1.5 shadow-2xl backdrop-blur-xl">
            {/* View Presets */}
            <div className="flex items-center gap-1">
              {cameraViews.map((preset) => {
                const active = activeCamPreset === preset.key
                return (
                  <button
                    key={preset.key}
                    onClick={() => handleSelectPreset(preset.key)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
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

            {/* Separator Divider */}
            <div className="h-4 w-px bg-slate-700/80 mx-1 shrink-0" />

            {/* Instrument Presets */}
            <div className="flex items-center gap-1">
              {instrumentPresets.map((preset) => {
                const active = activeCamPreset === preset.key || selectedInstrument === preset.key
                return (
                  <button
                    key={preset.key}
                    onClick={() => handleSelectPreset(preset.key)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      active
                        ? 'bg-amber-500 text-white shadow-md'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
