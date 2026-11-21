import * as THREE from 'three'
import { SharedPBRMaterials } from './sharedMaterials'
import { addConcretePlinthWithBolts } from './mechanicalDetails'

export interface CampbellStokesControls {
  root: THREE.Group
}

/**
 * Model 3D Campbell-Stokes Sunshine Recorder (Perekam Lama Penyinaran Matahari)
 * Berbasis spesifikasi WMO CIMO No. 8 & standar BMKG:
 * - Pilar beton stabil bebas getaran tinggi 1.2 m
 * - Pelat dasar dengan 3 sekrup penyetel kerataan (leveling screws) & waterpass mata sapi
 * - Busur pengatur derajat lintang stasiun (-7.67° LS Kebumen)
 * - Mangkuk logam kuningan cor dengan 3 alur penahan kartu pias (musim panas, ekuinoks, musim dingin)
 * - Kartu pias melengkung dengan garis jam dan jejak terbakar hangus (burnt trace)
 * - Bola kaca pejal optik bening (solid optical glass sphere, IOR 1.52)
 */
export function buildCampbellStokes(
  scene: THREE.Scene,
  sharedMats: SharedPBRMaterials,
  position = new THREE.Vector3(-1.65, 0.05, -3.5)
): CampbellStokesControls {
  const root = new THREE.Group()
  root.position.copy(position)
  root.userData.instrumentId = 'campbell'
  scene.add(root)

  // 1. PONDASI BETON DASAR BERBAUT ANGKUR
  const plinthTopY = addConcretePlinthWithBolts(root, 0.46, 0.46, 0.08, 0.28, 0, sharedMats)

  // 2. PILAR BETON MASIF PENOPANG ALAT (TINGGI ~1.10 M)
  const pillarGeo = new THREE.CylinderGeometry(0.12, 0.15, 1.05, 24)
  const pillar = new THREE.Mesh(pillarGeo, sharedMats.concrete)
  pillar.position.y = plinthTopY + 0.525
  pillar.castShadow = true
  pillar.receiveShadow = true
  root.add(pillar)

  // Kepala pilar beton (top cap stone)
  const capGeo = new THREE.CylinderGeometry(0.16, 0.14, 0.04, 24)
  const cap = new THREE.Mesh(capGeo, sharedMats.concrete)
  cap.position.y = plinthTopY + 1.07
  cap.receiveShadow = true
  root.add(cap)

  // 3. MEKANISME DUDUKAN LOGAM KUNINGAN (MOUNTING & LEVELING BASE)
  const instBaseY = plinthTopY + 1.09

  // Pelat dasar kuningan segitiga / bundar dengan 3 kaki sekrup penyetel
  const baseDisk = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.016, 24), sharedMats.brass)
  baseDisk.position.y = instBaseY + 0.008
  baseDisk.castShadow = true
  root.add(baseDisk)

  // 3 Sekrup penyetel kerataan (leveling thumb screws)
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3
    const lx = Math.cos(angle) * 0.105
    const lz = Math.sin(angle) * 0.105

    const screwHead = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.02, 12), sharedMats.darkSteel)
    screwHead.position.set(lx, instBaseY + 0.022, lz)
    screwHead.castShadow = true
    root.add(screwHead)

    const screwNut = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.014, 6), sharedMats.brass)
    screwNut.position.set(lx, instBaseY + 0.012, lz)
    root.add(screwNut)
  }

  // Waterpass mata sapi kecil (bullseye spirit level) di sisi utara
  const levelRing = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.008, 16), sharedMats.darkSteel)
  levelRing.position.set(0, instBaseY + 0.018, 0.065)
  root.add(levelRing)

  const levelLiquid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, 0.006, 16),
    new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.2 })
  )
  levelLiquid.position.set(0, instBaseY + 0.02, 0.065)
  root.add(levelLiquid)

  // 4. SEKTOR PENYETEL LINTANG & PENYANGGA BOLA KACA (LATITUDE ARC)
  const bracketGroup = new THREE.Group()
  bracketGroup.position.set(0, instBaseY + 0.025, 0)
  // Menyesuaikan inklinasi lintang stasiun Kebumen (-7.67° LS) menghadap Khatulistiwa/Utara
  bracketGroup.rotation.x = -0.134
  root.add(bracketGroup)

  // Tiang penopang braket kuningan cor
  const bracketStem = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.05), sharedMats.brass)
  bracketStem.position.y = 0.03
  bracketStem.castShadow = true
  bracketGroup.add(bracketStem)

  // Busur derajat skala lintang
  const arcScale = new THREE.Mesh(
    new THREE.TorusGeometry(0.075, 0.009, 8, 24, Math.PI * 0.55),
    sharedMats.brass
  )
  arcScale.position.set(0.026, 0.045, -0.01)
  arcScale.rotation.y = Math.PI / 2
  bracketGroup.add(arcScale)

  // 5. MANGKUK PENAHAN KARTU PIAS (RECORDING BOWL & PIAS CARD)
  const sphereCenterY = 0.135
  const bowlRadius = 0.105

  // Mangkok lengkung logam kuningan yang konsentris dengan bola kaca
  const bowlGeo = new THREE.TorusGeometry(bowlRadius, 0.018, 12, 48, Math.PI * 1.25)
  const bowl = new THREE.Mesh(bowlGeo, sharedMats.brass)
  bowl.position.set(0, sphereCenterY, 0)
  bowl.rotation.set(Math.PI / 2, 0, Math.PI * 0.38)
  bowl.castShadow = true
  bracketGroup.add(bowl)

  // 3 Flensa alur penahan kartu pias (summer, equinox, winter)
  const grooveGeo = new THREE.TorusGeometry(bowlRadius + 0.006, 0.004, 6, 40, Math.PI * 1.15)
  ;[-0.014, 0, 0.014].forEach((offY) => {
    const groove = new THREE.Mesh(grooveGeo, sharedMats.darkSteel)
    groove.position.set(0, sphereCenterY + offY, 0)
    groove.rotation.set(Math.PI / 2, 0, Math.PI * 0.38)
    bracketGroup.add(groove)
  })

  // Kertas Pias (Recording Paper Card) terpasang di alur ekuinoks
  const cardMat = new THREE.MeshStandardMaterial({
    color: 0x3b82f6, // Biru pias standar BMKG
    roughness: 0.88,
    side: THREE.DoubleSide,
  })
  const cardGeo = new THREE.CylinderGeometry(
    bowlRadius + 0.002,
    bowlRadius + 0.002,
    0.032,
    32,
    1,
    true,
    Math.PI * 0.72,
    Math.PI * 0.95
  )
  const card = new THREE.Mesh(cardGeo, cardMat)
  card.position.set(0, sphereCenterY, 0)
  bracketGroup.add(card)

  // Jejak gosong / terbakar sinar matahari terfokus pada kartu pias (Burnt trace line)
  const burnTraceMat = new THREE.MeshBasicMaterial({ color: 0x1c1917 }) // Gosong kehitaman
  const burnGeo = new THREE.CylinderGeometry(
    bowlRadius + 0.003,
    bowlRadius + 0.003,
    0.0045,
    28,
    1,
    true,
    Math.PI * 0.85,
    Math.PI * 0.65
  )
  const burnTrace = new THREE.Mesh(burnGeo, burnTraceMat)
  burnTrace.position.set(0, sphereCenterY, 0)
  bracketGroup.add(burnTrace)

  // 6. BOLA KACA PEJAL OPTIK BENING (SOLID OPTICAL GLASS SPHERE)
  const glassSphereRadius = 0.05
  const glassSphere = new THREE.Mesh(
    new THREE.SphereGeometry(glassSphereRadius, 32, 24),
    sharedMats.glassPhysical
  )
  glassSphere.position.set(0, sphereCenterY, 0)
  glassSphere.castShadow = true
  bracketGroup.add(glassSphere)

  // Lengan capit penjepit bola kaca di kedua kutub (kiri & kanan)
  ;[-1, 1].forEach((dir) => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.009, 0.045, 12), sharedMats.brass)
    arm.position.set(dir * (glassSphereRadius + 0.016), sphereCenterY, 0)
    arm.rotation.z = (dir * Math.PI) / 2
    arm.castShadow = true
    bracketGroup.add(arm)

    // Baut putar penjepit ujung (knurled clamp screw)
    const clampNut = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.014, 12), sharedMats.brass)
    clampNut.position.set(dir * (glassSphereRadius + 0.038), sphereCenterY, 0)
    clampNut.rotation.z = (dir * Math.PI) / 2
    bracketGroup.add(clampNut)
  })

  // Tag semua mesh turunan agar responsif terhadap raycasting selection
  root.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      obj.userData.instrumentId = 'campbell'
      obj.castShadow = true
      obj.receiveShadow = true
    }
  })

  return { root }
}
