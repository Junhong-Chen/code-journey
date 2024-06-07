import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Clock,
  TextureLoader,
  PlaneGeometry,
  Mesh,
  ShaderMaterial,
  DoubleSide,
  Uniform,
  RepeatWrapping,
  Vector2
} from 'three'
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import vertexShader from './vertex.glsl'
import fragmentShader from './fragment.glsl'

const scene = new Scene()

const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(0, 6, 6)

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

// control
const orbitControls = new OrbitControls(camera, renderer.domElement)

// coffee smoke
const loader = new GLTFLoader()
const textureLoader = new TextureLoader()

loader.load('/models/bakedModel.glb', function (gltf) {
  scene.add(gltf.scene.children[0])
})

const perlinTexture = textureLoader.load('/textures/perlin.png')
perlinTexture.wrapS = RepeatWrapping
perlinTexture.wrapT = RepeatWrapping

// smoke
const smokeGeometry = new PlaneGeometry(1, 1, 16, 64)
smokeGeometry.translate(0, 0.5, 0)
smokeGeometry.scale(1.5, 5, 1.5)

const smokeMaterial = new ShaderMaterial({
  side: DoubleSide,
  transparent: true,
  depthWrite: false,
  vertexShader,
  fragmentShader,
  uniforms: {
    uTime: new Uniform(0),
    uPerlinTexture: new Uniform(perlinTexture)
  }
})

const smoke = new Mesh(smokeGeometry, smokeMaterial)
smoke.position.y = 1.83
scene.add(smoke)

function animate() {
  window.requestAnimationFrame(animate)
  renderer.render(scene, camera)
  orbitControls.update()

  smokeMaterial.uniforms.uTime.value = clock.getElapsedTime()
}
animate()
