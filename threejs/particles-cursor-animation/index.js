import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Clock,
  Points,
  BufferAttribute,
  TextureLoader,
  PlaneGeometry,
  Mesh,
  MeshBasicMaterial,
  ShaderMaterial,
  DoubleSide,
  Uniform,
  Vector2,
  Raycaster,
  ACESFilmicToneMapping,
  CanvasTexture
} from 'three'
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import vertexShader from './vertex.glsl'
import fragmentShader from './fragment.glsl'

const scene = new Scene()

const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(0, 0, 8)

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
  resolution: new Vector2(window.innerWidth, window.innerHeight)
}
const renderer = new WebGLRenderer({ alpha: false, antialias: true })
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(sizes.pixelRatio)
renderer.toneMapping = ACESFilmicToneMapping
document.body.appendChild(renderer.domElement)

// 窗口自适应
window.addEventListener('resize', function () {
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight
  sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)
  sizes.resolution.set(window.innerWidth, window.innerHeight)

  const { width, height, pixelRatio} = sizes

  renderer.setSize(width, height)
  renderer.setPixelRatio(pixelRatio)

  camera.aspect = width / height
  camera.updateProjectionMatrix()

  // particles
  particlesMaterial.uniforms.uResolution.value.copy(sizes.resolution) 
}, false)

// 时钟
const clock = new Clock()

// Control
const orbitControls = new OrbitControls(camera, renderer.domElement)

// Loaders
const textureLoader = new TextureLoader()

/**
 * Displacement
 */
const displacement = {
  canvas: document.createElement('canvas')
}
displacement.canvas.width = 128
displacement.canvas.height = 128
displacement.canvas.style.width = '256px'
displacement.canvas.style.height = '256px'
displacement.canvas.style.position = 'fixed'
displacement.canvas.style.top = 0
displacement.canvas.style.left = 0

displacement.context = displacement.canvas.getContext('2d')
displacement.context.fillRect(0, 0, displacement.canvas.width, displacement.canvas.height)
document.body.appendChild(displacement.canvas)

displacement.glowImage = new Image()
displacement.glowImage.src = '/textures/glow.png'
displacement.glowSize = displacement.canvas.width / 4

// 因为 raycaster 无法作用于 Point，故新增一个 Plane 与 Point 重合来实现 raycaster
displacement.interactivePlane = new Mesh(
  new PlaneGeometry(10, 10),
  new MeshBasicMaterial({
    side: DoubleSide
  })
)
displacement.interactivePlane.visible = false
scene.add(displacement.interactivePlane)

displacement.raycaster = new Raycaster()

displacement.screenCursor = new Vector2(9999, 9999) // 使初始值不可见
displacement.canvasCursor = new Vector2(9999, 9999)
displacement.canvasCursorPrevious = new Vector2(9999, 9999)

window.addEventListener('pointermove', function(e) {
  displacement.screenCursor.x = (e.clientX / sizes.width) * 2 - 1
  displacement.screenCursor.y = -(e.clientY / sizes.height) * 2 + 1
})

displacement.texture = new CanvasTexture(displacement.canvas)

/**
 * Particles Cursor Animation
 */
const particlesGeometry = new PlaneGeometry(10, 10, 128, 128)
// 因为几何体是由多个顶点构成，当 three.js 将顶点索引发送给 GPU 时，GPU 会将每三个顶点绘制成一个三角形。但如果想绘制的是粒子，每一个顶点都绘制成一个粒子。
particlesGeometry.setIndex(null)
particlesGeometry.deleteAttribute('normal')

const count = particlesGeometry.attributes.position.count
const intencitiesArray = new Float32Array(count)
const anglesArray = new Float32Array(count)

for (let i = 0; i < count; i++) {
  intencitiesArray[i] = Math.random()
  anglesArray[i] = Math.random() * Math.PI * 2
}

particlesGeometry.setAttribute('aIntercity', new BufferAttribute(intencitiesArray, 1))
particlesGeometry.setAttribute('aAngle', new BufferAttribute(anglesArray, 1))

const particlesMaterial = new ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uResolution: new Uniform(sizes.resolution),
    uPictureTexture: new Uniform(textureLoader.load('/images/grayscaleDog.png')),
    uDisplacementTexture: new Uniform(displacement.texture)
  },
  // blending: AdditiveBlending
})
const particles = new Points(
  particlesGeometry,
  particlesMaterial,
)
scene.add(particles)

function animate() {
  window.requestAnimationFrame(animate)
  renderer.render(scene, camera)
  orbitControls.update()
  const elapsedTime = clock.getElapsedTime()

  // raycaster
  displacement.raycaster.setFromCamera(displacement.screenCursor, camera)
  const intersections = displacement.raycaster.intersectObject(displacement.interactivePlane)
  if (intersections.length) {
    const uv = intersections[0].uv
    displacement.canvasCursor.set(uv.x * displacement.canvas.width, (1 - uv.y) * displacement.canvas.height)
  }

  // displacement
  displacement.context.globalCompositeOperation = 'source-over'
  displacement.context.globalAlpha = 0.05
  displacement.context.fillRect(0, 0, displacement.canvas.width, displacement.canvas.height)

  // 鼠标悬停时，恢复粒子位置
  const cursorDistance = displacement.canvasCursorPrevious.distanceTo(displacement.canvasCursor)
  displacement.canvasCursorPrevious.copy(displacement.canvasCursor)
  const alpha = Math.min(cursorDistance * .1, 1)

  displacement.context.globalCompositeOperation = 'lighten'
  displacement.context.globalAlpha = alpha
  displacement.context.drawImage(
    displacement.glowImage,
    displacement.canvasCursor.x - displacement.glowSize / 2,
    displacement.canvasCursor.y - displacement.glowSize / 2,
    displacement.glowSize,
    displacement.glowSize
  )

  displacement.texture.needsUpdate = true
}
animate()
