'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
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
import { buildCampbellStokes } from './models/campbellStokes'
import { buildDigitalBarometer } from './models/digitalBarometer'
import { buildSkyAtmosphere, SkyAtmosphereSystem } from './models/skyAtmosphere'
import { buildStationLighting, StationLightingSystem } from './models/stationLighting'
import { buildHorizonPanorama360 } from './models/horizonPanorama'
import { FirstPersonController, InstrumentProximityInfo } from './FirstPersonController'

export const CAMERA_PRESETS: Record<string, { pos: THREE.Vector3; target: THREE.Vector3 }> = {
  overview:    { pos: new THREE.Vector3(10.2, 6.2, 11.0),   target: new THREE.Vector3(0, 1.1, 0) },
  top:         { pos: new THREE.Vector3(0.01, 14.5, 0),     target: new THREE.Vector3(0, 0, 0) },
  iso:         { pos: new THREE.Vector3(8.5, 7.8, 8.5),     target: new THREE.Vector3(0, 0.8, 0) },
  front:       { pos: new THREE.Vector3(0, 3.2, 11.8),      target: new THREE.Vector3(0, 1.2, 0) },
  side:        { pos: new THREE.Vector3(11.8, 3.2, 0),      target: new THREE.Vector3(0, 1.2, 0) },
  stevenson:   { pos: new THREE.Vector3(1.85, 2.05, 2.55),  target: new THREE.Vector3(0, 1.85, 0) },
  anemometer:  { pos: new THREE.Vector3(-1.35, 2.95, -0.55), target: new THREE.Vector3(-3.8, 2.35, -3.2) },
  raingauge:   { pos: new THREE.Vector3(3.95, 1.32, -0.85), target: new THREE.Vector3(4.25, 0.52, -2.6) },
  pyranometer: { pos: new THREE.Vector3(2.15, 1.55, 4.45),  target: new THREE.Vector3(3.9, 0.65, 2.8) },
  evappan:     { pos: new THREE.Vector3(-1.85, 1.55, 4.65), target: new THREE.Vector3(-3.6, 0.38, 2.8) },
  campbell:    { pos: new THREE.Vector3(-0.45, 1.65, -2.45), target: new THREE.Vector3(-1.65, 1.2, -3.5) },
  barometer:   { pos: new THREE.Vector3(0.45, 1.75, -2.45),  target: new THREE.Vector3(1.65, 1.3, -3.5) },
}

