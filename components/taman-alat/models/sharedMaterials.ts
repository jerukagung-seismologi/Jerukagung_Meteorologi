import * as THREE from 'three'
import {
  createPaintedWoodPBR,
  createGalvanizedSpanglePBR,
  createBrushedSteelPBR,
  createConcretePBR,
  createGrassGroundPBR,
  createSoilPBR,
  createSolarPanelPBR,
  createDarkPcbTexture,
  createNaturalWoodPBR,
} from '@/lib/tamanAlatTextures'

export function createSharedPBRMaterials() {
  const pbrTextures = {
    woodPaint: createPaintedWoodPBR(2, 2),
    galvanized: createGalvanizedSpanglePBR(3, 2),
    stainless: createBrushedSteelPBR(),
    concrete: createConcretePBR(2, 2),
    concreteWalk: createConcretePBR(1, 6),
    parkGrass: createGrassGroundPBR(true),
    outerGrass: createGrassGroundPBR(false),
    soil: createSoilPBR(),
    solar: createSolarPanelPBR(),
    pcbEsp: createDarkPcbTexture('#0c3b2e'),
    pcbBme: createDarkPcbTexture('#0c274d'),
    woodNat: createNaturalWoodPBR(),
  }

  const markShared = <T extends THREE.Material>(m: T): T => {
    m.userData = { ...m.userData, shared: true }
    return m
  }

  return {
    textures: pbrTextures,
    concrete: markShared(
      new THREE.MeshStandardMaterial({
        map: pbrTextures.concrete.map,
        bumpMap: pbrTextures.concrete.bumpMap,
        bumpScale: 0.025,
        roughnessMap: pbrTextures.concrete.roughnessMap,
        roughness: 0.92,
        metalness: 0.03,
      })
    ),
    walkway: markShared(
      new THREE.MeshStandardMaterial({
        map: pbrTextures.concreteWalk.map,
        bumpMap: pbrTextures.concreteWalk.bumpMap,
        bumpScale: 0.02,
        roughnessMap: pbrTextures.concreteWalk.roughnessMap,
        roughness: 0.9,
        metalness: 0.03,
      })
    ),
    whiteWoodFence: markShared(
      new THREE.MeshStandardMaterial({
        color: 0xe0e2e5,
        map: pbrTextures.woodPaint.map,
        bumpMap: pbrTextures.woodPaint.bumpMap,
        bumpScale: 0.014,
        roughnessMap: pbrTextures.woodPaint.roughnessMap,
        roughness: 0.68,
        metalness: 0.03,
      })
    ),
    galvanized: markShared(
      new THREE.MeshStandardMaterial({
        map: pbrTextures.galvanized.map,
        bumpMap: pbrTextures.galvanized.bumpMap,
        bumpScale: 0.012,
        roughnessMap: pbrTextures.galvanized.roughnessMap,
        roughness: 0.42,
        metalness: 0.85,
      })
    ),
    stainless: markShared(
      new THREE.MeshStandardMaterial({
        map: pbrTextures.stainless.map,
        roughnessMap: pbrTextures.stainless.roughnessMap,
        roughness: 0.28,
        metalness: 0.9,
      })
    ),
    darkSteel: markShared(
      new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.42,
        metalness: 0.78,
      })
    ),
    conduitGrey: markShared(
      new THREE.MeshStandardMaterial({
        color: 0x475569,
        roughness: 0.55,
        metalness: 0.18,
      })
    ),
    cableBlack: markShared(
      new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.65,
        metalness: 0.08,
      })
    ),
    woodNatural: markShared(
      new THREE.MeshStandardMaterial({
        map: pbrTextures.woodNat.map,
        bumpMap: pbrTextures.woodNat.bumpMap,
        bumpScale: 0.018,
        roughness: 0.86,
        metalness: 0.02,
      })
    ),
    brass: markShared(
      new THREE.MeshStandardMaterial({
        color: 0xd9a13b,
        roughness: 0.26,
        metalness: 0.9,
      })
    ),
    copper: markShared(
      new THREE.MeshStandardMaterial({
        color: 0xd97236,
        roughness: 0.3,
        metalness: 0.86,
      })
    ),
    ip65Grey: markShared(
      new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.48,
        metalness: 0.15,
      })
    ),
    pcbEsp: markShared(
      new THREE.MeshStandardMaterial({
        map: pbrTextures.pcbEsp,
        roughness: 0.38,
        metalness: 0.25,
      })
    ),
    pcbBme: markShared(
      new THREE.MeshStandardMaterial({
        map: pbrTextures.pcbBme,
        roughness: 0.38,
        metalness: 0.25,
      })
    ),
    solarGlass: markShared(
      new THREE.MeshStandardMaterial({
        map: pbrTextures.solar.map,
        roughnessMap: pbrTextures.solar.roughnessMap,
        bumpMap: pbrTextures.solar.bumpMap,
        bumpScale: 0.008,
        roughness: 0.18,
        metalness: 0.45,
      })
    ),
    glassPhysical: markShared(
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.05,
        metalness: 0.05,
        transmission: 0.92,
        ior: 1.52,
        transparent: true,
        opacity: 0.9,
      })
    ),
  }
}

export type SharedPBRMaterials = ReturnType<typeof createSharedPBRMaterials>
