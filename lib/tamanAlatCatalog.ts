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
    sensor: 'BME280 / SHT31 + ESP32 + Termometer Bola Kering/Basah',
    desc: 'Pelindung berventilasi alami dengan dinding berkisi-kisi ganda dan atap berlapis untuk melindungi sensor suhu/kelembapan dari radiasi matahari langsung serta presipitasi, sambil tetap menjaga sirkulasi udara.',
    wmo: 'Tinggi sensor 1.25–2.00 m di atas rumput terawat; dicat putih (albedo tinggi); pintu di Belahan Bumi Selatan menghadap Selatan agar tidak tersorot matahari saat dibuka.',
  },
  anemometer: {
    id: 'anemometer',
    name: 'Anemometer & Wind Vane',
    shortName: 'Anemometer + Wind Vane',
    category: 'Pengamatan Angin Permukaan',
    sensor: '3-Cup Hall-Effect Anemometer + Potensiometer/Hall Wind Vane',
    desc: 'Anemometer mangkuk mengukur kecepatan angin melalui frekuensi pulsa rotasi, sedangkan wind vane menunjukkan arah datangnya angin (0°–360°). Dilengkapi panel surya & kotak data logger IP65.',
    wmo: 'Penempatan terbuka jauh dari penghalang (jarak ≥ 10x tinggi halangan); tinggi standar operasional 10 m (atau 2–3 m pada taman alat agrometeorologi/AWS kompak).',
  },
  raingauge: {
    id: 'raingauge',
    name: 'Penakar Hujan Tipping Bucket & Manual OBS',
    shortName: 'Tipping Bucket + OBS',
    category: 'Pengamatan Curah Hujan',
    sensor: 'Tipping Bucket Otomatis (0.2 mm/tip) + Penakar Manual OBS',
    desc: 'Penakar otomatis memakai mekanisme jungkat-jungkit twin-bucket dengan sensor magnet/reed switch yang berayun setiap 0.2 mm hujan. Disandingkan dengan penakar manual OBS sebagai pembanding kalibrasi.',
    wmo: 'Mulut corong horizontal pada ketinggian standar (0.5–1.2 m di atas permukaan tanah) dengan ruang bebas halangan minimal 45° dari bibir corong.',
  },
  pyranometer: {
    id: 'pyranometer',
    name: 'Pyranometer & Petak Suhu Tanah',
    shortName: 'Pyranometer & Tanah',
    category: 'Radiasi Surya & Suhu Tanah',
    sensor: 'Thermopile Pyranometer (Kubah Kaca) + Probe Suhu Tanah 5/10/20 cm',
    desc: 'Pyranometer mengukur radiasi surya global horizontal (W/m²) melalui kubah kaca transparan dan pelindung panas (sun shield). Di sampingnya terdapat petak tanah gundul untuk pemantauan profil suhu tanah.',
    wmo: 'Pyranometer dipasang benar-benar datar (waterpass) bebas bayangan sepanjang hari; termometer tanah ditanam pada petak tanah gundul standar kedalaman 5, 10, dan 20 cm.',
  },
  evappan: {
    id: 'evappan',
    name: 'Panci Penguapan Kelas A (Class A Pan)',
    shortName: 'Class A Pan',
    category: 'Pengamatan Evaporasi',
    sensor: 'Panci Galvanis Ø 1.21 m + Stilling Well, Hook Gauge & Mini Anemometer',
    desc: 'Mengukur laju penguapan air terbuka (mm/hari) akibat kombinasi radiasi surya, suhu udara, kelembapan, dan angin. Dilengkapi sumur tenang (stilling well) untuk pembacaan tinggi muka air presisi.',
    wmo: 'Diletakkan di atas palet kisi kayu setinggi ~15 cm agar sirkulasi udara merata di bawah panci; tinggi air dijaga 5–7.5 cm di bawah bibir panci.',
  },
}
