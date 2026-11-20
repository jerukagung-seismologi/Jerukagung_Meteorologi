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

  // --- B. PETAK 4 PROBE SUHU TANAH (5, 10, 20, 50 CM) ---
  const soilG = new THREE.Group()
  soilG.position.set(0.72, 0, 0)
  group.add(soilG)

  const frameOuter = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.08, 1.18), sharedMats.concrete)
  frameOuter.position.y = 0.04
  frameOuter.receiveShadow = true
  soilG.add(frameOuter)

  const soilBed = new THREE.Mesh(
    new THREE.BoxGeometry(1.52, 0.09, 1.02),
    new THREE.MeshStandardMaterial({
      map: sharedMats.textures.soil.map,
      bumpMap: sharedMats.textures.soil.bumpMap,
      bumpScale: 0.042,
      roughness: 0.96,
    })
  )
  soilBed.position.y = 0.048
  soilBed.receiveShadow = true
  soilG.add(soilBed)

  const soilProbes = [
    { x: -0.48, z: 0.05, h: 0.24, color: 0x06b6d4, label: '5 cm' },
    { x: -0.16, z: 0.05, h: 0.32, color: 0xf59e0b, label: '10 cm' },
    { x: 0.16, z: 0.05, h: 0.40, color: 0xef4444, label: '20 cm' },
    { x: 0.48, z: 0.05, h: 0.54, color: 0x8b5cf6, label: '50 cm' },
  ]

  soilProbes.forEach((p) => {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, p.h, 12), sharedMats.stainless)
    stem.position.set(p.x, 0.08 + p.h / 2, p.z)
    stem.castShadow = true
    soilG.add(stem)

    const head = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.02, 0.05, 14),
      new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.32, metalness: 0.4 })
    )
    head.position.set(p.x, 0.08 + p.h + 0.025, p.z)
    head.castShadow = true
    soilG.add(head)

    // Kabel hitam per probe
    addConduitTube(
      soilG,
      [
        new THREE.Vector3(p.x, 0.12, p.z - 0.01),
        new THREE.Vector3(p.x * 0.6, 0.1, -0.18),
        new THREE.Vector3(p.x * 0.12, 0.36, -0.42),
      ],
      0.0045,
      sharedMats.cableBlack
    )
  })

  scene.add(group)

  return {
    root: group,
  }
}
