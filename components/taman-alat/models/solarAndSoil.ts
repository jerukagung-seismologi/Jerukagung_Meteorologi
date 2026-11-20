import * as THREE from 'three'
import { createSoilTexture } from '@/lib/tamanAlatTextures'
import { SharedMaterials } from './sharedMaterials'

export interface SolarAndSoilControls {
  root: THREE.Group
}

export function buildPyranometerAndSoil(scene: THREE.Scene, sharedMats: SharedMaterials): SolarAndSoilControls {
  const group = new THREE.Group()
  group.position.set(3.6, 0.05, 2.8)
  group.userData.instrumentId = 'pyranometer'

  // --- A. PYRANOMETER (lokal x = -0.45) ---
  const pyrGroup = new THREE.Group()
  pyrGroup.position.set(-0.45, 0, 0)
  group.add(pyrGroup)

  const pyrPad = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.06, 0.48), sharedMats.concrete)
  pyrPad.position.y = 0.03
  pyrPad.receiveShadow = true
  pyrGroup.add(pyrPad)

  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.038, 1.18, 14), sharedMats.whiteFence)
  post.position.y = 0.62
  post.castShadow = true
  pyrGroup.add(post)

  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.02, 20), sharedMats.galvanized)
  plate.position.y = 1.21
  plate.castShadow = true
  pyrGroup.add(plate)

  const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.125, 0.035, 24), sharedMats.whiteFence)
  shield.position.y = 1.24
  shield.castShadow = true
  pyrGroup.add(shield)

  const levelRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.012, 12),
    new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.2 })
  )
  levelRing.position.set(0.08, 1.26, 0.04)
  pyrGroup.add(levelRing)

  const sensorCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.028, 0.014, 16),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 })
  )
  sensorCore.position.y = 1.264
  pyrGroup.add(sensorCore)

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.056, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    sharedMats.glassDome
  )
  dome.position.y = 1.258
  pyrGroup.add(dome)

  // --- B. PETAK SUHU TANAH (lokal x = +0.65) ---
  const soilGroup = new THREE.Group()
  soilGroup.position.set(0.65, 0, 0)
  group.add(soilGroup)

  const frameOuter = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.07, 1.08), sharedMats.concrete)
  frameOuter.position.y = 0.035
  frameOuter.receiveShadow = true
  soilGroup.add(frameOuter)

  const soilBed = new THREE.Mesh(
    new THREE.BoxGeometry(1.36, 0.08, 0.96),
    new THREE.MeshStandardMaterial({ map: createSoilTexture(), roughness: 0.96 })
  )
  soilBed.position.y = 0.042
  soilBed.receiveShadow = true
  soilGroup.add(soilBed)

  const probes = [
    { x: -0.38, color: 0x06b6d4, h: 0.26 }, // 5 cm
    { x: 0.0, color: 0xf59e0b, h: 0.32 },   // 10 cm
    { x: 0.38, color: 0xef4444, h: 0.38 },  // 20 cm
  ]
  probes.forEach((p) => {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, p.h, 10), sharedMats.galvanized)
    stem.position.set(p.x, 0.08 + p.h / 2, 0)
    stem.castShadow = true
    soilGroup.add(stem)

    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.022, 0.045, 12),
      new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.35 })
    )
    cap.position.set(p.x, 0.08 + p.h + 0.02, 0)
    cap.castShadow = true
    soilGroup.add(cap)
  })

  scene.add(group)

  return {
    root: group,
  }
}
