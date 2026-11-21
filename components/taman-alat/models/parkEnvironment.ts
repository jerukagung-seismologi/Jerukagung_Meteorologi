import * as THREE from 'three'
import { createCompassPlaqueTexture } from '@/lib/tamanAlatTextures'
import { SharedPBRMaterials } from './sharedMaterials'

/** Cek apakah koordinat (x, z) berada di atas jalan setapak beton, petak tanah, atau pondasi alat */
export function isGrassExcluded(x: number, z: number): boolean {
  // Jalan setapak beton
  if (Math.abs(x) < 0.58 && z > -0.2 && z < 6.2) return true
  if (Math.abs(z) < 0.44 && Math.abs(x) < 3.95) return true
  if (Math.abs(x + 3.8) < 0.44 && z > -3.3 && z < 0.2) return true
  if (Math.abs(x - 3.8) < 0.44 && z > -2.8 && z < 0.2) return true
  if (Math.abs(x - 3.6) < 0.44 && z > -0.2 && z < 2.8) return true
  if (Math.abs(x + 3.6) < 0.44 && z > -0.2 && z < 2.8) return true
  // Jalan setapak ke Utara (Campbell-Stokes & Barometer)
  if (Math.abs(x) < 0.38 && z > -3.6 && z < 0.2) return true
  if (Math.abs(z + 3.5) < 0.38 && Math.abs(x) < 2.05) return true

  // Pondasi instrumen & petak tanah gundul
  if (Math.abs(x) < 0.92 && Math.abs(z) < 0.92) return true // Stevenson Screen
  if (Math.abs(x + 3.8) < 0.52 && Math.abs(z + 3.2) < 0.52) return true // Anemometer
  if (x > 3.2 && x < 5.4 && z > -3.15 && z < -2.05) return true // Penakar Hujan + OBS
  if (x > 2.8 && x < 5.2 && z > 2.05 && z < 3.55) return true // Pyranometer + Petak Tanah Gundul
  if (Math.abs(x + 3.6) < 0.85 && Math.abs(z - 2.8) < 0.85) return true // Panci Penguapan
  if (Math.hypot(x + 1.65, z + 3.5) < 0.55) return true // Campbell-Stokes
  if (Math.hypot(x - 1.65, z + 3.5) < 0.55) return true // Barometer Digital
  // Plakat kompas
  if (Math.hypot(x, z + 5.45) < 0.48 || Math.hypot(x - 1.55, z - 5.45) < 0.48) return true
  if (Math.hypot(x - 5.45, z) < 0.48 || Math.hypot(x + 5.45, z) < 0.48) return true
  return false
}

