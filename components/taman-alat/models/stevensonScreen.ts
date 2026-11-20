import * as THREE from 'three'
import { VOLUME_PRESETS } from '@/lib/tamanAlatPhysics'
import { SharedMaterials } from './sharedMaterials'

export interface StevensonScreenControls {
  root: THREE.Group
  doorPivot: THREE.Group | null
  espLedMat: THREE.MeshBasicMaterial | null
  rebuild: (params: {
    volumeKey: string
    legHeight: number
    louverTilt: number
    albedo: number
    xrayMode: boolean
    doorAngle: number
  }) => void
  applyXRay: (xrayMode: boolean) => void
  updateDoor: (doorAngle: number) => void
  updateEspLed: (elapsed: number) => void
  dispose: () => void
}

export function buildStevensonScreen(
  scene: THREE.Scene,
  sharedMats: SharedMaterials,
  initialParams = {
    volumeKey: 'casella',
    legHeight: 1.5,
    louverTilt: 45,
    albedo: 0.82,
    xrayMode: false,
    doorAngle: 0,
  }
): StevensonScreenControls {
  const root = new THREE.Group()
  root.position.set(0, 0.05, 0)
  root.userData.instrumentId = 'stevenson'
  scene.add(root)

  // Pondasi beton dasar
  const pad = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.05, 1.55), sharedMats.concrete)
  pad.position.y = 0.025
  pad.receiveShadow = true
  root.add(pad)

  const dynamicGroup = new THREE.Group()
  root.add(dynamicGroup)

  let doorPivot: THREE.Group | null = null
  let espLedMat: THREE.MeshBasicMaterial | null = null
  let outerMaterials: THREE.MeshStandardMaterial[] = []

  const disposeGroup = (group: THREE.Group) => {
    while (group.children.length > 0) {
      const child = group.children[0]
      group.remove(child)
      if ('geometry' in child && (child as THREE.Mesh).geometry) {
        ;((child as THREE.Mesh).geometry as THREE.BufferGeometry).dispose()
      }
      if (child instanceof THREE.Group) {
        disposeGroup(child)
      }
    }
  }

  const rebuild = (params: {
    volumeKey: string
    legHeight: number
    louverTilt: number
    albedo: number
    xrayMode: boolean
    doorAngle: number
  }) => {
    disposeGroup(dynamicGroup)
    outerMaterials = []

    const preset = VOLUME_PRESETS[params.volumeKey] || VOLUME_PRESETS.casella
    const W = preset.width
    const D = preset.depth
    const H = preset.height
    const legH = params.legHeight
    const tiltRad = (params.louverTilt * Math.PI) / 180

    // Material cat sangkar bereaksi terhadap slider Albedo
    const albedoNorm = (params.albedo - 0.45) / 0.4
    const paintColor = new THREE.Color().setHSL(
      0.11 * (1 - albedoNorm),
      0.14 * (1 - albedoNorm),
      0.64 + albedoNorm * 0.34
    )
    const paintRoughness = 0.88 - albedoNorm * 0.46

    const shelterMat = new THREE.MeshStandardMaterial({
      color: paintColor,
      roughness: paintRoughness,
      metalness: 0.04,
      transparent: params.xrayMode,
      opacity: params.xrayMode ? 0.24 : 1.0,
      depthWrite: !params.xrayMode,
    })
    outerMaterials.push(shelterMat)

    const frameMat = new THREE.MeshStandardMaterial({
      color: paintColor.clone().multiplyScalar(0.96),
      roughness: paintRoughness,
      metalness: 0.05,
      transparent: params.xrayMode,
      opacity: params.xrayMode ? 0.42 : 1.0,
      depthWrite: !params.xrayMode,
    })
    outerMaterials.push(frameMat)

    const legMat = new THREE.MeshStandardMaterial({
      color: paintColor.clone().multiplyScalar(0.95),
      roughness: 0.55,
      metalness: 0.08,
    })

    // 1. EMPAT KAKI PENYANGGA & PALANG PENGUAT BAWAH
    const legThick = 0.06
    const legOffsetX = W / 2 - 0.04
    const legOffsetZ = D / 2 - 0.04
    const splay = 0.09

    ;[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
      const topP = new THREE.Vector3(sx * legOffsetX, legH, sz * legOffsetZ)
      const botP = new THREE.Vector3(sx * (legOffsetX + splay), 0.05, sz * (legOffsetZ + splay))
      const dir = new THREE.Vector3().subVectors(topP, botP)
      const len = dir.length()

      const leg = new THREE.Mesh(new THREE.BoxGeometry(legThick, len, legThick), legMat)
      leg.position.copy(botP).addScaledVector(dir, 0.5)
      leg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
      leg.castShadow = true
      leg.receiveShadow = true
      dynamicGroup.add(leg)
    })

    // Palang penguat horizontal antar kaki (35% dan 96% tinggi kaki)
    ;[0.35, 0.96].forEach((ratio) => {
      const y = 0.05 + (legH - 0.05) * ratio
      const curW = (legOffsetX + splay * (1 - ratio)) * 2
      const curD = (legOffsetZ + splay * (1 - ratio)) * 2

      // Depan & belakang
      ;[-1, 1].forEach((sz) => {
        const brace = new THREE.Mesh(new THREE.BoxGeometry(curW, 0.045, 0.045), legMat)
        brace.position.set(0, y, sz * (curD / 2))
        brace.castShadow = true
        dynamicGroup.add(brace)
      })
      // Kiri & kanan
      ;[-1, 1].forEach((sx) => {
        const brace = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, curD), legMat)
        brace.position.set(sx * (curW / 2), y, 0)
        brace.castShadow = true
        dynamicGroup.add(brace)
      })
    })

    // Tangga pijakan pengamat di sisi Selatan (+Z)
    const stepCount = legH > 1.65 ? 3 : 2
    for (let s = 0; s < stepCount; s++) {
      const sy = 0.22 + s * 0.24
      const sz = D / 2 + 0.52 - s * 0.14
      const tread = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.035, 0.16), legMat)
      tread.position.set(0, sy, sz)
      tread.castShadow = true
      tread.receiveShadow = true
      dynamicGroup.add(tread)
    }
    // 2 tiang tangga miring
    ;[-0.21, 0.21].forEach((sx) => {
      const pTop = new THREE.Vector3(sx, 0.22 + (stepCount - 1) * 0.24 + 0.05, D / 2 + 0.52 - (stepCount - 1) * 0.14 - 0.05)
      const pBot = new THREE.Vector3(sx, 0.05, D / 2 + 0.62)
      const dir = new THREE.Vector3().subVectors(pTop, pBot)
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.035, dir.length(), 0.05), legMat)
      rail.position.copy(pBot).addScaledVector(dir, 0.5)
      rail.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
      rail.castShadow = true
      dynamicGroup.add(rail)
    })

    // 2. LANTAI BERONGGA (Papan berselang-seling ganda)
    const baseY = legH
    const slatCountFloor = 5
    const slatW = (W - 0.12) / slatCountFloor
    for (let i = 0; i < slatCountFloor; i++) {
      const x = -W / 2 + 0.06 + (i + 0.5) * slatW
      const board = new THREE.Mesh(new THREE.BoxGeometry(slatW * 0.72, 0.024, D - 0.08), frameMat)
      board.position.set(x, baseY + (i % 2 === 0 ? 0.015 : 0.045), 0)
      board.castShadow = true
      board.receiveShadow = true
      dynamicGroup.add(board)
    }

    // 3. RANGKA SUDUT KOTAK SANGKAR
    const postSize = 0.055
    ;[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
      const cornerPost = new THREE.Mesh(new THREE.BoxGeometry(postSize, H, postSize), frameMat)
      cornerPost.position.set(sx * (W / 2 - postSize / 2), baseY + H / 2, sz * (D / 2 - postSize / 2))
      cornerPost.castShadow = true
      cornerPost.receiveShadow = true
      dynamicGroup.add(cornerPost)
    })

    // Helper membuat panel dinding berkisi-kisi ganda (Double Louvers)
    const createDoubleLouverWall = (panelWidth: number, panelHeight: number, parentGroup: THREE.Group, localOffset: THREE.Vector3, rotY: number) => {
      const wallGroup = new THREE.Group()
      wallGroup.position.copy(localOffset)
      wallGroup.rotation.y = rotY
      parentGroup.add(wallGroup)

      const topRail = new THREE.Mesh(new THREE.BoxGeometry(panelWidth, 0.045, 0.055), frameMat)
      topRail.position.y = panelHeight / 2 - 0.022
      topRail.castShadow = true
      wallGroup.add(topRail)

      const botRail = new THREE.Mesh(new THREE.BoxGeometry(panelWidth, 0.045, 0.055), frameMat)
      botRail.position.y = -panelHeight / 2 + 0.022
      botRail.castShadow = true
      wallGroup.add(botRail)

      const innerH = panelHeight - 0.1
      const louverCount = Math.max(7, Math.round(innerH / 0.052))
      const spacing = innerH / louverCount
      const slatDepth = 0.048
      const slatGeo = new THREE.BoxGeometry(panelWidth - 0.02, 0.011, slatDepth)

      const inst = new THREE.InstancedMesh(slatGeo, shelterMat, louverCount * 2)
      const dummy = new THREE.Object3D()
      let idx = 0

      for (let i = 0; i < louverCount; i++) {
        const y = -innerH / 2 + (i + 0.5) * spacing
        // Lapisan luar
        dummy.position.set(0, y, 0.018)
        dummy.rotation.set(tiltRad, 0, 0)
        dummy.updateMatrix()
        inst.setMatrixAt(idx++, dummy.matrix)

        // Lapisan dalam
        dummy.position.set(0, y + spacing * 0.25, -0.018)
        dummy.rotation.set(-tiltRad, 0, 0)
        dummy.updateMatrix()
        inst.setMatrixAt(idx++, dummy.matrix)
      }

      inst.castShadow = true
      inst.receiveShadow = true
      wallGroup.add(inst)
    }

    // 3 Dinding Tetap: Belakang (-Z), Kiri (-X), Kanan (+X)
    const innerW = W - postSize * 2
    const innerD = D - postSize * 2
    const midY = baseY + H / 2

    createDoubleLouverWall(innerW, H, dynamicGroup, new THREE.Vector3(0, midY, -(D / 2 - 0.028)), Math.PI)
    createDoubleLouverWall(innerD, H, dynamicGroup, new THREE.Vector3(-(W / 2 - 0.028), midY, 0), -Math.PI / 2)
    createDoubleLouverWall(innerD, H, dynamicGroup, new THREE.Vector3(W / 2 - 0.028, midY, 0), Math.PI / 2)

    // 4. PINTU DEPAN BERENGSEL (Menghadap Selatan +Z, engsel di sisi kiri -X)
    doorPivot = new THREE.Group()
    doorPivot.position.set(-(W / 2 - postSize), midY, D / 2 - 0.028)
    doorPivot.rotation.y = params.doorAngle
    dynamicGroup.add(doorPivot)

    // Bingkai vertikal kiri/kanan pintu
    ;[-innerW / 2 + 0.018, innerW / 2 - 0.018].forEach((lx) => {
      const stile = new THREE.Mesh(new THREE.BoxGeometry(0.036, H - 0.02, 0.052), frameMat)
      stile.position.set(lx + innerW / 2, 0, 0)
      stile.castShadow = true
      doorPivot!.add(stile)
    })

    // Isi kisi-kisi pintu
    createDoubleLouverWall(innerW - 0.06, H - 0.02, doorPivot, new THREE.Vector3(innerW / 2, 0, 0), 0)

    // Gagang pintu di sisi kanan
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.11, 0.035), sharedMats.darkMetal)
    handle.position.set(innerW - 0.03, -0.02, 0.04)
    doorPivot.add(handle)

    // 2 Engsel logam di sisi kiri
    ;[-H * 0.3, H * 0.3].forEach((hy) => {
      const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.065, 8), sharedMats.darkMetal)
      hinge.position.set(0, hy, 0.03)
      doorPivot!.add(hinge)
    })

    // 5. ATAP GANDA BERVENTILASI (Double-Layered Insulated Roof)
    const roofOverhang = 0.14
    const innerRoof = new THREE.Mesh(new THREE.BoxGeometry(W + 0.04, 0.032, D + 0.04), frameMat)
    innerRoof.position.set(0, baseY + H + 0.016, 0)
    innerRoof.castShadow = true
    innerRoof.receiveShadow = true
    dynamicGroup.add(innerRoof)

    ;[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
      const spacer = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.085, 0.05), frameMat)
      spacer.position.set(sx * (W / 2 - 0.06), baseY + H + 0.068, sz * (D / 2 - 0.06))
      spacer.castShadow = true
      dynamicGroup.add(spacer)
    })

    const outerRoof = new THREE.Mesh(
      new THREE.BoxGeometry(W + roofOverhang * 2, 0.038, D + roofOverhang * 2),
      shelterMat
    )
    outerRoof.position.set(0, baseY + H + 0.12, 0)
    outerRoof.rotation.x = -0.095
    outerRoof.castShadow = true
    outerRoof.receiveShadow = true
    dynamicGroup.add(outerRoof)

    // 6. KOMPONEN INTERNAL (Sensor SHT31/BME280, ESP32, IP65, Termometer)
    const internalGroup = new THREE.Group()
    internalGroup.position.set(0, baseY + H * 0.48, 0)
    dynamicGroup.add(internalGroup)

    const shelf = new THREE.Mesh(
      new THREE.BoxGeometry(W * 0.68, 0.02, D * 0.42),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 })
    )
    shelf.position.set(0, -H * 0.12, -D * 0.06)
    shelf.castShadow = true
    internalGroup.add(shelf)

    const ip65Box = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.09), sharedMats.ip65Grey)
    ip65Box.position.set(-W * 0.2, 0.01, -D * 0.1)
    ip65Box.castShadow = true
    internalGroup.add(ip65Box)

    const espBoard = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.012, 0.048), sharedMats.pcbGreen)
    espBoard.position.set(-W * 0.01, -H * 0.102, -D * 0.04)
    internalGroup.add(espBoard)

    const espChip = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.014, 0.028), sharedMats.galvanized)
    espChip.position.set(-W * 0.025, -H * 0.092, -D * 0.04)
    internalGroup.add(espChip)

    espLedMat = new THREE.MeshBasicMaterial({ color: 0x22c55e })
    const espLed = new THREE.Mesh(new THREE.SphereGeometry(0.009, 10, 10), espLedMat)
    espLed.position.set(W * 0.022, -H * 0.09, -D * 0.035)
    internalGroup.add(espLed)

    const sensorStand = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.11, 8), sharedMats.darkMetal)
    sensorStand.position.set(W * 0.12, -H * 0.06, 0.02)
    internalGroup.add(sensorStand)

    const bmeBoard = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.055, 0.012), sharedMats.pcbBlue)
    bmeBoard.position.set(W * 0.12, -H * 0.005, 0.02)
    internalGroup.add(bmeBoard)

    const bmeCap = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, 0.014), sharedMats.galvanized)
    bmeCap.position.set(W * 0.12, -H * 0.005, 0.027)
    internalGroup.add(bmeCap)

    // Termometer Bola Kering & Basah
    const thermoFrame = new THREE.Mesh(new THREE.BoxGeometry(W * 0.42, 0.018, 0.02), sharedMats.woodPallet)
    thermoFrame.position.set(W * 0.04, H * 0.22, 0.04)
    internalGroup.add(thermoFrame)

    const dryStem = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.22, 8), sharedMats.whiteFence)
    dryStem.position.set(-0.02, H * 0.1, 0.04)
    internalGroup.add(dryStem)
    const dryBulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.016, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2, metalness: 0.5 })
    )
    dryBulb.position.set(-0.02, H * 0.1 - 0.115, 0.04)
    internalGroup.add(dryBulb)

    const wetStem = dryStem.clone()
    wetStem.position.set(0.07, H * 0.1, 0.04)
    internalGroup.add(wetStem)
    const wetBulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.017, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.6 })
    )
    wetBulb.position.set(0.07, H * 0.1 - 0.115, 0.04)
    internalGroup.add(wetBulb)
    const waterCup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.02, 0.045, 12),
      new THREE.MeshStandardMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.7 })
    )
    waterCup.position.set(0.07, H * 0.1 - 0.17, 0.04)
    internalGroup.add(waterCup)
  }

  rebuild(initialParams)

  const applyXRay = (xray: boolean) => {
    outerMaterials.forEach((mat, idx) => {
      mat.transparent = xray
      mat.opacity = xray ? (idx === 0 ? 0.24 : 0.42) : 1.0
      mat.depthWrite = !xray
      mat.needsUpdate = true
    })
  }

  const updateDoor = (doorAngle: number) => {
    if (doorPivot) {
      doorPivot.rotation.y = doorAngle
    }
  }

  const updateEspLed = (elapsed: number) => {
    if (espLedMat) {
      const pulse = (Math.sin(elapsed * 4.2) + 1) * 0.5
      espLedMat.color.setRGB(0.08, 0.45 + pulse * 0.55, 0.22)
    }
  }

  const dispose = () => {
    disposeGroup(dynamicGroup)
    if (root.parent) {
      root.parent.remove(root)
    }
  }

  return {
    root,
    get doorPivot() {
      return doorPivot
    },
    get espLedMat() {
      return espLedMat
    },
    rebuild,
    applyXRay,
    updateDoor,
    updateEspLed,
    dispose,
  }
}
