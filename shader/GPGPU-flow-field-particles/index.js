import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Clock,
  Points,
  BufferGeometry,
  BufferAttribute,
  TextureLoader,
  PlaneGeometry,
  Mesh,
  MeshBasicMaterial,
  ShaderMaterial,
  Uniform,
  Vector3,
  Vector2,
  Raycaster,
} from 'three'
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GPUComputationRenderer } from 'three/examples/jsm/Addons.js'
import GUI from 'lil-gui'
import vertexShader from './vertex.glsl'
import fragmentShader from './fragment.glsl'
import gpgpuParticlesShader from './gpgpu-particles.glsl'

const gui = new GUI()

const scene = new Scene()

const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(8, 4, 8)

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

  // particles
  if (particles)
    particles.material.uniforms.uResolution.value.set(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)
}, false)

// 时钟
const clock = new Clock()

// Control
const orbitControls = new OrbitControls(camera, renderer.domElement)

// Loaders
const textureLoader = new TextureLoader()

/**
 * GPGPU Flow Field Particles
 */
// loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

const gltf = await gltfLoader.loadAsync('/models/boat.glb')
const boat = gltf.scene.children[0]
const simplifiedModel = await gltfLoader.loadAsync('/models/boatSimplified.glb')
const simplifiedBoat = simplifiedModel.scene

// Mouse
const raycaster = new Raycaster()
const cursor = new Vector2()
window.addEventListener('pointermove', function(e) {
  cursor.x = (e.clientX / sizes.width) * 2 - 1
  cursor.y = -(e.clientY / sizes.height) * 2 + 1
})
// 使用简易模型来测试 Raycaster
scene.add(simplifiedBoat)
simplifiedBoat.visible = false

// Base Geometry
const baseGeometry = {}
baseGeometry.instance = boat.geometry
baseGeometry.count = baseGeometry.instance.attributes.position.count
// GPU Compute
// GPUComputationRenderer 内部会创建两个 FrameBufferObject，用来交替读写。这种做法也称为 Ping-Pong Buffers
const gpgpu = {}
// 设置为一个正方形，像素点数量大于 baseGeometry.count
gpgpu.size = Math.ceil(Math.sqrt(baseGeometry.count))
gpgpu.computation = new GPUComputationRenderer(gpgpu.size, gpgpu.size, renderer)

// Base Particles Texture
const baseParticlesTexture = gpgpu.computation.createTexture()
for (let i = 0; i < baseGeometry.count; i++) {
  const i3 = i * 3
  const i4 = i * 4
  const position = baseGeometry.instance.attributes.position.array
  const color = baseParticlesTexture.image.data

  // texture 中每个像素包含 RBGA 四个值，RGB 分别表示粒子的 XYZ 位置，Alpha 表示粒子运动的生命周期
  color[i4 + 0] = position[i3 + 0]
  color[i4 + 1] = position[i3 + 1]
  color[i4 + 2] = position[i3 + 2]
  color[i4 + 3] = Math.random()
}

// 将 texture injected 到 shader 中，获得一个计算变量
gpgpu.particlesVariable = gpgpu.computation.addVariable('uParticles', gpgpuParticlesShader, baseParticlesTexture)

gpgpu.particlesVariable.material.uniforms.uTime = new Uniform(0)
gpgpu.particlesVariable.material.uniforms.uDeltaTime = new Uniform(0)
gpgpu.particlesVariable.material.uniforms.uBase = new Uniform(baseParticlesTexture) // 添加原始 texture 用于还原粒子位置
gpgpu.particlesVariable.material.uniforms.uFlowFieldInfluence = new Uniform(.5)
gpgpu.particlesVariable.material.uniforms.uFlowFieldStrength = new Uniform(10)
gpgpu.particlesVariable.material.uniforms.uFlowFieldFrequency = new Uniform(.2)
gpgpu.particlesVariable.material.uniforms.uCursor = new Uniform(new Vector3(9999, 9999, 9999))


// 将变量自己作为依赖项，将现在的状态发送到下一次计算中，达到数据可持续化的效果
gpgpu.computation.setVariableDependencies(gpgpu.particlesVariable, [gpgpu.particlesVariable])
gpgpu.computation.init()

