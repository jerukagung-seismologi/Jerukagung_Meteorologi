import * as THREE from 'three'
import { SharedPBRMaterials } from './sharedMaterials'
import { addConcretePlinthWithBolts, addConduitTube } from './mechanicalDetails'

export interface StationLightingSystem {
  lampGroup: THREE.Group
  spotLight: THREE.SpotLight
  bulbMat: THREE.MeshStandardMaterial
  updateLamp: (nightFactor: number, override: 'auto' | 'on' | 'off') => boolean
  triggerLightning: () => void
  updateLightning: (dt: number) => number
}

export function buildStationLighting(
  scene: THREE.Scene,
  sharedMats: SharedPBRMaterials
): StationLightingSystem {
  // 1. TIANG LAMPU STASIUN METEOROLOGI (SISI SELATAN TAMAN ALAT)
  const lampGroup = new THREE.Group()
  lampGroup.position.set(1.45, 0.05, 5.55)

  const plinthTopY = addConcretePlinthWithBolts(lampGroup, 0.36, 0.36, 0.08, 0.20, 0, sharedMats)
  const poleH = 2.65
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.044, poleH, 16),
    sharedMats.stainless
  )
  pole.position.y = plinthTopY + poleH / 2
  pole.castShadow = true
  lampGroup.add(pole)

  // Lengkungan leher tiang lampu
  addConduitTube(
    lampGroup,
    [
      new THREE.Vector3(0, plinthTopY + poleH, 0),
      new THREE.Vector3(-0.14, plinthTopY + poleH + 0.22, 0),
      new THREE.Vector3(-0.44, plinthTopY + poleH + 0.26, 0),
      new THREE.Vector3(-0.56, plinthTopY + poleH + 0.14, 0),
    ],
    0.022,
    sharedMats.cableBlack
  )

  // Tudung kap lampu & panel surya mini di puncak tiang
  const hood = new THREE.Mesh(
    new THREE.ConeGeometry(0.16, 0.09, 16),
    sharedMats.darkSteel
  )
  hood.position.set(-0.56, plinthTopY + poleH + 0.14, 0)
  lampGroup.add(hood)

  // Panel surya mini fotovoltaik pengisi daya baterai lampu
  const pvGeo = new THREE.BoxGeometry(0.22, 0.015, 0.18)
  const pvMesh = new THREE.Mesh(pvGeo, sharedMats.solarPanel)
  pvMesh.position.set(0, plinthTopY + poleH + 0.12, 0)
  pvMesh.rotation.x = 0.25
  lampGroup.add(pvMesh)

  // Bola lampu warm-white LED
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xffe4b5,
    emissive: 0xffaa44,
    emissiveIntensity: 0.0,
    roughness: 0.25,
  })
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), bulbMat)
  bulb.position.set(-0.56, plinthTopY + poleH + 0.09, 0)
  lampGroup.add(bulb)

  // Lampu sorot Spotlight yang menerangi area pintu masuk dan taman di malam hari
  const spotLight = new THREE.SpotLight(0xffdfa0, 0, 14, Math.PI / 3.2, 0.45, 1.2)
  spotLight.position.set(-0.56, plinthTopY + poleH + 0.08, 0)
  spotLight.target.position.set(0, 0, 1.5)
  spotLight.castShadow = true
  spotLight.shadow.mapSize.set(512, 512)
  spotLight.shadow.bias = -0.0004
  lampGroup.add(spotLight)
  lampGroup.add(spotLight.target)

  scene.add(lampGroup)

  // 2. FUNGSI UPDATE LAMPU MALAM
  const updateLamp = (nightFactor: number, override: 'auto' | 'on' | 'off'): boolean => {
    let isOn = false
    if (override === 'on') isOn = true
    else if (override === 'off') isOn = false
    else {
      // Auto: menyala saat faktor malam > 0.42
      isOn = nightFactor > 0.42
    }

    const intensity = isOn ? 2.4 : 0.0
    spotLight.intensity = intensity
    bulbMat.emissiveIntensity = isOn ? 1.85 : 0.0
    return isOn
  }

  // 3. SISTEM KILATAN PETIR (LIGHTNING SYSTEM)
  let lightningTimer = 0
  let isFlashing = false
  let flashIntensity = 0

  const triggerLightning = () => {
    isFlashing = true
    flashIntensity = 1.0
  }

  const updateLightning = (dt: number): number => {
    if (!isFlashing) return 0.0

    flashIntensity -= dt * 4.2
    if (flashIntensity <= 0) {
      flashIntensity = 0
      isFlashing = false
    }

    return flashIntensity
  }

  return {
    lampGroup,
    spotLight,
    bulbMat,
    updateLamp,
    triggerLightning,
    updateLightning,
  }
}
