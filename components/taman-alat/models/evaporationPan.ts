import * as THREE from 'three'
import { SharedMaterials } from './sharedMaterials'

export interface EvaporationPanControls {
  root: THREE.Group
  waterMesh: THREE.Mesh
  waterBaseY: Float32Array
  miniRotor: THREE.Group
  update: (windSpeed: number, rainIntensity: number, dt: number, elapsed: number) => void
}

export function buildEvaporationPan(scene: THREE.Scene, sharedMats: SharedMaterials): EvaporationPanControls {
  const group = new THREE.Group()
  group.position.set(-3.6, 0.05, 2.8)
  group.userData.instrumentId = 'evappan'

  // Palet kisi-kisi kayu (1.34m x 1.34m, tinggi 0.14m)
  for (let i = -2; i <= 2; i++) {
    const runner = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.34), sharedMats.woodPallet)
    runner.position.set(i * 0.28, 0.04, 0)
    runner.castShadow = true
    runner.receiveShadow = true
    group.add(runner)
  }
  for (let j = -4; j <= 4; j++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.04, 0.11), sharedMats.woodPallet)
    slat.position.set(0, 0.1, j * 0.145)
    slat.castShadow = true
    slat.receiveShadow = true
    group.add(slat)
  }

  // Silinder logam galvanis Ø 1.21 m (radius 0.605m), tinggi 0.25m
  const panR = 0.605
  const panH = 0.25
  const panBaseY = 0.12

  const panWall = new THREE.Mesh(
    new THREE.CylinderGeometry(panR, panR, panH, 36, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0xdbe2ea,
      roughness: 0.3,
      metalness: 0.78,
      side: THREE.DoubleSide,
    })
  )
  panWall.position.y = panBaseY + panH / 2
  panWall.castShadow = true
  panWall.receiveShadow = true
  group.add(panWall)

  const panFloor = new THREE.Mesh(new THREE.CircleGeometry(panR, 36), sharedMats.galvanized)
  panFloor.rotation.x = -Math.PI / 2
  panFloor.position.y = panBaseY + 0.01
  panFloor.receiveShadow = true
  group.add(panFloor)

  const panRim = new THREE.Mesh(new THREE.TorusGeometry(panR, 0.012, 10, 36), sharedMats.galvanized)
  panRim.rotation.x = Math.PI / 2
  panRim.position.y = panBaseY + panH
  group.add(panRim)

  // Permukaan Air dengan ring geometry untuk riak
  const rippleGeo = new THREE.RingGeometry(0.001, panR - 0.012, 32, 8)
  rippleGeo.rotateX(-Math.PI / 2)
  const posAttr = rippleGeo.attributes.position
  const waterBaseY = new Float32Array(posAttr.count)
  for (let i = 0; i < posAttr.count; i++) {
    waterBaseY[i] = posAttr.getY(i)
  }

  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x0ea5e9,
    roughness: 0.12,
    metalness: 0.28,
    transparent: true,
    opacity: 0.78,
  })
  const waterMesh = new THREE.Mesh(rippleGeo, waterMat)
  waterMesh.position.y = panBaseY + 0.19
  waterMesh.receiveShadow = true
  group.add(waterMesh)

  // Stilling Well & Hook Gauge
  const well = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.22, 16, 1, true), sharedMats.brass)
  well.position.set(0.36, panBaseY + 0.12, 0.22)
  well.castShadow = true
  group.add(well)

  const hookBar = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.16, 8), sharedMats.darkMetal)
  hookBar.position.set(0.36, panBaseY + 0.28, 0.22)
  group.add(hookBar)

  const hookDial = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.025, 12), sharedMats.brass)
  hookDial.position.set(0.36, panBaseY + 0.36, 0.22)
  group.add(hookDial)

  // Mini Anemometer 0.5m
  const miniMast = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.018, 0.52, 10), sharedMats.galvanized)
  miniMast.position.set(-0.58, 0.12 + 0.26, -0.58)
  miniMast.castShadow = true
  group.add(miniMast)

  const miniRotor = new THREE.Group()
  miniRotor.position.set(-0.58, 0.12 + 0.54, -0.58)
  group.add(miniRotor)
  for (let i = 0; i < 3; i++) {
    const g = new THREE.Group()
    g.rotation.y = (i * Math.PI * 2) / 3
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.006, 0.006), sharedMats.darkMetal)
    arm.position.x = 0.055
    g.add(arm)
    const cup = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), sharedMats.whiteFence)
    cup.position.x = 0.11
    g.add(cup)
    miniRotor.add(g)
  }

  scene.add(group)

  const update = (windSpeed: number, rainIntensity: number, dt: number, elapsed: number) => {
    miniRotor.rotation.y -= windSpeed * 1.45 * dt

    // Riak Halus Permukaan Air
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
