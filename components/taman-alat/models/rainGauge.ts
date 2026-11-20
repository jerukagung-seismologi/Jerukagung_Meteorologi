import * as THREE from 'three'
import { SharedPBRMaterials } from './sharedMaterials'
import { addConcretePlinthWithBolts, addConduitTube } from './mechanicalDetails'

export interface RainGaugeControls {
  root: THREE.Group
  tippingBucketPivot: THREE.Group
  tippingHousingMat: THREE.MeshStandardMaterial
  tippingLedMat: THREE.MeshBasicMaterial
  update: (rainIntensity: number, dt: number, onTip?: () => void) => void
  setCutaway: (cutaway: boolean) => void
}

export function buildRainGaugeStation(scene: THREE.Scene, sharedMats: SharedPBRMaterials): RainGaugeControls {
  const group = new THREE.Group()
  group.position.set(3.8, 0.05, -2.6)
  group.userData.instrumentId = 'raingauge'

  // --- A. TIPPING BUCKET RAIN GAUGE ---
  const tbTopY = addConcretePlinthWithBolts(group, 0.68, 0.68, 0.1, 0.34, 0, sharedMats)

  const tbBase = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.155, 0.04, 28), sharedMats.darkSteel)
  tbBase.position.y = tbTopY + 0.02
  group.add(tbBase)

  const tippingHousingMat = new THREE.MeshStandardMaterial({
    map: sharedMats.textures.stainless.map,
    roughnessMap: sharedMats.textures.stainless.roughnessMap,
    roughness: 0.28,
    metalness: 0.88,
    side: THREE.DoubleSide,
  })
  const tbCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.142, 0.142, 0.56, 32, 1, true), tippingHousingMat)
  tbCyl.position.y = tbTopY + 0.32
  tbCyl.castShadow = true
  tbCyl.receiveShadow = true
  group.add(tbCyl)

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.142, 0.011, 12, 32), sharedMats.brass)
  rim.rotation.x = Math.PI / 2
  rim.position.y = tbTopY + 0.6
  group.add(rim)

  const funnel = new THREE.Mesh(
    new THREE.ConeGeometry(0.138, 0.17, 28, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.25, metalness: 0.85, side: THREE.DoubleSide })
  )
  funnel.rotation.x = Math.PI
  funnel.position.y = tbTopY + 0.515
  group.add(funnel)

  // Jungkat-Jungkit Twin Bucket Tembaga
  ;[-0.055, 0.055].forEach((fz) => {
    const fulcrum = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.13, 0.028), sharedMats.darkSteel)
    fulcrum.position.set(0, tbTopY + 0.11, fz)
    group.add(fulcrum)
  })

  const tippingBucketPivot = new THREE.Group()
  tippingBucketPivot.position.set(0, tbTopY + 0.165, 0)
  group.add(tippingBucketPivot)

  tippingBucketPivot.add(new THREE.Mesh(new THREE.BoxGeometry(0.185, 0.008, 0.085), sharedMats.copper))
  const div = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.072, 0.085), sharedMats.copper)
  div.position.y = 0.036
  tippingBucketPivot.add(div)
  ;[-0.042, 0.042].forEach((bz) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.055, 0.006), sharedMats.copper)
    wall.position.set(0, 0.028, bz)
    tippingBucketPivot.add(wall)
  })

  const magnet = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.022, 10), sharedMats.darkSteel)
  magnet.position.y = -0.016
  tippingBucketPivot.add(magnet)

  const reedPcb = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.012, 0.055), sharedMats.pcbBme)
  reedPcb.position.y = tbTopY + 0.055
  group.add(reedPcb)

  const tippingLedMat = new THREE.MeshBasicMaterial({ color: 0x064e3b })
  const reedLed = new THREE.Mesh(new THREE.SphereGeometry(0.013, 10, 10), tippingLedMat)
  reedLed.position.set(0.016, tbTopY + 0.07, 0.016)
  group.add(reedLed)

  // Pipa konduit sinyal ke plinth
  addConduitTube(
    group,
    [
      new THREE.Vector3(-0.14, tbTopY + 0.05, 0.04),
      new THREE.Vector3(-0.24, tbTopY + 0.03, 0.08),
      new THREE.Vector3(-0.28, 0.05, 0.14),
    ],
    0.01,
    sharedMats.conduitGrey
  )

  // --- B. PENAKAR MANUAL OBS KLASIK ---
  const obs = new THREE.Group()
  obs.position.set(1.12, 0, 0)
  group.add(obs)

  const obsTopY = addConcretePlinthWithBolts(obs, 0.56, 0.56, 0.09, 0.24, 0, sharedMats)
  const obsStand = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.62, 0.13), sharedMats.woodNatural)
  obsStand.position.y = obsTopY + 0.31
  obsStand.castShadow = true
  obs.add(obsStand)

  const obsCyl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.082, 0.082, 0.44, 24),
    new THREE.MeshStandardMaterial({
      map: sharedMats.textures.galvanized.map,
      roughnessMap: sharedMats.textures.galvanized.roughnessMap,
      color: 0x94a3b8,
      roughness: 0.45,
      metalness: 0.65,
    })
  )
  obsCyl.position.y = obsTopY + 0.8
  obsCyl.castShadow = true
  obs.add(obsCyl)

  const obsFunnel = new THREE.Mesh(new THREE.CylinderGeometry(0.086, 0.082, 0.075, 24), sharedMats.brass)
  obsFunnel.position.y = obsTopY + 1.055
  obsFunnel.castShadow = true
  obs.add(obsFunnel)

  const tapBody = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.08, 10), sharedMats.brass)
  tapBody.rotation.x = Math.PI / 2
  tapBody.position.set(0, obsTopY + 0.63, 0.105)
  obs.add(tapBody)
  const tapHandle = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.01, 0.01), sharedMats.brass)
  tapHandle.position.set(0, obsTopY + 0.65, 0.125)
  obs.add(tapHandle)

  scene.add(group)

  let bucketFillMm = 0
  let bucketSide = 1
  let bucketAngle = 0
  let bucketTargetAngle = 0
  let reedPulseTimer = 0

  const update = (rainIntensity: number, dt: number, onTip?: () => void) => {
    if (rainIntensity > 0) {
      const visualRateMmPerSec = (rainIntensity / 3600) * 60
      bucketFillMm += visualRateMmPerSec * dt
      if (bucketFillMm >= 0.2) {
        bucketFillMm -= 0.2
        bucketSide *= -1
        bucketTargetAngle = bucketSide * 0.38
        reedPulseTimer = 0.25
        if (onTip) onTip()
      }
    }

    bucketAngle += (bucketTargetAngle - bucketAngle) * Math.min(1, dt * 16)
    tippingBucketPivot.rotation.z = bucketAngle

    if (reedPulseTimer > 0) {
      reedPulseTimer -= dt
      tippingLedMat.color.setHex(0x4ade80)
    } else {
      tippingLedMat.color.setHex(0x064e3b)
    }
  }

  const setCutaway = (cutaway: boolean) => {
    tippingHousingMat.transparent = cutaway
    tippingHousingMat.opacity = cutaway ? 0.24 : 1.0
    tippingHousingMat.depthWrite = !cutaway
    tippingHousingMat.needsUpdate = true
  }

  return {
    root: group,
    tippingBucketPivot,
    tippingHousingMat,
    tippingLedMat,
    update,
    setCutaway,
  }
}
