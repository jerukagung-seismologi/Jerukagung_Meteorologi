export type SeasonId = "hujan" | "kemarau";

export type BasemapId = "jalan" | "satelit" | "topografi";

export interface HujanRecord {
  kecamatan: string;
  normal_amh_dasarian: number;
  normal_amh_label: string;
  prakiraan_amh_dasarian: number;
  prakiraan_amh_label: string;
  perbandingan_terhadap_normal: string;
  probabilitas_maju_pct: number;
  probabilitas_sama_pct: number;
  probabilitas_mundur_pct: number;
  prakiraan_sifat_hujan: string;
  prakiraan_puncak_bulan: string;
  normal_puncak_bulan: string;
  perbandingan_puncak_thd_normal: string;
  prakiraan_puncak_dasarian: number;
  prakiraan_puncak_label: string;
  rekomendasi_olah_tanah: string;
  rekomendasi_tanam_padi_mt1: string;
}

export interface KemarauRecord {
  kecamatan: string;
  normal_amk_dasarian: number;
  normal_amk_label: string;
  prakiraan_amk_dasarian: number;
  prakiraan_amk_label: string;
  perbandingan_terhadap_normal: string;
  probabilitas_maju_pct: number;
  probabilitas_sama_pct: number;
  probabilitas_mundur_pct: number;
  prakiraan_sifat_hujan_mk: string;
  prakiraan_pmk_bulan: string;
  normal_pmk_bulan: string;
  perbandingan_pmk_thd_normal: string;
  prakiraan_pmk_dasarian: number;
  prakiraan_pmk_label: string;
  rekomendasi_keringkan_sawah_mt2: string;
  rekomendasi_tanam_palawija_mt3: string;
}

export interface RasterOverlayMeta {
  id: string;
  season: SeasonId;
  label: string;
  unit: string;
  min: number;
  max: number;
  minLabel: string;
  maxLabel: string;
  gradientColors: string[];
  url: string;
  bounds: [[number, number], [number, number]];
}

export interface SeasonalDataset {
  metadata: {
    generated_at: string;
    kabupaten: string;
    total_kecamatan: number;
    model: string;
    standard: string;
    seasons: {
      hujan: { id: string; title: string; enso_context: string; normal_period: string };
      kemarau: { id: string; title: string; enso_context: string; normal_period: string };
    };
  };
  overlays: RasterOverlayMeta[];
  hujan: HujanRecord[];
  kemarau: KemarauRecord[];
}

export interface UnifiedLayerDef {
  id: string;
  kind: "polygon" | "raster";
  season: SeasonId;
  label: string;
  bannerTitle: string;
  field?: string;
  colorMap?: Record<string, string>;
  order?: string[];
  rasterId?: string;
}
