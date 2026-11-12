"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, Layers, Loader2, MapPin, X } from "lucide-react";
import type {
  BasemapId,
  HujanRecord,
  KemarauRecord,
  SeasonalDataset,
  SeasonId,
  UnifiedLayerDef,
} from "@/lib/seasonalPredictionTypes";

const SeasonalLeafletCanvas = dynamic(() => import("./SeasonalLeafletCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-full bg-slate-100 dark:bg-slate-900">
      <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
    </div>
  ),
});

const HUJAN_COLORS: Record<string, string> = {
  "Okt I": "#1b7837",
  "Okt II": "#7fbf7b",
  "Okt III": "#d9f0d3",
  "Nov I": "#fee08b",
  "Nov II": "#fdae61",
  "Nov III": "#f46d43",
  "Des I": "#d53e4f",
  "Des II": "#9e0142",
  Maju: "#2b83ba",
  Sama: "#abdda4",
  Mundur: "#d7191c",
  "Atas Normal": "#2b83ba",
  Normal: "#abdda4",
  "Bawah Normal": "#fdae61",
  "Desember 2026": "#41b6c4",
  "Januari 2027": "#1f78b4",
  "Februari 2027": "#08519c",
  "Maret 2027": "#7fcdbb",
};

const KEMARAU_COLORS: Record<string, string> = {
  "Apr I": "#7f0000",
  "Apr II": "#b30000",
  "Apr III": "#d7301f",
  "Mei I": "#ef6548",
  "Mei II": "#fc8d59",
  "Mei III": "#fdbb84",
  "Jun I": "#fdd49e",
  "Jun II": "#fee8c8",
  Maju: "#d73027",
  Sama: "#fee08b",
  Mundur: "#1a9850",
  "Atas Normal": "#1a9850",
  Normal: "#abdda4",
  "Bawah Normal": "#f46d43",
  "Juli 2026": "#fc4e2a",
  "Agustus 2026": "#b10026",
  "September 2026": "#800026",
};

