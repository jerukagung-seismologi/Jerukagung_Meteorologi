import * as THREE from 'three'
import { SharedPBRMaterials } from './sharedMaterials'
import { addConcretePlinthWithBolts, addConduitTube } from './mechanicalDetails'

export interface WindStationControls {
  root: THREE.Group
  cupRotorGroup: THREE.Group
  windVaneGroup: THREE.Group
  awsLedMat: THREE.MeshBasicMaterial
  update: (windSpeed: number, windDir: number, dt: number, elapsed: number) => void
}

export function buildWindStation(scene: THREE.Scene, sharedMats: SharedPBRMaterials): WindStationControls {
  const group = new THREE.Group()
  group.position.set(-3.8, 0.05, -3.2)
  group.userData.instrumentId = 'anemometer'

  // Pondasi beton berbaut angkur 4 titik
  const baseTopY = addConcretePlinthWithBolts(group, 0.78, 0.78, 0.12, 0.34, 0, sharedMats)

  // Tiang galvanis spangle setinggi 3.2m
  const mastH = 3.2
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.05, mastH, 20), sharedMats.galvanized)
  mast.position.y = baseTopY + mastH / 2
  mast.castShadow = true
  mast.receiveShadow = true
  group.add(mast)

  // Kotak Data Logger IP65
  const loggerBox = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.38, 0.19), sharedMats.ip65Grey)
  loggerBox.position.set(0, 1.38, 0.14)
  loggerBox.castShadow = true
  group.add(loggerBox)

  const doorRim = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.36, 0.015), sharedMats.stainless)
  doorRim.position.set(0, 1.38, 0.238)
  group.add(doorRim)

  const awsLedMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
  const awsLed = new THREE.Mesh(new THREE.SphereGeometry(0.01, 10, 10), awsLedMat)
  awsLed.position.set(0.09, 1.5, 0.248)
  group.add(awsLed)

  // Panel Surya Monokristalin
  const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.28), sharedMats.darkSteel)
  bracket.position.set(0, 1.88, -0.14)
  group.add(bracket)

  const pvFrame = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.028, 0.42), sharedMats.stainless)
  pvFrame.position.set(0, 1.96, -0.26)
  pvFrame.rotation.x = 0.28
  pvFrame.castShadow = true
  group.add(pvFrame)

  const pvFace = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.38), sharedMats.solarGlass)
  pvFace.position.set(0, 0.0155, 0)
  pvFace.rotation.x = -Math.PI / 2
  pvFrame.add(pvFace)

  // Pipa konduit melengkung
  addConduitTube(
    group,
    [
      new THREE.Vector3(0.05, 1.9, -0.24),
      new THREE.Vector3(0.08, 1.72, -0.08),
      new THREE.Vector3(0.08, 1.54, 0.12),
    ],
    0.011,
    sharedMats.conduitGrey
  )
  addConduitTube(
    group,
    [
      new THREE.Vector3(-0.04, 3.15, 0.03),
      new THREE.Vector3(-0.06, 2.35, 0.055),
      new THREE.Vector3(-0.06, 1.57, 0.11),
    ],
    0.01,
    sharedMats.conduitGrey
  )
  addConduitTube(
    group,
    [
      new THREE.Vector3(0.0, 1.19, 0.13),
      new THREE.Vector3(0.04, 0.65, 0.12),
      new THREE.Vector3(0.09, baseTopY + 0.02, 0.14),
    ],
    0.012,
    sharedMats.conduitGrey
  )

  // Palang T Atas
  const topY = baseTopY + mastH
  const crossBar = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.22, 14), sharedMats.galvanized)
  crossBar.rotation.z = Math.PI / 2
  crossBar.position.y = topY - 0.04
  crossBar.castShadow = true
  group.add(crossBar)

  // --- A. CUP ANEMOMETER (Kiri, x = -0.55) ---
  const anemoHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.038, 0.15, 14), sharedMats.darkSteel)
  anemoHousing.position.set(-0.55, topY + 0.03, 0)
  group.add(anemoHousing)

  const cupRotorGroup = new THREE.Group()
  cupRotorGroup.position.set(-0.55, topY + 0.15, 0)
  group.add(cupRotorGroup)

  cupRotorGroup.add(new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.045, 14), sharedMats.stainless))

  const cupGeo = new THREE.SphereGeometry(0.056, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2)
  const cupMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.25,
    metalness: 0.35,
    side: THREE.DoubleSide,
  })

  for (let i = 0; i < 3; i++) {
    const armG = new THREE.Group()
    armG.rotation.y = (i * Math.PI * 2) / 3
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.23, 8), sharedMats.stainless)
    arm.rotation.z = Math.PI / 2
    arm.position.x = 0.115
    armG.add(arm)

    const cup = new THREE.Mesh(cupGeo, cupMat)
    cup.position.x = 0.23
    cup.rotation.x = Math.PI / 2
    cup.castShadow = true
    armG.add(cup)
    cupRotorGroup.add(armG)
  }

  // --- B. WIND VANE (Kanan, x = +0.55) ---
  const vaneHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.038, 0.15, 14), sharedMats.darkSteel)
  vaneHousing.position.set(0.55, topY + 0.03, 0)
  group.add(vaneHousing)

  const windVaneGroup = new THREE.Group()
  windVaneGroup.position.set(0.55, topY + 0.17, 0)
  group.add(windVaneGroup)

  const vaneRod = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.58, 10), sharedMats.stainless)
  vaneRod.rotation.x = Math.PI / 2
  vaneRod.castShadow = true
  windVaneGroup.add(vaneRod)

  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.034, 0.115, 12),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.32, metalness: 0.25 })
  )
  cone.rotation.x = -Math.PI / 2
  cone.position.z = -0.31
  cone.castShadow = true
  windVaneGroup.add(cone)

  const tailShape = new THREE.Shape()
  tailShape.moveTo(0, -0.052)
  tailShape.lineTo(0.22, -0.105)
  tailShape.lineTo(0.22, 0.105)
  tailShape.lineTo(0, 0.052)
  tailShape.closePath()
  const tailFin = new THREE.Mesh(
    new THREE.ExtrudeGeometry(tailShape, { depth: 0.01, bevelEnabled: false }),
    sharedMats.stainless
  )
  tailFin.rotation.y = -Math.PI / 2
  tailFin.position.set(0.005, 0, 0.1)
  tailFin.castShadow = true
  windVaneGroup.add(tailFin)

  scene.add(group)

  let currentVaneAngle = 0

  const update = (windSpeed: number, windDir: number, dt: number, elapsed: number) => {
    cupRotorGroup.rotation.y -= windSpeed * 2.1 * dt

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
    awsLedMat,
    update,
  }
}
