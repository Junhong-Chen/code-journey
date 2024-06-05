import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Clock,
  Color,
  Mesh,
  ShaderMaterial,
  Uniform,
  SphereGeometry,
  Vector3,
  Vector2,
  TorusKnotGeometry,
  ACESFilmicToneMapping,
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

  material.uniforms.uResolution.value.set(sizes.width * sizes.pixelRatio, sizes.height * pixelRatio) 
}, false)

// 时钟
const clock = new Clock()

// Control
const orbitControls = new OrbitControls(camera, renderer.domElement)

// Halftone Shading
const guiParameters = {
  color: 0x2222ff,
  directionalLightColor: 0x66ff66,
  pointLightColor: 0xff2277,
  repetitions: 20,
}

const loader = new GLTFLoader()
const material = new ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uColor: new Uniform(new Color(guiParameters.color)),
    uDirectionalLightColor: new Uniform(new Color(guiParameters.directionalLightColor)),
    uPointColor: new Uniform(new Color(guiParameters.pointLightColor)),
    uDirectionalLightPosition: new Uniform(new Vector3(1, 1, 0)),
    uResolution: new Uniform(new Vector2(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)),
    uRepetitions: new Uniform(guiParameters.repetitions)
  }
})

gui.addColor(guiParameters, 'color').onChange(function(value) {
  material.uniforms.uColor.value.set(value)
})
gui.addColor(guiParameters, 'directionalLightColor').onChange(function(value) {
  material.uniforms.uDirectionalLightColor.value.set(value)
})
gui.addColor(guiParameters, 'pointLightColor').onChange(function(value) {
  material.uniforms.uPointColor.value.set(value)
})
gui.add(material.uniforms.uRepetitions, 'value').name('repetitions').min(1).max(300).step(1)

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
}
animate()