const CEWS_LAYERS: UnifiedLayerDef[] = [
  // Musim Hujan 2026/2027
  {
    id: "hujan_awal",
    kind: "polygon",
    season: "hujan",
    label: "Awal Musim Hujan (AMH)",
    bannerTitle: "PRAKIRAAN AWAL MUSIM HUJAN 2026/2027",
    field: "prakiraan_amh_label",
    colorMap: HUJAN_COLORS,
    order: ["Okt I", "Okt II", "Okt III", "Nov I", "Nov II", "Nov III", "Des I", "Des II"],
  },
  {
    id: "hujan_anomali",
    kind: "polygon",
    season: "hujan",
    label: "Perbandingan vs Normal",
    bannerTitle: "PERBANDINGAN AWAL MUSIM HUJAN TERHADAP NORMAL",
    field: "perbandingan_terhadap_normal",
    colorMap: HUJAN_COLORS,
    order: ["Maju", "Sama", "Mundur"],
  },
  {
    id: "hujan_puncak",
    kind: "polygon",
    season: "hujan",
    label: "Puncak Musim Hujan",
    bannerTitle: "PRAKIRAAN PUNCAK MUSIM HUJAN 2026/2027",
    field: "prakiraan_puncak_bulan",
    colorMap: HUJAN_COLORS,
    order: ["Desember 2026", "Januari 2027", "Februari 2027", "Maret 2027"],
  },
  {
    id: "hujan_sifat",
    kind: "polygon",
    season: "hujan",
    label: "Sifat Hujan Musim Hujan",
    bannerTitle: "PRAKIRAAN SIFAT HUJAN MUSIM HUJAN 2026/2027",
    field: "prakiraan_sifat_hujan",
    colorMap: HUJAN_COLORS,
    order: ["Atas Normal", "Normal", "Bawah Normal"],
  },
  {
    id: "hujan_tanam",
    kind: "polygon",
    season: "hujan",
    label: "Rekomendasi Tanam MT1",
    bannerTitle: "REKOMENDASI WAKTU TANAM PADI MT1 2026/2027",
    field: "rekomendasi_tanam_padi_mt1",
    colorMap: HUJAN_COLORS,
    order: ["Nov I", "Nov II", "Nov III", "Des I", "Des II"],
  },
  {
    id: "raster_total_hujan_mh",
    kind: "raster",
    season: "hujan",
    label: "Total Curah Hujan (250m)",
    bannerTitle: "SEBARAN TOTAL CURAH HUJAN MUSIM HUJAN (250M)",
    rasterId: "total_hujan_mh",
  },
  {
    id: "raster_amh_250m",
    kind: "raster",
    season: "hujan",
    label: "Awal Musim Hujan (250m)",
    bannerTitle: "SEBARAN AWAL MUSIM HUJAN RESOLUSI 250M",
    rasterId: "amh_250m",
  },

  // Musim Kemarau 2026
  {
    id: "kemarau_awal",
    kind: "polygon",
    season: "kemarau",
    label: "Awal Musim Kemarau (AMK)",
    bannerTitle: "PRAKIRAAN AWAL MUSIM KEMARAU 2026",
    field: "prakiraan_amk_label",
    colorMap: KEMARAU_COLORS,
    order: ["Apr I", "Apr II", "Apr III", "Mei I", "Mei II", "Mei III", "Jun I", "Jun II"],
  },
  {
    id: "kemarau_anomali",
    kind: "polygon",
    season: "kemarau",
    label: "Perbandingan vs Normal",
    bannerTitle: "PERBANDINGAN AWAL MUSIM KEMARAU TERHADAP NORMAL",
    field: "perbandingan_terhadap_normal",
    colorMap: KEMARAU_COLORS,
    order: ["Maju", "Sama", "Mundur"],
  },
  {
    id: "kemarau_puncak",
    kind: "polygon",
    season: "kemarau",
    label: "Puncak Musim Kemarau",
    bannerTitle: "PRAKIRAAN PUNCAK MUSIM KEMARAU 2026",
    field: "prakiraan_pmk_bulan",
    colorMap: KEMARAU_COLORS,
    order: ["Juli 2026", "Agustus 2026", "September 2026"],
  },
  {
    id: "kemarau_sifat",
    kind: "polygon",
    season: "kemarau",
    label: "Sifat Hujan Kemarau",
    bannerTitle: "PRAKIRAAN SIFAT HUJAN MUSIM KEMARAU 2026",
    field: "prakiraan_sifat_hujan_mk",
    colorMap: KEMARAU_COLORS,
    order: ["Atas Normal", "Normal", "Bawah Normal"],
  },
  {
    id: "kemarau_tanam",
    kind: "polygon",
    season: "kemarau",
    label: "Rekomendasi Palawija MT3",
    bannerTitle: "REKOMENDASI TANAM PALAWIJA MT3 2026",
    field: "rekomendasi_tanam_palawija_mt3",
    colorMap: KEMARAU_COLORS,
    order: ["Apr III", "Mei I", "Mei II", "Mei III", "Jun I"],
  },
  {
    id: "raster_total_hujan_mk",
    kind: "raster",
    season: "kemarau",
    label: "Total Hujan Kemarau (250m)",
    bannerTitle: "SEBARAN TOTAL CURAH HUJAN KEMARAU (250M)",
    rasterId: "total_hujan_mk",
  },
  {
    id: "raster_amk_250m",
    kind: "raster",
    season: "kemarau",
    label: "Awal Musim Kemarau (250m)",
    bannerTitle: "SEBARAN AWAL MUSIM KEMARAU RESOLUSI 250M",
    rasterId: "amk_250m",
  },
  {
    id: "raster_kekeringan_250m",
    kind: "raster",
    season: "kemarau",
    label: "Indeks Kekeringan (250m)",
    bannerTitle: "SEBARAN POTENSI KEKERINGAN METEOROLOGIS (250M)",
    rasterId: "kekeringan_250m",
  },
];

const OPACITY_OPTIONS = [1, 0.8, 0.6, 0.4, 0.2];

const BASEMAP_OPTIONS: { id: BasemapId; label: string }[] = [
  { id: "jalan", label: "Peta Jalan" },
  { id: "satelit", label: "Satelit" },
  { id: "topografi", label: "Topografi" },
];

interface SeasonalPredictionMapProps {
  isDarkMode?: boolean;
}

