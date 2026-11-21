import * as THREE from 'three'
import { clamp, degToRad } from '@/lib/tamanAlatPhysics'

export interface SkyAtmosphereSystem {
  skyMesh: THREE.Mesh
  starfield: THREE.Points
  sunMesh: THREE.Mesh
  moonGroup: THREE.Group
  cloudDome: THREE.Mesh
  sunLight: THREE.DirectionalLight
  moonLight: THREE.DirectionalLight
  hemiLight: THREE.HemisphereLight
  update: (
    hour: number,
    cloudCover: number,
    moonPhase: number,
    lightningIntensity: number,
    dt: number,
    time: number
  ) => { nightFactor: number; sunElevation: number; isNight: boolean }
}

/** Tekstur kawah bulan prosedural resolusi 512x512 berbasis Canvas 2D */
function createMoonCraterTexture(): THREE.CanvasTexture {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#b0b8c2'
  ctx.fillRect(0, 0, size, size)

  // Mare (dataran basal gelap di permukaan bulan)
  const maria = [
    { x: 180, y: 190, r: 85, a: 0.28 },
    { x: 310, y: 220, r: 105, a: 0.32 },
    { x: 260, y: 340, r: 90, a: 0.24 },
    { x: 150, y: 320, r: 65, a: 0.22 },
  ]
  maria.forEach((m) => {
    const grad = ctx.createRadialGradient(m.x, m.y, 10, m.x, m.y, m.r)
    grad.addColorStop(0, `rgba(45, 52, 65, ${m.a})`)
    grad.addColorStop(0.7, `rgba(70, 78, 92, ${m.a * 0.7})`)
    grad.addColorStop(1, 'rgba(176, 184, 194, 0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2)
    ctx.fill()
  })

  // Kawah-kawah impak meteor
  for (let i = 0; i < 90; i++) {
    const cx = (Math.sin(i * 12.9898) * 0.5 + 0.5) * size
    const cy = (Math.cos(i * 78.233) * 0.5 + 0.5) * size
    const cr = 3 + (i % 8) * 2.8

    ctx.beginPath()
    ctx.arc(cx, cy, cr, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(35, 40, 50, 0.45)'
    ctx.fill()

    ctx.lineWidth = 1.2
    ctx.strokeStyle = 'rgba(235, 240, 250, 0.55)'
    ctx.stroke()
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  return tex
}

export function buildSkyAtmosphere(scene: THREE.Scene): SkyAtmosphereSystem {
  // 1. SKY DOME DENGAN SHADER GLSL
  const skyUniforms = {
    uSunDir: { value: new THREE.Vector3(0, 1, 0) },
    uZenithColor: { value: new THREE.Color(0x194d8a) },
    uHorizonColor: { value: new THREE.Color(0x8cb6e6) },
    uGlowColor: { value: new THREE.Color(0xffaa44) },
    uGlowAmount: { value: 1.0 },
    uOvercast: { value: 0.0 },
    uNightFactor: { value: 0.0 },
    uLightning: { value: 0.0 },
  }

  const skyMat = new THREE.ShaderMaterial({
    uniforms: skyUniforms,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: /* glsl */ `
      varying vec3 vWorldDir;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldDir = normalize(position);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uSunDir;
      uniform vec3 uZenithColor;
      uniform vec3 uHorizonColor;
      uniform vec3 uGlowColor;
      uniform float uGlowAmount;
      uniform float uOvercast;
      uniform float uNightFactor;
      uniform float uLightning;
      varying vec3 vWorldDir;

      void main() {
        vec3 dir = normalize(vWorldDir);
        float h = clamp(dir.y, 0.0, 1.0);

        float horizonCurve = pow(1.0 - h, 2.35);
        vec3 skyCol = mix(uZenithColor, uHorizonColor, horizonCurve);

        float sunDot = max(dot(dir, normalize(uSunDir)), 0.0);
        float solarBand = pow(sunDot, 5.0) * pow(1.0 - h, 1.45) * uGlowAmount;
        float solarMie  = pow(sunDot, 42.0) * (1.0 - uOvercast * 0.85) * (1.0 - uNightFactor);
        skyCol += uGlowColor * solarBand * (1.0 - uOvercast * 0.72);
        skyCol += mix(vec3(1.0, 0.96, 0.86), uGlowColor, 0.45) * solarMie * 0.52;

        // Airglow malam tipis di ufuk
        float airglow = exp(-h * 7.5) * uNightFactor * 0.14;
        skyCol += vec3(0.08, 0.16, 0.30) * airglow;

        // Kilatan petir konvektif
        skyCol += vec3(0.65, 0.82, 1.0) * uLightning * 0.65 * (0.35 + 0.65 * horizonCurve);

        if (dir.y < 0.0) {
          skyCol = mix(uHorizonColor, uHorizonColor * 0.45, clamp(-dir.y * 4.5, 0.0, 1.0));
        }
        gl_FragColor = vec4(skyCol, 1.0);
      }
    `,
  })

  const skyGeo = new THREE.SphereGeometry(240, 32, 24)
  const skyMesh = new THREE.Mesh(skyGeo, skyMat)
  scene.add(skyMesh)

  // 2. STARFIELD 3.000 BINTANG DENGAN SCINTILLATION
  const starCount = 3000
  const starPos = new Float32Array(starCount * 3)
  const starMag = new Float32Array(starCount)

  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(Math.random() * 0.88 + 0.08) // Hemisphere atas
    const r = 230
    starPos[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta)
    starPos[i * 3 + 1] = r * Math.cos(phi)
    starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    starMag[i] = Math.random() * 0.7 + 0.3
  }

  const starGeo = new THREE.BufferGeometry()
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
  starGeo.setAttribute('aMag', new THREE.BufferAttribute(starMag, 1))

  const starUniforms = {
    uTime: { value: 0 },
    uNightFactor: { value: 0 },
    uOvercast: { value: 0 },
  }

  const starMat = new THREE.ShaderMaterial({
    uniforms: starUniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      attribute float aMag;
      uniform float uTime;
      uniform float uNightFactor;
      uniform float uOvercast;
      varying float vAlpha;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        float twinkle = sin(uTime * (1.8 + aMag * 3.5) + position.x * 0.05) * 0.32 + 0.68;
        vAlpha = aMag * twinkle * uNightFactor * (1.0 - uOvercast * 0.95);
        gl_PointSize = (1.2 + aMag * 1.8) * (200.0 / -mvPosition.z);
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vAlpha;
      void main() {
        if (vAlpha <= 0.01) discard;
        vec2 uv = gl_PointCoord - vec2(0.5);
        float d = length(uv);
        if (d > 0.5) discard;
        float glow = exp(-d * 4.5);
        gl_FragColor = vec4(vec3(0.92, 0.96, 1.0), vAlpha * glow);
      }
    `,
  })

  const starfield = new THREE.Points(starGeo, starMat)
  scene.add(starfield)

  // 3. CELESTIAL BODIES: MATAHARI & BULAN REALISTIS
  // Matahari
  const sunGeo = new THREE.SphereGeometry(7.5, 20, 20)
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff3d6, fog: false })
  const sunMesh = new THREE.Mesh(sunGeo, sunMat)
  scene.add(sunMesh)

  // Bulan (grup dengan rotasi fase)
  const moonGroup = new THREE.Group()
  const moonGeo = new THREE.SphereGeometry(5.8, 24, 24)
  const moonTex = createMoonCraterTexture()
  const moonMat = new THREE.MeshStandardMaterial({
    map: moonTex,
    roughness: 0.92,
    metalness: 0.0,
    emissive: 0xdde6f5,
    emissiveIntensity: 0.12,
  })
  const moonMesh = new THREE.Mesh(moonGeo, moonMat)
  moonGroup.add(moonMesh)
  scene.add(moonGroup)

  // 4. KUBAH AWAN (CLOUD DOME)
  const cloudUniforms = {
    uTime: { value: 0 },
    uCoverage: { value: 0.25 },
    uNightFactor: { value: 0.0 },
    uLightning: { value: 0.0 },
  }

  const cloudMat = new THREE.ShaderMaterial({
    uniforms: cloudUniforms,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    fog: false,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uCoverage;
      uniform float uNightFactor;
      uniform float uLightning;
      varying vec3 vDir;

      // Pseudo FBM noise
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i + vec2(0,0)), hash(i + vec2(1,0)), f.x),
                   mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
      }

      void main() {
        if (vDir.y < 0.04) discard;
        vec2 uv = (vDir.xz / (vDir.y + 0.35)) * 1.8;
        uv += vec2(uTime * 0.008, uTime * 0.005);

        float n = noise(uv * 2.2) * 0.55 + noise(uv * 4.8) * 0.30 + noise(uv * 9.5) * 0.15;
        float cloudAlpha = smoothstep(1.0 - uCoverage * 0.9, 1.05 - uCoverage * 0.5, n);
        cloudAlpha *= smoothstep(0.04, 0.22, vDir.y); // Fade out di dekat cakrawala

        vec3 dayCloudCol = mix(vec3(0.96, 0.97, 1.0), vec3(0.72, 0.76, 0.82), 1.0 - vDir.y);
        vec3 nightCloudCol = vec3(0.08, 0.12, 0.20);
        vec3 col = mix(dayCloudCol, nightCloudCol, uNightFactor);

        // Flash saat petir
        col += vec3(0.5, 0.65, 0.9) * uLightning * 0.85;

        gl_FragColor = vec4(col, cloudAlpha * 0.82);
      }
    `,
  })

  const cloudDome = new THREE.Mesh(new THREE.SphereGeometry(220, 24, 18), cloudMat)
  scene.add(cloudDome)

  // 5. LIGHTING UTAMA: MATAHARI, BULAN, HEMISPHERE
  const sunLight = new THREE.DirectionalLight(0xfff5e6, 2.1)
  sunLight.castShadow = true
  sunLight.shadow.mapSize.set(1024, 1024)
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

  const moonLight = new THREE.DirectionalLight(0xaaccff, 0.0)
  moonLight.castShadow = false
  scene.add(moonLight)

  const hemiLight = new THREE.HemisphereLight(0xcde0f7, 0x2b421a, 0.42)
  scene.add(hemiLight)

  // UPDATE FUNCTION
  const update = (
    hour: number,
    cloudCover: number,
    moonPhase: number,
    lightningIntensity: number,
    dt: number,
    time: number
  ) => {
    // 1. Posisi Matahari (Elevasi & Azimut di Kebumen -7.67° LS)
    const radHour = ((hour - 12) / 12) * Math.PI
    const declination = degToRad(-15) // Rata-rata kemiringan surya
    const lat = degToRad(-7.67)

    const sinElev = Math.sin(lat) * Math.sin(declination) + Math.cos(lat) * Math.cos(declination) * Math.cos(radHour)
    const sunElev = Math.asin(sinElev)
    const sunAzimuth = Math.atan2(
      -Math.sin(radHour),
      Math.tan(declination) * Math.cos(lat) - Math.sin(lat) * Math.cos(radHour)
    )

    const sunDir = new THREE.Vector3(
      Math.cos(sunElev) * Math.sin(sunAzimuth),
      Math.sin(sunElev),
      Math.cos(sunElev) * Math.cos(sunAzimuth)
    ).normalize()

    // Posisi visual bola matahari
    sunMesh.position.copy(sunDir).multiplyScalar(215)
    sunLight.position.copy(sunDir).multiplyScalar(32)

    // 2. Posisi Bulan (Berseberangan relatif terhadap matahari disesuaikan fase)
    const moonAngle = radHour + Math.PI + (moonPhase - 0.5) * Math.PI * 0.8
    const moonDir = new THREE.Vector3(
      Math.cos(0.45) * Math.sin(moonAngle),
      Math.sin(0.45 + Math.cos(moonAngle) * 0.35),
      Math.cos(0.45) * Math.cos(moonAngle)
    ).normalize()

    moonGroup.position.copy(moonDir).multiplyScalar(210)
    moonLight.position.copy(moonDir).multiplyScalar(28)

    // 3. Faktor Malam (0.0 Siang s/d 1.0 Malam)
    const sunElevDeg = (sunElev * 180) / Math.PI
    const nightFactor = clamp((-sunElevDeg + 2.0) / 12.0, 0.0, 1.0)
    const isNight = nightFactor > 0.55
    const overcast = cloudCover / 100

    // 4. Warna Langit Shader
    const zenithDay = new THREE.Color(0x1a4d8c)
    const zenithSunset = new THREE.Color(0x2d2146)
    const zenithNight = new THREE.Color(0x040814)

    const horizonDay = new THREE.Color(0x8cb6e6)
    const horizonSunset = new THREE.Color(0xf57c38)
    const horizonNight = new THREE.Color(0x091428)

    const sunsetFactor = clamp(1.0 - Math.abs(sunElevDeg - 4.5) / 8.5, 0.0, 1.0)

    const curZenith = new THREE.Color()
      .lerpColors(zenithDay, zenithSunset, sunsetFactor)
      .lerp(zenithNight, nightFactor)
    const curHorizon = new THREE.Color()
      .lerpColors(horizonDay, horizonSunset, sunsetFactor)
      .lerp(horizonNight, nightFactor)

    skyUniforms.uSunDir.value.copy(sunDir)
    skyUniforms.uZenithColor.value.copy(curZenith)
    skyUniforms.uHorizonColor.value.copy(curHorizon)
    skyUniforms.uGlowColor.value.setHex(sunsetFactor > 0.3 ? 0xff7722 : 0xffcc66)
    skyUniforms.uGlowAmount.value = 0.5 + sunsetFactor * 1.8
    skyUniforms.uOvercast.value = overcast
    skyUniforms.uNightFactor.value = nightFactor
    skyUniforms.uLightning.value = lightningIntensity

    // 5. Update Bintang & Awan
    starUniforms.uTime.value = time
    starUniforms.uNightFactor.value = nightFactor
    starUniforms.uOvercast.value = overcast

    cloudUniforms.uTime.value = time
    cloudUniforms.uCoverage.value = overcast
    cloudUniforms.uNightFactor.value = nightFactor
    cloudUniforms.uLightning.value = lightningIntensity

    // 6. Intensitas Pencahayaan (Lighting)
    const sunIntensity = Math.max(0, Math.sin(sunElev)) * (1.0 - overcast * 0.75) * (1.0 - nightFactor) * 2.1
    sunLight.intensity = sunIntensity
    sunLight.visible = sunIntensity > 0.01

    const moonBrightness = 0.18 * (0.3 + moonPhase * 0.7) * (1.0 - overcast * 0.8) * nightFactor
    moonLight.intensity = moonBrightness
    moonLight.visible = moonBrightness > 0.01

    // Hemisphere light blending
    const hemiSky = new THREE.Color(0xcde0f7).lerp(new THREE.Color(0x101b33), nightFactor)
    const hemiGround = new THREE.Color(0x2b421a).lerp(new THREE.Color(0x081208), nightFactor)
    hemiLight.color.copy(hemiSky)
    hemiLight.groundColor.copy(hemiGround)
    hemiLight.intensity = (0.42 * (1.0 - nightFactor) + 0.12 * nightFactor) * (1.0 - overcast * 0.35)

    // Visibility mesh matahari & bulan
    sunMesh.visible = sunElevDeg > -8.0
    moonGroup.visible = moonDir.y > -0.05

    return { nightFactor, sunElevation: sunElevDeg, isNight }
  }

  return {
    skyMesh,
    starfield,
    sunMesh,
    moonGroup,
    cloudDome,
    sunLight,
    moonLight,
    hemiLight,
    update,
  }
}
