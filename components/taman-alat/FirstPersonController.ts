import * as THREE from 'three'
import { InstrumentId, INSTRUMENT_CATALOG } from '@/lib/tamanAlatCatalog'

export interface InstrumentProximityInfo {
  instrumentId: InstrumentId
  name: string
  distance: number
}

const INSTRUMENT_LOCATIONS: { id: InstrumentId; x: number; z: number }[] = [
  { id: 'stevenson', x: 0, z: 0 },
  { id: 'anemometer', x: -3.8, z: -3.2 },
  { id: 'raingauge', x: 4.25, z: -2.6 },
  { id: 'pyranometer', x: 3.9, z: 2.8 },
  { id: 'evappan', x: -3.6, z: 2.8 },
  { id: 'campbell', x: -1.65, z: -3.5 },
  { id: 'barometer', x: 1.65, z: -3.5 },
]

export class FirstPersonController {
  private camera: THREE.PerspectiveCamera
  private domElement: HTMLElement
  private enabled = false

  // Posisi & Orientasi Pemain
  public position = new THREE.Vector3(0, 1.65, 5.2) // Mulai di gerbang Selatan
  private yaw = 0 // Menghadap Utara (arah -Z)
  private pitch = -0.05 // Sedikit menatap ke bawah ke arah taman
  private bobTime = 0

  // Kecepatan & Akselerasi
  private walkSpeed = 2.4
  private sprintSpeed = 4.8
  private velocity = new THREE.Vector3()

