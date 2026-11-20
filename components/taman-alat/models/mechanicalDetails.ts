import * as THREE from 'three'
import { SharedPBRMaterials } from './sharedMaterials'

/** Membuat pondasi beton cor dengan pelat dasar baja & 4 mur-baut angkur heksagonal */
export function addConcretePlinthWithBolts(
  parent: THREE.Group,
  width: number,
  depth: number,
  height: number,
  plateSize = 0.26,
  yBase = 0,
  mats?: SharedPBRMaterials
): number {
  const g = new THREE.Group()
  g.position.y = yBase
  parent.add(g)

  const concreteMat = mats?.concrete || new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9 })
  const darkSteelMat = mats?.darkSteel || new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45, metalness: 0.7 })
  const stainlessMat = mats?.stainless || new THREE.MeshStandardMaterial({ color: 0xcfd8dc, roughness: 0.3, metalness: 0.85 })

  // Badan pondasi beton
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), concreteMat)
  plinth.position.y = height / 2
  plinth.castShadow = true
  plinth.receiveShadow = true
  g.add(plinth)

  // Lis chamfer atas beton tipis
  const cap = new THREE.Mesh(new THREE.BoxGeometry(width - 0.04, 0.018, depth - 0.04), concreteMat)
  cap.position.y = height + 0.009
  cap.receiveShadow = true
  g.add(cap)

  // Pelat dasar baja (baseplate)
  const plateY = height + 0.018
  const plate = new THREE.Mesh(new THREE.BoxGeometry(plateSize, 0.018, plateSize), darkSteelMat)
  plate.position.y = plateY + 0.009
  plate.castShadow = true
  plate.receiveShadow = true
  g.add(plate)

  // 4 Mur-baut angkur heksagonal
  const boltOff = plateSize * 0.36
  const nutGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.014, 6)
  const studGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.026, 8)
  const washGeo = new THREE.CylinderGeometry(0.021, 0.021, 0.004, 12)

  ;[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    const bx = sx * boltOff
    const bz = sz * boltOff
    const wash = new THREE.Mesh(washGeo, stainlessMat)
    wash.position.set(bx, plateY + 0.02, bz)
    g.add(wash)

    const nut = new THREE.Mesh(nutGeo, stainlessMat)
    nut.position.set(bx, plateY + 0.028, bz)
    g.add(nut)

    const stud = new THREE.Mesh(studGeo, darkSteelMat)
    stud.position.set(bx, plateY + 0.032, bz)
    g.add(stud)
  })

  return plateY + 0.018
}

/** Membuat pipa konduit / kabel melengkung halus via TubeGeometry */
export function addConduitTube(
  parent: THREE.Group,
  points: THREE.Vector3[],
  radius = 0.012,
  material?: THREE.Material
): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3(points)
  const geo = new THREE.TubeGeometry(curve, 20, radius, 8, false)
  const defaultMat = material || new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.55, metalness: 0.18 })
  const mesh = new THREE.Mesh(geo, defaultMat)
  mesh.castShadow = true
  parent.add(mesh)
  return mesh
}

export function disposeGroupChildren(group: THREE.Group) {
  while (group.children.length > 0) {
    const child = group.children[0]
    group.remove(child)
    child.traverse((obj) => {
      if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose()
      if ((obj as THREE.Mesh).material) {
        const mat = (obj as THREE.Mesh).material
        if (Array.isArray(mat)) {
          mat.forEach((m) => { if (m && !m.userData?.shared) m.dispose() })
        } else if (!mat.userData?.shared) {
          mat.dispose()
        }
      }
    })
  }
}
