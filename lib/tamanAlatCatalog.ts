export type InstrumentId = "stevenson" | "rain-gauge" | "wind" | "pyranometer" | "evaporation-pan"

export interface InstrumentCatalogEntry {
  id: InstrumentId
  name: string
  shortName: string
  function: string
  measures: string
  placement: string
  maintenance: string
}

export const INSTRUMENT_CATALOG: Record<InstrumentId, InstrumentCatalogEntry> = {
  stevenson: { id: "stevenson", name: "Sangkar Meteorologi", shortName: "Stevenson Screen", function: "Melindungi sensor suhu dan kelembapan dari radiasi langsung sambil mempertahankan ventilasi alami.", measures: "Suhu udara, kelembapan relatif, dan titik embun.", placement: "Sensor sekitar 1,25 m di atas permukaan rumput, jauh dari sumber panas dan penghalang.", maintenance: "Jaga kisi-kisi tetap putih, bersih, kering, dan pintu menghadap arah yang meminimalkan radiasi matahari." },
  "rain-gauge": { id: "rain-gauge", name: "Penakar Hujan", shortName: "Tipping Bucket + OBS", function: "Mengukur jumlah dan intensitas presipitasi yang jatuh di area terbuka.", measures: "Curah hujan (mm) dan rain rate (mm/jam).", placement: "Mulut penakar horizontal, area terbuka, dengan ketinggian dan jarak dari penghalang mengikuti standar lokal/WMO.", maintenance: "Bersihkan corong, periksa saringan, dan kalibrasi mekanisme tipping bucket." },
  wind: { id: "wind", name: "Stasiun Angin", shortName: "Anemometer + Wind Vane", function: "Mengubah gerakan udara menjadi kecepatan dan arah angin.", measures: "Kecepatan angin (m/s) dan arah angin (derajat).", placement: "Sensor berada di atas tiang yang bebas dari turbulensi bangunan dan pepohonan.", maintenance: "Pastikan mangkuk bebas hambatan, bearing ringan, dan vane sejajar dengan utara." },
  pyranometer: { id: "pyranometer", name: "Pyranometer", shortName: "Radiasi Surya", function: "Mengukur radiasi gelombang pendek yang diterima permukaan horizontal.", measures: "Radiasi surya global (W/m²).", placement: "Dudukan horizontal dengan horizon lapang dan kubah selalu bersih.", maintenance: "Bersihkan kubah dan periksa leveling secara berkala." },
  "evaporation-pan": { id: "evaporation-pan", name: "Panci Penguapan Kelas A", shortName: "Class A Pan", function: "Merepresentasikan kehilangan air akibat evaporasi dari permukaan terbuka.", measures: "Perubahan tinggi muka air dan estimasi evaporasi.", placement: "Diletakkan di atas kisi kayu dengan area terbuka dan permukaan air terjaga.", maintenance: "Jaga air dan stilling well bersih, cek kebocoran, serta ukur tinggi muka air konsisten." },
}