export default function SeasonalPredictionMap({ isDarkMode = false }: SeasonalPredictionMapProps) {
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [dataset, setDataset] = useState<SeasonalDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeLayerId, setActiveLayerId] = useState<string | null>("hujan_awal");
  const [lastSeason, setLastSeason] = useState<SeasonId>("hujan");
  const [opacityByLayer, setOpacityByLayer] = useState<Record<string, number>>({});
  const [panelOpen, setPanelOpen] = useState<boolean>(true);
  const [basemap, setBasemap] = useState<BasemapId>("jalan");
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [geoRes, predRes] = await Promise.all([
          fetch("/data/kebumen_kecamatan.json"),
          fetch("/data/prediksi_musim.json"),
        ]);
        if (!geoRes.ok || !predRes.ok) {
          throw new Error("Gagal mengambil data peta atau prakiraan musim.");
        }
        const [geoData, predData] = await Promise.all([geoRes.json(), predRes.json()]);
        if (cancelled) return;
        setGeojson(geoData);
        setDataset(predData);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Terjadi kesalahan saat memuat peta.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeLayer = useMemo(
    () => CEWS_LAYERS.find((l) => l.id === activeLayerId) ?? null,
    [activeLayerId]
  );

  const currentSeason: SeasonId = activeLayer?.season ?? lastSeason;

  const activeRasterOverlay = useMemo(() => {
    if (!dataset?.overlays || activeLayer?.kind !== "raster" || !activeLayer.rasterId) {
      return null;
    }
    return dataset.overlays.find((o) => o.id === activeLayer.rasterId) ?? null;
  }, [dataset, activeLayer]);

  const currentOpacity = activeLayer ? (opacityByLayer[activeLayer.id] ?? 0.8) : 0.8;

  const currentRecords = useMemo(() => {
    if (!dataset) return [];
    return currentSeason === "hujan" ? dataset.hujan : dataset.kemarau;
  }, [dataset, currentSeason]);

  const selectedRecord = useMemo(() => {
    if (!selectedDistrict || !currentRecords.length) return undefined;
    return currentRecords.find(
      (r) => r.kecamatan.toLowerCase() === selectedDistrict.toLowerCase()
    );
  }, [currentRecords, selectedDistrict]);

  const activeSeasonMeta = dataset?.metadata?.seasons?.[currentSeason];

  const hujanLayers = useMemo(() => CEWS_LAYERS.filter((l) => l.season === "hujan"), []);
  const kemarauLayers = useMemo(() => CEWS_LAYERS.filter((l) => l.season === "kemarau"), []);

  const handleToggleLayer = (layer: UnifiedLayerDef, checked: boolean) => {
    if (checked) {
      setActiveLayerId(layer.id);
      setLastSeason(layer.season);
    } else if (activeLayerId === layer.id) {
      setActiveLayerId(null);
    }
  };

  const handleChangeLayerOpacity = (layer: UnifiedLayerDef, nextOpacity: number) => {
    setOpacityByLayer((prev) => ({ ...prev, [layer.id]: nextOpacity }));
    if (activeLayerId !== layer.id) {
      setActiveLayerId(layer.id);
      setLastSeason(layer.season);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full gap-3 bg-slate-100 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
        <p className="text-sm text-muted-foreground">Memuat peta prakiraan musim Kebumen...</p>
      </div>
    );
  }

  if (error || !dataset || !geojson) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full gap-2 text-center p-6 bg-slate-50 dark:bg-slate-950">
        <AlertTriangle className="h-8 w-8 text-amber-500" />
        <p className="text-sm font-medium text-foreground">{error || "Data prakiraan tidak tersedia."}</p>
      </div>
    );
  }

  return (
    <div className="relative z-0 isolate w-full h-full overflow-hidden bg-slate-200 dark:bg-slate-900">
      {/* Kanvas Peta Leaflet Penuh */}
      <SeasonalLeafletCanvas
        geojson={geojson}
        records={currentRecords}
        activeLayer={activeLayer}
        activeRasterOverlay={activeRasterOverlay}
        basemap={basemap}
        opacity={currentOpacity}
        selectedDistrict={selectedDistrict}
        onSelectDistrict={setSelectedDistrict}
        isDarkMode={isDarkMode}
      />

      {/* Top-Center Translucent Blue Banner (CEWS BMKG style) */}
      <div className="pointer-events-none absolute top-2.5 left-14 right-14 z-[450] flex justify-center">
        <div className="pointer-events-auto max-w-2xl rounded-sm bg-sky-500/80 dark:bg-sky-700/85 backdrop-blur-sm px-4 sm:px-8 py-1.5 sm:py-2 text-center text-white shadow-md border border-white/20">
          <p className="text-[11px] sm:text-sm font-bold tracking-wide uppercase leading-tight">
            {activeLayer ? activeLayer.bannerTitle : "PETA DASAR WILAYAH KEBUMEN"}
          </p>
          <p className="text-[10px] sm:text-xs font-medium opacity-95 uppercase tracking-wide mt-0.5">
            KABUPATEN KEBUMEN &bull; STANDAR BMKG
            {activeSeasonMeta?.enso_context ? ` • ${activeSeasonMeta.enso_context}` : ""}
          </p>
        </div>
      </div>

      {/* Top-Left Collapsible Layer Switcher Panel (CEWS BMKG style) */}
      <div className="pointer-events-none absolute top-2.5 left-2.5 z-[500] flex flex-col items-start gap-2">
        <button
          type="button"
          onClick={() => setPanelOpen((prev) => !prev)}
          aria-label={panelOpen ? "Tutup panel lapisan peta" : "Buka panel lapisan peta"}
          title={panelOpen ? "Tutup Panel Lapisan" : "Buka Panel Lapisan"}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/95 dark:bg-slate-900/95 text-sky-700 dark:text-sky-300 shadow-lg border border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
        >
          {panelOpen ? <X className="h-5 w-5" /> : <Layers className="h-5 w-5" />}
        </button>

        {panelOpen && (
          <div className="pointer-events-auto w-[290px] sm:w-[336px] max-h-[calc(100vh-220px)] overflow-y-auto rounded-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl border border-slate-200/90 dark:border-slate-700/90 text-slate-800 dark:text-slate-100">
            {/* Grup 1: Musim Hujan */}
            <LayerGroupSection
              title="Prakiraan Musim Hujan 2026/2027"
              layers={hujanLayers}
              activeLayerId={activeLayerId}
              opacityByLayer={opacityByLayer}
              onToggle={handleToggleLayer}
              onChangeOpacity={handleChangeLayerOpacity}
            />

            {/* Grup 2: Musim Kemarau */}
            <LayerGroupSection
              title="Prakiraan Musim Kemarau 2026"
              layers={kemarauLayers}
              activeLayerId={activeLayerId}
              opacityByLayer={opacityByLayer}
              onToggle={handleToggleLayer}
              onChangeOpacity={handleChangeLayerOpacity}
            />

            {/* Grup 3: Peta Dasar */}
            <div className="border-t border-slate-200 dark:border-slate-700 px-3 py-2.5">
              <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Peta Dasar (Basemap)
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {BASEMAP_OPTIONS.map((bm) => {
                  const active = basemap === bm.id;
                  return (
                    <button
                      key={bm.id}
                      type="button"
                      onClick={() => setBasemap(bm.id)}
                      className={
                        active
                          ? "rounded border border-sky-600 bg-sky-600 px-2 py-1 text-[11px] font-medium text-white shadow-sm"
                          : "rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                      }
                    >
                      {bm.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom-Left Floating Dismissible District Detail Card */}
      {selectedDistrict && selectedRecord && (
        <div className="pointer-events-auto absolute bottom-3 left-2.5 z-[500] w-[calc(100%-20px)] sm:w-[400px] max-w-[420px] rounded-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl border border-slate-200 dark:border-slate-700 p-3 text-slate-800 dark:text-slate-100">
          <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-700/80">
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <MapPin className="h-4 w-4 text-sky-600 shrink-0" />
                <h3 className="text-sm font-bold leading-tight">
                  Kecamatan {selectedRecord.kecamatan}
                </h3>
                <AnomalyBadge value={selectedRecord.perbandingan_terhadap_normal} />
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {currentSeason === "hujan"
                  ? "Prakiraan Musim Hujan 2026/2027"
                  : "Prakiraan Musim Kemarau 2026"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDistrict(null)}
              aria-label="Tutup detail kecamatan"
              className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="pt-2.5">
            {currentSeason === "hujan" ? (
              <HujanSelectedDetail record={selectedRecord as HujanRecord} />
            ) : (
              <KemarauSelectedDetail record={selectedRecord as KemarauRecord} />
            )}
            <p className="text-[10px] text-muted-foreground mt-2 pt-1.5 border-t border-slate-200/70 dark:border-slate-800">
              1 dasarian = ±10 hari (I: tgl 1–10, II: 11–20, III: 21–akhir bulan).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

interface LayerGroupSectionProps {
  title: string;
  layers: UnifiedLayerDef[];
  activeLayerId: string | null;
  opacityByLayer: Record<string, number>;
  onToggle: (layer: UnifiedLayerDef, checked: boolean) => void;
  onChangeOpacity: (layer: UnifiedLayerDef, nextOpacity: number) => void;
}

function LayerGroupSection({
  title,
  layers,
  activeLayerId,
  opacityByLayer,
  onToggle,
  onChangeOpacity,
}: LayerGroupSectionProps) {
  return (
    <div className="border-t first:border-t-0 border-slate-200 dark:border-slate-700 px-3 py-2.5">
      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">{title}</p>
      <div className="space-y-1.5">
        {layers.map((layer) => {
          const isChecked = activeLayerId === layer.id;
          const layerOpacity = opacityByLayer[layer.id] ?? 0.8;
          return (
            <div key={layer.id} className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Switch
                  checked={isChecked}
                  onCheckedChange={(checked) => onToggle(layer, checked)}
                  aria-label={`Aktifkan lapisan ${layer.label}`}
                  className="scale-90 data-[state=checked]:bg-sky-600"
                />
                <button
                  type="button"
                  onClick={() => onToggle(layer, !isChecked)}
                  className={
                    isChecked
                      ? "truncate text-left font-medium text-sky-700 dark:text-sky-300"
                      : "truncate text-left text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }
                  title={layer.label}
                >
                  {layer.label}
                </button>
              </div>
              <select
                aria-label={`Transparansi ${layer.label}`}
                value={String(layerOpacity)}
                onChange={(e) => onChangeOpacity(layer, parseFloat(e.target.value))}
                className="h-6 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-1 text-[11px] font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 shrink-0"
              >
                {OPACITY_OPTIONS.map((opt) => (
                  <option key={opt} value={String(opt)}>
                    {Math.round(opt * 100)}%
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AnomalyBadge({ value }: { value: string }) {
  if (value === "Maju") {
    return (
      <Badge className="h-5 px-1.5 text-[10px] bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200">
        Maju
      </Badge>
    );
  }
  if (value === "Sama") {
    return (
      <Badge className="h-5 px-1.5 text-[10px] bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200">
        Sama
      </Badge>
    );
  }
  return (
    <Badge className="h-5 px-1.5 text-[10px] bg-rose-100 text-rose-800 hover:bg-rose-100 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200">
      Mundur
    </Badge>
  );
}

function DetailTile({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/60 px-2.5 py-1.5">
      <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
      <p
        className={
          accent
            ? "text-xs font-bold text-foreground mt-0.5 leading-snug"
            : "text-xs font-medium text-foreground mt-0.5 leading-snug"
        }
      >
        {value}
      </p>
    </div>
  );
}

function HujanSelectedDetail({ record }: { record: HujanRecord }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
      <DetailTile label="Normal Awal Hujan" value={record.normal_amh_label} />
      <DetailTile label="Prakiraan Awal Hujan" value={record.prakiraan_amh_label} accent />
      <DetailTile label="Puncak Musim (BMKG)" value={record.prakiraan_puncak_bulan} accent />
      <DetailTile label="Sifat Hujan" value={record.prakiraan_sifat_hujan} />
      <DetailTile label="Mulai Olah Tanah" value={record.rekomendasi_olah_tanah} />
      <DetailTile label="Tanam Padi MT1" value={record.rekomendasi_tanam_padi_mt1} accent />
    </div>
  );
}

function KemarauSelectedDetail({ record }: { record: KemarauRecord }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
      <DetailTile label="Normal Awal Kemarau" value={record.normal_amk_label} />
      <DetailTile label="Prakiraan Awal Kemarau" value={record.prakiraan_amk_label} accent />
      <DetailTile label="Puncak Kemarau (BMKG)" value={record.prakiraan_pmk_bulan} accent />
      <DetailTile label="Sifat Hujan Kemarau" value={record.prakiraan_sifat_hujan_mk} />
      <DetailTile label="Keringkan Sawah MT2" value={record.rekomendasi_keringkan_sawah_mt2} />
      <DetailTile label="Tanam Palawija MT3" value={record.rekomendasi_tanam_palawija_mt3} accent />
    </div>
  );
}
