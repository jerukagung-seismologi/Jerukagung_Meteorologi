import * as THREE from "three"

export function createParkEnvironment(): THREE.Group {
  const group = new THREE.Group()
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(24, 20), new THREE.MeshStandardMaterial({ color: 0x567d45, roughness: 1 })); grass.rotation.x = -Math.PI / 2; group.add(grass)
  const path = new THREE.Mesh(new THREE.PlaneGeometry(3, 20), new THREE.MeshStandardMaterial({ color: 0xb9a98c, roughness: 1 })); path.rotation.x = -Math.PI / 2; path.position.y = 0.012; group.add(path)
  const fence = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 0.75, 0.12), new THREE.MeshStandardMaterial({ color: 0xf3f1e8, roughness: 0.7 }), 32); let index = 0
  for (let x = -11; x <= 11; x += 1.5) for (const z of [-9.5, 9.5]) fence.setMatrixAt(index++, new THREE.Matrix4().makeTranslation(x, 0.38, z))
  for (let z = -8; z <= 8; z += 1.5) for (const x of [-11.5, 11.5]) fence.setMatrixAt(index++, new THREE.Matrix4().makeTranslation(x, 0.38, z))
  group.add(fence)
  const directions = [["U", 0, -10.2], ["S", 0, 10.2], ["B", -12, 0], ["T", 12, 0]] as const
  for (const [label, x, z] of directions) { const canvas = document.createElement("canvas"); canvas.width = 96; canvas.height = 96; const context = canvas.getContext("2d"); if (!context) continue; context.fillStyle = "#f8f2df"; context.fillRect(0, 0, 96, 96); context.fillStyle = "#20372b"; context.font = "bold 56px sans-serif"; context.textAlign = "center"; context.textBaseline = "middle"; context.fillText(label, 48, 48); const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true })); sprite.scale.set(0.8, 0.8, 0.8); sprite.position.set(x, 0.8, z); group.add(sprite) }
  return group
}