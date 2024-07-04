import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Clock,
  Color,
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
  PCFSoftShadowMap,
  PCFShadowMap,
  ReinhardToneMapping,
  CubeTextureLoader,
  TextureLoader,
  WebGLRenderTarget
} from 'three'
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import GUI from 'lil-gui'
import {
  DotScreenPass,
  EffectComposer,
  GammaCorrectionShader,
  GlitchPass,
  RGBShiftShader,
  RenderPass,
  SMAAPass,
  ShaderPass,
  UnrealBloomPass
} from 'three/addons/Addons.js'
import vertexShader from './vertex.glsl'
import fragmentShader from './fragment.glsl'

const gui = new GUI()

const scene = new Scene()

const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(4, 1, -4)

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
  resolution: new Vector2(window.innerWidth, window.innerHeight)
}
const renderer = new WebGLRenderer({ alpha: false, antialias: true })
renderer.shadowMap.enabled = true
renderer.shadowMap.type = PCFShadowMap
renderer.toneMapping = ReinhardToneMapping
renderer.toneMappingExposure = 1.5
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

  // 更新效果合成器
  effectComposer.setSize(width, height)
  effectComposer.setPixelRatio(pixelRatio)
}, false)

// 时钟
const clock = new Clock()

// Control
const orbitControls = new OrbitControls(camera, renderer.domElement)
orbitControls.enableDamping = true

// Loaders
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)
const cubeTextureLoader = new CubeTextureLoader()
const textureLoader = new TextureLoader()

/**
 * Post-processing
 */
// Update all materials
const updateAllMaterials = () => {
  scene.traverse((child) => {
    if (child instanceof Mesh && child.material instanceof MeshStandardMaterial) {
      child.material.envMapIntensity = 2.5
      child.material.needsUpdate = true
      child.castShadow = true
      child.receiveShadow = true
    }
  })
}

// Environment map
const environmentMap = cubeTextureLoader.load([
  '/textures/envmaps/0/px.jpg',
  '/textures/envmaps/0/nx.jpg',
  '/textures/envmaps/0/py.jpg',
  '/textures/envmaps/0/ny.jpg',
  '/textures/envmaps/0/pz.jpg',
  '/textures/envmaps/0/nz.jpg'
])
scene.background = environmentMap
scene.environment = environmentMap

// Models
gltfLoader.load(
  '/models/DamagedHelmet/DamagedHelmet.gltf',
  (gltf) => {
    gltf.scene.scale.set(2, 2, 2)
    gltf.scene.rotation.y = Math.PI * 0.5
    scene.add(gltf.scene)

    updateAllMaterials()
  }
)

// Lights
const directionalLight = new DirectionalLight('#ffffff', 3)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.normalBias = 0.05
directionalLight.position.set(0.25, 3, - 2.25)
scene.add(directionalLight)

// Post Processing
const renderTarget = new WebGLRenderTarget(
  800,
  600,
  {
    // 当 PixelRatio 不为 1 时，可能会导致画面出现锯齿。通过自定义 renderTarget 增加采样点来消除锯齿。
    samples: renderer.getPixelRatio() === 1 ? 2 : 0
  }
)

const effectComposer = new EffectComposer(renderer, renderTarget)
effectComposer.setPixelRatio(sizes.pixelRatio)
effectComposer.setSize(sizes.width, sizes.height)

const renderPass = new RenderPass(scene, camera) // 创建一个渲染通道 renderPass
effectComposer.addPass(renderPass) // 将 renderPass 添加到 effectComposer 中

// 点屏通道
const dotScreenPass = new DotScreenPass()
dotScreenPass.enabled = false
effectComposer.addPass(dotScreenPass)

// 故障通道
const glitchPass = new GlitchPass()
glitchPass.goWild = false
glitchPass.enabled = true
effectComposer.addPass(glitchPass)

// RGB 偏移通道
const rbgShiftPass = new ShaderPass(RGBShiftShader)
rbgShiftPass.enabled = true
effectComposer.addPass(rbgShiftPass)

// 虚幻光晕通道
const unrealBloomPass = new UnrealBloomPass()
unrealBloomPass.strength = 0.3
unrealBloomPass.radius = 1
unrealBloomPass.threshold = 0.6
unrealBloomPass.enabled = false
effectComposer.addPass(unrealBloomPass)

// 自定义通道
const shader = {
  uniforms: {
    tDiffuse: { value: null },
    uNormalMap: { value: null }
  },
  vertexShader,
  fragmentShader
}
const customPass = new ShaderPass(shader)
customPass.material.uniforms.uNormalMap.value = textureLoader.load('/textures/interfaceNormalMap.png')
effectComposer.addPass(customPass)

// 伽马校正通道（通常最后添加）
const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader)
gammaCorrectionPass.enabled = true
effectComposer.addPass(gammaCorrectionPass)

// 子像素形态学抗锯齿通道（最后添加）
if (renderer.getPixelRatio() === 1 && !renderer.capabilities.isWebGL2) { // 如果用户设备不支持 webgl2，又需要处理画面锯齿，可以使用抗锯齿通道（对性能影响较大）
  const smaaPass = new SMAAPass()
  effectComposer.addPass(smaaPass)

  console.log('Using SMAA')
}

function animate() {
  const deltaTime = clock.getDelta()
  const elapsedTime = clock.getElapsedTime()
  orbitControls.update()

  // renderer.render(scene, camera)
  effectComposer.render() // 使用 effectComposer 代替 renderer 进行渲染

  window.requestAnimationFrame(animate)
}
animate()
