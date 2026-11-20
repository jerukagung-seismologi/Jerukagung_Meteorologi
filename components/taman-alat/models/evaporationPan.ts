import * as THREE from "three"

export function createEvaporationPan(): THREE.Group {
  const group = new THREE.Group(); group.userData.instrumentId = "evaporation-pan"; const wood = new THREE.MeshStandardMaterial({ color: 0x8c633e })
  for (const x of [-0.55, -0.18, 0.18, 0.55]) { const beam = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 1.45), wood); beam.position.set(x, 0.08, 0); group.add(beam) }
  const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.7, 0.22, 32), new THREE.MeshStandardMaterial({ color: 0x9ca9aa, metalness: 0.7, roughness: 0.3 })); pan.position.y = 0.35; group.add(pan); const water = new THREE.Mesh(new THREE.CircleGeometry(0.62, 32), new THREE.MeshStandardMaterial({ color: 0x4e9bb3, transparent: true, opacity: 0.7, roughness: 0.1 })); water.rotation.x = -Math.PI / 2; water.position.y = 0.47; group.add(water); const well = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.38, 16), new THREE.MeshStandardMaterial({ color: 0xe7e5d7 })); well.position.set(0.3, 0.62, 0); group.add(well); return group
}