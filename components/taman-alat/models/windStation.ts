import * as THREE from "three"

export function createWindStation(): THREE.Group {
  const group = new THREE.Group(); group.userData.instrumentId = "wind"; const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 4.2, 12), new THREE.MeshStandardMaterial({ color: 0x9ca7a9, metalness: 0.6 })); pole.position.y = 2.1; group.add(pole)
  const rotor = new THREE.Group(); rotor.position.y = 4.25; group.add(rotor); rotor.add(new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), new THREE.MeshStandardMaterial({ color: 0xd7dedb, metalness: 0.6 })))
  for (let i = 0; i < 3; i++) { const angle = i * Math.PI * 2 / 3; const arm = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.04, 0.05), new THREE.MeshStandardMaterial({ color: 0xd7dedb })); arm.rotation.y = angle; arm.position.set(Math.cos(angle) * 0.32, 0, Math.sin(angle) * 0.32); rotor.add(arm); const cup = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0xf2f4ef })); cup.position.set(Math.cos(angle) * 0.62, 0, Math.sin(angle) * 0.62); rotor.add(cup) }
  group.userData.rotor = rotor; const vane = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.12), new THREE.MeshStandardMaterial({ color: 0xd45d4c })); vane.position.set(0, 3.7, 0); group.add(vane); group.userData.vane = vane; return group
}