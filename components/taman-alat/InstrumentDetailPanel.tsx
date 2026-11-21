'use client'

import React, { useState } from 'react'
import {
  X,
  Eye,
  ShieldCheck,
  Cpu,
  Info,
  BookOpen,
  Wrench,
  CheckCircle2,
  Activity,
  Layers,
} from 'lucide-react'
import { InstrumentId, INSTRUMENT_CATALOG } from '@/lib/tamanAlatCatalog'
import { VOLUME_PRESETS, getCompassLabel } from '@/lib/tamanAlatPhysics'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import {
  SoilTemperatures,
  PsychrometricData,
  CampbellStokesState,
  PanWaterState,
} from '@/lib/tamanAlatPhysics'

interface InstrumentDetailPanelProps {
  instrumentId: InstrumentId | null
  onClose: () => void
  onFocusCamera: (preset: string) => void
  telemetry: {
    tempAmbient: number
    tempMeasured: number
    rh: number
    windSpeed: number
    windDir: number
    rainIntensity: number
    solarRad: number
    solarElevation?: number
    volumeKey: string
    louverTilt: number
    epsilonT: number
    tipCount: number
    rainAccumMm: number
    pressure?: number
    sunshineDuration?: number
    soil?: SoilTemperatures
    psychrometric?: PsychrometricData
    campbell?: CampbellStokesState
    pan?: PanWaterState
  }
}

type TabType = 'metrics' | 'principle' | 'components' | 'operation'