export function buildParkEnvironment(scene: THREE.Scene, sharedMats: SharedPBRMaterials) {
  const envGroup = new THREE.Group()

  // Hamparan tanah/rumput luas sekitar taman (150m x 150m)
  const outerGround = new THREE.Mesh(
    new THREE.PlaneGeometry(150, 150),
    new THREE.MeshStandardMaterial({
      map: sharedMats.textures.outerGrass.map,
      bumpMap: sharedMats.textures.outerGrass.bumpMap,
      bumpScale: 0.045,
      roughness: 0.96,
      metalness: 0.0,
    })
  )
  outerGround.rotation.x = -Math.PI / 2
  outerGround.receiveShadow = true
  envGroup.add(outerGround)

  // Petak rumput utama Taman Alat 12.2m x 12.2m
  const parkGrass = new THREE.Mesh(
    new THREE.BoxGeometry(12.2, 0.05, 12.2),
    new THREE.MeshStandardMaterial({
      map: sharedMats.textures.parkGrass.map,
      bumpMap: sharedMats.textures.parkGrass.bumpMap,
      bumpScale: 0.038,
      roughness: 0.92,
      metalness: 0.0,
    })
  )
  parkGrass.position.y = 0.025
  parkGrass.receiveShadow = true
  envGroup.add(parkGrass)

  // Lis beton tepi taman
  const curbPieces = [
    [12.36, 0.08, 0.14, 0, 0.04, -6.12],
    [5.2, 0.08, 0.14, -3.58, 0.04, 6.12],
    [5.2, 0.08, 0.14, 3.58, 0.04, 6.12],
    [0.14, 0.08, 12.36, -6.12, 0.04, 0],
    [0.14, 0.08, 12.36, 6.12, 0.04, 0],
  ]
  curbPieces.forEach(([w, h, d, x, y, z]) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), sharedMats.concrete)
    mesh.position.set(x, y, z)
    mesh.receiveShadow = true
    mesh.castShadow = true
    envGroup.add(mesh)
  })

  // Jalan setapak beton cor beragregat
  const walkwaySpecs = [
    [0.9, 0.03, 6.2, 0, 0.055, 3.0],       // Utama Selatan -> Tengah
    [7.6, 0.03, 0.6, 0, 0.055, 0],         // Melintang Tengah
    [0.6, 0.03, 3.3, -3.8, 0.055, -1.6],   // Ke Anemometer
    [0.6, 0.03, 2.7, 3.8, 0.055, -1.2],    // Ke Penakar Hujan
    [0.6, 0.03, 2.6, 3.6, 0.055, 1.3],     // Ke Pyranometer
    [0.6, 0.03, 2.6, -3.6, 0.055, 1.3],    // Ke Panci Penguapan
    [0.6, 0.03, 3.5, 0, 0.055, -1.75],     // Menuju Utara (Taman Sisi Utara)
    [3.9, 0.03, 0.6, 0, 0.055, -3.5],      // Melintang Utara (Campbell-Stokes & Barometer)
  ]
  walkwaySpecs.forEach(([w, h, d, x, y, z]) => {
    const path = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), sharedMats.walkway)
    path.position.set(x, y, z)
    path.receiveShadow = true
    envGroup.add(path)
  })

  // Pagar putih keliling
  buildPerimeterFence(envGroup, sharedMats)

  // 4 Penanda arah mata angin
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

function buildPerimeterFence(parentGroup: THREE.Group, sharedMats: SharedPBRMaterials) {
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

  addFenceSegment(-half, -half, half, -half)
  addFenceSegment(-half, -half, -half, half)
  addFenceSegment(half, -half, half, half)
  addFenceSegment(-half, half, -0.95, half)
  addFenceSegment(0.95, half, half, half)

  // Tiang Utama
  const postGeo = new THREE.BoxGeometry(0.09, fenceHeight + 0.08, 0.09)
  const postInst = new THREE.InstancedMesh(postGeo, sharedMats.whiteWoodFence, postPositions.length)
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

  // Bilah Vertikal
  const picketGeo = new THREE.BoxGeometry(0.025, fenceHeight - 0.14, 0.045)
  const picketInst = new THREE.InstancedMesh(picketGeo, sharedMats.whiteWoodFence, picketMatrices.length)
  picketMatrices.forEach((mat, idx) => picketInst.setMatrixAt(idx, mat))
  picketInst.castShadow = true
  picketInst.receiveShadow = true
  parentGroup.add(picketInst)

  // Palang Horizontal
  railConfigs.forEach(({ cx, cz, len, angle }) => {
    ;[0.32, 0.96].forEach((ry) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, len), sharedMats.whiteWoodFence)
      rail.position.set(cx, ry, cz)
      rail.rotation.y = angle
      rail.castShadow = true
      rail.receiveShadow = true
      parentGroup.add(rail)
    })
  })

  // Pintu gerbang kecil di sisi Selatan
  const gatePivot = new THREE.Group()
  gatePivot.position.set(-0.95, 0.05, half)
  gatePivot.rotation.y = -0.35
  const gateFrame = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.04), sharedMats.whiteWoodFence)
  gateFrame.position.set(0.45, 0.9, 0)
  gatePivot.add(gateFrame)
  const gateFrameLow = gateFrame.clone()
  gateFrameLow.position.y = 0.28
  gatePivot.add(gateFrameLow)
  for (let i = 1; i <= 4; i++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.92, 0.025), sharedMats.whiteWoodFence)
    bar.position.set(i * 0.18, 0.56, 0)
    bar.castShadow = true
    gatePivot.add(bar)
  }
  parentGroup.add(gatePivot)
}

