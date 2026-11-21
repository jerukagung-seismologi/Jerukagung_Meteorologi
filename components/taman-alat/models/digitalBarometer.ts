import * as THREE from 'three'
import { SharedPBRMaterials } from './sharedMaterials'
import { addConcretePlinthWithBolts, addConduitTube } from './mechanicalDetails'

export interface DigitalBarometerControls {
  root: THREE.Group
}

/**
 * Model 3D Barometer Digital Meteorologi Presisi (Digital Precision Barometer)
 * Berbasis standar WMO CIMO Guide No. 8 & BMKG:
 * - Tiang pedestal stainless steel setinggi pandangan mata (eye-level 1.20–1.40 m)
 * - Housing pelindung IP67 tahan cuaca dengan port tekanan statis (static pressure port / pitot baffle)
 * - Layar digital display LCD dengan pembacaan tekanan stasiun QFE & QNH (hPa)
 * - Jalur kabel catu daya & transmisi data telemetri ke logger
 */
export function buildDigitalBarometer(
  scene: THREE.Scene,
  sharedMats: SharedPBRMaterials,
  position = new THREE.Vector3(1.65, 0.05, -3.5)
): DigitalBarometerControls {
  const root = new THREE.Group()
  root.position.copy(position)
  root.userData.instrumentId = 'barometer'
  scene.add(root)

  // 1. PONDASI BETON PLINTH DENGAN 4 BAUT ANGKUR
  const plinthTopY = addConcretePlinthWithBolts(root, 0.42, 0.42, 0.08, 0.26, 0, sharedMats)

  // 2. TIANG PEDESTAL STAINLESS STEEL BRUSHED (TINGGI 1.25 M)
  const mastH = 1.15
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.042, mastH, 20), sharedMats.stainless)
  mast.position.y = plinthTopY + mastH / 2
  mast.castShadow = true
  mast.receiveShadow = true
  root.add(mast)

  // Flensa dudukan atas tiang
  const mountY = plinthTopY + mastH
  const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.016, 20), sharedMats.stainless)
  flange.position.y = mountY
  flange.castShadow = true
  root.add(flange)

  // 3. ENCLOSURE / CASING BAROMETER DIGITAL TAHAN CUACA (IP67)
  const encW = 0.24
  const encH = 0.32
  const encD = 0.14
  const encCenterY = mountY + encH / 2 + 0.02

  const housing = new THREE.Mesh(new THREE.BoxGeometry(encW, encH, encD), sharedMats.darkSteel)
  housing.position.set(0, encCenterY, 0)
  housing.castShadow = true
  housing.receiveShadow = true
  root.add(housing)

  // Sirip pendingin pasif di sisi belakang casing
  for (let f = -3; f <= 3; f++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(encW - 0.04, 0.008, 0.022), sharedMats.darkSteel)
    fin.position.set(0, encCenterY + f * 0.035, -encD / 2 - 0.011)
    root.add(fin)
  }

  // Bingkai jendela depan & panel bezel
  const bezel = new THREE.Mesh(
    new THREE.BoxGeometry(encW - 0.03, encH - 0.04, 0.012),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.6 })
  )
  bezel.position.set(0, encCenterY, encD / 2 + 0.006)
  root.add(bezel)

  // Layar LCD Display Backlit Digital
  const lcd = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.09, 0.005),
    new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Biru LCD menyala
      emissive: 0x0369a1,
      emissiveIntensity: 0.45,
      roughness: 0.2,
    })
  )
  lcd.position.set(0, encCenterY + 0.035, encD / 2 + 0.014)
  root.add(lcd)

  // Kaca proteksi jendela LCD
  const glassCover = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.11, 0.006),
    sharedMats.glassPhysical
  )
  glassCover.position.set(0, encCenterY + 0.035, encD / 2 + 0.018)
  root.add(glassCover)

  // Status LED Sensor (Normal / Sampling)
  const led = new THREE.Mesh(
    new THREE.SphereGeometry(0.006, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0x10b981 })
  )
  led.position.set(-0.065, encCenterY - 0.05, encD / 2 + 0.014)
  root.add(led)

  // 4. PORT TEKANAN STATIS (STATIC PRESSURE INLET HEAD / PITOT BAFFLE)
  // Mencegah error pembacaan tekanan akibat hembusan angin dinamis (Bernoulli dynamic pressure)
  const portStem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 12), sharedMats.stainless)
  portStem.position.set(0, encCenterY + encH / 2 + 0.06, 0)
  portStem.castShadow = true
  root.add(portStem)

  // Piringan penangkal hembusan angin (anti-wind dynamic pressure disc head)
  const discTop = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.006, 20), sharedMats.stainless)
  discTop.position.set(0, encCenterY + encH / 2 + 0.12, 0)
  discTop.castShadow = true
  root.add(discTop)

  const discBot = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.006, 20), sharedMats.stainless)
  discBot.position.set(0, encCenterY + encH / 2 + 0.102, 0)
  root.add(discBot)

  // 5. PIPA KONDUIT KABEL BAWAH
  addConduitTube(
    root,
    [
      new THREE.Vector3(0.04, mountY + 0.04, -0.04),
      new THREE.Vector3(0.05, mountY - 0.25, -0.035),
      new THREE.Vector3(0.035, plinthTopY + 0.25, -0.03),
      new THREE.Vector3(0.04, plinthTopY + 0.01, -0.035),
    ],
    0.008,
    sharedMats.conduitGrey
  )

  // Tag semua mesh turunan agar responsif terhadap raycasting selection
  root.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      obj.userData.instrumentId = 'barometer'
      obj.castShadow = true
      obj.receiveShadow = true
    }
  })

  return { root }
}
