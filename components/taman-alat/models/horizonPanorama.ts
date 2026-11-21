import * as THREE from 'three'

/** Pseudo seeded noise helper */
function seededNoise(i: number, seed: number): number {
  const x = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453
  return x - Math.floor(x)
}

export function buildHorizonPanorama360(scene: THREE.Scene): THREE.Group {
  const panoramaGroup = new THREE.Group()

  // 3 Cincin Silinder Perbukitan Berketinggian Bertingkat (Horizon Kebumen)
  const rings = [
    { radius: 92, baseH: 3.8, amp: 5.2, seed: 1.1, color: 0x223d29 },
    { radius: 150, baseH: 8.5, amp: 11.5, seed: 3.7, color: 0x1e3531 },
    { radius: 215, baseH: 15.0, amp: 20.0, seed: 6.4, color: 0x1c2f3a },
  ]

  rings.forEach((cfg) => {
    const segs = 96
    const geo = new THREE.CylinderGeometry(cfg.radius, cfg.radius, 1, segs, 1, true)
    const pos = geo.attributes.position

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const z = pos.getZ(i)
      const angle = Math.atan2(z, x)

      if (y > 0) {
        const ridge =
          Math.sin(angle * 3 + cfg.seed) * 0.45 +
          Math.sin(angle * 7 - cfg.seed * 1.6) * 0.30 +
          Math.cos(angle * 13 + cfg.seed * 2.2) * 0.16 +
          Math.sin(angle * 23 + cfg.seed) * 0.09
        pos.setY(i, cfg.baseH + Math.max(-0.5, ridge) * cfg.amp)
      } else {
        pos.setY(i, -3.5)
      }
    }
    geo.computeVertexNormals()

    const mesh = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({
        color: cfg.color,
        roughness: 0.96,
        metalness: 0.0,
        side: THREE.DoubleSide,
      })
    )
    panoramaGroup.add(mesh)
  })

  // 175 Pohon Siluet Tropis di Luar Zona Bebas Halangan WMO (radius 18m - 65m)
  const treeCount = 175
  const trunkGeo = new THREE.CylinderGeometry(0.14, 0.24, 2.2, 6)
  trunkGeo.translate(0, 1.1, 0)
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3b2c20, roughness: 0.95 })

  const crownGeo = new THREE.ConeGeometry(1.55, 4.6, 7)
  crownGeo.translate(0, 3.8, 0)
  const crownMat = new THREE.MeshStandardMaterial({ color: 0x234424, roughness: 0.92 })

  const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount)
  const crownInst = new THREE.InstancedMesh(crownGeo, crownMat, treeCount)
  const dummy = new THREE.Object3D()
  const col = new THREE.Color()

  for (let i = 0; i < treeCount; i++) {
    const ang = seededNoise(i, 2.1) * Math.PI * 2
    const dist = 18.0 + Math.pow(seededNoise(i, 4.7), 0.78) * 48.0
    const sc = 0.75 + seededNoise(i, 8.3) * 1.35

    dummy.position.set(Math.cos(ang) * dist, 0, Math.sin(ang) * dist)
    dummy.rotation.set(0, seededNoise(i, 6.2) * Math.PI * 2, 0)
    dummy.scale.set(
      sc * (0.85 + seededNoise(i, 1.4) * 0.35),
      sc,
      sc * (0.85 + seededNoise(i, 9.2) * 0.35)
    )
    dummy.updateMatrix()

    trunkInst.setMatrixAt(i, dummy.matrix)
    crownInst.setMatrixAt(i, dummy.matrix)
    col.setHSL(0.30 + (seededNoise(i, 3.3) - 0.5) * 0.05, 0.36, 0.16 + seededNoise(i, 7.7) * 0.09)
    crownInst.setColorAt(i, col)
  }

  trunkInst.instanceMatrix.needsUpdate = true
  crownInst.instanceMatrix.needsUpdate = true
  if (crownInst.instanceColor) crownInst.instanceColor.needsUpdate = true

  panoramaGroup.add(trunkInst)
  panoramaGroup.add(crownInst)

  scene.add(panoramaGroup)
  return panoramaGroup
}
