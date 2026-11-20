import * as THREE from 'three'

export function createSharedMaterials() {
  return {
    concrete: new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9, metalness: 0.05 }),
    whiteFence: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.55, metalness: 0.05 }),
    galvanized: new THREE.MeshStandardMaterial({ color: 0xcfd8dc, roughness: 0.35, metalness: 0.75 }),
    darkMetal: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45, metalness: 0.6 }),
    ip65Grey: new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.65, metalness: 0.1 }),
    pcbGreen: new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5, metalness: 0.2 }),
    pcbBlue: new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.5, metalness: 0.2 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.35, metalness: 0.8 }),
    copper: new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.4, metalness: 0.7 }),
    woodPallet: new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85, metalness: 0.0 }),
    glassDome: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.08,
      metalness: 0.1,
      transmission: 0.82,
      ior: 1.5,
      transparent: true,
      opacity: 0.88,
    }),
  }
}

export type SharedMaterials = ReturnType<typeof createSharedMaterials>
