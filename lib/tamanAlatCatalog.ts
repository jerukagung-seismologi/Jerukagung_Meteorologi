export type InstrumentId =
  | 'stevenson'
  | 'anemometer'
  | 'raingauge'
  | 'pyranometer'
  | 'evappan'
  | 'campbell'
  | 'barometer'

export interface InstrumentCatalogEntry {
  id: InstrumentId
  name: string
  shortName: string
  category: string
  sensor: string
  desc: string
  wmo: string
  // Field ilmiah spesifik standar WMO & BMKG
  scientificFunction: string
  parameter: string
  principle: string
  components: string[]
  operation: string
}

export const INSTRUMENT_CATALOG: Record<InstrumentId, InstrumentCatalogEntry> = {
  stevenson: {
    id: 'stevenson',
    name: 'Sangkar Meteorologi (Stevenson Screen)',
    shortName: 'Stevenson Screen',
    category: 'Suhu & Kelembapan Udara',
    sensor: 'BME280 / SHT31 + ESP32 + Termometer Bola Kering & Basah',
    desc: 'Pelindung berventilasi alami dengan kisi-kisi kayu ganda dan atap berlapis insulasi di atas pondasi beton berbaut. Melindungi sensor dari radiasi matahari langsung & hujan sambil menjaga sirkulasi udara bebas.',
    wmo: 'Tinggi sensor 1.25–2.00 m di atas rumput terawat; cat putih beralbedo tinggi (≥ 0.80); pintu di Belahan Bumi Selatan menghadap Selatan agar bola termometer tidak tersorot matahari saat observasi.',
    scientificFunction: 'Melindungi instrumen sensor temperatur dan kelembapan dari pengaruh langsung radiasi matahari, radiasi termal tanah, dan tetesan presipitasi, sembari mempertahankan aliran ventilasi udara bebas yang mewakili massa udara ambien sebenarnya.',
    parameter: 'Suhu Udara Ambien (°C), Suhu Titik Embun / Dew Point (°C), dan Kelembapan Relatif / RH (%).',
    principle: 'Ventilasi konvektif alami melalui kisi-kisi ganda (double-louvered) yang membelokkan radiasi surya langsung & hamburan, meminimalkan efek panas laten dan error radiasi mikroiklim.',
    components: [
      'Badan sangkar kisi kayu ganda (White Louvered Wooden Shelter)',
      'Atap ganda berongga insulasi termal (Double Roof with Air Gap)',
      'Termometer Bola Kering & Bola Basah (Psychrometer)',
      'Termometer Maksimum & Minimum (Six-Bellani / Standar BMKG)',
      'Unit Modul Sensor Digital IoT (BME280/SHT31 + Mikrokontroler)',
      'Kaki penopang baja profil siku 1.50 m dengan sepatu angkur beton',
    ],
    operation: 'Pembacaan manual dilakukan oleh pengamat setiap jam sinoptik (00, 03, 06, 09, 12, 15, 18, 21 UTC / waktu lokal). Pintu selatan dibuka sesingkat mungkin. Sensor digital mencatat data berkala tiap 1 menit.',
  },
  anemometer: {
    id: 'anemometer',
    name: 'Tiang Anemometer, Wind Vane & Unit AWS PV',
    shortName: 'Anemometer + Wind Vane',
    category: 'Pengamatan Angin & Energi Surya',
    sensor: '3-Cup Anemometer + Wind Vane + Panel Surya Monokristalin + Logger IP65',
    desc: 'Anemometer 3 mangkuk mengukur kecepatan angin (m/s), wind vane melacak arah datangnya angin (0°–360°), disuplai panel surya monokristalin menghadap Utara dengan kabel konduit menuju data logger IP65.',
    wmo: 'Area terbuka bebas penghalang (jarak minimum 10x tinggi rintangan terdekat). Standar pengamatan sinoptik 10 m, atau 2–3 m pada stasiun agrometeorologi / AWS mikroklimat.',
    scientificFunction: 'Mengukur vektor kecepatan horizontal angin dan arah asal hembusan angin permukaan secara kontinu, serta memantau pasokan daya otonom sistem pengamatan otomatis stasiun cuaca.',
    parameter: 'Kecepatan Angin (m/s atau Knot), Arah Angin (Derajat Azimut 0°–360° & 16 Arah Mata Angin), dan Gust Maksimum.',
    principle: 'Perputaran mangkuk simetris proporsional terhadap gaya hambat aerodinamika (drag differential) yang diubah opto-elektronik menjadi frekuensi pulsa (RPM), dipadukan potensiometer presisi pada sirip pengarah arah angin.',
    components: [
      'Rotor 3-Mangkuk Anemometer kerucut hembus (Three-Cup Assembly)',
      'Sirip Arah Angin dengan penyeimbang beban (Counterweighted Wind Vane)',
      'Tiang baja galvanis hot-dip dengan sistem kawat spanner (Guy Wires)',
      'Panel Surya Fotovoltaik Monokristalin 50W dengan braket miring',
      'Enclosure Data Logger & Baterai LiFePO4 IP65',
      'Jalur kabel pelindung konduit tahan cuaca & grounding proteksi petir',
    ],
    operation: 'Data kecepatan diintegrasikan selama interval 2 menit dan 10 menit untuk menghasilkan kecepatan rata-rata serta kecepatan hembusan maksimum (wind gust) yang dipancarkan secara telemetri.',
  },
  raingauge: {
    id: 'raingauge',
    name: 'Penakar Hujan Tipping Bucket & Manual OBS',
    shortName: 'Tipping Bucket + OBS',
    category: 'Pengamatan Curah Hujan',
    sensor: 'Tipping Bucket 0.2 mm/tip (Reed Switch) + Penakar Manual OBS',
    desc: 'Penakar hujan otomatis dengan mekanisme jungkat-jungkit twin-bucket tembaga yang mengirim pulsa tiap 0.2 mm hujan. Disandingkan penakar manual OBS bercorong kuningan sebagai rujukan kalibrasi lapangan.',
    wmo: 'Bibir corong horizontal pada ketinggian 0.5–1.2 m di atas permukaan tanah berumput, dengan sudut bebas ruang minimal 45° dari setiap pohon atau struktur sekitar.',
    scientificFunction: 'Mengukur akumulasi kedalaman presipitasi cair (hujan) yang jatuh ke permukaan bumi serta intensitas laju curah hujan per satuan waktu (mm/jam) secara real-time dan terverifikasi.',
    parameter: 'Akumulasi Curah Hujan (mm), Intensitas Hujan (mm/jam), dan Waktu Kejadian Presipitasi.',
    principle: 'Air hujan ditangkap corong luas 200 cm² lalu dialirkan ke ember jungkit kembar seimbang. Setiap pengisian 0.2 mm (4.0 ml) air, ember menjungkit dan menggerakkan magnet melintasi sakelar buluh (reed switch) menghasilkan pulsa digital.',
    components: [
      'Corong penangkap air hujan presisi dengan bibir pisau tajam (Knife-Edge Rim)',
      'Mekanisme ember jungkit ganda (Balanced Twin Tipping Buckets)',
      'Sensor pulsa kontak buluh tertutup (Hermetically Sealed Reed Switch)',
      'Saringan penyaring daun & kotoran corong (Mesh Debris Filter)',
      'Penakar Hujan Manual Observatorium (OBS) logam kuningan 100 cm²',
      'Gelas ukur standar BMKG berskala 0.1 mm untuk verifikasi manual',
    ],
    operation: 'Setiap tip dihitung oleh logger untuk kalkulasi laju intensitas. Pada jam 07.00 WIB setiap pagi, air pada penakar OBS diambil menggunakan kran penguras dan diukur dengan gelas ukur untuk validasi data.',
  },
  pyranometer: {
    id: 'pyranometer',
    name: 'Pyranometer & Petak Sensor Suhu Tanah',
    shortName: 'Pyranometer & Tanah',
    category: 'Radiasi Surya & Profil Suhu Tanah',
    sensor: 'Pyranometer Kubah Kaca Ganda + 4 Probe Tanah (5, 10, 20, 50 cm)',
    desc: 'Pyranometer mengukur radiasi surya global horizontal (W/m²) dengan sun shield bertingkat & kubah kaca ganda. Di sampingnya petak tanah gundul berbingkai beton memantau gradien suhu tanah 4 kedalaman.',
    wmo: 'Pyranometer harus terpasang rata waterpass mutlak, bebas halangan bayangan pada elevasi > 3° sepanjang tahun; termometer tanah ditanam pada petak tanah gundul di kedalaman 5, 10, 20, dan 50 cm.',
    scientificFunction: 'Mengukur fluks radiasi gelombang pendek surya total (langsung + difus) yang diterima permukaan horizontal, serta menganalisis konduksi panas dan neraca energi di lapisan perakaran tanah.',
    parameter: 'Radiasi Surya Global Horizontal (W/m²) dan Suhu Tanah Kedalaman 5 cm, 10 cm, 20 cm, 50 cm (°C).',
    principle: 'Prinsip termoelektrik (thermopile) berbasis efek Seebeck antara bidang hitam penyerap dan bidang referensi, menghasilkan tegangan mikrovolt proporsional terhadap fluks radiasi 285–3000 nm.',
    components: [
      'Kubah kaca optik ganda (Dual Precision Optical Glass Domes)',
      'Sensor detektor termopile berlapis karbon hitam berspektrum datar',
      'Pelindung silau radiasi sekunder putih (Sun Radiation Shield Screen)',
      'Sekrup penyetel waterpass dan indikator gelembung udara presisi',
      'Petak tanah gundul berbingkai beton pembatas erosi 2.0 x 1.5 m',
      'Termometer tanah bengkok berselubung tembaga BMKG 4 kedalaman',
    ],
    operation: 'Tegangan termopile dikonversi koefisien kalibrasi sensitivitas (µV/W·m⁻²). Kubah kaca dibersihkan berkala dari debu dan embun pada pagi hari sebelum pengukuran puncak.',
  },
  evappan: {
    id: 'evappan',
    name: 'Panci Penguapan Kelas A (Class A Pan)',
    shortName: 'Class A Pan',
    category: 'Pengamatan Evaporasi',
    sensor: 'Panci Galvanis Ø 1.21 m + Stilling Well, Hook Gauge & Mini Anemometer',
    desc: 'Mengukur laju penguapan permukaan air terbuka (mm/hari) akibat radiasi, suhu, defisit uap air, dan angin. Dilengkapi sumur tenang (stilling well), hook gauge mikrometer, serta anemometer mini 0.5 m.',
    wmo: 'Ditempatkan di atas palet kisi kayu balok setinggi 10–15 cm agar sirkulasi udara bebas melewati bagian bawah dasar panci; tinggi muka air dijaga 5–7.5 cm di bawah bibir atas.',
    scientificFunction: 'Mengukur besaran evaporasi potensial dari permukaan air bebas guna estimasi kebutuhan air tanaman (ET₀), evaluasi neraca air hidrologis, dan manajemen irigasi pertanian.',
    parameter: 'Penguapan Harian (mm/24 jam), Suhu Permukaan Air (°C), dan Laju Angin Rendah / Wind-Run (km/hari pada ketinggian 0.5 m).',
    principle: 'Perubahan ketinggian permukaan air diukur menggunakan mikrometer ujung kait (hook gauge) di dalam bejana peredam gelombang (stilling well), dikoreksi dengan curah hujan yang tercatat selama periode pengamatan.',
    components: [
      'Panci bundar baja tahan karat / monel Ø 1.21 m (47.5 in) kedalaman 25.4 cm',
      'Platform kisi kayu penopang sirkulasi bawah (Wooden Grid Platform)',
      'Bejana peredam riak air (Brass Stilling Well)',
      'Alat ukur kait mikrometer nonius presisi 0.02 mm (Hook Gauge)',
      'Termometer apung air maksimum-minimum (Floating Thermometer)',
      'Anemometer Totalizer 0.5 m pengukur jarak tempuh angin (Wind-Run)',
    ],
    operation: 'Pengamatan harian dilakukan pada pukul 07.00 WIB. Titik ujung jarum hook gauge disentuhkan tepat pada meniskus permukaan air, lalu dihitung selisih ketinggian air dengan memperhitungkan masukan hujan.',
  },
  campbell: {
    id: 'campbell',
    name: 'Campbell–Stokes Sunshine Recorder',
    shortName: 'Campbell–Stokes',
    category: 'Lama Penyinaran Matahari',
    sensor: 'Bola Kaca Pejal Optik Ø 100 mm + Pias Rekam Kartu Biru Termal',
    desc: 'Instrumen standar dunia untuk merekam durasi penyinaran matahari langsung. Bola kaca optik memfokuskan berkas sinar matahari menjadi titik api berintensitas tinggi yang membakar kartu pias kimiawi.',
    wmo: 'Dipasang pada pilar beton stabil bebas getaran tinggi 1.2 m; piringan instrumen diatur tepat pada sudut lintang stasiun (-7.67° LS Kebumen) dan sejajar garis meridian Utara-Selatan sejati.',
    scientificFunction: 'Mencatat secara akurat jumlah jam dalam sehari di mana radiasi matahari langsung (direct beam solar irradiance) melebihi ambang batas aktivasi WMO sebesar 120 W/m².',
    parameter: 'Lama Penyinaran Matahari / Sunshine Duration (Jam dan Menit / Hari) serta Persentase Penyinaran Nyata vs Teoritis (%).',
    principle: 'Bola kaca optik pejal homogen berfungsi sebagai lensa cembung sferis seragam dari segala arah azimut surya, memfokuskan berkas radiasi langsung ke alur logam penahan pias. Jika radiasi > 120 W/m², titik fokus akan membakar atau menghanguskan kertas pias.',
    components: [
      'Bola kaca pejal optik bening berkualitas tinggi (Homogeneous Optical Crown Glass Sphere Ø 100 mm, n = 1.52)',
      'Mangkuk busur logam kuningan cor dengan 3 alur pemegang pias (Equinoctial, Summer, Winter)',
      'Busur penyesuaian sudut derajat lintang stasiun dan pengunci (Latitude Arc Scale)',
      'Pelat dasar penyetel kerataan tiga titik sekrup (Three-Point Leveling Base)',
      'Waterpass mata sapi melingkar presisi tinggi (Circular Spirit Level)',
      'Kartu pias khusus tahan air berwarna biru BMKG dengan skala pembagian jam',
    ],
    operation: 'Kertas pias diganti setiap petang menjelang senja setelah matahari terbenam. Jejak terbakar diukur panjangnya menggunakan cetakan skala jam standar BMKG untuk menentukan durasi total harian.',
  },
  barometer: {
    id: 'barometer',
    name: 'Barometer Digital Meteorologi Presisi',
    shortName: 'Barometer Digital',
    category: 'Tekanan Udara Atmosfer',
    sensor: 'Transduser Silikon Piezoresistif Presisi Tinggi + Static Pressure Port IP67',
    desc: 'Instrumen presisi pengukur tekanan udara atmosfer permukaan stasiun (QFE) dan tekanan tereduksi permukaan laut (QNH/MSLP). Dilengkapi port peredam tekanan dinamis angin dan layar digital iluminasi LCD.',
    wmo: 'Dipasang pada ketinggian terkalibrasi terhadap Barometer Reference Level (BRL) stasiun; terlindung dari fluktuasi termal mendadak, getaran, serta hembusan angin dinamis langsung.',
    scientificFunction: 'Memantau tekanan atmosfer permukaan stasiun dan mendeteksi perubahan pola tekanan barometrik secara mikro, yang menjadi indikator primer pergerakan sistem cuaca, front, dan badai.',
    parameter: 'Tekanan Udara Permukaan Stasiun / QFE (hPa / mbar), Tekanan Udara Muka Laut / QNH (hPa), dan Tendensi Tekanan 3 Jam (Barometric Tendency).',
    principle: 'Deformasi mekanis mikro diafragma silikon monokristalin akibat perbedaan tekanan menghasilkan perubahan hambatan listrik (piezoresistive effect) pada jembatan Wheatstone terintegrasi, diproses dengan kompensasi suhu digital presisi tinggi.',
    components: [
      'Sensor transduser silikon piezoresistif dengan kompensasi temperatur terkalibrasi',
      'Port tekanan statis dengan sekat peredam tekanan dinamik angin (Pitot Static Port Baffle)',
      'Casing logam die-cast IP67 tahan korosi garam dan cuaca tropis',
      'Layar LCD monokrom kontras tinggi dengan lampu latar display pembacaan hPa',
      'Unit konverter sinyal analog-ke-digital 24-bit dengan port serial RS-485 / Modbus',
      'Tiang pedestal baja tahan karat (Stainless Steel 316) kokoh terpasang angkur beton',
    ],
    operation: 'Mengukur tekanan atmosfer secara kontinu dengan frekuensi sampel 1 Hz. Data disaring digital untuk meredam fluktuasi turbulensi angin dan dikirimkan ke server pengolah data cuaca setiap menit.',
  },
}