  // State Tombol
  private keys = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
  }

  // Pointer / Drag Look
  private isPointerLocked = false
  private isDragging = false
  private prevMouseX = 0
  private prevMouseY = 0

  // Virtual Joypad (Mobile)
  private virtualMoveX = 0
  private virtualMoveY = 0

  // Proximity callback
  public onProximityChange?: (info: InstrumentProximityInfo | null) => void
  public onInteract?: (id: InstrumentId) => void

  private currentNearInstrument: InstrumentId | null = null

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera
    this.domElement = domElement

    this.bindEvents()
  }

  public setEnabled(enable: boolean) {
    this.enabled = enable
    if (!enable) {
      this.keys.forward = false
      this.keys.backward = false
      this.keys.left = false
      this.keys.right = false
      this.keys.sprint = false
      this.virtualMoveX = 0
      this.virtualMoveY = 0
      if (document.pointerLockElement === this.domElement) {
        document.exitPointerLock()
      }
    } else {
      // Sinkronkan posisi kamera awal
      this.position.set(0, 1.65, 5.2)
      this.yaw = 0
      this.pitch = -0.05
    }
  }

  public isEnabled(): boolean {
    return this.enabled
  }

  public setVirtualMove(x: number, y: number) {
    this.virtualMoveX = x
    this.virtualMoveY = y
  }

  private bindEvents() {
    window.addEventListener('keydown', (e) => {
      if (!this.enabled) return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keys.forward = true
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.backward = true
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = true
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = true
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.sprint = true

      // Interaksi tombol E ala Minecraft
      if (e.code === 'KeyE') {
        if (this.currentNearInstrument && this.onInteract) {
          this.onInteract(this.currentNearInstrument)
        }
      }
    })

    window.addEventListener('keyup', (e) => {
      if (!this.enabled) return
      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keys.forward = false
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.backward = false
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = false
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = false
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.sprint = false
    })

    // Pointer Lock & Mouse Look
    this.domElement.addEventListener('click', () => {
      if (this.enabled && !this.isPointerLocked) {
        this.domElement.requestPointerLock?.()
      }
    })

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.domElement
    })

    this.domElement.addEventListener('mousedown', (e) => {
      if (!this.enabled) return
      if (e.button === 0) {
        this.isDragging = true
        this.prevMouseX = e.clientX
        this.prevMouseY = e.clientY
      }
    })

    window.addEventListener('mouseup', () => {
      this.isDragging = false
    })

    window.addEventListener('mousemove', (e) => {
      if (!this.enabled) return

      if (this.isPointerLocked) {
        const dx = e.movementX || 0
        const dy = e.movementY || 0
        this.yaw -= dx * 0.0022
        this.pitch -= dy * 0.0022
        this.clampAngles()
      } else if (this.isDragging) {
        const dx = e.clientX - this.prevMouseX
        const dy = e.clientY - this.prevMouseY
        this.prevMouseX = e.clientX
        this.prevMouseY = e.clientY
        this.yaw -= dx * 0.003
        this.pitch -= dy * 0.003
        this.clampAngles()
      }
    })

    // Touch look on canvas
    let lastTouchX = 0
    let lastTouchY = 0
    this.domElement.addEventListener('touchstart', (e) => {
      if (!this.enabled) return
      if (e.touches.length === 1) {
        lastTouchX = e.touches[0].clientX
        lastTouchY = e.touches[0].clientY
      }
    }, { passive: true })

    this.domElement.addEventListener('touchmove', (e) => {
      if (!this.enabled) return
      if (e.touches.length === 1) {
        const tx = e.touches[0].clientX
        const ty = e.touches[0].clientY
        const dx = tx - lastTouchX
        const dy = ty - lastTouchY
        lastTouchX = tx
        lastTouchY = ty

        this.yaw -= dx * 0.004
        this.pitch -= dy * 0.004
        this.clampAngles()
      }
    }, { passive: true })
  }

  private clampAngles() {
    const maxPitch = (80 * Math.PI) / 180
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch))
  }

  public update(dt: number) {
    if (!this.enabled) return

    // 1. Hitung vektor pergerakan
    const speed = this.keys.sprint ? this.sprintSpeed : this.walkSpeed

    let moveX = 0
    let moveZ = 0

    if (this.keys.forward) moveZ += 1
    if (this.keys.backward) moveZ -= 1
    if (this.keys.left) moveX -= 1
    if (this.keys.right) moveX += 1

    // Gabungkan dengan input virtual joystick jika ada
    if (Math.abs(this.virtualMoveX) > 0.05 || Math.abs(this.virtualMoveY) > 0.05) {
      moveX += this.virtualMoveX
      moveZ += this.virtualMoveY
    }

    const moveLength = Math.hypot(moveX, moveZ)
    if (moveLength > 0.01) {
      moveX /= moveLength
      moveZ /= moveLength

      // Arah relatif terhadap yaw kamera
      const forwardX = -Math.sin(this.yaw)
      const forwardZ = -Math.cos(this.yaw)
      const rightX = -Math.sin(this.yaw + Math.PI / 2)
      const rightZ = -Math.cos(this.yaw + Math.PI / 2)

      const dirX = forwardX * moveZ + rightX * moveX
      const dirZ = forwardZ * moveZ + rightZ * moveX

      this.velocity.x = dirX * speed
      this.velocity.z = dirZ * speed

      // Head-bobbing saat bergerak
      this.bobTime += dt * (this.keys.sprint ? 14 : 9.5)
    } else {
      this.velocity.set(0, 0, 0)
      this.bobTime = 0
    }

    // 2. Terapkan kecepatan ke posisi
    this.position.x += this.velocity.x * dt
    this.position.z += this.velocity.z * dt

    // 3. Batas Pagar Taman Alat (Collision Boundary 12.2m x 12.2m)
    const bound = 5.45
    this.position.x = Math.max(-bound, Math.min(bound, this.position.x))
    this.position.z = Math.max(-bound, Math.min(bound, this.position.z))

    // 4. Update Kamera
    const bobOffset = Math.sin(this.bobTime) * 0.038
    this.camera.position.set(this.position.x, 1.65 + bobOffset, this.position.z)

    // Arah pandangan kamera
    const target = new THREE.Vector3(
      this.camera.position.x - Math.sin(this.yaw) * Math.cos(this.pitch) * 10,
      this.camera.position.y + Math.sin(this.pitch) * 10,
      this.camera.position.z - Math.cos(this.yaw) * Math.cos(this.pitch) * 10
    )
    this.camera.lookAt(target)

    // 5. Cek Proximity ke 7 Instrumen
    this.checkProximity()
  }

  private checkProximity() {
    let nearest: { id: InstrumentId; dist: number } | null = null
    let minDist = 1.95 // Radius deteksi meter

    for (const inst of INSTRUMENT_LOCATIONS) {
      const dist = Math.hypot(this.position.x - inst.x, this.position.z - inst.z)
      if (dist < minDist) {
        minDist = dist
        nearest = { id: inst.id, dist }
      }
    }

    if (nearest) {
      if (this.currentNearInstrument !== nearest.id) {
        this.currentNearInstrument = nearest.id
        const catalog = INSTRUMENT_CATALOG[nearest.id]
        if (this.onProximityChange && catalog) {
          this.onProximityChange({
            instrumentId: nearest.id,
            name: catalog.shortName || catalog.name,
            distance: nearest.dist,
          })
        }
      }
    } else {
      if (this.currentNearInstrument !== null) {
        this.currentNearInstrument = null
        if (this.onProximityChange) {
          this.onProximityChange(null)
        }
      }
    }
  }
}