interface WeatherParkCanvasProps {
  state: SimulationState
  activeCamPreset: string
  selectedInstrument: InstrumentId | null
  onSelectInstrument: (id: InstrumentId | null) => void
  onCamPresetChange: (preset: string) => void
  onTipRainGauge?: () => void
  onHourTick?: (newHour: number) => void
  onProximityChange?: (info: InstrumentProximityInfo | null) => void
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
  onProximityChange,
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
  const controlsRef = useRef<OrbitControls | null>(null)
  const fpsControllerRef = useRef<FirstPersonController | null>(null)

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
    if (state.navMode === 'firstPerson') return
    const preset = CAMERA_PRESETS[activeCamPreset]
    if (preset) {
      camTransitionRef.current.targetPos.copy(preset.pos)
      camTransitionRef.current.targetLook.copy(preset.target)
      camTransitionRef.current.active = true
    }
  }, [activeCamPreset, state.navMode])

  // Watch for navigation mode switch (Orbit vs First-Person)
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.enabled = state.navMode !== 'firstPerson'
    }
    if (fpsControllerRef.current) {
      fpsControllerRef.current.setEnabled(state.navMode === 'firstPerson')
    }
  }, [state.navMode])

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
    scene.fog = new THREE.FogExp2(0x6b90b8, 0.0035)

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.08, 450)
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

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controlsRef.current = controls
    controls.target.copy(CAMERA_PRESETS.overview.target)
    controls.enableDamping = true
    controls.dampingFactor = 0.065
    controls.maxPolarAngle = Math.PI / 2 - 0.025
    controls.minDistance = 0.95
    controls.maxDistance = 35
    controls.update()

    controls.addEventListener('start', () => {
      camTransitionRef.current.active = false
    })

    // First-Person Controller (Minecraft-style WASD)
    const fpsController = new FirstPersonController(camera, renderer.domElement)
    fpsControllerRef.current = fpsController
    fpsController.onProximityChange = (info) => {
      onProximityChange?.(info)
    }
    fpsController.onInteract = (id) => {
      onSelectInstrument(id)
    }

    // Shared PBR Materials
    const sharedMats = createSharedPBRMaterials()

    // 1. Atmosfer 24 Jam: GLSL Sky Shader, Awan, Bintang Twinkling, Matahari, Bulan Kawah
    const skyAtmosphere = buildSkyAtmosphere(scene)

    // 2. Panorama Horizon 360° Kebumen & Pohon Siluet
    buildHorizonPanorama360(scene)

    // 3. Tiang Lampu Stasiun Otomatis & Sistem Petir
    const stationLighting = buildStationLighting(scene, sharedMats)

    // 4. Lingkungan Taman & Rumput Instanced GPU
    buildParkEnvironment(scene, sharedMats)
    grassMeshRef.current = buildInstancedGrass(scene, initialPreset.grassCount, grassUniformsRef.current)

    // 5. Tujuh Instrumen Meteorologi Lengkap
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

    const campbell = buildCampbellStokes(scene, sharedMats)
    const barometer = buildDigitalBarometer(scene, sharedMats)

    const interactiveRoots = [
      stevenson.root,
      windStation.root,
      rainGauge.root,
      solarAndSoil.root,
      evapPan.root,
      campbell.root,
      barometer.root,
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
      if (stateRef.current.navMode === 'firstPerson') return
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
      if (stateRef.current.navMode === 'firstPerson') return
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

      // 1. Sistem Petir Konvektif (Acak saat badai atau hujan deras)
      if (currentState.activeMood === 'storm' || (currentState.rainIntensity > 40 && Math.random() < 0.009)) {
        stationLighting.triggerLightning()
      }
      const lightning = stationLighting.updateLightning(dt)

      // 2. Sistem Atmosfer 24 Jam (GLSL Sky, Bintang Twinkle, Bulan Kawah & Fase, Pencahayaan)
      const atmo = skyAtmosphere.update(
        currentState.hour,
        currentState.cloudCover,
        currentState.moonPhase ?? 0.38,
        lightning,
        dt,
        elapsed
      )

      // Lampu stasiun otomatis / manual
      stationLighting.updateLamp(atmo.nightFactor, currentState.nightLampOverride ?? 'auto')

      // Exposure & Fog adaptif sesuai waktu & petir
      renderer.toneMappingExposure =
        (0.48 + (1.0 - atmo.nightFactor) * 0.27 - (currentState.cloudCover / 100) * 0.1) *
        (1.0 + lightning * 0.45)

      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.setHex(atmo.isNight ? 0x060e1c : 0x6b90b8)
        scene.fog.density = atmo.isNight ? 0.0042 : 0.0034
      }

      // 3. Update Navigasi Kamera: First-Person WASD vs OrbitControls
      if (currentState.navMode === 'firstPerson') {
        fpsController.update(dt)
      } else {
        // Orbit Controls transition lerp
        if (camTransitionRef.current.active) {
          camera.position.lerp(camTransitionRef.current.targetPos, dt * 3.8)
          controls.target.lerp(camTransitionRef.current.targetLook, dt * 3.8)
          if (
            camera.position.distanceTo(camTransitionRef.current.targetPos) < 0.04 &&
            controls.target.distanceTo(camTransitionRef.current.targetLook) < 0.04
          ) {
            camera.position.copy(camTransitionRef.current.targetPos)
            controls.target.copy(camTransitionRef.current.targetLook)
            camTransitionRef.current.active = false
          }
        }
        controls.update()
      }

      // 4. Timelapse logic
      if (currentState.timelapse) {
        timelapseThrottle += dt
        if (timelapseThrottle > 0.06) {
          timelapseThrottle = 0
          const nextHour = (currentState.hour + 0.1) % 24
          onHourTick?.(nextHour)
        }
      }

      // 5. Animasi Buka/Tutup Pintu Sangkar
      const targetAngle = currentState.doorOpen ? -degToRad(105) : 0
      if (Math.abs(currentDoorAngle - targetAngle) > 0.01) {
        currentDoorAngle = THREE.MathUtils.lerp(currentDoorAngle, targetAngle, dt * 6.5)
        if (stevensonRef.current) {
          stevensonRef.current.setDoorAngle(currentDoorAngle)
        }
      }

      // 6. Animasi Anemometer & Wind Vane
      if (windStationRef.current) {
        windStationRef.current.update(dt, currentState.windSpeed, currentState.windDir)
      }

      // 7. Animasi Rumput GPU (Goyangan angin)
      const windAngleRad = degToRad(currentState.windDir)
      grassUniformsRef.current.uTime.value = elapsed
      grassUniformsRef.current.uWindSpeed.value = currentState.windSpeed
      grassUniformsRef.current.uWindDir.value.set(-Math.sin(windAngleRad), -Math.cos(windAngleRad))

      // 8. Animasi Partikel Hujan Instanced
      const rainCount = Math.min(
        MAX_RAIN_DROPS,
        Math.floor((currentState.rainIntensity / 80) * MAX_RAIN_DROPS)
      )
      rainInstMesh.count = rainCount

      if (rainCount > 0) {
        const dirRad = degToRad(currentState.windDir)
        const flowVx = -Math.sin(dirRad) * (currentState.windSpeed * 0.28)
        const flowVz = Math.cos(dirRad) * (currentState.windSpeed * 0.28)
        const fallVec = new THREE.Vector3(flowVx, -11.5, flowVz).normalize()
        const upVec = new THREE.Vector3(0, 1, 0)
        const tiltQuat = new THREE.Quaternion().setFromUnitVectors(upVec, fallVec.clone().negate())

        for (let i = 0; i < rainCount; i++) {
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

      // 9. Animasi Streamlines Aliran Udara
      airflowGroup.visible = currentState.showAirflow
      if (currentState.showAirflow) {
        const yaw = degToRad(currentState.windDir + 180)
        const flowX = Math.sin(yaw)
        const flowZ = Math.cos(yaw)
        const perpX = -flowZ
        const perpZ = flowX
        const centerY = currentState.legHeight + 0.4
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
      if (container.contains(domEl)) {
        container.removeChild(domEl)
      }
      stevenson.dispose()
    }
  }, [])

  return (
    <div className="relative h-full w-full select-none overflow-hidden" ref={mountRef}>
      {/* Tooltip Hover (saat Mode Orbit) */}
      {hoveredInstrument && tooltipPos && state.navMode !== 'firstPerson' && (
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
