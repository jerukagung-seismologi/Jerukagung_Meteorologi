import * as THREE from 'three'
import { createSolarPanelTexture } from '@/lib/tamanAlatTextures'
import { SharedMaterials } from './sharedMaterials'

export interface WindStationControls {
  root: THREE.Group
  cupRotorGroup: THREE.Group
  windVaneGroup: THREE.Group
  update: (windSpeed: number, windDir: number, dt: number, elapsed: number) => void
}

export function buildWindStation(scene: THREE.Scene, sharedMats: SharedMaterials): WindStationControls {
  const group = new THREE.Group()
  group.position.set(-3.8, 0.05, -3.2)
  group.userData.instrumentId = 'anemometer'

  // Pondasi beton
  const pad = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.08, 0.75), sharedMats.concrete)
  pad.position.y = 0.04
  pad.receiveShadow = true
  pad.castShadow = true
  group.add(pad)

  // Pelat flange bawah
  const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.05, 16), sharedMats.darkMetal)
  flange.position.y = 0.105
  group.add(flange)

  // Tiang logam galvanis setinggi 3.2m
  const mastH = 3.2
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.048, mastH, 16), sharedMats.galvanized)
  mast.position.y = mastH / 2 + 0.08
  mast.castShadow = true
  mast.receiveShadow = true
  group.add(mast)

  // Kotak Data Logger IP65 di ketinggian 1.35m
  const loggerBox = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.36, 0.18), sharedMats.ip65Grey)
  loggerBox.position.set(0, 1.35, 0.13)
  loggerBox.castShadow = true
  group.add(loggerBox)

  // Panel Surya kecil miring menghadap Utara (-Z)
  const solarBracket = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.22), sharedMats.darkMetal)
  solarBracket.position.set(0, 1.85, -0.11)
  group.add(solarBracket)

  const solarFrame = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.025, 0.36), sharedMats.galvanized)
  solarFrame.position.set(0, 1.92, -0.22)
  solarFrame.rotation.x = 0.26
  solarFrame.castShadow = true
  group.add(solarFrame)

  const solarFace = new THREE.Mesh(
    new THREE.PlaneGeometry(0.42, 0.32),
    new THREE.MeshStandardMaterial({ map: createSolarPanelTexture(), roughness: 0.2, metalness: 0.4 })
  )
  solarFace.position.set(0, 0.015, 0)
  solarFace.rotation.x = -Math.PI / 2
  solarFrame.add(solarFace)

  // Palang T atas (crossbar)
  const crossBar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.15, 12), sharedMats.galvanized)
  crossBar.rotation.z = Math.PI / 2
  crossBar.position.y = mastH + 0.02
  crossBar.castShadow = true
  group.add(crossBar)

  // --- A. CUP ANEMOMETER (Sisi Kiri Palang, x = -0.52) ---
  const anemoBase = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.036, 0.14, 12), sharedMats.darkMetal)
  anemoBase.position.set(-0.52, mastH + 0.08, 0)
  group.add(anemoBase)

  const cupRotorGroup = new THREE.Group()
  cupRotorGroup.position.set(-0.52, mastH + 0.19, 0)
  group.add(cupRotorGroup)

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.04, 12), sharedMats.darkMetal)
  cupRotorGroup.add(hub)

  const cupGeo = new THREE.SphereGeometry(0.052, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2)
  const cupMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.32,
    metalness: 0.15,
    side: THREE.DoubleSide,
  })

  for (let i = 0; i < 3; i++) {
    const armGroup = new THREE.Group()
    armGroup.rotation.y = (i * Math.PI * 2) / 3

    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.22, 8), sharedMats.galvanized)
    arm.rotation.z = Math.PI / 2
    arm.position.x = 0.11
    armGroup.add(arm)

    const cup = new THREE.Mesh(cupGeo, cupMat)
    cup.position.set(0.22, 0, 0)
    cup.rotation.x = Math.PI / 2
    cup.castShadow = true
    armGroup.add(cup)

    cupRotorGroup.add(armGroup)
  }

  // --- B. WIND VANE (Sisi Kanan Palang, x = +0.52) ---
  const vaneBase = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.036, 0.14, 12), sharedMats.darkMetal)
  vaneBase.position.set(0.52, mastH + 0.08, 0)
  group.add(vaneBase)

  const windVaneGroup = new THREE.Group()
  windVaneGroup.position.set(0.52, mastH + 0.21, 0)
  group.add(windVaneGroup)

  const vaneRod = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.56, 8), sharedMats.galvanized)
  vaneRod.rotation.x = Math.PI / 2
  vaneRod.castShadow = true
  windVaneGroup.add(vaneRod)

  const arrowCone = new THREE.Mesh(
    new THREE.ConeGeometry(0.032, 0.11, 10),
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35, metalness: 0.2 })
  )
  arrowCone.rotation.x = -Math.PI / 2
  arrowCone.position.z = -0.3
  arrowCone.castShadow = true
  windVaneGroup.add(arrowCone)

  const tailShape = new THREE.Shape()
  tailShape.moveTo(0, -0.05)
  tailShape.lineTo(0.2, -0.1)
  tailShape.lineTo(0.2, 0.1)
  tailShape.lineTo(0, 0.05)
  tailShape.closePath()

  const tailFin = new THREE.Mesh(
    new THREE.ExtrudeGeometry(tailShape, { depth: 0.01, bevelEnabled: false }),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4, metalness: 0.2 })
  )
  tailFin.rotation.y = -Math.PI / 2
  tailFin.position.set(0.005, 0, 0.11)
  tailFin.castShadow = true
  windVaneGroup.add(tailFin)

  scene.add(group)

  let currentVaneAngle = 0

  const update = (windSpeed: number, windDir: number, dt: number, elapsed: number) => {
    // Rotasi mangkuk anemometer
    cupRotorGroup.rotation.y -= windSpeed * 2.1 * dt

    // Wind Vane interpolasi
    const targetRad = -(windDir * Math.PI) / 180
    const gust = windSpeed > 0.5 ? Math.sin(elapsed * 2.3) * 0.045 * Math.min(1, windSpeed / 10) : 0
    let diff = ((targetRad + gust - currentVaneAngle + Math.PI) % (Math.PI * 2)) - Math.PI
    if (diff < -Math.PI) diff += Math.PI * 2
    currentVaneAngle += diff * Math.min(1, dt * 4.5)
    windVaneGroup.rotation.y = currentVaneAngle
  }

  return {
    root: group,
    cupRotorGroup,
    windVaneGroup,
    update,
  }
}
