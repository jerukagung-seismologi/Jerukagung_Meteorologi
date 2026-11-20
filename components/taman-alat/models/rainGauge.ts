import * as THREE from 'three'
import { SharedMaterials } from './sharedMaterials'

export interface RainGaugeControls {
  root: THREE.Group
  tippingBucketPivot: THREE.Group
  tippingHousingMat: THREE.MeshStandardMaterial
  tippingLedMat: THREE.MeshBasicMaterial
  update: (rainIntensity: number, dt: number, onTip?: () => void) => void
  setCutaway: (cutaway: boolean) => void
}

export function buildRainGaugeStation(scene: THREE.Scene, sharedMats: SharedMaterials): RainGaugeControls {
  const group = new THREE.Group()
  group.position.set(3.8, 0.05, -2.5)
  group.userData.instrumentId = 'raingauge'

  // --- A. TIPPING BUCKET RAIN GAUGE ---
  const tbPad = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.08, 0.68), sharedMats.concrete)
  tbPad.position.y = 0.04
  tbPad.receiveShadow = true
  tbPad.castShadow = true
  group.add(tbPad)

  const tbBase = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.155, 0.05, 24), sharedMats.darkMetal)
  tbBase.position.y = 0.105
  group.add(tbBase)

  const tippingHousingMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.28,
    metalness: 0.55,
    side: THREE.DoubleSide,
  })
  const tbCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.56, 28, 1, true), tippingHousingMat)
  tbCyl.position.y = 0.41
  tbCyl.castShadow = true
  tbCyl.receiveShadow = true
  group.add(tbCyl)

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.01, 10, 28), sharedMats.brass)
  rim.rotation.x = Math.PI / 2
  rim.position.y = 0.69
  group.add(rim)

  const funnel = new THREE.Mesh(
    new THREE.ConeGeometry(0.138, 0.16, 24, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.6, side: THREE.DoubleSide })
  )
  funnel.rotation.x = Math.PI
  funnel.position.y = 0.6
  group.add(funnel)

  // Mekanisme Internal Jungkat-Jungkit Twin Bucket
  const fulcrumL = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.14, 0.03), sharedMats.darkMetal)
  fulcrumL.position.set(0, 0.2, 0.055)
  group.add(fulcrumL)
  const fulcrumR = fulcrumL.clone()
  fulcrumR.position.z = -0.055
  group.add(fulcrumR)

  const tippingBucketPivot = new THREE.Group()
  tippingBucketPivot.position.set(0, 0.25, 0)
  group.add(tippingBucketPivot)

  const bucketFloor = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.008, 0.085), sharedMats.copper)
  tippingBucketPivot.add(bucketFloor)

  const divider = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.068, 0.085), sharedMats.copper)
  divider.position.y = 0.034
  tippingBucketPivot.add(divider)

  ;[-0.042, 0.042].forEach((bz) => {
    const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.175, 0.052, 0.006), sharedMats.copper)
    sideWall.position.set(0, 0.026, bz)
    tippingBucketPivot.add(sideWall)
  })

  const magnet = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.022, 10), sharedMats.darkMetal)
  magnet.position.set(0, -0.016, 0)
  tippingBucketPivot.add(magnet)

  const reedPcb = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.012, 0.05), sharedMats.pcbBlue)
  reedPcb.position.set(0, 0.14, 0)
  group.add(reedPcb)

  const tippingLedMat = new THREE.MeshBasicMaterial({ color: 0x064e3b })
  const reedLed = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 10), tippingLedMat)
  reedLed.position.set(0.015, 0.155, 0.015)
  group.add(reedLed)

  // --- B. PENAKAR HUJAN MANUAL OBS ---
  const obsGroup = new THREE.Group()
  obsGroup.position.set(1.1, 0, 0)
  group.add(obsGroup)

  const obsPad = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.08, 0.56), sharedMats.concrete)
  obsPad.position.y = 0.04
  obsPad.receiveShadow = true
  obsGroup.add(obsPad)

  const obsStand = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.62, 0.14), sharedMats.woodPallet)
  obsStand.position.y = 0.39
  obsStand.castShadow = true
  obsGroup.add(obsStand)

  const obsMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.42, metalness: 0.48 })
  const obsCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.44, 20), obsMat)
  obsCyl.position.y = 0.9
  obsCyl.castShadow = true
  obsGroup.add(obsCyl)

  const obsFunnel = new THREE.Mesh(new THREE.CylinderGeometry(0.084, 0.08, 0.07, 20), sharedMats.brass)
  obsFunnel.position.y = 1.15
  obsFunnel.castShadow = true
  obsGroup.add(obsFunnel)

  const tapPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.08, 8), sharedMats.brass)
  tapPipe.rotation.x = Math.PI / 2
  tapPipe.position.set(0, 0.72, 0.1)
  obsGroup.add(tapPipe)

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