/** Membangun ribuan bilah rumput 3D GPU InstancedMesh dengan animasi angin di Vertex Shader */
export function buildInstancedGrass(
  scene: THREE.Scene,
  count: number,
  grassUniforms: {
    uTime: { value: number }
    uWindSpeed: { value: number }
    uWindDir: { value: THREE.Vector2 }
  }
): THREE.InstancedMesh | null {
  if (count <= 0) return null

  const bladeGeo = new THREE.PlaneGeometry(0.032, 0.16, 1, 3)
  bladeGeo.translate(0, 0.08, 0)
  const pos = bladeGeo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i)
    const t = y / 0.16
    pos.setX(i, pos.getX(i) * (1.0 - t * 0.88))
    pos.setZ(i, t * t * 0.035)
  }
  bladeGeo.computeVertexNormals()

  const grassMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.78,
    metalness: 0.0,
    side: THREE.DoubleSide,
  })

  grassMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = grassUniforms.uTime
    shader.uniforms.uWindSpeed = grassUniforms.uWindSpeed
    shader.uniforms.uWindDir = grassUniforms.uWindDir

    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
       uniform float uTime;
       uniform float uWindSpeed;
       uniform vec2 uWindDir;`
    )

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       float tipFactor = pow(clamp(position.y / 0.16, 0.0, 1.0), 1.65);
       vec2 worldXZ = vec2(0.0);
       #ifdef USE_INSTANCING
         worldXZ = vec2(instanceMatrix[3][0], instanceMatrix[3][2]);
       #endif
       float wavePhase = dot(worldXZ, uWindDir) * 0.65 - uTime * (1.7 + uWindSpeed * 0.24);
       float flutter = sin(wavePhase) * 0.65 + sin(wavePhase * 2.3 + worldXZ.x * 1.4) * 0.35;
       float bendAmt = (0.012 + min(uWindSpeed, 20.0) * 0.0052) * (0.55 + 0.45 * flutter);
       vec2 worldDisp = uWindDir * bendAmt * tipFactor;
       transformed.x += worldDisp.x;
       transformed.z += worldDisp.y;
       transformed.y -= abs(bendAmt) * 0.22 * tipFactor;`
    )
  }

  const grassInstMesh = new THREE.InstancedMesh(bladeGeo, grassMat, count)
  const dummy = new THREE.Object3D()
  const color = new THREE.Color()

  let placed = 0
  let attempts = 0
  while (placed < count && attempts < count * 5) {
    attempts++
    const inside = placed < count * 0.82
    let gx: number, gz: number
    if (inside) {
      gx = (Math.random() - 0.5) * 11.7
      gz = (Math.random() - 0.5) * 11.7
      if (isGrassExcluded(gx, gz)) continue
    } else {
      const side = Math.floor(Math.random() * 4)
      const span = (Math.random() - 0.5) * 18.0
      const dist = 6.35 + Math.random() * 3.5
      if (side === 0) { gx = span; gz = -dist }
      else if (side === 1) { gx = span; gz = dist }
      else if (side === 2) { gx = -dist; gz = span }
      else { gx = dist; gz = span }
    }

    const baseY = inside ? 0.048 : 0.0
    const scaleH = 0.65 + Math.random() * 0.85
    const scaleW = 0.8 + Math.random() * 0.55

    dummy.position.set(gx, baseY, gz)
    dummy.rotation.set((Math.random() - 0.5) * 0.16, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.16)
    dummy.scale.set(scaleW, scaleH, 1.0)
    dummy.updateMatrix()
    grassInstMesh.setMatrixAt(placed, dummy.matrix)

    color.setHSL(0.28 + (Math.random() - 0.5) * 0.045, 0.44 + Math.random() * 0.16, 0.26 + Math.random() * 0.14)
    grassInstMesh.setColorAt(placed, color)
    placed++
  }

  grassInstMesh.count = placed
  grassInstMesh.castShadow = false
  grassInstMesh.receiveShadow = true
  scene.add(grassInstMesh)
  return grassInstMesh
}
