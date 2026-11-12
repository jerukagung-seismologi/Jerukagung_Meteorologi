"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, Layers, Loader2, MapPin, Search, X } from "lucide-react";
import type {
  AdminLevel,
  BasemapId,
  HujanRecord,
  KemarauRecord,
  SeasonalDataset,
  SeasonalVillageDataset,
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
  "Okt III": "#a1d99b",
  "Nov I": "#fee08b",
  "Nov II": "#fdae61",
  "Nov III": "#f46d43",
  "Des I": "#d53e4f",
  "Des II": "#9e0142",
  Maju: "#2b83ba",
  Sama: "#78c679",
  Mundur: "#d7191c",
  "Atas Normal": "#2b83ba",
  Normal: "#78c679",
  "Bawah Normal": "#fdae61",
  "Desember 2026": "#41b6c4",
  "Januari 2027": "#1f78b4",
  "Februari 2027": "#08519c",
  "Maret 2027": "#7fcdbb",
  "< 1.500 mm": "#9ecae1",
  "1.500–1.600 mm": "#4292c6",
  "1.600–1.750 mm": "#2171b5",
  "> 1.750 mm": "#08306b",
};

const KEMARAU_COLORS: Record<string, string> = {
  "Apr I": "#7f0000",
  "Apr II": "#b30000",
  "Apr III": "#d7301f",
  "Mei I": "#ef6548",
  "Mei II": "#fc8d59",
  "Mei III": "#fdbb84",
  "Jun I": "#fdd49e",
  "Jun II": "#fed976",
  Maju: "#d73027",
  Sama: "#fee08b",
  Mundur: "#1a9850",
  "Atas Normal": "#1a9850",
  Normal: "#78c679",
  "Bawah Normal": "#f46d43",
  "Juli 2026": "#fc4e2a",
  "Agustus 2026": "#b10026",
  "September 2026": "#800026",
  "< 430 mm": "#fed976",
  "430–485 mm": "#a1d99b",
  "485–525 mm": "#41b6c4",
  "> 525 mm": "#0868ac",
  "Sedang (< 60)": "#66c2a5",
  "Cukup Tinggi (60–65)": "#fe9929",
  "Tinggi (65–70)": "#d94801",
  "Sangat Tinggi (> 70)": "#990000",
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
    id: "hujan_curah_kelas",
    kind: "polygon",
    season: "hujan",
    label: "Potensi Total Hujan MH",
    bannerTitle: "ZONA POTENSI TOTAL CURAH HUJAN MUSIM HUJAN 2026/2027",
    field: "kelas_hujan_mh",
    colorMap: HUJAN_COLORS,
    order: ["< 1.500 mm", "1.500–1.600 mm", "1.600–1.750 mm", "> 1.750 mm"],
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
    desaField: "amk_label_250m",
    colorMap: KEMARAU_COLORS,
    order: ["Apr I", "Apr II", "Apr III", "Mei I", "Mei II", "Mei III", "Jun I", "Jun II"],
  },
  {
    id: "kemarau_curah_kelas",
    kind: "polygon",
    season: "kemarau",
    label: "Potensi Total Hujan MK",
    bannerTitle: "ZONA POTENSI TOTAL CURAH HUJAN KEMARAU 2026",
    field: "kelas_hujan_mk",
    colorMap: KEMARAU_COLORS,
    order: ["< 430 mm", "430–485 mm", "485–525 mm", "> 525 mm"],
  },
  {
    id: "kemarau_kekeringan_kelas",
    kind: "polygon",
    season: "kemarau",
    label: "Tingkat Risiko Kekeringan",
    bannerTitle: "ZONASI TINGKAT KERAWANAN KEKERINGAN 2026",
    field: "kelas_kekeringan",
    colorMap: KEMARAU_COLORS,
    order: ["Sedang (< 60)", "Cukup Tinggi (60–65)", "Tinggi (65–70)", "Sangat Tinggi (> 70)"],
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
  const [kecGeojson, setKecGeojson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [kecDataset, setKecDataset] = useState<SeasonalDataset | null>(null);
  const [desaGeojson, setDesaGeojson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [desaDataset, setDesaDataset] = useState<SeasonalVillageDataset | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingDesa, setLoadingDesa] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [adminLevel, setAdminLevel] = useState<AdminLevel>("kecamatan");
  const [activeLayerId, setActiveLayerId] = useState<string | null>("hujan_curah_kelas");
  const [lastSeason, setLastSeason] = useState<SeasonId>("hujan");
  const [opacityByLayer, setOpacityByLayer] = useState<Record<string, number>>({});
  const [panelOpen, setPanelOpen] = useState<boolean>(true);
  const [basemap, setBasemap] = useState<BasemapId>("jalan");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

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
        setKecGeojson(geoData);
        setKecDataset(predData);

        // Preload data 460 desa di latar belakang agar perpindahan mode instan
        Promise.all([
          fetch("/data/kebumen_desa.json"),
          fetch("/data/prediksi_musim_desa.json"),
        ])
          .then(async ([dGeoRes, dPredRes]) => {
            if (!dGeoRes.ok || !dPredRes.ok || cancelled) return;
            const [dGeo, dPred] = await Promise.all([dGeoRes.json(), dPredRes.json()]);
            if (!cancelled) {
              setDesaGeojson(dGeo);
              setDesaDataset(dPred);
            }
          })
          .catch(() => {
            // Akan dimuat ulang saat user berpindah ke mode Desa
          });
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

  const handleSwitchAdminLevel = async (nextLevel: AdminLevel) => {
    if (nextLevel === adminLevel) return;
    setSelectedCode(null);
    setSearchQuery("");

    if (nextLevel === "desa" && (!desaGeojson || !desaDataset)) {
      setLoadingDesa(true);
      try {
        const [dGeoRes, dPredRes] = await Promise.all([
          fetch("/data/kebumen_desa.json"),
          fetch("/data/prediksi_musim_desa.json"),
        ]);
        if (!dGeoRes.ok || !dPredRes.ok) {
          throw new Error("Gagal mengambil data batas dan prakiraan per desa.");
        }
        const [dGeo, dPred] = await Promise.all([dGeoRes.json(), dPredRes.json()]);
        setDesaGeojson(dGeo);
        setDesaDataset(dPred);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal memuat data desa.");
        setLoadingDesa(false);
        return;
      } finally {
        setLoadingDesa(false);
      }
    }

    setAdminLevel(nextLevel);
  };

  const activeLayer = useMemo(
    () => CEWS_LAYERS.find((l) => l.id === activeLayerId) ?? null,
    [activeLayerId]
  );

  const currentSeason: SeasonId = activeLayer?.season ?? lastSeason;

  const activeRasterOverlay = useMemo(() => {
    if (!kecDataset?.overlays || activeLayer?.kind !== "raster" || !activeLayer.rasterId) {
      return null;
    }
    return kecDataset.overlays.find((o) => o.id === activeLayer.rasterId) ?? null;
  }, [kecDataset, activeLayer]);

  const currentOpacity = activeLayer ? (opacityByLayer[activeLayer.id] ?? 0.8) : 0.8;

  const activeGeojson = adminLevel === "desa" && desaGeojson ? desaGeojson : kecGeojson;

  const currentRecords = useMemo(() => {
    if (adminLevel === "desa" && desaDataset) {
      return currentSeason === "hujan" ? desaDataset.hujan : desaDataset.kemarau;
    }
    if (!kecDataset) return [];
    return currentSeason === "hujan" ? kecDataset.hujan : kecDataset.kemarau;
  }, [adminLevel, desaDataset, kecDataset, currentSeason]);

  const selectedRecord = useMemo(() => {
    if (!selectedCode || !currentRecords.length) return undefined;
    return currentRecords.find(
      (r) => (r.code || r.kecamatan).toLowerCase() === selectedCode.toLowerCase()
    );
  }, [currentRecords, selectedCode]);

  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || adminLevel !== "desa") return [];
    return currentRecords
      .filter((r) => {
        const desa = (r.desa || "").toLowerCase();
        const kec = (r.kecamatan || "").toLowerCase();
        return desa.includes(q) || kec.includes(q);
      })
      .slice(0, 6);
  }, [searchQuery, adminLevel, currentRecords]);

  const activeSeasonMeta = kecDataset?.metadata?.seasons?.[currentSeason];

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

  if (error || !kecDataset || !activeGeojson) {
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
        geojson={activeGeojson}
        records={currentRecords}
        adminLevel={adminLevel}
        activeLayer={activeLayer}
        activeRasterOverlay={activeRasterOverlay}
        basemap={basemap}
        opacity={currentOpacity}
        selectedCode={selectedCode}
        onSelectCode={setSelectedCode}
        isDarkMode={isDarkMode}
      />

      {/* Top-Center High-Contrast Blue Banner (CEWS BMKG style) */}
      <div className="pointer-events-none absolute top-2.5 left-14 right-14 z-[450] flex justify-center">
        <div className="pointer-events-auto max-w-2xl rounded-md bg-blue-900/95 dark:bg-slate-900/95 backdrop-blur-md px-4 sm:px-8 py-2 text-center text-white shadow-xl border border-blue-400/40">
          <p className="text-xs sm:text-sm font-extrabold tracking-wider uppercase text-white leading-tight">
            {activeLayer ? activeLayer.bannerTitle : "PETA DASAR WILAYAH KEBUMEN"}
          </p>
          <p className="text-[11px] sm:text-xs font-semibold text-blue-100 uppercase tracking-wide mt-0.5">
            KABUPATEN KEBUMEN &bull;{" "}
            {adminLevel === "desa" ? "460 DESA/KELURAHAN (250M)" : "26 KECAMATAN"}
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
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/95 dark:bg-slate-900/95 text-blue-700 dark:text-sky-300 shadow-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          {panelOpen ? <X className="h-5 w-5" /> : <Layers className="h-5 w-5" />}
        </button>

        {panelOpen && (
          <div className="pointer-events-auto w-[296px] sm:w-[342px] max-h-[calc(100vh-220px)] overflow-y-auto rounded-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100">
            {/* Pengalih Tingkat Batas Wilayah (Mode Ganda) */}
            <div className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800/70">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Batas Wilayah Peta
                </p>
                {loadingDesa && <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600 dark:text-sky-400" />}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSwitchAdminLevel("kecamatan")}
                  className={
                    adminLevel === "kecamatan"
                      ? "rounded border border-blue-700 bg-blue-700 px-2 py-1 text-[11px] font-bold text-white shadow-sm"
                      : "rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-[11px] font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }
                >
                  Kecamatan (26)
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchAdminLevel("desa")}
                  className={
                    adminLevel === "desa"
                      ? "rounded border border-blue-700 bg-blue-700 px-2 py-1 text-[11px] font-bold text-white shadow-sm"
                      : "rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-[11px] font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }
                >
                  Desa / Kel (460)
                </button>
              </div>

              {adminLevel === "desa" && (
                <div className="relative mt-2">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2 top-2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama desa atau kecamatan..."
                    className="w-full h-7 pl-7 pr-6 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[11px] focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label="Hapus pencarian"
                      className="absolute right-1.5 top-1.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {searchMatches.length > 0 && (
                    <div className="mt-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-md max-h-36 overflow-y-auto">
                      {searchMatches.map((m) => (
                        <button
                          key={m.code || m.desa}
                          type="button"
                          onClick={() => {
                            setSelectedCode(m.code || m.kecamatan);
                            setSearchQuery("");
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-[11px] hover:bg-sky-50 dark:hover:bg-slate-800 border-b last:border-b-0 border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2"
                        >
                          <span className="font-medium truncate">{m.desa}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            Kec. {m.kecamatan}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

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
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1.5">
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
                          ? "rounded border border-blue-700 bg-blue-700 px-2 py-1 text-[11px] font-bold text-white shadow-sm"
                          : "rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-[11px] font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
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

      {/* Bottom-Left Floating Dismissible Detail Card (Kecamatan atau Desa/Kelurahan) */}
      {selectedCode && selectedRecord && (
        <div className="pointer-events-auto absolute bottom-3 left-2.5 z-[500] w-[calc(100%-20px)] sm:w-[410px] max-w-[430px] rounded-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl border border-slate-300 dark:border-slate-700 p-3.5 text-slate-900 dark:text-slate-100">
          <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-700 dark:text-sky-400 shrink-0" />
                <h3 className="text-sm font-extrabold leading-tight text-slate-900 dark:text-slate-50">
                  {adminLevel === "desa" && selectedRecord.desa
                    ? `Desa/Kel. ${selectedRecord.desa}`
                    : `Kecamatan ${selectedRecord.kecamatan}`}
                </h3>
                <AnomalyBadge value={selectedRecord.perbandingan_terhadap_normal} />
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                {adminLevel === "desa" && selectedRecord.desa
                  ? `Kec. ${selectedRecord.kecamatan} · `
                  : ""}
                {currentSeason === "hujan"
                  ? "Prakiraan Musim Hujan 2026/2027"
                  : "Prakiraan Musim Kemarau 2026"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCode(null)}
              aria-label="Tutup detail wilayah"
              className="rounded p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="pt-2.5">
            {currentSeason === "hujan" ? (
              <HujanSelectedDetail record={selectedRecord as HujanRecord} />
            ) : (
              <KemarauSelectedDetail
                record={selectedRecord as KemarauRecord}
                adminLevel={adminLevel}
              />
            )}
            <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              {adminLevel === "desa"
                ? "Curah hujan & indeks mikro diekstrak dari raster downscaling 250m per poligon desa. 1 dasarian = ±10 hari."
                : "1 dasarian = ±10 hari (I: tgl 1–10, II: 11–20, III: 21–akhir bulan)."}
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
    <div className="border-t border-slate-200 dark:border-slate-700 px-3 py-2.5">
      <p className="text-xs font-bold text-slate-900 dark:text-slate-50 mb-2">{title}</p>
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
                  className="scale-90 data-[state=checked]:bg-blue-700 data-[state=unchecked]:bg-slate-300 dark:data-[state=unchecked]:bg-slate-700"
                />
                <button
                  type="button"
                  onClick={() => onToggle(layer, !isChecked)}
                  className={
                    isChecked
                      ? "truncate text-left font-bold text-blue-700 dark:text-sky-300"
                      : "truncate text-left font-medium text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white"
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
                className="h-6 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-1 text-[11px] font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-600 shrink-0"
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
      <Badge className="h-5 px-1.5 text-[10px] font-bold bg-blue-100 text-blue-900 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-100 border-blue-400 dark:border-blue-700">
        Maju
      </Badge>
    );
  }
  if (value === "Sama") {
    return (
      <Badge className="h-5 px-1.5 text-[10px] font-bold bg-emerald-100 text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-100 border-emerald-400 dark:border-emerald-700">
        Sama
      </Badge>
    );
  }
  return (
    <Badge className="h-5 px-1.5 text-[10px] font-bold bg-rose-100 text-rose-900 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-100 border-rose-400 dark:border-rose-700">
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
    <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/90 px-2.5 py-1.5 shadow-xs">
      <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-tight">{label}</p>
      <p
        className={
          accent
            ? "text-xs font-extrabold text-blue-700 dark:text-sky-300 mt-0.5 leading-snug"
            : "text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5 leading-snug"
        }
      >
        {value}
      </p>
    </div>
  );
}

function HujanSelectedDetail({ record }: { record: HujanRecord }) {
  const rainDisplay =
    record.total_hujan_mh_mm != null
      ? `${record.total_hujan_mh_mm.toLocaleString("id-ID")} mm`
      : record.prakiraan_sifat_hujan;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
      <DetailTile label="Prakiraan Awal Hujan" value={record.prakiraan_amh_label} accent />
      <DetailTile label="Normal Awal Hujan" value={record.normal_amh_label} />
      <DetailTile label="Puncak Musim (BMKG)" value={record.prakiraan_puncak_bulan} accent />
      <DetailTile label="Estimasi Hujan MH" value={rainDisplay} accent />
      <DetailTile label="Mulai Olah Tanah" value={record.rekomendasi_olah_tanah} />
      <DetailTile label="Tanam Padi MT1" value={record.rekomendasi_tanam_padi_mt1} accent />
    </div>
  );
}

function KemarauSelectedDetail({
  record,
  adminLevel,
}: {
  record: KemarauRecord;
  adminLevel: AdminLevel;
}) {
  const amkDisplay =
    adminLevel === "desa" && record.amk_label_250m
      ? `${record.amk_label_250m} (250m)`
      : record.prakiraan_amk_label;
  const rainDisplay =
    record.total_hujan_mk_mm != null
      ? `${record.total_hujan_mk_mm.toLocaleString("id-ID")} mm`
      : record.prakiraan_sifat_hujan_mk;
  const droughtDisplay =
    record.kekeringan_skor != null && record.kelas_kekeringan
      ? `${record.kelas_kekeringan}`
      : record.prakiraan_sifat_hujan_mk;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
      <DetailTile label="Prakiraan Awal Kemarau" value={amkDisplay} accent />
      <DetailTile label="Puncak Kemarau (BMKG)" value={record.prakiraan_pmk_bulan} accent />
      <DetailTile label="Estimasi Hujan MK" value={rainDisplay} />
      <DetailTile label="Risiko Kekeringan" value={droughtDisplay} accent />
      <DetailTile label="Keringkan Sawah MT2" value={record.rekomendasi_keringkan_sawah_mt2} />
      <DetailTile label="Tanam Palawija MT3" value={record.rekomendasi_tanam_palawija_mt3} accent />
    </div>
  );
}
