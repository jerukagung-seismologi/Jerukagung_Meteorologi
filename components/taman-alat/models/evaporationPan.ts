import * as THREE from 'three'
import { SharedPBRMaterials } from './sharedMaterials'

export interface EvaporationPanControls {
  root: THREE.Group
  waterMesh: THREE.Mesh
  waterBaseY: Float32Array
  miniRotor: THREE.Group
  update: (windSpeed: number, rainIntensity: number, dt: number, elapsed: number) => void
}

export function buildEvaporationPan(scene: THREE.Scene, sharedMats: SharedPBRMaterials): EvaporationPanControls {
  const group = new THREE.Group()
  group.position.set(-3.6, 0.05, 2.8)
  group.userData.instrumentId = 'evappan'

  // Landasan pelat beton di bawah palet
  const pad = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.05, 1.56), sharedMats.concrete)
  pad.position.y = 0.025
  pad.receiveShadow = true
  group.add(pad)

  // Palet kisi kayu bertekstur alami
  for (let i = -2; i <= 2; i++) {
    const runner = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.36), sharedMats.woodNatural)
    runner.position.set(i * 0.28, 0.09, 0)
    runner.castShadow = true
    runner.receiveShadow = true
    group.add(runner)
  }
  for (let j = -4; j <= 4; j++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.04, 0.115), sharedMats.woodNatural)
    slat.position.set(0, 0.15, j * 0.145)
    slat.castShadow = true
    slat.receiveShadow = true
    group.add(slat)
  }

  // Silinder Panci Logam Galvanis Spangle (Ø 1.21 m, tinggi 0.255 m)
  const panR = 0.605
  const panH = 0.255
  const panBaseY = 0.17

  const panMat = sharedMats.galvanized.clone()
  panMat.side = THREE.DoubleSide
  const panWall = new THREE.Mesh(new THREE.CylinderGeometry(panR, panR, panH, 40, 1, true), panMat)
  panWall.position.y = panBaseY + panH / 2
  panWall.castShadow = true
  panWall.receiveShadow = true
  group.add(panWall)

  const panFloor = new THREE.Mesh(new THREE.CircleGeometry(panR, 40), sharedMats.galvanized)
  panFloor.rotation.x = -Math.PI / 2
  panFloor.position.y = panBaseY + 0.01
  panFloor.receiveShadow = true
  group.add(panFloor)

  const panRim = new THREE.Mesh(new THREE.TorusGeometry(panR, 0.013, 12, 40), sharedMats.stainless)
  panRim.rotation.x = Math.PI / 2
  panRim.position.y = panBaseY + panH
  group.add(panRim)

  // Permukaan Air Reflektif IBL dengan Animasi Riak
  const rippleGeo = new THREE.RingGeometry(0.001, panR - 0.01, 36, 10)
  rippleGeo.rotateX(-Math.PI / 2)
  const posAttr = rippleGeo.attributes.position
  const waterBaseY = new Float32Array(posAttr.count)
  for (let i = 0; i < posAttr.count; i++) {
    waterBaseY[i] = posAttr.getY(i)
  }

  const waterMat = new THREE.MeshPhysicalMaterial({
    color: 0x0b6fa4,
    roughness: 0.06,
    metalness: 0.12,
    transmission: 0.45,
    transparent: true,
    opacity: 0.86,
    ior: 1.333,
    reflectivity: 0.92,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  })
  const waterMesh = new THREE.Mesh(rippleGeo, waterMat)
  waterMesh.position.y = panBaseY + 0.195
  waterMesh.receiveShadow = true
  group.add(waterMesh)

  // Stilling Well Kuningan + Hook Gauge Mikrometer
  const well = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.056, 0.22, 20, 1, true), sharedMats.brass)
  well.position.set(0.36, panBaseY + 0.12, 0.22)
  well.castShadow = true
  group.add(well)

  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.016, 0.025), sharedMats.brass)
  bridge.position.set(0.36, panBaseY + 0.235, 0.22)
  group.add(bridge)

  const hookRod = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.16, 10), sharedMats.stainless)
  hookRod.position.set(0.36, panBaseY + 0.29, 0.22)
  group.add(hookRod)

  const micrometer = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.032, 16), sharedMats.brass)
  micrometer.position.set(0.36, panBaseY + 0.37, 0.22)
  group.add(micrometer)

  // Mini Anemometer 0.5m
  const miniMast = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.52, 12), sharedMats.galvanized)
  miniMast.position.set(-0.58, 0.17 + 0.26, -0.58)
  miniMast.castShadow = true
  group.add(miniMast)

  const miniRotor = new THREE.Group()
  miniRotor.position.set(-0.58, 0.17 + 0.54, -0.58)
  group.add(miniRotor)
  for (let i = 0; i < 3; i++) {
    const g = new THREE.Group()
    g.rotation.y = (i * Math.PI * 2) / 3
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.006, 0.006), sharedMats.stainless)
    arm.position.x = 0.055
    g.add(arm)
    const cup = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), sharedMats.whiteWoodFence)
    cup.position.x = 0.11
    g.add(cup)
    miniRotor.add(g)
  }

  scene.add(group)

  const update = (windSpeed: number, rainIntensity: number, dt: number, elapsed: number) => {
    miniRotor.rotation.y -= windSpeed * 1.45 * dt

    const pos = waterMesh.geometry.attributes.position
    const amp = 0.0025 + windSpeed * 0.00055 + rainIntensity * 0.00009
    const freq = 2.6 + windSpeed * 0.22
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      const r = Math.hypot(x, z)
      const wave = Math.sin(r * 18 - elapsed * freq) * Math.cos((x - z) * 9 + elapsed * 1.8) * amp
      pos.setY(i, waterBaseY[i] + wave)
    }
    pos.needsUpdate = true
  }

  return {
    root: group,
    waterMesh,
    waterBaseY,
    miniRotor,
    update,
  }
}
