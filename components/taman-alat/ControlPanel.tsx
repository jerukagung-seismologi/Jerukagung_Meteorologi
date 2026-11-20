'use client'

import React, { useState } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Sun,
  Activity,
  Layers,
  Wind,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Moon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  SimulationState,
  PhysicsAnalytics,
  VOLUME_PRESETS,
  formatHourWIB,
  getCompassLabel,
} from '@/lib/tamanAlatPhysics'

interface ControlPanelProps {
  mode: 'live' | 'simulation'
  onModeChange: (mode: 'live' | 'simulation') => void
  state: SimulationState
  analytics: PhysicsAnalytics
  onChange: (patch: Partial<SimulationState>) => void
  onReset: () => void
  liveSource?: string
}

export default function ControlPanel({
  mode,
  onModeChange,
  state,
  analytics,
  onChange,
  onReset,
  liveSource = 'sensor',
}: ControlPanelProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState<'sangkar' | 'cuaca' | 'fisika'>('sangkar')

  const cardinals = [
    { label: 'U', deg: 0 },
    { label: 'TL', deg: 45 },
    { label: 'T', deg: 90 },
    { label: 'TG', deg: 135 },
    { label: 'S', deg: 180 },
    { label: 'BD', deg: 225 },
    { label: 'B', deg: 270 },
    { label: 'BL', deg: 315 },
  ]

  const getShieldIcon = () => {
    if (analytics.shieldStatus === 'safe') return <ShieldCheck className="h-4 w-4 text-emerald-400" />
    if (analytics.shieldStatus === 'warn') return <AlertTriangle className="h-4 w-4 text-amber-400" />
    return <ShieldAlert className="h-4 w-4 text-rose-400" />
  }

  const getShieldBadgeClass = () => {
    if (analytics.shieldStatus === 'safe') return 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
    if (analytics.shieldStatus === 'warn') return 'bg-amber-950/60 border-amber-500/40 text-amber-300'
    return 'bg-rose-950/60 border-rose-500/40 text-rose-300'
  }

  return (
    <div className="pointer-events-auto flex flex-col w-full max-w-sm rounded-2xl border border-slate-700/60 bg-slate-900/90 shadow-2xl backdrop-blur-xl transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-sky-400" />
          <span className="text-sm font-bold text-white">Panel Eksperimen</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`text-[10px] font-semibold uppercase ${
              mode === 'live'
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                : 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
            }`}
          >
            {mode === 'live' ? `LIVE · ${liveSource}` : 'SIMULASI'}
          </Badge>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            aria-label={collapsed ? 'Buka panel kontrol' : 'Tutup panel kontrol'}
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="p-4 space-y-4">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-950/60 p-1 border border-slate-800">
            <button
              onClick={() => onModeChange('live')}
              className={`rounded-lg py-1.5 text-xs font-semibold transition ${
                mode === 'live'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Live Observasi
            </button>
            <button
              onClick={() => onModeChange('simulation')}
              className={`rounded-lg py-1.5 text-xs font-semibold transition ${
                mode === 'simulation'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Simulasi Interaktif
            </button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
            <TabsList className="grid grid-cols-3 bg-slate-950/60 p-1 rounded-xl border border-slate-800 text-xs">
              <TabsTrigger value="sangkar" className="data-[state=active]:bg-sky-500 data-[state=active]:text-white">
                <Layers className="h-3 w-3 mr-1" />
                Sangkar
              </TabsTrigger>
              <TabsTrigger value="cuaca" className="data-[state=active]:bg-sky-500 data-[state=active]:text-white">
                <Sun className="h-3 w-3 mr-1" />
                Cuaca
              </TabsTrigger>
              <TabsTrigger value="fisika" className="data-[state=active]:bg-sky-500 data-[state=active]:text-white">
                <Activity className="h-3 w-3 mr-1" />
                Fisika
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: SANGKAR */}
            <TabsContent value="sangkar" className="space-y-4 mt-3">
              {/* Preset Volume */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <Label className="text-slate-300 text-xs font-medium">Preset Volume Sangkar</Label>
                  <span className="font-mono text-sky-300 text-xs font-semibold">
                    {VOLUME_PRESETS[state.volumeKey]?.dm3 || 510} dm³
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {Object.values(VOLUME_PRESETS).map((p) => (
                    <button
                      key={p.key}
                      onClick={() => onChange({ volumeKey: p.key })}
                      className={`rounded-xl px-2 py-2 text-center text-[11px] font-medium transition ${
                        state.volumeKey === p.key
                          ? 'border border-sky-400/60 bg-sky-500/20 font-semibold text-sky-100 shadow'
                          : 'border border-slate-700/50 bg-slate-800/60 text-slate-300 hover:border-sky-400/50 hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tinggi Kaki */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <Label className="text-slate-300 text-xs">Tinggi Kaki Sangkar</Label>
                  <span className="font-mono text-sky-300">{state.legHeight.toFixed(2)} m</span>
                </div>
                <Slider
                  value={[state.legHeight]}
                  min={1.0}
                  max={2.0}
                  step={0.05}
                  onValueChange={([val]) => onChange({ legHeight: val })}
                />
              </div>

              {/* Sudut Louver */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <Label className="text-slate-300 text-xs">Sudut Kemiringan Louver</Label>
                  <span className="font-mono text-sky-300">{state.louverTilt}°</span>
                </div>
                <Slider
                  value={[state.louverTilt]}
                  min={25}
                  max={65}
                  step={1}
                  onValueChange={([val]) => onChange({ louverTilt: val })}
                />
              </div>

              {/* Albedo Cat */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <Label className="text-slate-300 text-xs">Albedo Cat Luar Sangkar</Label>
                  <span className="font-mono text-sky-300">{state.albedo.toFixed(2)}</span>
                </div>
                <Slider
                  value={[state.albedo]}
                  min={0.45}
                  max={0.85}
                  step={0.01}
                  onValueChange={([val]) => onChange({ albedo: val })}
                />
                <p className="text-[10px] text-slate-400">0.45 (kusam/lama) → 0.85 (putih baru)</p>
              </div>

              {/* Toggles */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800 text-xs">
                <div className="flex items-center justify-between">
                  <Label htmlFor="door-toggle" className="text-slate-300 text-xs cursor-pointer">
                    Buka Pintu Sangkar (Selatan)
                  </Label>
                  <Switch
                    id="door-toggle"
                    checked={state.doorOpen}
                    onCheckedChange={(val) => onChange({ doorOpen: val })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="xray-toggle" className="text-slate-300 text-xs cursor-pointer">
                    Mode X-Ray Transparan
                  </Label>
                  <Switch
                    id="xray-toggle"
                    checked={state.xrayMode}
                    onCheckedChange={(val) => onChange({ xrayMode: val })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="airflow-toggle" className="text-slate-300 text-xs cursor-pointer">
                    Visualisasi Aliran Udara
                  </Label>
                  <Switch
                    id="airflow-toggle"
                    checked={state.showAirflow}
                    onCheckedChange={(val) => onChange({ showAirflow: val })}
                  />
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: CUACA & SURYA */}
            <TabsContent value="cuaca" className="space-y-4 mt-3">
              {/* Timelapse & Hour */}
              <div className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-300 text-xs font-medium">Waktu & Posisi Surya</Label>
                    <p className="font-mono text-sky-300 text-xs font-bold mt-0.5">{formatHourWIB(state.hour)}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={state.timelapse ? 'default' : 'outline'}
                    className={`h-8 px-3 rounded-lg text-xs ${
                      state.timelapse ? 'bg-amber-500 text-slate-950 hover:bg-amber-400' : 'border-slate-700'
                    }`}
                    onClick={() => onChange({ timelapse: !state.timelapse })}
                  >
                    {state.timelapse ? <Pause className="h-3.5 w-3.5 mr-1" /> : <Play className="h-3.5 w-3.5 mr-1" />}
                    {state.timelapse ? 'Jeda' : 'Timelapse'}
                  </Button>
                </div>
                <Slider
                  value={[state.hour]}
                  min={5.0}
                  max={19.0}
                  step={0.1}
                  disabled={state.timelapse || mode === 'live'}
                  onValueChange={([val]) => onChange({ hour: val })}
                />
              </div>

              {/* Ambient Temp */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <Label className="text-slate-300 text-xs">Suhu Lingkungan (T_amb)</Label>
                  <span className="font-mono text-sky-300">{state.tempAmbient.toFixed(1)} °C</span>
                </div>
                <Slider
                  value={[state.tempAmbient]}
                  min={18}
                  max={40}
                  step={0.5}
                  disabled={mode === 'live'}
                  onValueChange={([val]) => onChange({ tempAmbient: val })}
                />
              </div>

              {/* RH */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <Label className="text-slate-300 text-xs">Kelembapan Relatif (RH)</Label>
                  <span className="font-mono text-sky-300">{Math.round(state.rh)}%</span>
                </div>
                <Slider
                  value={[state.rh]}
                  min={30}
                  max={100}
                  step={1}
                  disabled={mode === 'live'}
                  onValueChange={([val]) => onChange({ rh: val })}
                />
              </div>

              {/* Wind Speed */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <Label className="text-slate-300 text-xs">Kecepatan Angin</Label>
                  <span className="font-mono text-sky-300">{state.windSpeed.toFixed(1)} m/s</span>
                </div>
                <Slider
                  value={[state.windSpeed]}
                  min={0}
                  max={18}
                  step={0.2}
                  disabled={mode === 'live'}
                  onValueChange={([val]) => onChange({ windSpeed: val })}
                />
              </div>

              {/* Wind Direction */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <Label className="text-slate-300 text-xs">Arah Datang Angin</Label>
                  <span className="font-mono text-sky-300">
                    {Math.round(state.windDir)}° ({getCompassLabel(state.windDir)})
                  </span>
                </div>
                <Slider
                  value={[state.windDir]}
                  min={0}
                  max={360}
                  step={5}
                  disabled={mode === 'live'}
                  onValueChange={([val]) => onChange({ windDir: val })}
                />
                <div className="grid grid-cols-4 gap-1 pt-1">
                  {cardinals.map((c) => (
                    <button
                      key={c.label}
                      disabled={mode === 'live'}
                      onClick={() => onChange({ windDir: c.deg })}
                      className="rounded-lg border border-slate-700/60 bg-slate-800/40 py-1 text-[10px] font-semibold text-slate-300 hover:border-sky-400 hover:text-white transition disabled:opacity-50"
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rain Intensity */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <Label className="text-slate-300 text-xs">Intensitas Hujan</Label>
                  <span className="font-mono text-sky-300">{state.rainIntensity.toFixed(1)} mm/jam</span>
                </div>
                <Slider
                  value={[state.rainIntensity]}
                  min={0}
                  max={100}
                  step={1}
                  disabled={mode === 'live'}
                  onValueChange={([val]) => onChange({ rainIntensity: val })}
                />
              </div>

              {/* Cloud Cover */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <Label className="text-slate-300 text-xs">Tutupan Awan</Label>
                  <span className="font-mono text-sky-300">{Math.round(state.cloudCover)}%</span>
                </div>
                <Slider
                  value={[state.cloudCover]}
                  min={0}
                  max={100}
                  step={5}
                  disabled={mode === 'live'}
                  onValueChange={([val]) => onChange({ cloudCover: val })}
                />
              </div>
            </TabsContent>

            {/* TAB 3: ANALITIK FISIKA */}
            <TabsContent value="fisika" className="space-y-3.5 mt-3">
              {/* Telemetry Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
                  <span className="text-[10px] text-slate-400 block">Suhu Lingkungan (T_amb)</span>
                  <span className="font-bold text-white text-sm">{state.tempAmbient.toFixed(2)} °C</span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
                  <span className="text-[10px] text-slate-400 block">Suhu Sensor (T_sh)</span>
                  <span className="font-bold text-emerald-400 text-sm">{analytics.tempMeasured.toFixed(2)} °C</span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
                  <span className="text-[10px] text-slate-400 block">Error Radiasi (ε_T)</span>
                  <span className="font-bold text-amber-400 text-sm">+{analytics.epsilonT.toFixed(2)} °C</span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
                  <span className="text-[10px] text-slate-400 block">Waktu Respon (τ_sh)</span>
                  <span className="font-bold text-sky-400 text-sm">{analytics.tauSh} dtk</span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
                  <span className="text-[10px] text-slate-400 block">Radiasi Surya Global</span>
                  <span className="font-bold text-white text-sm">{Math.round(analytics.solarRad)} W/m²</span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
                  <span className="text-[10px] text-slate-400 block">Radiasi Terserap Sangkar</span>
                  <span className="font-bold text-slate-300 text-sm">{Math.round(analytics.absorbedRad)} W/m²</span>
                </div>
              </div>

              {/* Shadow Protection Assessment Card */}
              <div className={`rounded-xl border p-3 text-xs ${getShieldBadgeClass()}`}>
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  {getShieldIcon()}
                  <span>{analytics.shieldTitle}</span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">{analytics.shieldDesc}</p>
              </div>

              {/* Info formula */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-2.5 text-[10px] text-slate-400 leading-normal">
                Model: Keseimbangan energi semi-empiris WMO CIMO No. 8. Error radiasi dipengaruhi oleh albedo, luas
                penampang efektif sangkar, elevasi matahari, dan pendinginan konvektif angin.
              </div>
            </TabsContent>
          </Tabs>

          {/* Reset Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="w-full text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset Eksperimen
          </Button>
        </div>
      )}
    </div>
  )
}
