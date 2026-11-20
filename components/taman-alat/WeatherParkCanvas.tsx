'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Sky } from 'three/examples/jsm/objects/Sky.js'
import { InstrumentId, INSTRUMENT_CATALOG } from '@/lib/tamanAlatCatalog'
import {
  SimulationState,
  QUALITY_PRESETS,
  calculateSunPosition,
  clamp,
  degToRad,
} from '@/lib/tamanAlatPhysics'
import { createSharedPBRMaterials } from './models/sharedMaterials'
import { buildParkEnvironment, buildInstancedGrass } from './models/parkEnvironment'
import { buildStevensonScreen, StevensonScreenControls } from './models/stevensonScreen'
import { buildWindStation, WindStationControls } from './models/windStation'
import { buildRainGaugeStation, RainGaugeControls } from './models/rainGauge'
import { buildPyranometerAndSoil } from './models/solarAndSoil'
import { buildEvaporationPan, EvaporationPanControls } from './models/evaporationPan'

export const CAMERA_PRESETS: Record<string, { pos: THREE.Vector3; target: THREE.Vector3 }> = {
  overview:    { pos: new THREE.Vector3(10.2, 6.2, 11.0),   target: new THREE.Vector3(0, 1.1, 0) },
  stevenson:   { pos: new THREE.Vector3(1.85, 2.05, 2.55),  target: new THREE.Vector3(0, 1.85, 0) },
  anemometer:  { pos: new THREE.Vector3(-1.35, 2.95, -0.55), target: new THREE.Vector3(-3.8, 2.35, -3.2) },
  raingauge:   { pos: new THREE.Vector3(3.95, 1.32, -0.85), target: new THREE.Vector3(4.25, 0.52, -2.6) },
  pyranometer: { pos: new THREE.Vector3(2.15, 1.55, 4.45),  target: new THREE.Vector3(3.9, 0.65, 2.8) },
  evappan:     { pos: new THREE.Vector3(-1.85, 1.55, 4.65), target: new THREE.Vector3(-3.6, 0.38, 2.8) },
}

interface WeatherParkCanvasProps {
  state: SimulationState
  activeCamPreset: string
  selectedInstrument: InstrumentId | null
  onSelectInstrument: (id: InstrumentId | null) => void
  onCamPresetChange: (preset: string) => void
  onTipRainGauge?: () => void
  onHourTick?: (newHour: number) => void
}

const MAX_RAIN_DROPS = 1600

