import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Clock,
  Color,
  AdditiveBlending,
  DirectionalLight,
  ShaderMaterial,
  DoubleSide,
  Uniform,
} from 'three'
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import GUI from 'lil-gui'
import vertexShader from './vertex.glsl'
import fragmentShader from './fragment.glsl'

const gui = new GUI()
gui.domElement.addEventListener('mousedown', function (e) {
  e.stopPropagation()
}, false)

const scene = new Scene()

const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(0, 2, 2)

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

// light
const directionalLight = new DirectionalLight(0xffddcc, 2)
scene.add(directionalLight)

// hologram
const loader = new GLTFLoader()
const materialParams = { color: '#3aa8df' }

let suzanne
const material = new ShaderMaterial({
  transparent: true,
  depthWrite: false,
  side: DoubleSide,
  blending: AdditiveBlending,
  vertexShader,
  fragmentShader,
  uniforms: {
    uTime: new Uniform(0),
    uColor: new Uniform(new Color(materialParams.color))
  }
})

gui.addColor(materialParams, 'color').onChange((value) => {
  material.uniforms.uColor.value.set(value)
})

loader.load('/models/suzanne.glb', (gltf) => {
  suzanne = gltf.scene.children[0]
  suzanne.material = material
  scene.add(suzanne)
})

function animate() {
  window.requestAnimationFrame(animate)
  renderer.render(scene, camera)
  orbitControls.update()

  material.uniforms.uTime.value = clock.getElapsedTime()
}
animate()
