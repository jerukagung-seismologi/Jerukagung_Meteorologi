import * as THREE from "three"

export function createRainGauge(): THREE.Group {
  const group = new THREE.Group(); group.userData.instrumentId = "rain-gauge"; const metal = new THREE.MeshStandardMaterial({ color: 0xb8c3c6, metalness: 0.7, roughness: 0.35 })
  const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.4, 0.9, 20), metal); bucket.position.y = 0.45; group.add(bucket); const funnel = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.35, 20, 1, true), metal); funnel.position.y = 1.08; group.add(funnel)
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.3, 10), new THREE.MeshStandardMaterial({ color: 0x59666a })); stand.position.set(1.1, 0.65, 0); group.add(stand); const obs = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.85, 20), metal); obs.position.set(1.1, 1.35, 0); group.add(obs)
  return group
}