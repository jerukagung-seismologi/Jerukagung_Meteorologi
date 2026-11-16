# Struktur Data Spasial & Prediksi Musim Multi-Kabupaten
Stasiun Meteorologi Kelas III Jerukagung - BMKG

Direktori `public/data/` diorganisasi secara modular dan terisolasi per kabupaten untuk memudahkan skalabilitas penambahan wilayah baru di masa mendatang tanpa menimbulkan konflik file.

## Struktur Direktori

Setiap kabupaten memiliki folder dedicated dengan struktur file yang seragam:

```text
public/data/
├── kebumen/
│   ├── arsip/                        # Arsip evaluasi per tahun (musim_2000 s.d. musim_2025)
│   │   └── musim_<tahun>/
│   │       ├── overlays/             # 5 file PNG overlay tergeoreferensi EPSG:3857
│   │       ├── prediksi_musim.json
│   │       └── prediksi_musim_desa.json
│   ├── overlays/                     # 5 file PNG overlay musim aktif (EPSG:3857)
│   │   ├── amh_dasarian_250m.png
│   │   ├── total_hujan_mh_250m.png
│   │   ├── amk_dasarian_250m.png
│   │   ├── total_hujan_mk_250m.png
│   │   └── kerawanan_kekeringan_250m.png
│   ├── kebumen_kecamatan.json        # GeoJSON poligon kecamatan (teroptimasi)
│   ├── kebumen_desa.json             # GeoJSON poligon desa/kelurahan (teroptimasi)
│   ├── musim_catalog.json            # Katalog daftar musim aktif & arsip historis
│   ├── prediksi_musim.json           # Data tabular tingkat kecamatan (musim aktif)
│   └── prediksi_musim_desa.json      # Data tabular tingkat desa (musim aktif)
│
├── purworejo/
│   ├── arsip/
│   ├── overlays/
│   ├── purworejo_kecamatan.json
│   ├── purworejo_desa.json
│   ├── musim_catalog.json
│   ├── prediksi_musim.json
│   └── prediksi_musim_desa.json
│
└── <kabupaten_baru>/
    ├── arsip/
    ├── overlays/
    ├── <kabupaten>_kecamatan.json
    ├── <kabupaten>_desa.json
    ├── musim_catalog.json
    ├── prediksi_musim.json
    └── prediksi_musim_desa.json
```

## Panduan Menambahkan Kabupaten Baru

1. **Siapkan Data & GeoJSON:**
   - Masukkan batas administrasi ke `<kabupaten>_kecamatan.json` dan `<kabupaten>_desa.json`.
   - Jalankan generator arsip dan musim aktif:
     ```bash
     python prediksi_musim/generate_archive_seasons.py --kabupaten <nama_kabupaten>
     ```
2. **Sinkronkan ke Cloud Firestore:**
     ```bash
     python prediksi_musim/sync_to_firestore.py --kabupaten <nama_kabupaten> --sync-all-archives
     ```
3. **Daftarkan di Web Dashboard:**
   - Tambahkan entri baru ke `KABUPATEN_CONFIGS` di `components/graphics/SeasonalPredictionMap.tsx`:
     ```typescript
     {
       id: "<id_kabupaten>",
       name: "Kabupaten <Nama>",
       shortName: "<Nama>",
       totalKec: <jumlah_kecamatan>,
       totalDesa: <jumlah_desa>,
       kecGeoUrl: "/data/<id_kabupaten>/<id_kabupaten>_kecamatan.json",
       desaGeoUrl: "/data/<id_kabupaten>/<id_kabupaten>_desa.json",
       center: [<lat>, <lon>],
       zoom: 11,
     }
     ```
   Dropdown switcher di dashboard secara otomatis akan mendeteksi kabupaten baru, memuat batas GeoJSON, overlay raster, dan data tabularnya.
