import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Clock,
  PlaneGeometry,
  Mesh,
  Vector2,
  ACESFilmicToneMapping,
  PCFSoftShadowMap,
  MeshStandardMaterial,
  Vector3,
  DirectionalLight,
  EquirectangularReflectionMapping,
  Uniform,
  DoubleSide,
  MeshDepthMaterial,
  RGBADepthPacking,
} from 'three'
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import GUI from 'lil-gui'
import vertexShader from './vertex.glsl'
import fragmentShader from './fragment.glsl'

const gui = new GUI()
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
camera.position.set(-5, 5, 12)

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
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

// Environment map
rgbeLoader.load('/hdr/aerodynamics_workshop.hdr', (environmentMap) => {
  environmentMap.mapping = EquirectangularReflectionMapping

  scene.background = environmentMap
  scene.backgroundBlurriness = 0.5
  scene.environment = environmentMap
})

/**
 * Silced Model
 */
// Model
let model = null
gltfLoader.load('/models/gears.glb', function(gltf) {
  model = gltf.scene

  model.traverse((child) => {
    if (child.isMesh) {
      if (child.name === 'outerHull') {
        child.material = customShaderMaterial
        child.customDepthMaterial = customDepthMaterial
      } else {
        child.material = material
      }
      child.castShadow = true
      child.receiveShadow = true
    }
  })

  scene.add(model)
})

// Material
const material = new MeshStandardMaterial({
  metalness: 0.5,
  roughness: 0.25,
  envMapIntensity: 0.5,
  color: '#858080'
})

const uniforms = {
  uSliceStart: new Uniform(1),
  uSliceArc: new Uniform(1.5)
}
gui.add(uniforms.uSliceStart, 'value', -Math.PI, Math.PI).name('uSliceStart')
gui.add(uniforms.uSliceArc, 'value', 0, 2 * Math.PI).name('uSliceArc')

const patchMap = {
  csm_Slice: { // 直接在 CustomShaderMaterial.fragmentShader 中修改 csm_FragColor 会导致模型默认使用传入的 color 值渲染，而不是 MeshStandardMaterial 材质的颜色
    '#include <colorspace_fragment>': `
      #include <colorspace_fragment>
      if (!gl_FrontFacing) // 判断当前片段是否属于正面还是背面
        gl_FragColor = vec4(.75, .15, .3, 1.);
    `
  }
}

const customShaderMaterial = new CustomShaderMaterial({
  // CSM
  baseMaterial: MeshStandardMaterial,
  vertexShader,
  fragmentShader,
  uniforms,
  patchMap,
  silent: true,

  // MeshStandardMaterial
  metalness: 0.5,
  roughness: 0.25,
  envMapIntensity: 0.5,
  color: '#858080',
  side: DoubleSide
})

const customDepthMaterial = new CustomShaderMaterial({
  // CSM
  baseMaterial: MeshDepthMaterial,
  vertexShader,
  fragmentShader,
  uniforms,
  patchMap,
  silent: true,

  // MeshDepthMaterial
  depthPacking: RGBADepthPacking
})

// Plane
const plane = new Mesh(
  new PlaneGeometry(10, 10, 10),
  new MeshStandardMaterial({ color: '#aaaaaa' })
)
plane.receiveShadow = true
plane.position.x = - 4
plane.position.y = - 3
plane.position.z = - 4
plane.lookAt(new Vector3(0, 0, 0))
scene.add(plane)

// Lights
const directionalLight = new DirectionalLight('#ffffff', 4)
directionalLight.position.set(6.25, 3, 4)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.near = 0.1
directionalLight.shadow.camera.far = 30
directionalLight.shadow.normalBias = 0.05
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

  if (model) {
    model.rotation.y = elapsedTime * .1
  }

  // Update controls
  orbitControls.update()

  // Render
  renderer.render(scene, camera)

  // Call animate again on the next frame
  window.requestAnimationFrame(animate)
}
animate()
