# Struktur Data Spasial & Prediksi Musim Multi-Kabupaten
Stasiun Meteorologi Kelas III Jerukagung - BMKG

Direktori `public/data/` diorganisasi secara modular dan terisolasi per kabupaten untuk memudahkan skalabilitas penambahan wilayah operasional tanpa menimbulkan konflik file atau regresi performa.

---

## 1. Daftar Wilayah Operasional (9 Wilayah Administrasi)

Sistem Web GIS dan Prediksi Iklim saat ini mencakup **9 wilayah administratif** di Jawa Tengah dan Jawa Timur, mencakup total **145 Kecamatan** dan **2.531 Desa/Kelurahan**:

| No | Wilayah / Kabupaten | Kode BPS / Kemendagri | Gugus Wilayah | Kecamatan | Desa / Kelurahan | Status Data |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|
| 1 | **Kabupaten Kebumen** | `33.05` | Kedu Selatan | 26 | 460 | Lengkap (Aktif + 26 Thn Arsip) |
| 2 | **Kabupaten Purworejo** | `33.06` | Kedu Selatan | 16 | 494 | Lengkap (Aktif + 26 Thn Arsip) |
| 3 | **Kabupaten Wonosobo** | `33.07` | Kedu Pegunungan | 15 | 265 | Lengkap (Aktif + 26 Thn Arsip) |
| 4 | **Kabupaten Magelang** | `33.08` | Kedu Timur | 21 | 372 | Lengkap (Aktif + 26 Thn Arsip) |
| 5 | **Kota Magelang** | `33.71` | Kedu Perkotaan | 3 | 17 | Lengkap (Aktif + 26 Thn Arsip) |
| 6 | **Kabupaten Temanggung** | `33.23` | Kedu Utara | 20 | 289 | Lengkap (Aktif + 26 Thn Arsip) |
| 7 | **Kabupaten Klaten** | `33.10` | Solo Raya | 26 | 401 | Lengkap (Aktif + 26 Thn Arsip) |
| 8 | **Kabupaten Madiun** | `35.19` | Jawa Timur Barat | 15 | 206 | Lengkap (Aktif + 26 Thn Arsip) |
| 9 | **Kota Madiun** | `35.77` | Jawa Timur Perkotaan | 3 | 27 | Lengkap (Aktif + 26 Thn Arsip) |
| **Total** | **9 Wilayah** | - | - | **145 Kecamatan** | **2.531 Desa** | **27 Musim / Wilayah** |

---

## 2. Struktur Direktori Standar

Setiap kabupaten memiliki folder dedicated dengan susunan file yang seragam:

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
├── purworejo/ ...
├── wonosobo/ ...
├── magelang/ ...
├── kota_magelang/ ...
├── temanggung/ ...
├── klaten/ ...
├── madiun/ ...
└── kota_madiun/ ...
```

---

## 3. Fitur Multi-Wilayah di Web GIS Dashboard

1. **Dropdown Switcher Terkelompok (`<optgroup>`):**
   - **Semua Wilayah:** Menampilkan seluruh 9 wilayah sekaligus dalam satu peta interaktif gabungan.
   - **Eks Karesidenan Kedu:** Kebumen, Purworejo, Wonosobo, Magelang, Kota Magelang, Temanggung.
   - **Solo Raya:** Klaten.
   - **Jawa Timur:** Madiun, Kota Madiun.
2. **Katalog Musim Otomatis:**
   - Memilih wilayah akan otomatis memuat `musim_catalog.json` wilayah tersebut (27 musim: 1 musim aktif + 26 arsip evaluasi 2000–2025).
3. **Sinkronisasi Cloud Firestore:**
   - Koleksi Firestore berformat `musim_<id_kabupaten>` siap untuk mode dynamic fetching atau offline fallback ke file statis di `public/data/`.
