import { firestore } from "./FirebaseConfig";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

export interface SeasonDataset {
  metadata?: any;
  overlays?: any[];
  hujan?: any[];
  kemarau?: any[];
}

/**
 * Mengambil data master katalog musim dari Cloud Firestore
 * dengan fallback otomatis ke /data/musim_catalog.json jika offline/gagal.
 */
export async function getSeasonalCatalog(): Promise<any> {
  try {
    const docRef = doc(firestore, "musim_kebumen", "catalog");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (err) {
    console.warn("[Firestore] Gagal memuat katalog dari Firestore, menggunakan fallback JSON:", err);
  }

  // Fallback ke berkas lokal
  const res = await fetch("/data/musim_catalog.json");
  if (!res.ok) throw new Error("Gagal mengambil master katalog musim.");
  return res.json();
}

/**
 * Mengambil data musim aktif (2026/2027) langsung dari Cloud Firestore (Chunked Architecture: 27 reads)
 * dengan rekonstruksi otomatis untuk dataset kecamatan dan dataset 460 desa.
 * Dilengkapi graceful fallback ke berkas JSON lokal (/data/prediksi_musim.json & /data/prediksi_musim_desa.json).
 */
export async function getActiveSeasonData(seasonId = "2026_2027"): Promise<{
  kecDataset: SeasonDataset;
  desaDataset: SeasonDataset;
  source: "firestore" | "fallback_json";
}> {
  try {
    const seasonDocRef = doc(firestore, "musim_kebumen", seasonId);
    const seasonSnap = await getDoc(seasonDocRef);

    if (seasonSnap.exists()) {
      const overview = seasonSnap.data();
      const kecColRef = collection(firestore, "musim_kebumen", seasonId, "kecamatan");
      const kecSnaps = await getDocs(kecColRef);

      if (!kecSnaps.empty) {
        const hujanKec: any[] = [];
        const kemarauKec: any[] = [];
        const hujanDesa: any[] = [];
        const kemarauDesa: any[] = [];

        kecSnaps.forEach((d) => {
          const chunk = d.data();
          if (chunk.hujan && Object.keys(chunk.hujan).length > 0) {
            hujanKec.push(chunk.hujan);
          }
          if (chunk.kemarau && Object.keys(chunk.kemarau).length > 0) {
            kemarauKec.push(chunk.kemarau);
          }
          if (Array.isArray(chunk.desa_hujan)) {
            hujanDesa.push(...chunk.desa_hujan);
          }
          if (Array.isArray(chunk.desa_kemarau)) {
            kemarauDesa.push(...chunk.desa_kemarau);
          }
        });

        const kecDataset: SeasonDataset = {
          metadata: overview.metadata,
          overlays: overview.overlays,
          hujan: hujanKec,
          kemarau: kemarauKec,
        };

        const desaDataset: SeasonDataset = {
          metadata: overview.metadata,
          hujan: hujanDesa,
          kemarau: kemarauDesa,
        };

        return {
          kecDataset,
          desaDataset,
          source: "firestore",
        };
      }
    }
  } catch (err) {
    console.warn("[Firestore] Gagal memuat musim dari Firestore, beralih ke fallback JSON statis:", err);
  }

  // Fallback ganda ke JSON statis lokal
  const [kecRes, desaRes] = await Promise.all([
    fetch("/data/prediksi_musim.json"),
    fetch("/data/prediksi_musim_desa.json").catch(() => null),
  ]);

  if (!kecRes.ok) throw new Error("Gagal memuat dataset prediksi musim.");
  const kecDataset = await kecRes.json();
  const desaDataset = desaRes && desaRes.ok ? await desaRes.json() : null;

  return {
    kecDataset,
    desaDataset,
    source: "fallback_json",
  };
}