gpgpu.debug = new Mesh(
  new PlaneGeometry(3, 3),
  new MeshBasicMaterial({
    transparent: true,
    map: gpgpu.computation.getCurrentRenderTarget(gpgpu.particlesVariable).texture
  })
)
gpgpu.debug.visible = false
gpgpu.debug.position.x = 6
scene.add(gpgpu.debug)

// Particles
const particles = {}
const particlesUvArray = new Float32Array(baseGeometry.count * 2)
const sizesArray = new Float32Array(baseGeometry.count)

// 计算在 texture 上每个像素（颜色）映射的 particles（位置）
for (let y = 0; y < gpgpu.size; y++) {
  for (let x = 0; x < gpgpu.size; x++) {
    const i = y * gpgpu.size + x
    const i2 = i * 2

    // 在像素的中心点获取颜色值
    const uvX = (x + .5) / gpgpu.size
    const uvY = (y + .5) / gpgpu.size

    particlesUvArray[i2 + 0] = uvX
    particlesUvArray[i2 + 1] = uvY
    
    sizesArray[i] = Math.random()
  }
}

particles.geometry = new BufferGeometry()
// 只绘制有记录位置的点
particles.geometry.setDrawRange(0, baseGeometry.count)
particles.geometry.setAttribute('aParticlesUv', new BufferAttribute(particlesUvArray, 2))
particles.geometry.setAttribute('aSize', new BufferAttribute(sizesArray, 1))
// 这一操作前，需要先在 blender 中将纹理的颜色写入模型的顶点颜色属性
particles.geometry.setAttribute('aColor', baseGeometry.instance.attributes.color)

particles.material = new ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms:
  {
    uSize: new Uniform(0.05),
    uResolution: new Uniform(new Vector2(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)),
     // 在 GPGPU 中会使用两个 FBO 来交替读写数据，所以没法直接把 texture 写在 Uniform 中，只能在每一帧中获取 texture
    uParticlesTexture: new Uniform()
  }
})
particles.points = new Points(
  particles.geometry,
  particles.material
)
scene.add(particles.points)

/**
 * Tweaks
 */
const guiParameters = {
  clearColor: 0x29191f
}
renderer.setClearColor(guiParameters.clearColor)
gui.addColor(guiParameters, 'clearColor').onChange(() => { renderer.setClearColor(guiParameters.clearColor) })
gui.add(gpgpu.debug, 'visible').name('debugVisible')
gui.add(particles.material.uniforms.uSize, 'value').min(0).max(1).name('uSize')
gui.add(gpgpu.particlesVariable.material.uniforms.uFlowFieldInfluence, 'value').min(0).max(1).name('uFlowFieldInfluence')
gui.add(gpgpu.particlesVariable.material.uniforms.uFlowFieldStrength, 'value').min(0).max(10).name('uFlowFieldStrength')
gui.add(gpgpu.particlesVariable.material.uniforms.uFlowFieldFrequency, 'value').min(0).max(1).name('uFlowFieldFrequency')

function animate() {
  window.requestAnimationFrame(animate)
  renderer.render(scene, camera)
  orbitControls.update()
  const deltaTime = clock.getDelta()
  const elapsedTime = clock.getElapsedTime()

  // GPGPU update
  gpgpu.computation.compute()
  // 获取最新的 texture 赋值给 uParticlesTexture
  particles.material.uniforms.uParticlesTexture.value = gpgpu.computation.getCurrentRenderTarget(gpgpu.particlesVariable).texture
  
  gpgpu.particlesVariable.material.uniforms.uTime.value = elapsedTime
  gpgpu.particlesVariable.material.uniforms.uDeltaTime.value = deltaTime

  // Raycaster
  raycaster.setFromCamera(cursor, camera)
  const intersect = raycaster.intersectObject(simplifiedBoat)
  if (intersect.length) {
    gpgpu.particlesVariable.material.uniforms.uCursor.value.copy(intersect[0].point)
  } else {
    gpgpu.particlesVariable.material.uniforms.uCursor.value.set(9999, 9999, 9999)
  }
}
animate()
