'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { InstrumentId, INSTRUMENT_CATALOG } from '@/lib/tamanAlatCatalog'
import {
  SimulationState,
  calculateSunPosition,
  clamp,
  degToRad,
} from '@/lib/tamanAlatPhysics'
import { createSharedMaterials } from './models/sharedMaterials'
import { buildParkEnvironment } from './models/parkEnvironment'
import { buildStevensonScreen, StevensonScreenControls } from './models/stevensonScreen'
import { buildWindStation, WindStationControls } from './models/windStation'
import { buildRainGaugeStation, RainGaugeControls } from './models/rainGauge'
import { buildPyranometerAndSoil } from './models/solarAndSoil'
import { buildEvaporationPan, EvaporationPanControls } from './models/evaporationPan'

export const CAMERA_PRESETS: Record<string, { pos: THREE.Vector3; target: THREE.Vector3 }> = {
  overview: { pos: new THREE.Vector3(9.6, 6.4, 10.6), target: new THREE.Vector3(0, 1.1, 0) },
  stevenson: { pos: new THREE.Vector3(1.85, 2.05, 2.55), target: new THREE.Vector3(0, 1.85, 0) },
  anemometer: { pos: new THREE.Vector3(-1.4, 3.0, -0.7), target: new THREE.Vector3(-3.8, 2.45, -3.2) },
  raingauge: { pos: new THREE.Vector3(3.9, 1.35, -0.85), target: new THREE.Vector3(4.15, 0.52, -2.5) },
  pyranometer: { pos: new THREE.Vector3(2.3, 1.55, 4.45), target: new THREE.Vector3(3.85, 0.72, 2.8) },
  evappan: { pos: new THREE.Vector3(-1.85, 1.55, 4.7), target: new THREE.Vector3(-3.6, 0.35, 2.8) },
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

const MAX_RAIN_DROPS = 1400

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

  // Mutable refs to pass reactive state into render loop without resetting canvas
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

  // Camera transition controller
  const camTransitionRef = useRef({
    active: false,
    targetPos: new THREE.Vector3().copy(CAMERA_PRESETS.overview.pos),
    targetLook: new THREE.Vector3().copy(CAMERA_PRESETS.overview.target),
  })

  // Watch for activeCamPreset changes to start camera lerp
  useEffect(() => {
    const preset = CAMERA_PRESETS[activeCamPreset]
    if (preset) {
      camTransitionRef.current.targetPos.copy(preset.pos)
      camTransitionRef.current.targetLook.copy(preset.target)
      camTransitionRef.current.active = true
    }
  }, [activeCamPreset])

  // Watch for Stevenson structural parameter changes to trigger rebuild
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

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    // Scene & Renderer
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x60a5fa)
    scene.fog = new THREE.FogExp2(0x60a5fa, 0.0085)

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 250)
    camera.position.copy(CAMERA_PRESETS.overview.pos)

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.copy(CAMERA_PRESETS.overview.target)
    controls.enableDamping = true
    controls.dampingFactor = 0.065
    controls.maxPolarAngle = Math.PI / 2 - 0.03
    controls.minDistance = 1.1
    controls.maxDistance = 32
    controls.update()

    controls.addEventListener('start', () => {
      camTransitionRef.current.active = false
    })

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x3f6212, 0.72)
    scene.add(hemiLight)

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 2.3)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.width = 2048
    sunLight.shadow.mapSize.height = 2048
    sunLight.shadow.camera.near = 2
    sunLight.shadow.camera.far = 65
    const d = 8.8
    sunLight.shadow.camera.left = -d
    sunLight.shadow.camera.right = d
    sunLight.shadow.camera.top = d
    sunLight.shadow.camera.bottom = -d
    sunLight.shadow.bias = -0.00045
    sunLight.shadow.normalBias = 0.025
    scene.add(sunLight)

    // Sun Sphere & Halo
    const sunGeo = new THREE.SphereGeometry(1.15, 24, 24)
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff5c2 })
    const sunMesh = new THREE.Mesh(sunGeo, sunMat)
    scene.add(sunMesh)

    const haloGeo = new THREE.SphereGeometry(1.85, 24, 24)
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xfde68a,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
    })
    const sunHalo = new THREE.Mesh(haloGeo, haloMat)
    sunMesh.add(sunHalo)

    // Clouds
    const cloudGroup = new THREE.Group()
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.95,
      metalness: 0,
      transparent: true,
      opacity: 0.35,
    })
    const puffGeo = new THREE.DodecahedronGeometry(1, 1)

    for (let i = 0; i < 16; i++) {
      const cluster = new THREE.Group()
      const puffs = 3 + (i % 3)
      for (let p = 0; p < puffs; p++) {
        const m = new THREE.Mesh(puffGeo, cloudMat)
        m.position.set((p - 1) * 1.8, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 1.4)
        m.scale.set(1.8 + Math.random() * 1.3, 0.8 + Math.random() * 0.45, 1.5 + Math.random() * 1.0)
        cluster.add(m)
      }
      const angle = (i / 16) * Math.PI * 2 + 0.2
      const radius = 14 + (i % 4) * 9
      cluster.position.set(Math.cos(angle) * radius, 15 + (i % 3) * 2.5, Math.sin(angle) * radius)
      cluster.userData = { speed: 0.25 + (i % 4) * 0.12, baseY: cluster.position.y }
      cloudGroup.add(cluster)
    }
    scene.add(cloudGroup)

    // Shared Materials
    const sharedMats = createSharedMaterials()

    // Environment (grass, curbs, walkways, fence, compass plaques)
    buildParkEnvironment(scene, sharedMats)

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

    // Rain Lines System
    const rainPositions = new Float32Array(MAX_RAIN_DROPS * 2 * 3)
    const rainBaseData: { x: number; y: number; z: number; speed: number }[] = []
    for (let i = 0; i < MAX_RAIN_DROPS; i++) {
      rainBaseData.push({
        x: (Math.random() - 0.5) * 18,
        y: Math.random() * 11,
        z: (Math.random() - 0.5) * 18,
        speed: 9.5 + Math.random() * 4.5,
      })
    }
    const rainGeo = new THREE.BufferGeometry()
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3))
    rainGeo.setDrawRange(0, 0)
    const rainMat = new THREE.LineBasicMaterial({
      color: 0xbae6fd,
      transparent: true,
      opacity: 0.55,
    })
    const rainLines = new THREE.LineSegments(rainGeo, rainMat)
    rainLines.frustumCulled = false
    scene.add(rainLines)

    // Airflow Streamline System
    const airflowGroup = new THREE.Group()
    scene.add(airflowGroup)
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.68 })
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
      const shaft = new THREE.Mesh(shaftGeo, arrowMat)
      const head = new THREE.Mesh(headGeo, arrowMat)
      head.position.z = 0.21
      g.add(shaft)
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
      if (dist > 6) return // User was dragging the camera, not clicking

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

      // 1. Sun & Atmosphere Updates
      const sun = calculateSunPosition(currentState.hour)
      sunMesh.position.set(sun.sx, sun.sy, sun.sz)
      sunMesh.visible = sun.elevDeg > -3
      sunLight.position.set(sun.sx, Math.max(1.5, sun.sy), sun.sz)

      const cloudFrac = currentState.cloudCover / 100
      const rainFrac = Math.min(1, currentState.rainIntensity / 60)
      const overcast = Math.min(1, cloudFrac * 0.75 + rainFrac * 0.45)

      // Sky colors
      const nightSky = new THREE.Color(0x0f172a)
      const sunsetSky = new THREE.Color(0xf97316).lerp(new THREE.Color(0x64748b), 0.35)
      const clearDaySky = new THREE.Color(0x60a5fa).lerp(new THREE.Color(0xbae6fd), 0.35)
      const cloudySky = new THREE.Color(0x64748b).lerp(new THREE.Color(0x94a3b8), 0.35)

      const baseDaySky = sunsetSky.clone().lerp(clearDaySky, sun.sunHeightFactor)
      const weatheredSky = baseDaySky.lerp(cloudySky, overcast * 0.85)
      const finalSky = nightSky.clone().lerp(weatheredSky, sun.dayFactor)

      scene.background = finalSky
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.copy(finalSky)
        scene.fog.density = 0.0085 + overcast * 0.011 + rainFrac * 0.008
      }

      // Sun & Hemi light
      const sunWarm = new THREE.Color(0xff9e5e)
      const sunNoon = new THREE.Color(0xfffbeb)
      sunLight.color.copy(sunWarm).lerp(sunNoon, sun.sunHeightFactor)
      sunLight.intensity =
        sun.elevDeg > 0 ? Math.max(0.25, (2.6 * Math.sin(degToRad(sun.elevDeg)) + 0.35) * (1 - overcast * 0.72)) : 0.08

      hemiLight.intensity = 0.22 + sun.dayFactor * (0.68 - overcast * 0.18)
      hemiLight.color.copy(finalSky).lerp(new THREE.Color(0xffffff), 0.4)

      // Cloud appearance
      cloudMat.opacity = clamp(0.08 + cloudFrac * 0.78 + rainFrac * 0.15, 0.05, 0.92)
      const cColor = new THREE.Color(0xffffff).lerp(new THREE.Color(0x475569), rainFrac * 0.65 + cloudFrac * 0.25)
      cColor.multiplyScalar(0.25 + 0.75 * sun.dayFactor)
      cloudMat.color.copy(cColor)
      cloudGroup.visible = currentState.cloudCover > 2 || currentState.rainIntensity > 0

      // Cloud drift
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

      // 2. Timelapse Handler
      if (currentState.timelapse && onHourTick) {
        timelapseThrottle += dt
        if (timelapseThrottle >= 0.1) {
          let newHour = currentState.hour + timelapseThrottle * 0.55
          timelapseThrottle = 0
          if (newHour > 19.0) newHour = 5.0
          onHourTick(newHour)
        }
      }

      // 3. Smooth Camera Lerp
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

      // 4. Stevenson Screen Animation
      const targetDoor = currentState.doorOpen ? -degToRad(105) : 0
      currentDoorAngle += (targetDoor - currentDoorAngle) * Math.min(1, dt * 6.5)
      stevenson.updateDoor(currentDoorAngle)
      stevenson.updateEspLed(elapsed)

      // 5. Wind Station Animation
      windStation.update(currentState.windSpeed, currentState.windDir, dt, elapsed)

      // 6. Rain Gauge Animation
      rainGauge.update(currentState.rainIntensity, dt, onTipRainGauge)

      // 7. Evaporation Pan Ripples & Mini Rotor
      evapPan.update(currentState.windSpeed, currentState.rainIntensity, dt, elapsed)

      // 8. Rain Drops Particles
      if (currentState.rainIntensity <= 0.1) {
        rainLines.geometry.setDrawRange(0, 0)
      } else {
        const activeDrops = Math.min(
          MAX_RAIN_DROPS,
          Math.floor((currentState.rainIntensity / 100) * MAX_RAIN_DROPS) + 90
        )
        rainLines.geometry.setDrawRange(0, activeDrops * 2)

        const dirRad = degToRad(currentState.windDir)
        const flowVx = -Math.sin(dirRad) * (currentState.windSpeed * 0.28)
        const flowVz = Math.cos(dirRad) * (currentState.windSpeed * 0.28)
        const streakLen = 0.28 + (currentState.rainIntensity / 100) * 0.18

        for (let i = 0; i < activeDrops; i++) {
          const d = rainBaseData[i]
          d.y -= d.speed * dt
          d.x += flowVx * dt
          d.z += flowVz * dt

          if (d.y < 0.05) {
            d.y = 9.5 + Math.random() * 2.5
            d.x = (Math.random() - 0.5) * 17
            d.z = (Math.random() - 0.5) * 17
          }
          if (d.x > 9) d.x -= 18
          if (d.x < -9) d.x += 18
          if (d.z > 9) d.z -= 18
          if (d.z < -9) d.z += 18

          const baseIdx = i * 6
          rainPositions[baseIdx] = d.x
          rainPositions[baseIdx + 1] = d.y
          rainPositions[baseIdx + 2] = d.z

          rainPositions[baseIdx + 3] = d.x - flowVx * 0.045
          rainPositions[baseIdx + 4] = d.y + streakLen
          rainPositions[baseIdx + 5] = d.z - flowVz * 0.045
        }
        rainLines.geometry.attributes.position.needsUpdate = true
      }

      // 9. Airflow Particles
      airflowGroup.visible = currentState.showAirflow && currentState.windSpeed > 0.1
      if (airflowGroup.visible) {
        const centerY = 0.05 + currentState.legHeight + 0.84 * 0.5
        const dirRad = degToRad(currentState.windDir)
        const flowX = -Math.sin(dirRad)
        const flowZ = Math.cos(dirRad)
        const perpX = flowZ
        const perpZ = -flowX
        const yaw = Math.atan2(flowX, flowZ)
        const speed = Math.min(3.5, 0.35 + currentState.windSpeed * 0.14)

        for (let i = 0; i < airflowParticles.length; i++) {
          const p = airflowParticles[i]
          p.progress += (speed * p.speedScale * dt) / 3.4
          if (p.progress > 1) p.progress -= 1

          const along = (p.progress - 0.5) * 3.4
          const insideFactor = Math.exp(-(along * along) / 0.45)
          const yWave = Math.sin(p.progress * Math.PI * 2) * 0.04 * insideFactor

          p.mesh.position.set(
            flowX * along + perpX * p.lateral,
            centerY + p.vertOffset + yWave,
            flowZ * along + perpZ * p.lateral
          )
          p.mesh.rotation.y = yaw
          const edgeScale = Math.sin(p.progress * Math.PI)
          p.mesh.scale.setScalar(0.45 + 0.65 * edgeScale)
        }
      }

      controls.update()
      renderer.render(scene, camera)
    }

    animate()

    // Resize Observer
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
  }, []) // Mount once

  return (
    <div className="relative h-full w-full select-none overflow-hidden" ref={mountRef}>
      {/* Hover Tooltip */}
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
