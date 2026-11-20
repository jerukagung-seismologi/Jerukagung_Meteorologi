import * as THREE from "three"

export function createSolarAndSoil(): THREE.Group {
  const group = new THREE.Group(); group.userData.instrumentId = "pyranometer"; const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 1.2), new THREE.MeshStandardMaterial({ color: 0xf3f2e9 })); base.position.y = 0.75; group.add(base)
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0xd9f0e8, transmission: 0.75, transparent: true, opacity: 0.78, roughness: 0.08 })); dome.position.y = 0.86; group.add(dome)
  const plot = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 1.2), new THREE.MeshStandardMaterial({ color: 0x6c5134 })); plot.position.set(2, 0.04, 0); group.add(plot); for (const z of [-0.3, 0, 0.3]) { const probe = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 8), new THREE.MeshStandardMaterial({ color: 0x272d2e, metalness: 0.5 })); probe.position.set(2, 0.35, z); group.add(probe) }
  return group
}