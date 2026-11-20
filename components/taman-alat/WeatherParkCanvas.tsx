"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { getSunPosition, lerpAngle, type WeatherParkValues } from "@/lib/tamanAlatPhysics"
import { createParkEnvironment } from "./models/parkEnvironment"
import { createStevensonScreen } from "./models/stevensonScreen"
import { createRainGauge } from "./models/rainGauge"
import { createWindStation } from "./models/windStation"
import { createSolarAndSoil } from "./models/solarAndSoil"
import { createEvaporationPan } from "./models/evaporationPan"

interface WeatherParkCanvasProps {
  values: WeatherParkValues
  stevenson: { volumeDm3: number; legHeight: number; louverTilt: number; albedo: number; xRay: boolean }
  selectedInstrument: string | null
  onSelectInstrument: (id: string | null) => void
  onWebglError: () => void
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh
    mesh.geometry?.dispose()
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    for (const material of materials) {
      if (!material) continue
      const materialWithMaps = material as THREE.Material & Partial<Record<"map" | "normalMap" | "roughnessMap" | "metalnessMap", THREE.Texture>>
      for (const key of ["map", "normalMap", "roughnessMap", "metalnessMap"] as const) materialWithMaps[key]?.dispose()
      material.dispose()
    }
  })
}

export default function WeatherParkCanvas({ values, stevenson, selectedInstrument, onSelectInstrument, onWebglError }: WeatherParkCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const valuesRef = useRef(values); valuesRef.current = values
  const selectedRef = useRef(selectedInstrument); selectedRef.current = selectedInstrument
  const selectRef = useRef(onSelectInstrument); selectRef.current = onSelectInstrument

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let renderer: THREE.WebGLRenderer
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }) } catch { onWebglError(); return }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setSize(container.clientWidth, container.clientHeight); container.appendChild(renderer.domElement)
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x9ac4d5); scene.fog = new THREE.Fog(0x9ac4d5, 24, 48)
    const camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.1, 100); camera.position.set(17, 14, 19)
    const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.target.set(0, 1.5, 0); controls.maxPolarAngle = Math.PI / 2.05; controls.minDistance = 7; controls.maxDistance = 38
    scene.add(new THREE.HemisphereLight(0xdff2ff, 0x4a5b3e, 1.6))
    const sun = new THREE.DirectionalLight(0xffdfad, 2.2); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.left = -22; sun.shadow.camera.right = 22; sun.shadow.camera.top = 22; sun.shadow.camera.bottom = -22; scene.add(sun)
    const environment = createParkEnvironment(); scene.add(environment)
    const stevensonGroup = createStevensonScreen(stevenson); stevensonGroup.position.set(-5.5, 0, -4); scene.add(stevensonGroup)
    const rainGroup = createRainGauge(); rainGroup.position.set(5, 0, -4); scene.add(rainGroup)
    const windGroup = createWindStation(); windGroup.position.set(-5.5, 0, 4); scene.add(windGroup)
    const solarGroup = createSolarAndSoil(); solarGroup.position.set(4.5, 0, 3.5); scene.add(solarGroup)
    const panGroup = createEvaporationPan(); panGroup.position.set(0, 0, 6); scene.add(panGroup)
    const instrumentGroups = [stevensonGroup, rainGroup, windGroup, solarGroup, panGroup]
    for (const group of instrumentGroups) group.traverse((child) => { (child as THREE.Mesh).castShadow = true; (child as THREE.Mesh).receiveShadow = true })
    const rainGeometry = new THREE.BufferGeometry(); const rainPositions = new Float32Array(180 * 3); for (let i = 0; i < 180; i++) { rainPositions[i * 3] = (Math.random() - 0.5) * 20; rainPositions[i * 3 + 1] = Math.random() * 12; rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 16 }
    rainGeometry.setAttribute("position", new THREE.BufferAttribute(rainPositions, 3)); const rain = new THREE.Points(rainGeometry, new THREE.PointsMaterial({ color: 0xa8d8ef, size: 0.06, transparent: true, opacity: 0.7 })); scene.add(rain)
    const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2(); let animationFrame = 0; let disposed = false; let cameraTarget = new THREE.Vector3(0, 1.5, 0)
    const findInstrument = (object: THREE.Object3D | null) => { let current = object; while (current) { if (typeof current.userData.instrumentId === "string") return current.userData.instrumentId as string; current = current.parent }
      return null }
    const handlePointer = (event: PointerEvent) => { const rect = renderer.domElement.getBoundingClientRect(); pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1; pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1; raycaster.setFromCamera(pointer, camera); const hit = raycaster.intersectObjects(instrumentGroups, true)[0]; const id = findInstrument(hit?.object ?? null); if (id) { selectRef.current(id); const group = instrumentGroups.find((item) => item.userData.instrumentId === id); if (group) cameraTarget = group.position.clone().add(new THREE.Vector3(0, 1.4, 0)) } }
    renderer.domElement.addEventListener("click", handlePointer)
    const resizeObserver = new ResizeObserver(() => { if (!container.clientWidth || !container.clientHeight) return; camera.aspect = container.clientWidth / container.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(container.clientWidth, container.clientHeight) }); resizeObserver.observe(container)
    const clock = new THREE.Clock()
    const animate = () => { if (disposed) return; const delta = clock.getDelta(); const current = valuesRef.current; const selectedGroup = instrumentGroups.find((group) => group.userData.instrumentId === selectedRef.current); if (selectedGroup) cameraTarget.lerp(selectedGroup.position.clone().add(new THREE.Vector3(0, 1.4, 0)), 0.06); else cameraTarget.lerp(new THREE.Vector3(0, 1.5, 0), 0.06); controls.target.lerp(cameraTarget, 0.06); for (const group of instrumentGroups) group.traverse((child) => { const material = (child as THREE.Mesh).material as THREE.MeshStandardMaterial; if (material?.emissive) material.emissive.set(group === selectedGroup ? 0x284b3d : 0x000000) }); const sunPosition = getSunPosition(current.hour); const azimuth = (sunPosition.azimuth * Math.PI) / 180; const elevation = Math.max(0.1, (sunPosition.elevation * Math.PI) / 180); sun.position.set(Math.cos(azimuth) * 18 * Math.cos(elevation), 18 * Math.sin(elevation), Math.sin(azimuth) * 18 * Math.cos(elevation)); sun.intensity = sunPosition.elevation < 0 ? 0.1 : 1.2 + current.solarRadiation / 1000; scene.background = new THREE.Color(current.rainRate > 0 ? 0x71899a : sunPosition.elevation < 8 ? 0xd49d78 : 0x9ac4d5); (windGroup.userData.rotor as THREE.Group).rotation.y += delta * (0.7 + current.windSpeed * 0.35); const vane = windGroup.userData.vane as THREE.Mesh; vane.rotation.y = lerpAngle(vane.rotation.y * 180 / Math.PI, current.windDirection, 0.08) * Math.PI / 180; rain.visible = current.rainRate > 0.1; rain.rotation.y += delta * 0.03; const positions = rain.geometry.getAttribute("position") as THREE.BufferAttribute; for (let i = 1; i < positions.count; i++) { const y = positions.getY(i) - delta * (2 + current.rainRate * 0.12); positions.setY(i, y < 0 ? 12 : y) } positions.needsUpdate = true; const xRaySensor = stevensonGroup.userData.sensor as THREE.Mesh; xRaySensor.visible = Boolean(stevensonGroup.userData.xRay); controls.update(); renderer.render(scene, camera); animationFrame = requestAnimationFrame(animate) }
    animate()
    return () => { disposed = true; cancelAnimationFrame(animationFrame); resizeObserver.disconnect(); renderer.domElement.removeEventListener("click", handlePointer); controls.dispose(); disposeObject(scene); renderer.dispose(); renderer.domElement.remove() }
  }, [onWebglError, stevenson])

  return <div ref={containerRef} className="absolute inset-0" aria-label="Simulasi 3D taman alat meteorologi" />
}