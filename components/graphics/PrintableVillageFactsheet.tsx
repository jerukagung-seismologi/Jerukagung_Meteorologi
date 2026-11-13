"use client";

import React, { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, X, Calendar, Droplets, ShieldAlert, Wheat, CheckCircle2 } from "lucide-react";
import { HujanRecord, KemarauRecord, SeasonId } from "@/lib/seasonalPredictionTypes";

interface PrintableVillageFactsheetProps {
  isOpen: boolean;
  onClose: () => void;
  record?: HujanRecord | KemarauRecord;
  season: SeasonId;
  wilayahName: string;
  isDesa?: boolean;
  kecamatanName?: string;
}

export const PrintableVillageFactsheet: React.FC<PrintableVillageFactsheetProps> = ({
  isOpen,
  onClose,
  record,
  season,
  wilayahName,
  isDesa = false,
  kecamatanName,
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !record) return null;

  const isHujan = season === "hujan";
  const katam = record.katam;
  const cews = record.cews;

  const judulWilayah = isDesa && kecamatanName
    ? `DESA ${wilayahName.toUpperCase()}, KECAMATAN ${kecamatanName.toUpperCase()}`
    : `KECAMATAN ${wilayahName.toUpperCase()}`;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl print:max-w-none print:max-h-none print:overflow-visible print:border-none print:shadow-none print:p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Lembar Informasi Iklim & Kalender Tanam Desa</DialogTitle>
          <DialogDescription>
            Dokumen cetak resmi informasi prakiraan iklim, rekomendasi kalender tanam, dan indikator CEWS BMKG Kabupaten Kebumen
          </DialogDescription>
        </DialogHeader>

        {/* Header Action Bar (Hidden on print) */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-3 bg-slate-100 dark:bg-gray-800/90 border-b border-gray-200 dark:border-gray-700 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">
              Pratinjau Lembar Informasi Iklim & Kalender Tanam
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
              className="text-gray-600 dark:text-gray-300"
            >
              <X className="w-4 h-4" />
              <span>Tutup</span>
            </Button>
          </div>
        </div>

        {/* PRINTABLE SHEET CONTAINER */}
        <div
          ref={printAreaRef}
          id="printable-factsheet"
          className="p-8 sm:p-10 text-gray-900 bg-white print:p-6 print:m-0 print:text-black print:bg-white print:w-full"
          style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
        >
          {/* Header Kop Surat */}
          <div className="border-b-2 border-black pb-4 mb-6">
            <div className="flex items-center justify-between gap-4">
              <div className="w-16 h-16 flex items-center justify-center bg-blue-900 text-white font-black text-xl rounded-lg print:border print:border-black print:bg-white print:text-black">
                BMKG
              </div>
              <div className="text-center flex-1">
                <h3 className="text-xs uppercase tracking-widest font-semibold text-gray-600 print:text-black">
                  Badan Meteorologi Klimatologi dan Geofisika
                </h3>
                <h1 className="text-lg sm:text-xl font-black uppercase text-gray-900 tracking-tight print:text-black">
                  Stasiun Meteorologi Kelas III Jerukagung Kebumen
                </h1>
                <p className="text-xs text-gray-600 print:text-black mt-0.5">
                  Jl. Jerukagung No. 01, Klirong, Kebumen, Jawa Tengah | Portal Iklim & Agroklimat Terpadu
                </p>
              </div>
              <div className="w-16 h-16 flex flex-col items-center justify-center border border-gray-300 rounded-lg p-1 text-center print:border-black">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Tahun</span>
                <span className="text-base font-black text-blue-900 print:text-black">2026</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-300 text-center">
              <h2 className="text-base font-extrabold tracking-wide uppercase text-blue-950 print:text-black">
                LEMBAR INFORMASI IKLIM DESA & PANDUAN POLA TANAM (KATAM)
              </h2>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-semibold text-gray-700 print:text-black">
                <span>WILAYAH: <strong className="text-black font-black">{judulWilayah}</strong></span>
                <span>•</span>
                <span>MUSIM: <strong className="text-black font-black">{isHujan ? "MUSIM HUJAN 2026/2027" : "MUSIM KEMARAU 2026"}</strong></span>
                <span>•</span>
                <span>TANGGAL CETAK: <strong>{currentDate}</strong></span>
              </div>
            </div>
          </div>

          {/* SECTION 1: RINGKASAN PROFIL MUSIM & IKLIM */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 print:text-black border-b border-gray-300 pb-1 mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-700 print:text-black" />
              1. Ringkasan Prakiraan & Karakteristik Musim
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 border border-gray-200 rounded-lg bg-slate-50 print:bg-white print:border-black">
                <div className="text-[10px] text-gray-500 font-semibold uppercase">Awal Musim (AMH/AMK)</div>
                <div className="text-sm font-black text-gray-900 mt-0.5">
                  {(record as any).prakiraan_awal_musim_label || (record as any).awal_musim_dasarian || "-"}
                </div>
                <div className="text-[10px] text-gray-600 mt-0.5">
                  Status: <strong>{(record as any).perbandingan_thd_normal || "Sama dg Normal"}</strong>
                </div>
              </div>

              <div className="p-2.5 border border-gray-200 rounded-lg bg-slate-50 print:bg-white print:border-black">
                <div className="text-[10px] text-gray-500 font-semibold uppercase">Puncak Musim</div>
                <div className="text-sm font-black text-gray-900 mt-0.5">
                  {(record as any).prakiraan_puncak_bulan || (record as any).prakiraan_pmk_bulan || "-"}
                </div>
                <div className="text-[10px] text-gray-600 mt-0.5">
                  Normal: <strong>{(record as any).normal_puncak_bulan || (record as any).normal_pmk_bulan || "-"}</strong>
                </div>
              </div>

              <div className="p-2.5 border border-gray-200 rounded-lg bg-slate-50 print:bg-white print:border-black">
                <div className="text-[10px] text-gray-500 font-semibold uppercase">Sifat Curah Hujan</div>
                <div className="text-sm font-black text-gray-900 mt-0.5">
                  {(record as any).sifat_hujan_label || "Normal"}
                </div>
                <div className="text-[10px] text-gray-600 mt-0.5">
                  Rasio: <strong>{(record as any).persentase_terhadap_normal ? `${(record as any).persentase_terhadap_normal}%` : "100%"}</strong>
                </div>
              </div>

              <div className="p-2.5 border border-gray-200 rounded-lg bg-slate-50 print:bg-white print:border-black">
                <div className="text-[10px] text-gray-500 font-semibold uppercase">Estimasi Akumulasi</div>
                <div className="text-sm font-black text-gray-900 mt-0.5">
                  {(record as any).estimasi_curah_hujan_mm ? `${(record as any).estimasi_curah_hujan_mm.toLocaleString("id-ID")} mm` : "-"}
                </div>
                <div className="text-[10px] text-gray-600 mt-0.5">
                  Durasi: <strong>{(record as any).panjang_musim_dasarian ? `${(record as any).panjang_musim_dasarian} Dasarian` : "-"}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: KALENDER TANAM TERPADU (KATAM) */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 print:text-black border-b border-gray-300 pb-1 mb-2 flex items-center gap-1.5">
              <Wheat className="w-3.5 h-3.5 text-emerald-700 print:text-black" />
              2. Jadwal Kalender Tanam Dinamis (Katam) & Rekomendasi Agronomi
            </h3>
            {katam ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* MT1 */}
                <div className="p-3 border border-emerald-300 rounded-lg bg-emerald-50/40 print:bg-white print:border-black">
                  <div className="flex items-center justify-between pb-1 border-b border-emerald-200">
                    <span className="font-extrabold text-emerald-950 text-xs uppercase">{katam.mt1?.nama || "MT1 (Padi Rendeng)"}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">Rendeng</span>
                  </div>
                  <div className="mt-2 text-xs font-black text-gray-900">
                    Mulai Tanam: {katam.mt1?.tanam || "-"} (Panen: {katam.mt1?.panen || "-"})
                  </div>
                  <div className="mt-1 text-[11px] text-gray-700">
                    <strong>Varietas:</strong> {(katam.mt1?.varietas || []).join(", ") || "Inpari 32, Ciherang"}
                  </div>
                  <div className="mt-1.5 text-[10px] text-gray-600 leading-snug">
                    <strong>Petunjuk:</strong> {katam.mt1?.tips || "-"}
                  </div>
                </div>

                {/* MT2 */}
                <div className="p-3 border border-blue-300 rounded-lg bg-blue-50/40 print:bg-white print:border-black">
                  <div className="flex items-center justify-between pb-1 border-b border-blue-200">
                    <span className="font-extrabold text-blue-950 text-xs uppercase">{katam.mt2?.nama || "MT2 (Padi Gadu)"}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded">Gadu</span>
                  </div>
                  <div className="mt-2 text-xs font-black text-gray-900">
                    Mulai Tanam: {katam.mt2?.tanam || "-"} (Panen: {katam.mt2?.panen || "-"})
                  </div>
                  <div className="mt-1 text-[11px] text-gray-700">
                    <strong>Varietas:</strong> {(katam.mt2?.varietas || []).join(", ") || "Inpari 32, Mekongga"}
                  </div>
                  <div className="mt-1.5 text-[10px] text-gray-600 leading-snug">
                    <strong>Petunjuk:</strong> {katam.mt2?.tips || "-"}
                  </div>
                </div>

                {/* MT3 */}
                <div className="p-3 border border-amber-300 rounded-lg bg-amber-50/40 print:bg-white print:border-black">
                  <div className="flex items-center justify-between pb-1 border-b border-amber-200">
                    <span className="font-extrabold text-amber-950 text-xs uppercase">{katam.mt3?.nama || "MT3 (Palawija)"}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded">Palawija</span>
                  </div>
                  <div className="mt-2 text-xs font-black text-gray-900">
                    Mulai Tanam: {katam.mt3?.tanam || "-"} (Panen: {katam.mt3?.panen || "-"})
                  </div>
                  <div className="mt-1 text-[11px] text-gray-700">
                    <strong>Komoditas:</strong> {(katam.mt3?.komoditas || katam.mt3?.varietas || []).join(", ") || "Kedelai, Jagung, Kacang Hijau"}
                  </div>
                  <div className="mt-1.5 text-[10px] text-gray-600 leading-snug">
                    <strong>Petunjuk:</strong> {katam.mt3?.tips || "-"}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">Data profil Kalender Tanam tidak tersedia.</p>
            )}
          </div>


          {/* SECTION 3: MONITORING KEKERINGAN & PERINGATAN DINI (CEWS BMKG) */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 print:text-black border-b border-gray-300 pb-1 mb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-orange-700 print:text-black" />
              3. Monitoring Hari Tanpa Hujan (HTH) & Neraca Air Standardized Precipitation Index (SPI)
            </h3>
            {cews ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 border border-gray-200 rounded-lg bg-slate-50 print:bg-white print:border-black">
                  <div className="text-[10px] text-gray-500 font-semibold uppercase">Hari Tanpa Hujan (HTH)</div>
                  <div className="text-sm font-black text-gray-900 mt-0.5">{cews.hth_hari} Hari</div>
                  <div className="text-[10px] text-gray-600 mt-0.5 font-medium">{cews.hth_kategori}</div>
                </div>

                <div className="p-2.5 border border-gray-200 rounded-lg bg-slate-50 print:bg-white print:border-black">
                  <div className="text-[10px] text-gray-500 font-semibold uppercase">Peringatan Dini (PDCHT)</div>
                  <div className="text-sm font-black text-emerald-800 print:text-black mt-0.5">{cews.pdcht_status}</div>
                  <div className="text-[10px] text-gray-600 mt-0.5 truncate">{cews.pdcht_keterangan}</div>
                </div>

                <div className="p-2.5 border border-gray-200 rounded-lg bg-slate-50 print:bg-white print:border-black">
                  <div className="text-[10px] text-gray-500 font-semibold uppercase">SPI 1-Bulan (Oktober 2026)</div>
                  <div className="text-sm font-black text-gray-900 mt-0.5">{cews.spi_1_bulan.toFixed(2)}</div>
                  <div className="text-[10px] text-gray-600 mt-0.5">{cews.spi_1_kategori}</div>
                </div>

                <div className="p-2.5 border border-gray-200 rounded-lg bg-slate-50 print:bg-white print:border-black">
                  <div className="text-[10px] text-gray-500 font-semibold uppercase">SPI 3-Bulan (Agust-Okt 2026)</div>
                  <div className="text-sm font-black text-gray-900 mt-0.5">{cews.spi_3_bulan.toFixed(2)}</div>
                  <div className="text-[10px] text-gray-600 mt-0.5">{cews.spi_3_kategori}</div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">Data metrik CEWS BMKG tidak tersedia.</p>
            )}
          </div>

          {/* SECTION 4: REKOMENDASI TAKTIS POKTAN & GAPOKTAN */}
          <div className="mb-8 p-3.5 border border-gray-300 rounded-lg bg-slate-50/80 print:bg-white print:border-black">
            <h4 className="text-xs font-bold uppercase text-gray-900 print:text-black mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 print:text-black" />
              4. Rekomendasi Tindak Lanjut bagi Petani, Gapoktan, dan Petugas Penyuluh Lapangan (PPL):
            </h4>
            <ul className="text-[11px] text-gray-700 print:text-black space-y-1 list-disc list-inside">
              <li>
                <strong>Olah Tanah & Persemaian:</strong> Sinkronkan jadwal semai dan olah lahan dengan tanggal rekomendasi Katam MT1 agar tidak mengalami kekeringan awal atau genangan berlebih.
              </li>
              <li>
                <strong>Pemilihan Benih Bersertifikat:</strong> Gunakan varietas padi berumur genjah (105–115 hari) toleran rendaman atau kekeringan sesuai rekomendasi agronomi setempat.
              </li>
              <li>
                <strong>Manajemen Air & Drainase:</strong> Lakukan perbaikan saluran irigasi tersier dan pembersihan drainase sawah sebelum puncak musim hujan tiba guna mencegah banjir luapan.
              </li>
              <li>
                <strong>Konsultasi Berkala:</strong> Pantau pembaharuan informasi cuaca dasarian dan konsultasikan langkah pengendalian organisme pengganggu tanaman (OPT) dengan Balai Penyuluhan Pertanian (BPP) terdekat.
              </li>
            </ul>
          </div>

          {/* Tanda Tangan / Footer */}
          <div className="mt-8 pt-4 border-t border-gray-300 grid grid-cols-2 text-center text-xs text-gray-800 print:text-black">
            <div>
              <p className="text-[11px] text-gray-600 print:text-black">Mengetahui,</p>
              <p className="font-bold text-xs uppercase mt-0.5">Balai Penyuluhan Pertanian (BPP)</p>
              <p className="text-[10px] text-gray-500 print:text-black">Wilayah Binaan Kec. {kecamatanName || wilayahName}</p>
              <div className="h-14"></div>
              <p className="font-semibold underline text-xs">( Koordinator Penyuluh Pertanian )</p>
              <p className="text-[10px] text-gray-500">NIP. ...................................................</p>
            </div>

            <div>
              <p className="text-[11px] text-gray-600 print:text-black">Kebumen, {currentDate}</p>
              <p className="font-bold text-xs uppercase mt-0.5">Stasiun Meteorologi Jerukagung</p>
              <p className="text-[10px] text-gray-500 print:text-black">Koordinator Unit Informasi & Agroklimat</p>
              <div className="h-14"></div>
              <p className="font-semibold underline text-xs">( Tim Agroklimat BMKG Jerukagung )</p>
              <p className="text-[10px] text-gray-500">Katalog Data Geospasial Resolusi 250m</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrintableVillageFactsheet;