export default function InstrumentDetailPanel({
  instrumentId,
  onClose,
  onFocusCamera,
  telemetry,
}: InstrumentDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('metrics')

  if (!instrumentId || !INSTRUMENT_CATALOG[instrumentId]) return null

  const info = INSTRUMENT_CATALOG[instrumentId]

  // Render metrics specific to the selected instrument
  let metricItems: { label: string; value: string }[] = []

  if (instrumentId === 'stevenson') {
    const preset = VOLUME_PRESETS[telemetry.volumeKey] || VOLUME_PRESETS.casella
    const psych = telemetry.psychrometric
    metricItems = [
      { label: 'Suhu Udara (Kering)', value: `${telemetry.tempMeasured.toFixed(2)} °C` },
      {
        label: 'Bola Basah (Tw)',
        value: psych ? `${psych.tempWet.toFixed(1)} °C (Depresi: ${psych.depression.toFixed(1)}°)` : `${(telemetry.tempMeasured - 2.8).toFixed(1)} °C`,
      },
      {
        label: 'Kelembapan / Titik Embun',
        value: psych ? `${Math.round(telemetry.rh)}% / ${psych.dewPoint.toFixed(1)} °C` : `${Math.round(telemetry.rh)}%`,
      },
      { label: 'Error Radiasi (ε_T)', value: `+${telemetry.epsilonT.toFixed(2)} °C` },
      { label: 'Volume / Louver', value: `${preset.dm3} dm³ / ${telemetry.louverTilt}°` },
      { label: 'Standar Tropis BMKG', value: 'Dua Pintu (Utara & Selatan)' },
    ]
  } else if (instrumentId === 'anemometer') {
    const rpm = Math.round(telemetry.windSpeed * 28.5)
    const knot = (telemetry.windSpeed * 1.94384).toFixed(1)
    metricItems = [
      { label: 'Kecepatan Angin', value: `${telemetry.windSpeed.toFixed(1)} m/s (${knot} kt)` },
      { label: 'Arah Datang', value: `${Math.round(telemetry.windDir)}° (${getCompassLabel(telemetry.windDir)})` },
      { label: 'Rotasi Mangkuk', value: `${rpm} RPM` },
      { label: 'Tinggi Tiang', value: '3.20 m (Agromet)' },
    ]
  } else if (instrumentId === 'raingauge') {
    metricItems = [
      { label: 'Intensitas Hujan', value: `${telemetry.rainIntensity.toFixed(1)} mm/jam` },
      { label: 'Tipping Bucket AWS', value: `${telemetry.tipCount} tip (${telemetry.rainAccumMm.toFixed(1)} mm)` },
      { label: 'Penakar Manual OBS', value: `${telemetry.rainAccumMm.toFixed(1)} mm (Gelas 100 cm²)` },
      { label: 'Status Mekanisme', value: telemetry.rainIntensity > 0 ? 'Aktif Berayun' : 'Siaga Pengamatan' },
    ]
  } else if (instrumentId === 'pyranometer') {
    const rad = Math.round(telemetry.solarRad)
    const elev = Math.max(0, telemetry.solarElevation ?? 0)
    const soil = telemetry.soil
    metricItems = [
      { label: 'Radiasi Surya Global', value: `${rad} W/m²` },
      { label: 'Elevasi Matahari', value: `${elev.toFixed(1)}°` },
      {
        label: 'Tanah 0 & 5 cm',
        value: soil ? `${soil.t0}° / ${soil.t5} °C` : `${(telemetry.tempAmbient + 2.5).toFixed(1)} °C`,
      },
      {
        label: 'Tanah 10 & 20 cm',
        value: soil ? `${soil.t10}° / ${soil.t20} °C` : `${telemetry.tempAmbient.toFixed(1)} °C`,
      },
      {
        label: 'Tanah Dalam 50 cm',
        value: soil ? `${soil.t50} °C ${soil.inversionActive ? '(Inversi Malam 🌙)' : ''}` : `${(telemetry.tempAmbient - 1.5).toFixed(1)} °C`,
      },
      { label: 'Model Difusi Termal', value: '1D Fourier (arXiv:2405.15284)' },
    ]
  } else if (instrumentId === 'evappan') {
    const pan = telemetry.pan
    metricItems = [
      {
        label: 'Laju Evaporasi (Dalton)',
        value: pan ? `${pan.evapRateMmPerDay} mm/hari` : '3.8 mm/hari',
      },
      {
        label: 'Neraca Air (dH = P - E)',
        value: pan ? `${pan.netWaterChangeMmPerHour > 0 ? '+' : ''}${pan.netWaterChangeMmPerHour} mm/jam` : '0 mm/jam',
      },
      {
        label: 'Suhu Air Panci',
        value: pan ? `${pan.waterTemp} °C` : `${(telemetry.tempAmbient - 0.5).toFixed(1)} °C`,
      },
      { label: 'Wind-Run 0.5 m', value: `${(telemetry.windSpeed * 0.72).toFixed(1)} m/s` },
      { label: 'Stilling Well & Hook', value: 'Mikrometer Vernier BMKG' },
    ]
  } else if (instrumentId === 'campbell') {
    const camp = telemetry.campbell
    metricItems = [
      {
        label: 'Radiasi Langsung (DNI)',
        value: camp ? `${camp.dni} W/m²` : `${Math.round(telemetry.solarRad)} W/m²`,
      },
      { label: 'Ambang Batas WMO', value: '≥ 120 W/m²' },
      {
        label: 'Status Pembakaran Pias',
        value: camp ? (camp.isBurning ? '🔥 Aktif Membakar Pias' : '⏸️ Di Bawah Ambang Batas') : 'Siaga',
      },
      { label: 'Jenis Kertas Pias', value: 'Pias Ekuinoks / Lengkung' },
      { label: 'Lintang Stasiun', value: '7.67° LS (Kebumen)' },
    ]
  } else if (instrumentId === 'barometer') {
    const qfe = telemetry.pressure ?? 1012.4
    const qnh = qfe + 1.4
    metricItems = [
      { label: 'Tekanan Stasiun (QFE)', value: `${qfe.toFixed(1)} hPa` },
      { label: 'Tekanan Laut (QNH)', value: `${qnh.toFixed(1)} hPa` },
      { label: 'Tendensi 3 Jam', value: '+0.2 hPa (Stabil)' },
      { label: 'Akurasi Sensor', value: '±0.1 hPa (WMO)' },
    ]
  }

  return (
    <div className="pointer-events-auto w-full max-w-sm rounded-2xl border border-sky-500/30 bg-slate-900/95 p-4 sm:p-5 text-slate-100 shadow-2xl backdrop-blur-xl transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge className="bg-sky-500/20 text-sky-300 border-sky-400/30 text-[10px] font-semibold tracking-wide uppercase">
            {info.category}
          </Badge>
          <h3 className="mt-1.5 text-base font-bold text-white leading-snug">{info.name}</h3>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          aria-label="Tutup detail instrumen"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Sensor Specification */}
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/50 px-3 py-2 text-xs text-sky-200">
        <Cpu className="h-4 w-4 shrink-0 text-sky-400" />
        <span className="truncate">{info.sensor}</span>
      </div>

      {/* Navigation Tabs */}
      <div className="mt-3 flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950/70 p-1 text-[11px] font-medium">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`flex-1 rounded-lg py-1 transition ${
            activeTab === 'metrics'
              ? 'bg-sky-500 text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Metrik
        </button>
        <button
          onClick={() => setActiveTab('principle')}
          className={`flex-1 rounded-lg py-1 transition ${
            activeTab === 'principle'
              ? 'bg-sky-500 text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Prinsip
        </button>
        <button
          onClick={() => setActiveTab('components')}
          className={`flex-1 rounded-lg py-1 transition ${
            activeTab === 'components'
              ? 'bg-sky-500 text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Komponen
        </button>
        <button
          onClick={() => setActiveTab('operation')}
          className={`flex-1 rounded-lg py-1 transition ${
            activeTab === 'operation'
              ? 'bg-sky-500 text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          SOP WMO
        </button>
      </div>

      {/* Tab 1: Live Metrik & Info Singkat */}
      {activeTab === 'metrics' && (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {metricItems.map((item, idx) => (
              <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
                <span className="block text-[10px] font-medium text-slate-400">{item.label}</span>
                <span className="mt-0.5 block text-xs font-bold text-white">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-1.5 text-xs text-slate-300">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-400" />
            <p className="leading-relaxed">{info.desc}</p>
          </div>
          <div className="rounded-xl border border-sky-500/20 bg-sky-950/20 p-2.5 text-[11px] text-sky-300">
            <span className="font-semibold text-sky-200">Parameter yang Diukur:</span> {info.parameter}
          </div>
        </div>
      )}

      {/* Tab 2: Prinsip Kerja Ilmiah */}
      {activeTab === 'principle' && (
        <div className="mt-3 space-y-2.5 text-xs text-slate-300">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center gap-1.5 font-semibold text-sky-300 mb-1">
              <BookOpen className="h-3.5 w-3.5 text-sky-400" />
              Fungsi Ilmiah:
            </div>
            <p className="leading-relaxed text-slate-300 text-[11px]">{info.scientificFunction}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center gap-1.5 font-semibold text-amber-300 mb-1">
              <Activity className="h-3.5 w-3.5 text-amber-400" />
              Prinsip Pengukuran:
            </div>
            <p className="leading-relaxed text-slate-300 text-[11px]">{info.principle}</p>
          </div>
        </div>
      )}

      {/* Tab 3: Daftar Komponen Utama */}
      {activeTab === 'components' && (
        <div className="mt-3 space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {info.components.map((comp, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-2.5 py-2 text-[11px] text-slate-200"
            >
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <span className="leading-snug">{comp}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Operasional & Standar WMO */}
      {activeTab === 'operation' && (
        <div className="mt-3 space-y-2.5 text-xs">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-[11px] text-slate-300">
            <div className="flex items-center gap-1.5 font-semibold text-sky-300 mb-1">
              <Wrench className="h-3.5 w-3.5 text-sky-400" />
              Prosedur Operasional Stasiun:
            </div>
            <p className="leading-relaxed">{info.operation}</p>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/30 p-3 text-[11px] text-emerald-300">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-200 mb-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Standar Penempatan WMO CIMO:
            </div>
            <p className="leading-relaxed">{info.wmo}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2">
        <Button
          size="sm"
          className="flex-1 bg-sky-500 text-white hover:bg-sky-400 font-medium text-xs rounded-xl shadow-lg shadow-sky-500/20"
          onClick={() => onFocusCamera(instrumentId)}
        >
          <Eye className="mr-1.5 h-3.5 w-3.5" />
          Fokus Kamera ke Alat
        </Button>
      </div>
    </div>
  )
}
