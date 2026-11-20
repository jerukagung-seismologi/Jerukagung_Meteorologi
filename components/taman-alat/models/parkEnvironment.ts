import * as THREE from 'three'
import { createGrassTexture, createCompassPlaqueTexture } from '@/lib/tamanAlatTextures'
import { SharedMaterials } from './sharedMaterials'

export function buildParkEnvironment(scene: THREE.Scene, sharedMats: SharedMaterials) {
  const envGroup = new THREE.Group()

  // Hamparan tanah/rumput luas sekitar taman
  const outerGround = new THREE.Mesh(
    new THREE.PlaneGeometry(150, 150),
    new THREE.MeshStandardMaterial({
      map: createGrassTexture(false),
      roughness: 0.96,
      metalness: 0.0,
    })
  )
  outerGround.rotation.x = -Math.PI / 2
  outerGround.receiveShadow = true
  envGroup.add(outerGround)

  // Petak rumput utama Taman Alat 12m x 12m (sedikit lebih tinggi & terawat)
  const parkGrass = new THREE.Mesh(
    new THREE.BoxGeometry(12.2, 0.05, 12.2),
    new THREE.MeshStandardMaterial({
      map: createGrassTexture(true),
      roughness: 0.92,
      metalness: 0.0,
    })
  )
  parkGrass.position.y = 0.025
  parkGrass.receiveShadow = true
  envGroup.add(parkGrass)

  // Lis beton tepi taman
  const curbMat = sharedMats.concrete
  const curbPieces = [
    [12.36, 0.08, 0.14, 0, 0.04, -6.12],
    [5.2, 0.08, 0.14, -3.58, 0.04, 6.12],
    [5.2, 0.08, 0.14, 3.58, 0.04, 6.12],
    [0.14, 0.08, 12.36, -6.12, 0.04, 0],
    [0.14, 0.08, 12.36, 6.12, 0.04, 0],
  ]
  curbPieces.forEach(([w, h, d, x, y, z]) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), curbMat)
    mesh.position.set(x, y, z)
    mesh.receiveShadow = true
    mesh.castShadow = true
    envGroup.add(mesh)
  })

  // Jalan setapak beton tipis (dari gerbang Selatan ke Stevenson Screen & cabang ke alat)
  const walkwaySpecs = [
    [0.9, 0.03, 6.2, 0, 0.055, 3.0],       // Utama Selatan -> Tengah
    [7.6, 0.03, 0.6, 0, 0.055, 0],         // Melintang Tengah
    [0.6, 0.03, 3.3, -3.8, 0.055, -1.6],   // Ke Anemometer
    [0.6, 0.03, 2.7, 3.8, 0.055, -1.2],    // Ke Penakar Hujan
    [0.6, 0.03, 2.6, 3.6, 0.055, 1.3],     // Ke Pyranometer
    [0.6, 0.03, 2.6, -3.6, 0.055, 1.3],    // Ke Panci Penguapan
  ]
  walkwaySpecs.forEach(([w, h, d, x, y, z]) => {
    const path = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), sharedMats.concrete)
    path.position.set(x, y, z)
    path.receiveShadow = true
    envGroup.add(path)
  })

  // Pagar putih keliling standar taman alat
  buildPerimeterFence(envGroup, sharedMats)

  // Penanda arah mata angin (U, T, S, B) di 4 sisi taman
  const compassData = [
    { l: 'U', sub: 'UTARA', x: 0, z: -5.45 },
    { l: 'S', sub: 'SELATAN', x: 1.55, z: 5.45 },
    { l: 'T', sub: 'TIMUR', x: 5.45, z: 0 },
    { l: 'B', sub: 'BARAT', x: -5.45, z: 0 },
  ]
  compassData.forEach((c) => {
    const plaque = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.03, 0.62),
      new THREE.MeshStandardMaterial({
        map: createCompassPlaqueTexture(c.l, c.sub),
        roughness: 0.65,
      })
    )
    plaque.position.set(c.x, 0.065, c.z)
    plaque.receiveShadow = true
    envGroup.add(plaque)
  })

  scene.add(envGroup)
  return envGroup
}

