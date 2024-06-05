import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Clock,
  Color,
  TextureLoader,
  DirectionalLight,
  PlaneGeometry,
  MeshStandardMaterial,
  Mesh,
  MeshDepthMaterial,
  RGBADepthPacking,
  Uniform,
  Vector2,
  ACESFilmicToneMapping,
  EquirectangularReflectionMapping,
  MeshPhysicalMaterial,
  PCFSoftShadowMap
} from 'three'
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import GUI from 'lil-gui'
import threeCustomShaderMaterial from 'three-custom-shader-material/vanilla'
import vertexShader from './vertex.glsl'
import fragmentShader from './fragment.glsl'

const gui = new GUI()

const scene = new Scene()

const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(4, 3, -8)

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
  resolution: new Vector2(window.innerWidth, window.innerHeight)
}
const renderer = new WebGLRenderer({ alpha: false, antialias: true })
renderer.toneMapping = ACESFilmicToneMapping
renderer.toneMappingExposure = 1
renderer.shadowMap.enabled = true
renderer.shadowMap.type = PCFSoftShadowMap
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

// Control
const orbitControls = new OrbitControls(camera, renderer.domElement)

// Loaders
const textureLoader = new TextureLoader()

/**
 * Wobbly Sphere
 */
// Loader 
const rgbeLoader = new RGBELoader()
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('./draco/')
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

// Environment map
rgbeLoader.load('/hdr/urban_alley_01_1k.hdr', function(map) {
  map.mapping = EquirectangularReflectionMapping

  scene.background = map
  scene.environment = map
})

const colors = {
  colorA: 0x0000ff,
  colorB: 0xff0000
}
const uniforms = {
  uTime: new Uniform(0),
  uPositionFrequency: new Uniform(.3),
  uTimeFrequency: new Uniform(.3),
  uStrength: new Uniform(.3),
  uWarpedPositionFrequency: new Uniform(.3),
  uWarpedTimeFrequency: new Uniform(.1),
  uWarpedStrength: new Uniform(1.6),
  uColorA: new Uniform(new Color(colors.colorA)),
  uColorB: new Uniform(new Color(colors.colorB)),
}

// Material
const material = new threeCustomShaderMaterial({
  baseMaterial: MeshPhysicalMaterial,
  vertexShader,
  fragmentShader,
  uniforms,
  metalness: 0,
  roughness: .5,
  color: 'white',
  transmission: 0,
  ior: 1.5,
  thickness: 1.5,
  transparent: true,
  wireframe: false,
})

const depthMaterial = new threeCustomShaderMaterial({
  baseMaterial: MeshDepthMaterial,
  vertexShader,
  uniforms,
  silent: true,
  depthPacking: RGBADepthPacking
})

// Geometry
// let geometry = new IcosahedronGeometry(2.5, 50)
// 合并几何体中重复的顶点
// geometry = mergeVertices(geometry)
// geometry.computeTangents()

// Mesh
// const wobble = new Mesh(geometry, material)
// wobble.customDepthMaterial = depthMaterial
// wobble.receiveShadow = true
// wobble.castShadow = true
// scene.add(wobble)

// Model
gltfLoader.load('/models/suzanne-t.glb', (gltf) => { // 模型需要包含切线（tangent）数据
  const wobble = gltf.scene.children[0]
  wobble.receiveShadow = true
  wobble.castShadow = true
  wobble.material = material
  wobble.customDepthMaterial = depthMaterial

  scene.add(wobble)
})

// Plane
const plane = new Mesh(
  new PlaneGeometry(15, 15, 15),
  new MeshStandardMaterial()
)
plane.receiveShadow = true
plane.rotation.y = Math.PI
plane.position.y = - 5
plane.position.z = 5
scene.add(plane)

// Light
const directionalLight = new DirectionalLight('white', 3)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.normalBias = 0.05
directionalLight.position.set(0.25, 2, - 2.25)
scene.add(directionalLight)

// Tweaks
gui.add(uniforms.uPositionFrequency, 'value', 0, 2).name('uPositionFrequency')
gui.add(uniforms.uTimeFrequency, 'value', 0, 2).name('uTimeFrequency')
gui.add(uniforms.uStrength, 'value', 0, 2).name('uStrength')
gui.add(uniforms.uWarpedPositionFrequency, 'value', 0, 2).name('uWarpedPositionFrequency')
gui.add(uniforms.uWarpedTimeFrequency, 'value', 0, 2).name('uWarpedTimeFrequency')
gui.add(uniforms.uWarpedStrength, 'value', 0, 2).name('uWarpedStrength')
gui.addColor(colors, 'colorA').onChange((value) => { uniforms.uColorA.value.set(value) })
gui.addColor(colors, 'colorB').onChange((value) => { uniforms.uColorB.value.set(value) })

gui.add(material, 'metalness', 0, 1)
gui.add(material, 'roughness', 0, 1)
gui.add(material, 'transmission', 0, 1)
gui.add(material, 'ior', 0, 10)
gui.add(material, 'thickness', 0, 10)
gui.addColor(material, 'color')

function animate() {
  window.requestAnimationFrame(animate)
  renderer.render(scene, camera)
  orbitControls.update()
  const deltaTime = clock.getDelta()
  const elapsedTime = clock.getElapsedTime()

  uniforms.uTime.value = elapsedTime
}
animate()
