"use client";

import React, { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed } from "lucide-react";
import type {
  AdminLevel,
  BasemapId,
  HujanRecord,
  KemarauRecord,
  RasterOverlayMeta,
  UnifiedLayerDef,
} from "@/lib/seasonalPredictionTypes";

interface SeasonalLeafletCanvasProps {
  geojson: GeoJSON.FeatureCollection;
  records: (HujanRecord | KemarauRecord)[];
  adminLevel: AdminLevel;
  activeLayer: UnifiedLayerDef | null;
  activeRasterOverlay: RasterOverlayMeta | null;
  basemap: BasemapId;
  opacity: number;
  selectedCode: string | null;
  onSelectCode: (code: string | null) => void;
  isDarkMode?: boolean;
}

const BASEMAP_CONFIGS: Record<
  BasemapId,
  {
    url: string;
    attribution: string;
    maxZoom: number;
  }
> = {
  jalan: {
    url: "https://tile.openstreetmap.de/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 18,
  },
  satelit: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri World Imagery",
    maxZoom: 18,
  },
  topografi: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenTopoMap (CC-BY-SA)",
    maxZoom: 17,
  },
};

export default function SeasonalLeafletCanvas({
  geojson,
  records,
  adminLevel,
  activeLayer,
  activeRasterOverlay,
  basemap,
  opacity,
  selectedCode,
  onSelectCode,
}: SeasonalLeafletCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const rasterLayerRef = useRef<L.ImageOverlay | null>(null);
  const geoLayerRef = useRef<L.GeoJSON | null>(null);
  const boundsRef = useRef<L.LatLngBounds | null>(null);
  const onSelectRef = useRef(onSelectCode);

  onSelectRef.current = onSelectCode;

  const activeField =
    adminLevel === "desa" && activeLayer?.desaField ? activeLayer.desaField : activeLayer?.field;

  const recordMap = useMemo(() => {
    const map = new Map<string, HujanRecord | KemarauRecord>();
    for (const r of records) {
      const key = r.code || r.kecamatan;
      map.set(key, r);
    }
    return map;
  }, [records]);

  const legendItems = useMemo(() => {
    if (!activeLayer || activeLayer.kind !== "polygon" || !activeField || !activeLayer.colorMap) {
      return [];
    }
    const colorMap = activeLayer.colorMap;
    const present = new Set(
      records.map((r) => String((r as unknown as Record<string, unknown>)[activeField] ?? ""))
    );
    const ordered = (activeLayer.order || []).filter((c) => present.has(c));
    const extras = Array.from(present).filter((c) => c && !ordered.includes(c));
    return [...ordered, ...extras].map((cat) => ({
      label: cat,
      color: colorMap[cat] || "#94a3b8",
    }));
  }, [records, activeLayer, activeField]);

  // Inisialisasi peta Leaflet satu kali dengan kontrol zoom di kanan atas (gaya CEWS)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [-7.66, 109.63],
      zoom: 11,
      minZoom: 9,
      maxZoom: 16,
      zoomControl: false,
    });

    L.control.zoom({ position: "topright" }).addTo(map);

    const rasterPane = map.createPane("raster250mPane");
    rasterPane.style.zIndex = "350";
    rasterPane.style.pointerEvents = "none";

    const initialGeo = L.geoJSON(geojson);
    const bounds = initialGeo.getBounds();
    if (bounds.isValid()) {
      boundsRef.current = bounds;
      map.fitBounds(bounds, { padding: [32, 32] });
    }

    mapRef.current = map;

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      rasterLayerRef.current = null;
      geoLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Perbarui Basemap Tile
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    const cfg = BASEMAP_CONFIGS[basemap];
    const tile = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: cfg.maxZoom,
    }).addTo(map);
    tileLayerRef.current = tile;
  }, [basemap]);

  // Perbarui Overlay Raster 250m
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (rasterLayerRef.current) {
      map.removeLayer(rasterLayerRef.current);
      rasterLayerRef.current = null;
    }

    if (activeLayer?.kind === "raster" && activeRasterOverlay) {
      const overlay = L.imageOverlay(activeRasterOverlay.url, activeRasterOverlay.bounds, {
        opacity,
        interactive: false,
        pane: "raster250mPane",
      }).addTo(map);
      rasterLayerRef.current = overlay;
    }
  }, [activeLayer, activeRasterOverlay, opacity]);

  // Perbarui Poligon Wilayah (Kecamatan atau Desa/Kelurahan)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (geoLayerRef.current) {
      map.removeLayer(geoLayerRef.current);
      geoLayerRef.current = null;
    }

    const isDarkBasemap = basemap === "satelit";
    const defaultBorderColor = isDarkBasemap ? "#e2e8f0" : "#1e293b";
    const defaultWeight = adminLevel === "desa" ? 0.65 : 1.25;
    const isPolygonFill = activeLayer?.kind === "polygon" && Boolean(activeField);

    const layer = L.geoJSON(geojson, {
      style: (feature) => {
        const props = (feature?.properties || {}) as Record<string, unknown>;
        const code = String(props.code || props.nm_kecamatan || props.name || "");
        const rec = recordMap.get(code);
        const catVal =
          isPolygonFill && rec && activeField
            ? String((rec as unknown as Record<string, unknown>)[activeField] ?? "")
            : "";
        const fillColor =
          isPolygonFill && activeLayer?.colorMap ? activeLayer.colorMap[catVal] || "#94a3b8" : "transparent";
        const isSelected = code === selectedCode;

        return {
          fillColor,
          fillOpacity: isPolygonFill ? opacity : 0.03,
          color: isSelected ? "#0284c7" : defaultBorderColor,
          weight: isSelected ? 2.8 : defaultWeight,
          opacity: isSelected ? 1 : adminLevel === "desa" ? 0.72 : 0.85,
        };
      },
      onEachFeature: (feature, featureLayer) => {
        const props = (feature?.properties || {}) as Record<string, unknown>;
        const code = String(props.code || props.nm_kecamatan || props.name || "");
        const name = String(props.name || props.nm_kelurahan || props.nm_kecamatan || "");
        const parentKec = String(props.nm_kecamatan || "");
        const rec = recordMap.get(code);

        const titleHtml =
          adminLevel === "desa"
            ? `<div style="font-weight:700;">Desa/Kel. ${name}</div><div style="font-size:11px;opacity:0.8;">Kec. ${rec?.kecamatan || parentKec}</div>`
            : `<div style="font-weight:700;">Kec. ${name}</div>`;

        let tooltipLine = "Klik untuk detail";
        if (rec && activeLayer) {
          if (activeLayer.kind === "polygon" && activeField) {
            const val = String((rec as unknown as Record<string, unknown>)[activeField] ?? "-");
            tooltipLine = `${activeLayer.label}: <strong>${val}</strong>`;
          } else if (activeLayer.season === "hujan") {
            const hr = rec as HujanRecord;
            tooltipLine = hr.total_hujan_mh_mm
              ? `Total Hujan MH: <strong>${hr.total_hujan_mh_mm.toLocaleString("id-ID")} mm</strong>`
              : `Awal Hujan: <strong>${hr.prakiraan_amh_label}</strong>`;
          } else {
            const kr = rec as KemarauRecord;
            if (activeLayer.rasterId === "kekeringan_250m" && kr.kekeringan_skor != null) {
              tooltipLine = `Skor Kekeringan: <strong>${kr.kekeringan_skor}</strong> (${kr.kelas_kekeringan})`;
            } else if (activeLayer.rasterId === "amk_250m" && kr.amk_label_250m) {
              tooltipLine = `Awal Kemarau (250m): <strong>${kr.amk_label_250m}</strong>`;
            } else if (kr.total_hujan_mk_mm != null) {
              tooltipLine = `Total Hujan MK: <strong>${kr.total_hujan_mk_mm.toLocaleString("id-ID")} mm</strong>`;
            } else {
              tooltipLine = `Awal Kemarau: <strong>${kr.prakiraan_amk_label}</strong>`;
            }
          }
        }

        featureLayer.bindTooltip(
          `<div style="font-family:inherit;font-size:12px;line-height:1.35;">
            ${titleHtml}
            <div style="margin-top:2px;">${tooltipLine}</div>
          </div>`,
          { sticky: true, direction: "auto", opacity: 0.96 }
        );

        featureLayer.on({
          mouseover: (e) => {
            const target = e.target as L.Path;
            target.setStyle({
              weight: adminLevel === "desa" ? 2.2 : 2.8,
              color: "#0ea5e9",
              fillOpacity: isPolygonFill ? Math.min(opacity + 0.12, 1) : 0.14,
            });
            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
              target.bringToFront();
            }
          },
          mouseout: (e) => {
            layer.resetStyle(e.target);
          },
          click: () => {
            if (code) onSelectRef.current(code);
          },
        });
      },
    }).addTo(map);

    geoLayerRef.current = layer;
  }, [geojson, recordMap, adminLevel, activeLayer, activeField, basemap, opacity, selectedCode]);

  const handleResetView = () => {
    if (mapRef.current && boundsRef.current) {
      mapRef.current.fitBounds(boundsRef.current, { padding: [32, 32] });
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {/* Tombol Reset Posisi tepat di bawah Zoom (+/-) kanan atas */}
      <button
        type="button"
        onClick={handleResetView}
        title="Fokus ke Kabupaten Kebumen"
        aria-label="Fokus ke Kabupaten Kebumen"
        className="absolute top-[78px] right-[10px] z-[500] w-[34px] h-[34px] flex items-center justify-center rounded bg-white dark:bg-gray-900 border-2 border-black/20 dark:border-gray-600 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <LocateFixed className="h-4 w-4 text-gray-700 dark:text-gray-200" />
      </button>

      {/* Legenda Gaya CEWS di Pojok Kanan Bawah */}
      {activeLayer && (
        <div className="absolute bottom-6 right-3 z-[500] min-w-[165px] max-w-[235px] rounded-md bg-white/92 dark:bg-gray-900/92 backdrop-blur-sm border border-gray-300 dark:border-gray-700 shadow-lg p-2.5 text-xs">
          {activeLayer.kind === "raster" && activeRasterOverlay ? (
            <div className="space-y-1.5">
              <p className="font-semibold text-[11px] leading-tight text-foreground">
                {activeRasterOverlay.label}
              </p>
              <div
                className="h-3 w-44 rounded-sm border border-gray-300 dark:border-gray-600"
                style={{
                  background: `linear-gradient(to right, ${activeRasterOverlay.gradientColors.join(", ")})`,
                }}
              />
              <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                <span>{activeRasterOverlay.minLabel}</span>
                <span>{activeRasterOverlay.maxLabel}</span>
              </div>
            </div>
          ) : legendItems.length > 0 ? (
            <div className="space-y-1.5">
              <p className="font-semibold text-[11px] leading-tight text-foreground">
                {activeLayer.label}
              </p>
              <div className="flex flex-col gap-1">
                {legendItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-[11px]">
                    <span
                      className="inline-block w-6 h-3.5 rounded-[2px] shrink-0 border border-black/25"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-medium text-gray-800 dark:text-gray-200 truncate">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
