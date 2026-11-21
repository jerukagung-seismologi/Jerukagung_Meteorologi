import * as THREE from 'three'
import { SharedPBRMaterials } from './sharedMaterials'
import { addConcretePlinthWithBolts, addConduitTube } from './mechanicalDetails'

export interface SolarAndSoilControls {
  root: THREE.Group
}

export function buildPyranometerAndSoil(scene: THREE.Scene, sharedMats: SharedPBRMaterials): SolarAndSoilControls {
  const group = new THREE.Group()
  group.position.set(3.7, 0.05, 2.8)
  group.userData.instrumentId = 'pyranometer'

  // --- A. PYRANOMETER HIGH-DETAIL ---
  const pyr = new THREE.Group()
  pyr.position.set(-0.5, 0, 0)
  group.add(pyr)

  const pyrBaseY = addConcretePlinthWithBolts(pyr, 0.5, 0.5, 0.09, 0.22, 0, sharedMats)
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.038, 1.15, 18), sharedMats.galvanized)
  post.position.y = pyrBaseY + 0.575
  post.castShadow = true
  pyr.add(post)

  const mountY = pyrBaseY + 1.16
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.022, 24), sharedMats.stainless)
  plate.position.y = mountY
  plate.castShadow = true
  pyr.add(plate)

  // Sun Shield Putih Bertingkat (2 lapis piringan peneduh radiasi)
  const shieldLow = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.132, 0.022, 28), sharedMats.whiteWoodFence)
  shieldLow.position.y = mountY + 0.024
  shieldLow.castShadow = true
  pyr.add(shieldLow)

  const shieldTop = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.024, 28), sharedMats.whiteWoodFence)
  shieldTop.position.y = mountY + 0.052
  shieldTop.castShadow = true
  pyr.add(shieldTop)

  // Waterpass / Level bubble hijau
  const levelRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.016, 0.014, 14),
    new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.15 })
  )
  levelRing.position.set(0.09, mountY + 0.07, 0.04)
  pyr.add(levelRing)

  // Receiver termopile radial hitam
  const sensorCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.026, 0.014, 18),
    new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.95 })
  )
  sensorCore.position.y = mountY + 0.07
  pyr.add(sensorCore)

  // Kubah kaca ganda (kubah dalam & kubah luar)
  const domeIn = new THREE.Mesh(
    new THREE.SphereGeometry(0.044, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    sharedMats.glassPhysical
  )
  domeIn.position.y = mountY + 0.065
  pyr.add(domeIn)

  const domeOut = new THREE.Mesh(
    new THREE.SphereGeometry(0.058, 28, 18, 0, Math.PI * 2, 0, Math.PI / 2),
    sharedMats.glassPhysical
  )
  domeOut.position.y = mountY + 0.062
  pyr.add(domeOut)

  addConduitTube(
    pyr,
    [
      new THREE.Vector3(0.09, mountY + 0.03, -0.05),
      new THREE.Vector3(0.11, mountY - 0.18, -0.04),
      new THREE.Vector3(0.04, 0.55, -0.02),
      new THREE.Vector3(0.06, pyrBaseY + 0.02, 0.04),
    ],
    0.009,
    sharedMats.conduitGrey
  )

  // --- B. PETAK TANAH GUNDUL WMO-No. 8 (5, 10, 20, 50 CM) ---
  const soilG = new THREE.Group()
  soilG.position.set(0.78, 0, 0)
  group.add(soilG)

  // Bingkai beton penahan petak tanah 1.95m x 1.35m
  const frameOuter = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.09, 1.35), sharedMats.concrete)
  frameOuter.position.y = 0.045
  frameOuter.receiveShadow = true
  soilG.add(frameOuter)

  const soilBed = new THREE.Mesh(
    new THREE.BoxGeometry(1.78, 0.095, 1.18),
    new THREE.MeshStandardMaterial({
      map: sharedMats.textures.soil.map,
      bumpMap: sharedMats.textures.soil.bumpMap,
      bumpScale: 0.048,
      roughness: 0.96,
      metalness: 0.0,
    })
  )
  soilBed.position.y = 0.05
  soilBed.receiveShadow = true
  soilG.add(soilBed)

  // 1. Tiga Termometer Tanah Bengkok (Bent-Stem Symons Pattern 60°) untuk 5, 10, dan 20 cm
  const bentProbes = [
    { x: -0.52, z: 0.12, depth: '5 cm', stemH: 0.18, color: 0x06b6d4 },
    { x: -0.18, z: 0.12, depth: '10 cm', stemH: 0.24, color: 0xf59e0b },
    { x: 0.18, z: 0.12, depth: '20 cm', stemH: 0.32, color: 0xef4444 },
  ]

  bentProbes.forEach((bp) => {
    const probeGrp = new THREE.Group()
    probeGrp.position.set(bp.x, 0.08, bp.z)
    soilG.add(probeGrp)

    // Dudukan cincin kuningan di permukaan tanah
    const baseCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.025, 14), sharedMats.brass)
    baseCollar.position.y = 0.012
    baseCollar.castShadow = true
    probeGrp.add(baseCollar)

    // Batang kaca miring 60° (menghadap Selatan agar pengamat dari jalur setapak mudah membaca tanpa bayangan)
    const stemGroup = new THREE.Group()
    stemGroup.rotation.x = -Math.PI / 6 // Miring 30° dari vertikal = 60° dari horizontal
    probeGrp.add(stemGroup)

    // Tabung kaca transparan
    const glassTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.009, bp.stemH, 12),
      sharedMats.glassPhysical
    )
    glassTube.position.y = bp.stemH / 2
    glassTube.castShadow = true
    stemGroup.add(glassTube)

    // Skala putih di belakang tabung kaca
    const scalePlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, bp.stemH * 0.92, 0.004),
      sharedMats.whiteWoodFence
    )
    scalePlate.position.set(0, bp.stemH / 2, -0.006)
    stemGroup.add(scalePlate)

    // Kolom cairan merah indikator suhu
    const fluidStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.003, 0.003, bp.stemH * 0.72, 8),
      new THREE.MeshBasicMaterial({ color: 0xdc2626 })
    )
    fluidStem.position.set(0, bp.stemH * 0.4, 0)
    stemGroup.add(fluidStem)

    // Pelat penahan tripod kuningan kecil
    const tripodLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.08, 6), sharedMats.brass)
    tripodLeg.position.set(0, 0.035, -0.035)
    tripodLeg.rotation.x = Math.PI / 4
    probeGrp.add(tripodLeg)
  })

  // 2. Termometer Tanah Dalam 50 cm (Earth Thermometer Suspended in Steel Tube)
  const deepTubeGrp = new THREE.Group()
  deepTubeGrp.position.set(0.56, 0.08, 0.12)
  soilG.add(deepTubeGrp)

  // Selongsong tabung besi galvanis pelindung yang tertanam ke dalam tanah
  const steelTube = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.36, 16), sharedMats.darkSteel)
  steelTube.position.y = 0.18
  steelTube.castShadow = true
  deepTubeGrp.add(steelTube)

  // Kerah flensa pengunci di bibir tanah
  const tubeFlange = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.022, 16), sharedMats.brass)
  tubeFlange.position.y = 0.015
  deepTubeGrp.add(tubeFlange)

  // Tutup tudung pelindung hujan atas (rain cap) dari kuningan
  const capMesh = new THREE.Mesh(new THREE.ConeGeometry(0.044, 0.038, 16), sharedMats.brass)
  capMesh.position.y = 0.375
  capMesh.castShadow = true
  deepTubeGrp.add(capMesh)

  // Rantai gantung penarik termometer paraffin
  const chainStem = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.08, 8), sharedMats.stainless)
  chainStem.position.set(0, 0.41, 0)
  deepTubeGrp.add(chainStem)

  const pullRing = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.0035, 8, 16), sharedMats.brass)
  pullRing.position.set(0, 0.455, 0)
  pullRing.rotation.y = Math.PI / 2
  deepTubeGrp.add(pullRing)

  scene.add(group)

  return {
    root: group,
  }
}