function buildPerimeterFence(parentGroup: THREE.Group, sharedMats: SharedMaterials) {
  const fenceHeight = 1.15
  const half = 6.08
  const postPositions: [number, number][] = []
  const picketMatrices: THREE.Matrix4[] = []
  const railConfigs: { cx: number; cz: number; len: number; angle: number }[] = []

  const addFenceSegment = (x1: number, z1: number, x2: number, z2: number) => {
    const dx = x2 - x1
    const dz = z2 - z1
    const len = Math.hypot(dx, dz)
    const angle = Math.atan2(dx, dz)

    const postCount = Math.max(2, Math.round(len / 2.0) + 1)
    for (let i = 0; i < postCount; i++) {
      const t = i / (postCount - 1)
      postPositions.push([x1 + dx * t, z1 + dz * t])
    }

    const picketCount = Math.floor(len / 0.22)
    const dummy = new THREE.Object3D()
    for (let i = 1; i < picketCount; i++) {
      const t = i / picketCount
      dummy.position.set(x1 + dx * t, fenceHeight * 0.48 + 0.05, z1 + dz * t)
      dummy.rotation.set(0, angle, 0)
      dummy.updateMatrix()
      picketMatrices.push(dummy.matrix.clone())
    }

    railConfigs.push({ cx: (x1 + x2) / 2, cz: (z1 + z2) / 2, len, angle })
  }

  // 4 sisi pagar keliling (terbuka gerbang di tengah sisi Selatan)
  addFenceSegment(-half, -half, half, -half)
  addFenceSegment(-half, -half, -half, half)
  addFenceSegment(half, -half, half, half)
  addFenceSegment(-half, half, -0.95, half)
  addFenceSegment(0.95, half, half, half)

  // InstancedMesh Tiang Utama
  const postGeo = new THREE.BoxGeometry(0.09, fenceHeight + 0.08, 0.09)
  const postInst = new THREE.InstancedMesh(postGeo, sharedMats.whiteFence, postPositions.length)
  const dummy = new THREE.Object3D()
  postPositions.forEach(([x, z], idx) => {
    dummy.position.set(x, (fenceHeight + 0.08) / 2 + 0.03, z)
    dummy.rotation.set(0, 0, 0)
    dummy.updateMatrix()
    postInst.setMatrixAt(idx, dummy.matrix)
  })
  postInst.castShadow = true
  postInst.receiveShadow = true
  parentGroup.add(postInst)

  // InstancedMesh Bilah Vertikal
  const picketGeo = new THREE.BoxGeometry(0.025, fenceHeight - 0.14, 0.045)
  const picketInst = new THREE.InstancedMesh(picketGeo, sharedMats.whiteFence, picketMatrices.length)
  picketMatrices.forEach((mat, idx) => picketInst.setMatrixAt(idx, mat))
  picketInst.castShadow = true
  picketInst.receiveShadow = true
  parentGroup.add(picketInst)

  // Palang Horizontal (atas & bawah)
  railConfigs.forEach(({ cx, cz, len, angle }) => {
    ;[0.32, 0.96].forEach((ry) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, len), sharedMats.whiteFence)
      rail.position.set(cx, ry, cz)
      rail.rotation.y = angle
      rail.castShadow = true
      rail.receiveShadow = true
      parentGroup.add(rail)
    })
  })

  // Pintu gerbang kecil terbuka sedikit di sisi Selatan
  const gatePivot = new THREE.Group()
  gatePivot.position.set(-0.95, 0.05, half)
  gatePivot.rotation.y = -0.35
  const gateFrame = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.04), sharedMats.whiteFence)
  gateFrame.position.set(0.45, 0.9, 0)
  gatePivot.add(gateFrame)
  const gateFrameLow = gateFrame.clone()
  gateFrameLow.position.y = 0.28
  gatePivot.add(gateFrameLow)
  for (let i = 1; i <= 4; i++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.92, 0.025), sharedMats.whiteFence)
    bar.position.set(i * 0.18, 0.56, 0)
    bar.castShadow = true
    gatePivot.add(bar)
  }
  parentGroup.add(gatePivot)
}