export default function WeatherParkCanvas({
  state,
  activeCamPreset,
  selectedInstrument,
  onSelectInstrument,
  onCamPresetChange,
  onTipRainGauge,
  onHourTick,
}: WeatherParkCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [hoveredInstrument, setHoveredInstrument] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)

  const stateRef = useRef(state)
  stateRef.current = state
  const activePresetRef = useRef(activeCamPreset)
  activePresetRef.current = activeCamPreset
  const selectedInstRef = useRef(selectedInstrument)
  selectedInstRef.current = selectedInstrument

  const stevensonRef = useRef<StevensonScreenControls | null>(null)
  const windStationRef = useRef<WindStationControls | null>(null)
  const rainGaugeRef = useRef<RainGaugeControls | null>(null)
  const evapPanRef = useRef<EvaporationPanControls | null>(null)
  const grassMeshRef = useRef<THREE.InstancedMesh | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)

  const grassUniformsRef = useRef({
    uTime: { value: 0 },
    uWindSpeed: { value: 3.8 },
    uWindDir: { value: new THREE.Vector2(-0.7, -0.7) },
  })

  // Camera transition controller
  const camTransitionRef = useRef({
    active: false,
    targetPos: new THREE.Vector3().copy(CAMERA_PRESETS.overview.pos),
    targetLook: new THREE.Vector3().copy(CAMERA_PRESETS.overview.target),
  })

  // Watch for activeCamPreset changes
  useEffect(() => {
    const preset = CAMERA_PRESETS[activeCamPreset]
    if (preset) {
      camTransitionRef.current.targetPos.copy(preset.pos)
      camTransitionRef.current.targetLook.copy(preset.target)
      camTransitionRef.current.active = true
    }
  }, [activeCamPreset])

  // Watch for Stevenson structural parameter changes
  useEffect(() => {
    if (stevensonRef.current) {
      stevensonRef.current.rebuild({
        volumeKey: state.volumeKey,
        legHeight: state.legHeight,
        louverTilt: state.louverTilt,
        albedo: state.albedo,
        xrayMode: state.xrayMode,
        doorAngle: state.doorOpen ? -degToRad(105) : 0,
      })
    }
  }, [state.volumeKey, state.legHeight, state.louverTilt, state.albedo])

  // Watch for X-ray toggle
  useEffect(() => {
    if (stevensonRef.current) {
      stevensonRef.current.applyXRay(state.xrayMode)
    }
    if (rainGaugeRef.current) {
      const cutaway = state.xrayMode || activeCamPreset === 'raingauge' || selectedInstrument === 'raingauge'
      rainGaugeRef.current.setCutaway(cutaway)
    }
  }, [state.xrayMode, activeCamPreset, selectedInstrument])

  // Watch for Quality preset changes to rebuild grass count & adapt DPR
  useEffect(() => {
    const q = QUALITY_PRESETS[state.qualityKey] || QUALITY_PRESETS.balanced
    if (rendererRef.current && mountRef.current) {
      rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, q.maxDpr))
      rendererRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    }
    if (sceneRef.current) {
      if (grassMeshRef.current) {
        sceneRef.current.remove(grassMeshRef.current)
        grassMeshRef.current.geometry.dispose()
        ;(grassMeshRef.current.material as THREE.Material).dispose()
        grassMeshRef.current = null
      }
      grassMeshRef.current = buildInstancedGrass(sceneRef.current, q.grassCount, grassUniformsRef.current)
    }
  }, [state.qualityKey])

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    // Scene & Renderer
    const scene = new THREE.Scene()
    sceneRef.current = scene
    scene.fog = new THREE.FogExp2(0x6b90b8, 0.0038)

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.08, 300)
    camera.position.copy(CAMERA_PRESETS.overview.pos)

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    rendererRef.current = renderer
    const initialPreset = QUALITY_PRESETS[stateRef.current.qualityKey] || QUALITY_PRESETS.balanced
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, initialPreset.maxDpr))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.75
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.copy(CAMERA_PRESETS.overview.target)
    controls.enableDamping = true
    controls.dampingFactor = 0.065
    controls.maxPolarAngle = Math.PI / 2 - 0.025
    controls.minDistance = 0.95
    controls.maxDistance = 30
    controls.update()

    controls.addEventListener('start', () => {
      camTransitionRef.current.active = false
    })

    // Sky Shader (Rayleigh & Mie Atmospheric Scattering)
    const sky = new Sky()
    sky.scale.setScalar(220)
    scene.add(sky)

    // PMREM IBL Generator & Environment Scene
    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    pmremGenerator.compileEquirectangularShader()

    const envScene = new THREE.Scene()
    const envSky = new Sky()
    envSky.scale.setScalar(50)
    envScene.add(envSky)

    const envGround = new THREE.Mesh(
      new THREE.CircleGeometry(48, 24),
      new THREE.MeshBasicMaterial({ color: 0x386130 })
    )
    envGround.rotation.x = -Math.PI / 2
    envGround.position.y = -0.5
    envScene.add(envGround)

    let envRenderTarget: THREE.WebGLRenderTarget | null = null
    let lastIblElevDeg = -999
    let lastIblCloud = -999
    let lastIblUpdateMs = 0

    // Lighting (disesuaikan agar adem dan tidak overexposed)
    const hemiLight = new THREE.HemisphereLight(0xcde0f7, 0x2b421a, 0.42)
    scene.add(hemiLight)

    const sunLight = new THREE.DirectionalLight(0xfff8eb, 1.85)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.set(initialPreset.shadowSize, initialPreset.shadowSize)
    sunLight.shadow.camera.near = 2
    sunLight.shadow.camera.far = 65
    const d = 8.6
    sunLight.shadow.camera.left = -d
    sunLight.shadow.camera.right = d
    sunLight.shadow.camera.top = d
    sunLight.shadow.camera.bottom = -d
    sunLight.shadow.bias = -0.00045
    sunLight.shadow.normalBias = 0.025
    scene.add(sunLight)

    // Procedural Clouds
    const cloudGroup = new THREE.Group()
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.96,
      metalness: 0.0,
      transparent: true,
      opacity: 0.35,
    })
    const puffGeo = new THREE.DodecahedronGeometry(1, 1)

    for (let i = 0; i < 16; i++) {
      const cluster = new THREE.Group()
      const puffs = 3 + (i % 3)
      for (let p = 0; p < puffs; p++) {
        const m = new THREE.Mesh(puffGeo, cloudMat)
        m.position.set((p - 1) * 1.9, (Math.random() - 0.5) * 0.55, (Math.random() - 0.5) * 1.3)
        m.scale.set(1.9 + Math.random() * 1.3, 0.78 + Math.random() * 0.45, 1.5 + Math.random() * 1.1)
        cluster.add(m)
      }
      const angle = (i / 16) * Math.PI * 2 + 0.15
      const radius = 15 + (i % 4) * 9.5
      cluster.position.set(Math.cos(angle) * radius, 16 + (i % 3) * 2.4, Math.sin(angle) * radius)
      cluster.userData = { speed: 0.25 + (i % 4) * 0.12 }
      cloudGroup.add(cluster)
    }
    cloudGroup.userData = { cloudMat }
    scene.add(cloudGroup)

    // Shared PBR Materials
    const sharedMats = createSharedPBRMaterials()

    // Environment & Grass
    buildParkEnvironment(scene, sharedMats)
    grassMeshRef.current = buildInstancedGrass(scene, initialPreset.grassCount, grassUniformsRef.current)

    // Instruments
    const stevenson = buildStevensonScreen(scene, sharedMats, {
      volumeKey: stateRef.current.volumeKey,
      legHeight: stateRef.current.legHeight,
      louverTilt: stateRef.current.louverTilt,
      albedo: stateRef.current.albedo,
      xrayMode: stateRef.current.xrayMode,
      doorAngle: stateRef.current.doorOpen ? -degToRad(105) : 0,
    })
    stevensonRef.current = stevenson

    const windStation = buildWindStation(scene, sharedMats)
    windStationRef.current = windStation

    const rainGauge = buildRainGaugeStation(scene, sharedMats)
    rainGaugeRef.current = rainGauge

    const solarAndSoil = buildPyranometerAndSoil(scene, sharedMats)

    const evapPan = buildEvaporationPan(scene, sharedMats)
    evapPanRef.current = evapPan

    const interactiveRoots = [
      stevenson.root,
      windStation.root,
      rainGauge.root,
      solarAndSoil.root,
      evapPan.root,
    ]

    // Rain Instanced Particles System
    const dropGeo = new THREE.CylinderGeometry(0.0038, 0.0038, 0.44, 4)
    const dropMat = new THREE.MeshBasicMaterial({
      color: 0xcbeafe,
      transparent: true,
      opacity: 0.56,
      depthWrite: false,
    })
    const rainInstMesh = new THREE.InstancedMesh(dropGeo, dropMat, MAX_RAIN_DROPS)
    rainInstMesh.count = 0
    rainInstMesh.frustumCulled = false

    const rainData: { x: number; y: number; z: number; speed: number }[] = []
    for (let i = 0; i < MAX_RAIN_DROPS; i++) {
      rainData.push({
        x: (Math.random() - 0.5) * 18,
        y: Math.random() * 11,
        z: (Math.random() - 0.5) * 18,
        speed: 9.8 + Math.random() * 4.2,
      })
    }
    const rainDummy = new THREE.Object3D()
    scene.add(rainInstMesh)

    // Airflow Streamline System
    const airflowGroup = new THREE.Group()
    scene.add(airflowGroup)
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.7 })
    const shaftGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.34, 6)
    shaftGeo.rotateX(Math.PI / 2)
    const headGeo = new THREE.ConeGeometry(0.025, 0.08, 6)
    headGeo.rotateX(Math.PI / 2)

    const airflowParticles: {
      mesh: THREE.Group
      progress: number
      lateral: number
      vertOffset: number
      speedScale: number
    }[] = []

    for (let i = 0; i < 24; i++) {
      const g = new THREE.Group()
      g.add(new THREE.Mesh(shaftGeo, arrowMat))
      const head = new THREE.Mesh(headGeo, arrowMat)
      head.position.z = 0.21
      g.add(head)

      airflowParticles.push({
        mesh: g,
        progress: Math.random(),
        lateral: (Math.random() - 0.5) * 1.15,
        vertOffset: (Math.random() - 0.5) * 0.72,
        speedScale: 0.8 + Math.random() * 0.4,
      })
      airflowGroup.add(g)
    }

    // Raycasting Events
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const downPos = { x: 0, y: 0 }

    const findInstrumentId = (obj: THREE.Object3D | null): InstrumentId | null => {
      let cur = obj
      while (cur) {
        if (cur.userData?.instrumentId) return cur.userData.instrumentId as InstrumentId
        cur = cur.parent
      }
      return null
    }

    const onPointerDown = (e: PointerEvent) => {
      downPos.x = e.clientX
      downPos.y = e.clientY
    }

    const onPointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObjects(interactiveRoots, true)

      if (hits.length > 0) {
        const instId = findInstrumentId(hits[0].object)
        if (instId && INSTRUMENT_CATALOG[instId]) {
          renderer.domElement.style.cursor = 'pointer'
          setHoveredInstrument(INSTRUMENT_CATALOG[instId].name)
          setTooltipPos({ x: e.clientX, y: e.clientY })
          return
        }
      }
      renderer.domElement.style.cursor = 'grab'
      setHoveredInstrument(null)
      setTooltipPos(null)
    }

    const onPointerLeave = () => {
      setHoveredInstrument(null)
      setTooltipPos(null)
    }

    const onPointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y)
      if (dist > 6) return

      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObjects(interactiveRoots, true)
      if (hits.length > 0) {
        const instId = findInstrumentId(hits[0].object)
        if (instId) {
          onSelectInstrument(instId)
          onCamPresetChange(instId)
        }
      }
    }

    const domEl = renderer.domElement
    domEl.addEventListener('pointerdown', onPointerDown)
    domEl.addEventListener('pointermove', onPointerMove)
    domEl.addEventListener('pointerleave', onPointerLeave)
    domEl.addEventListener('pointerup', onPointerUp)

    // Animation Loop
    const clock = new THREE.Clock()
    let currentDoorAngle = 0
    let timelapseThrottle = 0
    let animationFrameId: number

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      const dt = Math.min(clock.getDelta(), 0.05)
      const elapsed = clock.getElapsedTime()
      const currentState = stateRef.current

      // 1. Sun & Atmosphere Updates (Sky Shader & Lighting)
      const sun = calculateSunPosition(currentState.hour)
      const sunDir = new THREE.Vector3(sun.sx, sun.sy, sun.sz).normalize()
      sunLight.position.copy(sunDir).multiplyScalar(28)
      if (sunLight.position.y < 1.2) sunLight.position.y = 1.2

      const cloudFrac = currentState.cloudCover / 100
      const rainFrac = Math.min(1, currentState.rainIntensity / 65)
      const overcast = Math.min(1, cloudFrac * 0.78 + rainFrac * 0.48)
      const dayFactor = clamp((sun.elevDeg + 4) / 26, 0, 1)
      const sunHigh = clamp(sun.elevDeg / 45, 0, 1)

      // Atmospheric parameters
      const turbidity = 2.0 + overcast * 10.5 + (1 - sunHigh) * 2.5
      const rayleigh = Math.max(0.35, (2.6 - overcast * 1.9) * (0.35 + 0.65 * dayFactor))
      const mieCoeff = 0.0045 + overcast * 0.018
      const mieG = 0.82 - overcast * 0.16

      ;[sky, envSky].forEach((s) => {
        const u = s.material.uniforms
        if (u['turbidity']) u['turbidity'].value = turbidity
        if (u['rayleigh']) u['rayleigh'].value = rayleigh
        if (u['mieCoefficient']) u['mieCoefficient'].value = mieCoeff
        if (u['mieDirectionalG']) u['mieDirectionalG'].value = mieG
        if (u['sunPosition']) u['sunPosition'].value.copy(sunDir)
      })

      const sunWarm = new THREE.Color(0xff9447)
      const sunDay = new THREE.Color(0xfff7e8)
      sunLight.color.copy(sunWarm).lerp(sunDay, sunHigh)
      sunLight.intensity =
        sun.elevDeg > -1
          ? Math.max(0.18, (1.92 * Math.sin(Math.max(0.05, degToRad(sun.elevDeg))) + 0.22) * (1 - overcast * 0.72))
          : 0.06

      hemiLight.intensity = 0.12 + dayFactor * (0.40 - overcast * 0.14)
      renderer.toneMappingExposure = 0.42 + dayFactor * (0.33 - overcast * 0.12)

      const fogNight = new THREE.Color(0x0a1122)
      const fogSunset = new THREE.Color(0xc97545)
      const fogClear = new THREE.Color(0x6b92ba)
      const fogCloudy = new THREE.Color(0x566a7d)
      const fogDay = fogSunset.clone().lerp(fogClear, sunHigh).lerp(fogCloudy, overcast * 0.85)
      scene.fog.color.copy(fogNight).lerp(fogDay, dayFactor)
      scene.fog.density = 0.0032 + overcast * 0.0065 + rainFrac * 0.0055

      // Cloud appearance & drift
      cloudMat.opacity = clamp(0.06 + cloudFrac * 0.8 + rainFrac * 0.16, 0.05, 0.92)
      const cColor = new THREE.Color(0xffffff).lerp(new THREE.Color(0x4b5563), rainFrac * 0.6 + cloudFrac * 0.28)
      cColor.multiplyScalar(0.22 + 0.78 * dayFactor)
      cloudMat.color.copy(cColor)
      cloudGroup.visible = currentState.cloudCover > 2 || currentState.rainIntensity > 0

      if (cloudGroup.visible) {
        const dirRad = degToRad(currentState.windDir)
        const cVx = -Math.sin(dirRad) * Math.max(0.25, currentState.windSpeed * 0.14)
        const cVz = Math.cos(dirRad) * Math.max(0.25, currentState.windSpeed * 0.14)
        cloudGroup.children.forEach((c) => {
          c.position.x += cVx * (c.userData.speed || 0.3) * dt
          c.position.z += cVz * (c.userData.speed || 0.3) * dt
          if (c.position.x > 46) c.position.x = -46
          if (c.position.x < -46) c.position.x = 46
          if (c.position.z > 46) c.position.z = -46
          if (c.position.z < -46) c.position.z = 46
        })
      }

      // Throttled PMREM IBL Regeneration
      const q = QUALITY_PRESETS[currentState.qualityKey] || QUALITY_PRESETS.balanced
      const now = performance.now()
      const elevMoved = Math.abs(sun.elevDeg - lastIblElevDeg) >= q.iblMinDeltaDeg
      const cloudMoved = Math.abs(currentState.cloudCover - lastIblCloud) >= 7
      const timeReady = now - lastIblUpdateMs >= q.iblMinIntervalMs

      if (!envRenderTarget || ((elevMoved || cloudMoved) && timeReady)) {
        const nextRT = pmremGenerator.fromScene(envScene, q.iblBlur, 0.1, 100)
        if (envRenderTarget) envRenderTarget.dispose()
        envRenderTarget = nextRT
        scene.environment = envRenderTarget.texture
        scene.environmentIntensity = 0.22 + dayFactor * (0.42 - overcast * 0.14)

        lastIblElevDeg = sun.elevDeg
        lastIblCloud = currentState.cloudCover
        lastIblUpdateMs = now
      }

      // 2. Wind sway on 3D grass
      const windRad = degToRad(currentState.windDir)
      grassUniformsRef.current.uTime.value = elapsed
      grassUniformsRef.current.uWindSpeed.value = currentState.windSpeed
      grassUniformsRef.current.uWindDir.value.set(-Math.sin(windRad), Math.cos(windRad))

      // 3. Timelapse Handler
      if (currentState.timelapse && onHourTick) {
        timelapseThrottle += dt
        if (timelapseThrottle >= 0.1) {
          let newHour = currentState.hour + timelapseThrottle * 0.55
          timelapseThrottle = 0
          if (newHour > 19.0) newHour = 5.0
          onHourTick(newHour)
        }
      }

      // 4. Smooth Camera Lerp
      if (camTransitionRef.current.active) {
        const alpha = 1 - Math.exp(-5.5 * dt)
        camera.position.lerp(camTransitionRef.current.targetPos, alpha)
        controls.target.lerp(camTransitionRef.current.targetLook, alpha)
        if (
          camera.position.distanceTo(camTransitionRef.current.targetPos) < 0.02 &&
          controls.target.distanceTo(camTransitionRef.current.targetLook) < 0.02
        ) {
          camTransitionRef.current.active = false
        }
      }

      // 5. Stevenson Screen Animation
      const targetDoor = currentState.doorOpen ? -degToRad(105) : 0
      currentDoorAngle += (targetDoor - currentDoorAngle) * Math.min(1, dt * 6.5)
      stevenson.updateDoor(currentDoorAngle)
      stevenson.updateEspLed(elapsed)

      // 6. Wind Station Animation
      windStation.update(currentState.windSpeed, currentState.windDir, dt, elapsed)

      // 7. Rain Gauge Animation
      rainGauge.update(currentState.rainIntensity, dt, onTipRainGauge)

      // 8. Evaporation Pan Ripples & Mini Rotor
      evapPan.update(currentState.windSpeed, currentState.rainIntensity, dt, elapsed)

      // 9. Instanced Rain Drops
      if (currentState.rainIntensity <= 0.1) {
        rainInstMesh.count = 0
      } else {
        const active = Math.min(
          MAX_RAIN_DROPS,
          Math.floor((currentState.rainIntensity / 100) * MAX_RAIN_DROPS) + 100
        )
        rainInstMesh.count = active

        const flowVx = -Math.sin(windRad) * (currentState.windSpeed * 0.28)
        const flowVz = Math.cos(windRad) * (currentState.windSpeed * 0.28)
        const fallVec = new THREE.Vector3(flowVx, -11.5, flowVz).normalize()
        const upVec = new THREE.Vector3(0, 1, 0)
        const tiltQuat = new THREE.Quaternion().setFromUnitVectors(upVec, fallVec.clone().negate())

        for (let i = 0; i < active; i++) {
          const d = rainData[i]
          d.y -= d.speed * dt
          d.x += flowVx * dt
          d.z += flowVz * dt

          if (d.y < 0.08) {
            d.y = 9.5 + Math.random() * 2.5
            d.x = (Math.random() - 0.5) * 17.5
            d.z = (Math.random() - 0.5) * 17.5
          }
          if (d.x > 9) d.x -= 18
          if (d.x < -9) d.x += 18
          if (d.z > 9) d.z -= 18
          if (d.z < -9) d.z += 18

          rainDummy.position.set(d.x, d.y, d.z)
          rainDummy.quaternion.copy(tiltQuat)
          rainDummy.scale.set(1, 0.85 + (currentState.rainIntensity / 100) * 0.45, 1)
          rainDummy.updateMatrix()
          rainInstMesh.setMatrixAt(i, rainDummy.matrix)
        }
        rainInstMesh.instanceMatrix.needsUpdate = true
      }

      // 10. Airflow Particles
      airflowGroup.visible = currentState.showAirflow && currentState.windSpeed > 0.1
      if (airflowGroup.visible) {
        const centerY = 0.05 + currentState.legHeight + 0.84 * 0.5
        const flowX = -Math.sin(windRad)
        const flowZ = Math.cos(windRad)
        const perpX = flowZ
        const perpZ = -flowX
        const yaw = Math.atan2(flowX, flowZ)
        const speed = Math.min(3.6, 0.35 + currentState.windSpeed * 0.14)

        for (let i = 0; i < airflowParticles.length; i++) {
          const p = airflowParticles[i]
          p.progress += (speed * p.speedScale * dt) / 3.4
          if (p.progress > 1) p.progress -= 1

          const along = (p.progress - 0.5) * 3.4
          const inside = Math.exp(-(along * along) / 0.45)
          const yWave = Math.sin(p.progress * Math.PI * 2) * 0.04 * inside

          p.mesh.position.set(
            flowX * along + perpX * p.lateral,
            centerY + p.vertOffset + yWave,
            flowZ * along + perpZ * p.lateral
          )
          p.mesh.rotation.y = yaw
          p.mesh.scale.setScalar(0.45 + 0.65 * Math.sin(p.progress * Math.PI))
        }
      }

      controls.update()
      renderer.render(scene, camera)
    }

    animate()

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) {
          camera.aspect = width / height
          camera.updateProjectionMatrix()
          renderer.setSize(width, height)
        }
      }
    })
    ro.observe(container)

    return () => {
      cancelAnimationFrame(animationFrameId)
      ro.disconnect()
      domEl.removeEventListener('pointerdown', onPointerDown)
      domEl.removeEventListener('pointermove', onPointerMove)
      domEl.removeEventListener('pointerleave', onPointerLeave)
      domEl.removeEventListener('pointerup', onPointerUp)
      controls.dispose()
      renderer.dispose()
      if (envRenderTarget) envRenderTarget.dispose()
      pmremGenerator.dispose()
      if (container.contains(domEl)) {
        container.removeChild(domEl)
      }
      stevenson.dispose()
    }
  }, [])

  return (
    <div className="relative h-full w-full select-none overflow-hidden" ref={mountRef}>
      {hoveredInstrument && tooltipPos && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-12 rounded-lg border border-sky-400/40 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-sky-200 shadow-xl backdrop-blur-md transition-all duration-75"
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
        >
          {hoveredInstrument}
        </div>
      )}
    </div>
  )
}
