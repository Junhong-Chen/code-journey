import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Clock,
  Color,
  PlaneGeometry,
  Mesh,
  MeshBasicMaterial,
  ShaderMaterial,
  DoubleSide,
  Uniform,
  SphereGeometry,
  Vector2,
  TorusKnotGeometry,
  IcosahedronGeometry
} from 'three'
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import GUI from 'lil-gui'
import vertexShader from './vertex.glsl'
import fragmentShader from './fragment.glsl'

const gui = new GUI()

const scene = new Scene()

const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(2, 3, 4)

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
orbitControls.enablePan = false

// Lights Shading
const guiParameters = {
  color: new Color('white'),
  directionalLightColor: new Color(0x2222ff),
  pointLightColor: new Color(0xff2277)
}

gui.addColor(guiParameters, 'color').name('color').onChange(function(value) {
  guiParameters.color.set(value)
})
gui.addColor(guiParameters, 'directionalLightColor').name('directionalLightColor').onChange(function(value) {
  guiParameters.directionalLightColor.set(value)
  directionalLightHelper.material.color.set(value)
})
gui.addColor(guiParameters, 'pointLightColor').name('pointLightColor').onChange(function(value) {
  guiParameters.pointLightColor.set(value)
  pointLightHelper.material.color.set(value)
})

// Light Helper
const directionalLightHelper = new Mesh(
  new PlaneGeometry(),
  new MeshBasicMaterial({
    color: guiParameters.directionalLightColor,
    side: DoubleSide
  })
)
directionalLightHelper.position.set(0, 0, 3)
scene.add(directionalLightHelper)

const pointLightHelper = new Mesh(
  new IcosahedronGeometry(0.1, 2),
  new MeshBasicMaterial({
    color: guiParameters.pointLightColor,
  })
)
pointLightHelper.position.set(0, 3, 0)
scene.add(pointLightHelper)

const loader = new GLTFLoader()
const material = new ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uColor: new Uniform(guiParameters.color),
    uDirectionalLightColor: new Uniform(guiParameters.directionalLightColor),
    uPointLightColor: new Uniform(guiParameters.pointLightColor),
    uDirectionalLightPosition: new Uniform(directionalLightHelper.position),
    uPointLightPosition: new Uniform(pointLightHelper.position),
  }
})
let suzane
const sphere = new Mesh(
  new SphereGeometry(),
  material
)
sphere.position.x = -3
const torusKnot = new Mesh(
  new TorusKnotGeometry(0.56, 0.25, 128, 16),
  material
)
torusKnot.position.x = 3
scene.add(sphere, torusKnot)

loader.load('/models/suzanne.glb', function(gltf) {
  suzane = gltf.scene.children[0]
  suzane.material = material
  scene.add(suzane)
})

function animate() {
  window.requestAnimationFrame(animate)
  renderer.render(scene, camera)
  orbitControls.update()
  const elapseTime = clock.getElapsedTime()

  if (suzane) {
    suzane.rotation.x += 0.005
    suzane.rotation.y += 0.01
  }
  sphere.rotation.x += 0.005
  sphere.rotation.y += 0.01
  torusKnot.rotation.x += 0.005
  torusKnot.rotation.y += 0.01

  pointLightHelper.position.z = Math.sin(elapseTime) * 3
  pointLightHelper.position.y = Math.cos(elapseTime) * 3
  directionalLightHelper.position.x = pointLightHelper.position.z * 2
  directionalLightHelper.position.z = pointLightHelper.position.y * 2
  directionalLightHelper.lookAt(0, 0, 0);
}
animate()
