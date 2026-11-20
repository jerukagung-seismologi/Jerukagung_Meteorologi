import * as THREE from "three"

export interface StevensonOptions { volumeDm3: number; legHeight: number; louverTilt: number; albedo: number; xRay: boolean }

export function createStevensonScreen(options: StevensonOptions): THREE.Group {
  const group = new THREE.Group(); group.userData.instrumentId = "stevenson"; group.userData.xRay = options.xRay; const width = Math.cbrt(options.volumeDm3 / 1000) * 1.7
  const material = new THREE.MeshStandardMaterial({ color: new THREE.Color().setScalar(0.65 + options.albedo * 0.35), roughness: 0.72, transparent: options.xRay, opacity: options.xRay ? 0.35 : 1 })
  const feet = new THREE.Mesh(new THREE.BoxGeometry(width * 0.75, options.legHeight, width * 0.75), new THREE.MeshStandardMaterial({ color: 0x6d5035 })); feet.position.y = options.legHeight / 2; group.add(feet)
  const floor = new THREE.Mesh(new THREE.BoxGeometry(width, 0.12, width), material); floor.position.y = options.legHeight; group.add(floor)
  const louvers = new THREE.InstancedMesh(new THREE.BoxGeometry(width * 1.05, 0.055, 0.12), material, 28)
  for (let i = 0; i < 28; i++) { const side = i < 14 ? -1 : 1; const row = i % 14; const matrix = new THREE.Matrix4().makeRotationZ((options.louverTilt * Math.PI) / 180); matrix.setPosition(side * width * 0.5, options.legHeight + 0.15 + row * 0.12, 0); louvers.setMatrixAt(i, matrix) }
  group.add(louvers)
  const roofMaterial = material.clone(); roofMaterial.color.set(0xece9db); const roof = new THREE.Mesh(new THREE.BoxGeometry(width * 1.18, 0.16, width * 1.18), roofMaterial); roof.position.y = options.legHeight + 1.85; group.add(roof); const roofCap = roof.clone(); roofCap.scale.set(0.92, 0.45, 0.92); roofCap.position.y += 0.2; group.add(roofCap)
  const sensor = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.5, 0.25), new THREE.MeshStandardMaterial({ color: 0x263238, emissive: 0x102027, transparent: true, opacity: options.xRay ? 1 : 0 })); sensor.position.set(0, options.legHeight + 0.8, 0); group.add(sensor); group.userData.sensor = sensor
  return group
}