import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Clock,
  Vector2,
  ACESFilmicToneMapping,
  PCFSoftShadowMap,
  DirectionalLight,
  EquirectangularReflectionMapping,
  IcosahedronGeometry,
  MeshPhysicalMaterial,
  Mesh,
  BoxGeometry,
  MeshStandardMaterial,
  PlaneGeometry,
  Uniform,
  MeshDepthMaterial,
  RGBADepthPacking,
  Color,
} from 'three'
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg'
import GUI from 'lil-gui' 
import vertexShader from './vertex.glsl'
import fragmentShader from './fragment.glsl'

const gui = new GUI()
const guiParams = {}
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
  resolution: new Vector2(window.innerWidth, window.innerHeight)
}

// Scene
const scene = new Scene()

// Camera
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(-10, 6, -2)

// Renderer
const renderer = new WebGLRenderer({ alpha: false, antialias: true })
renderer.shadowMap.enabled = true
renderer.shadowMap.type = PCFSoftShadowMap
renderer.toneMapping = ACESFilmicToneMapping
renderer.toneMappingExposure = 1
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(sizes.pixelRatio)
document.body.appendChild(renderer.domElement)

// 窗口自适应
window.addEventListener('resize', function () {
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight
  sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)
  sizes.resolution.set(window.innerWidth, window.innerHeight)

  const { width, height, pixelRatio } = sizes

  renderer.setSize(width, height)
  renderer.setPixelRatio(pixelRatio)

  camera.aspect = width / height
  camera.updateProjectionMatrix()
}, false)


// Control
const orbitControls = new OrbitControls(camera, renderer.domElement)

// Loaders
const rgbeLoader = new RGBELoader()

// Environment map
rgbeLoader.load('/hdr/spruit_sunrise.hdr', (environmentMap) => {
  environmentMap.mapping = EquirectangularReflectionMapping

  scene.background = environmentMap
  scene.backgroundBlurriness = 0.5
  scene.environment = environmentMap
})

/**
 * Procedural Terrain
 */
// Board
const boardFill = new Brush(new BoxGeometry(11, 2, 11))
const boardHole = new Brush(new BoxGeometry(10, 2.1, 10))
const evaluator = new Evaluator()
const board = evaluator.evaluate(boardFill, boardHole, SUBTRACTION)
board.geometry.clearGroups()
board.material = new MeshStandardMaterial({
  color: 'white',
  metalness: 0,
  roughness: 0
})
board.castShadow = true
board.receiveShadow = true
scene.add(board)

// Terrain
const geometry = new PlaneGeometry(10, 10, 500, 500)
// 删除不用的属性，减少显存开销
geometry.deleteAttribute('uv')
geometry.deleteAttribute('normal')
geometry.rotateX(-Math.PI * .5)

guiParams.uColorWaterDeep = 0x002b3d
guiParams.uColorWaterSurface = 0x66a8ff
guiParams.uColorSand = 0xffe894
guiParams.uColorGrass = 0x85d534
guiParams.uColorRock = 0xa6bb81
guiParams.uColorSnow = 0xffffff
const uniforms = {
  uPositionFrequency: new Uniform(.2),
  uStrength: new Uniform(2),
  uWarpFrequency: new Uniform(5),
  uWarpStrength: new Uniform(.5),
  uTime: new Uniform(0),
  uColorWaterDeep: new Uniform(new Color(guiParams.uColorWaterDeep)),
  uColorWaterSurface: new Uniform(new Color(guiParams.uColorWaterSurface)),
  uColorSand: new Uniform(new Color(guiParams.uColorSand)),
  uColorGrass: new Uniform(new Color(guiParams.uColorGrass)),
  uColorRock: new Uniform(new Color(guiParams.uColorRock)),
  uColorSnow: new Uniform(new Color(guiParams.uColorSnow)),
}
gui.add(uniforms.uPositionFrequency, 'value', 0, 1).name('uPositionFrequency')
gui.add(uniforms.uStrength, 'value', 0, 10).name('uStrength')
gui.add(uniforms.uWarpFrequency, 'value', 0, 10).name('uWarpFrequency')
gui.add(uniforms.uWarpStrength, 'value', 0, 1).name('uWarpStrength')
gui.addColor(guiParams, 'uColorWaterDeep').onChange(value => uniforms.uColorWaterDeep.value.set(value))
gui.addColor(guiParams, 'uColorWaterSurface').onChange(value => uniforms.uColorWaterSurface.value.set(value))
gui.addColor(guiParams, 'uColorSand').onChange(value => uniforms.uColorSand.value.set(value))
gui.addColor(guiParams, 'uColorGrass').onChange(value => uniforms.uColorGrass.value.set(value))
gui.addColor(guiParams, 'uColorRock').onChange(value => uniforms.uColorRock.value.set(value))
gui.addColor(guiParams, 'uColorSnow').onChange(value => uniforms.uColorSnow.value.set(value))


const material = new CustomShaderMaterial({
  // CSM
  baseMaterial: MeshStandardMaterial,
  vertexShader,
  fragmentShader,
  uniforms,
  silent: true,

  // MeshStandardMaterial
  metalness: 0,
  roughness: .5,
  color: 0x85d534
})

const depthMaterial = new CustomShaderMaterial({
  // CSM
  baseMaterial: MeshDepthMaterial,
  vertexShader,
  fragmentShader,
  uniforms,
  silent: true,

  // MeshDepthMaterial
  depthPacking: RGBADepthPacking
})

const terrain = new Mesh(geometry, material)
terrain.customDepthMaterial = depthMaterial
terrain.castShadow = true
terrain.receiveShadow = true
scene.add(terrain)

// Water Surface
const waterSurface = new Mesh(
  new PlaneGeometry(10, 10, 1, 1),
  new MeshPhysicalMaterial({
    transmission: 1,
    roughness: .25
  })
)
waterSurface.rotateX(-Math.PI * .5)
waterSurface.position.y = -.1
scene.add(waterSurface)

// Lights
const directionalLight = new DirectionalLight('#ffffff', 2)
directionalLight.position.set(6.25, 3, 4)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.near = 0.1
directionalLight.shadow.camera.far = 30
directionalLight.shadow.camera.top = 8
directionalLight.shadow.camera.right = 8
directionalLight.shadow.camera.bottom = -8
directionalLight.shadow.camera.left = -8
scene.add(directionalLight)

// Animate
const clock = new Clock()
const animate = () => {
  const deltaTime = clock.getDelta()
  const elapsedTime = clock.getElapsedTime()

  uniforms.uTime.value = elapsedTime;

  // Update controls
  orbitControls.update()

  // Render
  renderer.render(scene, camera)

  // Call animate again on the next frame
  window.requestAnimationFrame(animate)
}
animate()
