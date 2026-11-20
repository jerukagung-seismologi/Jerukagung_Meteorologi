export type InstrumentId = 'stevenson' | 'anemometer' | 'raingauge' | 'pyranometer' | 'evappan'

export interface InstrumentCatalogEntry {
  id: InstrumentId
  name: string
  shortName: string
  category: string
  sensor: string
  desc: string
  wmo: string
}

export const INSTRUMENT_CATALOG: Record<InstrumentId, InstrumentCatalogEntry> = {
  stevenson: {
    id: 'stevenson',
    name: 'Sangkar Meteorologi (Stevenson Screen)',
    shortName: 'Stevenson Screen',
    category: 'Suhu & Kelembapan Udara',
    sensor: 'BME280 / SHT31 + ESP32 + Termometer Bola Kering & Basah',
    desc: 'Pelindung berventilasi alami dengan kisi-kisi kayu ganda dan atap berlapis insulasi di atas pondasi beton berbaut. Melindungi sensor dari radiasi matahari langsung & hujan sambil menjaga sirkulasi udara bebas.',
    wmo: 'Tinggi sensor 1.25–2.00 m di atas rumput terawat; cat putih beralbedo tinggi; pintu di Belahan Bumi Selatan menghadap Selatan agar tidak tersorot matahari saat pengamatan.',
  },
  anemometer: {
    id: 'anemometer',
    name: 'Tiang Anemometer, Wind Vane & Unit AWS PV',
    shortName: 'Anemometer + Wind Vane',
    category: 'Pengamatan Angin & Energi Surya',
    sensor: '3-Cup Anemometer + Wind Vane + Panel Surya Monokristalin + Logger IP65',
    desc: 'Anemometer 3 mangkuk mengukur kecepatan angin (m/s), wind vane melacak arah datangnya angin (0°–360°), disuplai panel surya monokristalin menghadap Utara dengan kabel konduit menuju data logger IP65.',
    wmo: 'Area terbuka bebas penghalang (jarak ≥ 10x tinggi halangan). Standar operasional 10 m atau 2–3 m pada stasiun agrometeorologi/AWS kompak.',
  },
  raingauge: {
    id: 'raingauge',
    name: 'Penakar Hujan Tipping Bucket & Manual OBS',
    shortName: 'Tipping Bucket + OBS',
    category: 'Pengamatan Curah Hujan',
    sensor: 'Tipping Bucket 0.2 mm/tip (Reed Switch) + Penakar Manual OBS',
    desc: 'Penakar hujan otomatis dengan mekanisme jungkat-jungkit twin-bucket tembaga yang mengirim pulsa tiap 0.2 mm hujan. Disandingkan penakar manual OBS bercorong kuningan sebagai rujukan kalibrasi lapangan.',
    wmo: 'Bibir corong horizontal pada tinggi 0.5–1.2 m di atas tanah dengan sudut ruang terbuka minimal 45° bebas bayangan bangunan/pohon.',
  },
  pyranometer: {
    id: 'pyranometer',
    name: 'Pyranometer & Petak Sensor Suhu Tanah',
    shortName: 'Pyranometer & Tanah',
    category: 'Radiasi Surya & Profil Suhu Tanah',
    sensor: 'Pyranometer Kubah Kaca Ganda + 4 Probe Tanah (5, 10, 20, 50 cm)',
    desc: 'Pyranometer mengukur radiasi surya global horizontal (W/m²) dengan sun shield bertingkat & kubah kaca ganda. Di sampingnya petak tanah gundul berbingkai beton memantau gradien suhu tanah 4 kedalaman.',
    wmo: 'Pyranometer harus rata sempurna (waterpass) bebas bayangan sepanjang hari; termometer tanah ditanam pada petak tanah gundul terstandar di kedalaman 5, 10, 20, dan 50 cm.',
  },
  evappan: {
    id: 'evappan',
    name: 'Panci Penguapan Kelas A (Class A Pan)',
    shortName: 'Class A Pan',
    category: 'Pengamatan Evaporasi',
    sensor: 'Panci Galvanis Ø 1.21 m + Stilling Well, Hook Gauge & Mini Anemometer',
    desc: 'Mengukur laju penguapan permukaan air terbuka (mm/hari) akibat radiasi, suhu, defisit uap air, dan angin. Dilengkapi sumur tenang (stilling well), hook gauge mikrometer, serta anemometer mini 0.5 m.',
    wmo: 'Ditempatkan di atas palet kisi kayu setinggi ~15 cm agar sirkulasi udara merata di bawah panci; tinggi muka air dijaga 5–7.5 cm di bawah bibir panci.',
  },
}
