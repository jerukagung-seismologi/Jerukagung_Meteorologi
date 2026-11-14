import { firestore } from "./FirebaseConfig";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

export interface SeasonDataset {
  metadata?: any;
  overlays?: any[];
  hujan?: any[];
  kemarau?: any[];
}

let catalogCache: any = null;
const seasonDataCache = new Map<string, any>();

/**
 * Mengambil data master katalog musim dari Cloud Firestore
 * dengan fallback otomatis ke /data/musim_catalog.json jika offline/gagal.
 */
export async function getSeasonalCatalog(): Promise<any> {
  if (catalogCache) return catalogCache;

  try {
    const docRef = doc(firestore, "musim_kebumen", "catalog");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      catalogCache = snap.data();
      return catalogCache;
    }
  } catch (err) {
    console.warn("[Firestore] Gagal memuat katalog dari Firestore, menggunakan fallback JSON:", err);
  }

  // Fallback ke berkas lokal
  const res = await fetch("/data/musim_catalog.json");
  if (!res.ok) throw new Error("Gagal mengambil master katalog musim.");
  catalogCache = await res.json();
  return catalogCache;
}

/**
 * Mengambil data musim (aktif 2026/2027 maupun 11 tahun arsip 2015–2025) langsung dari Cloud Firestore
 * (Chunked Architecture: 27 reads per musim) dengan rekonstruksi otomatis untuk dataset kecamatan dan 460 desa.
 * Dilengkapi graceful fallback ganda ke berkas JSON lokal di CDN.
 */
export async function getSeasonData(
  seasonId = "2026_2027",
  folder = ""
): Promise<{
  kecDataset: SeasonDataset;
  desaDataset: SeasonDataset;
  source: "firestore" | "fallback_json";
}> {
  const cacheKey = `${seasonId}_${folder}`;
  if (seasonDataCache.has(cacheKey)) {
    return seasonDataCache.get(cacheKey);
  }

  let result: {
    kecDataset: SeasonDataset;
    desaDataset: SeasonDataset;
    source: "firestore" | "fallback_json";
  };

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

        result = {
          kecDataset,
          desaDataset,
          source: "firestore",
        };
        seasonDataCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    console.warn(`[Firestore] Gagal memuat musim ${seasonId} dari Firestore, beralih ke fallback JSON statis:`, err);
  }

  // Fallback ganda ke JSON statis lokal
  const basePath = folder ? `/data/${folder}` : "/data";
  const [kecRes, desaRes] = await Promise.all([
    fetch(`${basePath}/prediksi_musim.json`),
    fetch(`${basePath}/prediksi_musim_desa.json`).catch(() => null),
  ]);

  if (!kecRes.ok) throw new Error(`Gagal memuat dataset prediksi musim (${seasonId}).`);
  const kecDataset = await kecRes.json();
  const desaDataset = desaRes && desaRes.ok ? await desaRes.json() : null;

  result = {
    kecDataset,
    desaDataset,
    source: "fallback_json",
  };
  seasonDataCache.set(cacheKey, result);
  return result;
}

/** Alias untuk kompatibilitas ke belakang */
export const getActiveSeasonData = getSeasonData;
