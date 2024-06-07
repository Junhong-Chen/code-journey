import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Clock,
  Color,
  RawShaderMaterial,
  Points,
  AdditiveBlending,
  BufferGeometry,
  BufferAttribute,
  Vector2
} from 'three'
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import vertexShader from './vertex.vs.glsl'
import fragmentShader from './fragment.fs.glsl'

const scene = new Scene()

const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(0, 0, 3)

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
  resolution: new Vector2(window.innerWidth, window.innerHeight)
}
const renderer = new WebGLRenderer({ alpha: false, antialias: true })
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(sizes.pixelRatio)
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
}, false)

// 时钟
const clock = new Clock()

const orbitControls = new OrbitControls(camera, renderer.domElement)

// galaxy
const count = 131072
const itemSize = 3
const branchs = 3
const geometry = new BufferGeometry()
const positoins = new Float32Array(count * itemSize)
const colors = new Float32Array(count * itemSize)
const randoms = new Float32Array(count * itemSize)
const scales = new Float32Array(count)
const radius = 4
const insideColor = new Color(0xdd9060)
const outsideColor = new Color(0x6666dd)

for (let i = 0; i < count; i++) {
  const j = itemSize * i
  const r = Math.random() * radius
  const angle = (i % branchs) / branchs * Math.PI * 2

  const randomX = Math.pow(Math.random(), 3) * Math.sign(Math.random() - 0.5) * r / 2
  const randomY = Math.pow(Math.random(), 3) * Math.sign(Math.random() - 0.5) * r / 2 
  const randomZ = Math.pow(Math.random(), 3) * Math.sign(Math.random() - 0.5) * r / 2

  positoins[j + 0] = Math.cos(angle) * r
  positoins[j + 1] = 0
  positoins[j + 2] = Math.sin(angle) * r

  randoms[j + 0] = randomX
  randoms[j + 1] = randomY
  randoms[j + 2] = randomZ

  const mixColor = insideColor.clone()
  mixColor.lerp(outsideColor, r / radius)

  colors[j + 0] = mixColor.r
  colors[j + 1] = mixColor.g
  colors[j + 2] = mixColor.b

  scales[i] = Math.random()
}
geometry.setAttribute('position', new BufferAttribute(positoins, itemSize))
geometry.setAttribute('color', new BufferAttribute(colors, itemSize))
geometry.setAttribute('aRandom', new BufferAttribute(randoms, itemSize))
geometry.setAttribute('aScale', new BufferAttribute(scales, 1))

const material = new RawShaderMaterial({
  depthWrite: false,
  blending: AdditiveBlending,
  vertexColors: true,
  vertexShader,
  fragmentShader,
  uniforms: {
    uTime: { value: 0 },
    uSize: { value: 16 * renderer.getPixelRatio() }
  }
})

const points = new Points(
  geometry,
  material
)
scene.add(points)

function animate () {
  window.requestAnimationFrame(animate)
  renderer.render(scene, camera)
  orbitControls.update()
  
  material.uniforms.uTime.value = clock.getElapsedTime()
}
animate()
