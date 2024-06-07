import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Clock,
  Color,
  Points,
  AdditiveBlending,
  BufferGeometry,
  TextureLoader,
  ShaderMaterial,
  Uniform,
  Vector2,
  Float32BufferAttribute
} from 'three'
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import GUI from 'lil-gui'
import gsap from 'gsap'
import vertexShader from './vertex.glsl'
import fragmentShader from './fragment.glsl'

const gui = new GUI()

const scene = new Scene()

const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(0, 0, 8)

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
 * Particles Morphing
 */
// loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

const guiParameters = {
  clearColor: 0x160920,
  progress: 0,
  colorA: 0xff7300,
  colorB: 0x0091ff
}

let particles

gltfLoader.load('/models/particlesModels.glb', function(gltf) {
  particles = {}
  particles.countMax = 0
  particles.index = 0
  const positions = gltf.scene.children.map(child => {
    const position = child.geometry.attributes.position
    if (position.count > particles.countMax) particles.countMax = position.count
    return position
  })

  particles.positions = []
  const array = new Float32Array(particles.countMax * 3)
  const sizeArray = new Float32Array(particles.countMax)
  for (const position of positions) {
    for (let i = 0; i < particles.countMax; i++) {
      const j = i * 3
      if (i < position.count) {
        array[j + 0] = position.array[j + 0]
        array[j + 1] = position.array[j + 1]
        array[j + 2] = position.array[j + 2]
      } else {
        const _j = Math.floor(Math.random() * position.count) * 3
        array[j + 0] = position.array[_j + 0]
        array[j + 1] = position.array[_j + 1]
        array[j + 2] = position.array[_j + 2]
      }
    }
    particles.positions.push(new Float32BufferAttribute(array, 3))
  }
  
  for (let i = 0; i < particles.countMax; i++) {
    sizeArray[i] = Math.random()
  }

  particles.geometry = new BufferGeometry()
  particles.geometry.setAttribute('position', particles.positions[particles.index])
  particles.geometry.setAttribute('aSize', new Float32BufferAttribute(sizeArray, 1))
  
  particles.material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms:
    {
      uSize: new Uniform(0.1),
      uResolution: new Uniform(new Vector2(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)),
      uProgress: new Uniform(guiParameters.progress),
      uColorA: new Uniform(new Color(guiParameters.colorA)),
      uColorB: new Uniform(new Color(guiParameters.colorB)),
    },
    depthWrite: false,
    transparent: true,
    blending: AdditiveBlending
  })
  particles.points = new Points(particles.geometry, particles.material)
  particles.points.frustumCulled = false // 不检测物体是否在相机可视范围内
  scene.add(particles.points)
  
  particles.morph = function(index) {
    particles.geometry.attributes.position = particles.positions[particles.index]
    particles.geometry.attributes.aPositionTarget = particles.positions[index]
    // 这里是两个 geometry 交换变换，并不好同时计算两个 geometry 的 bounding，所以使用 frustumCulled = false 更方便
    // particles.geometry.computeBoundingBox()
    // particles.geometry.computeBoundingSphere()
    particles.index = index

    gsap.fromTo(
      particles.material.uniforms.uProgress,
      { value: 0 },
      { value: 1, duration: 3, ease: 'linear' }
    )
  }
  particles.morph0 = () => particles.morph(0)
  particles.morph1 = () => particles.morph(1)
  particles.morph2 = () => particles.morph(2)
  particles.morph3 = () => particles.morph(3)

  gui.add(particles.material.uniforms.uProgress, 'value').name('progress').min(0).max(1).step(.001).listen()
  gui.add(particles, 'morph0')
  gui.add(particles, 'morph1')
  gui.add(particles, 'morph2')
  gui.add(particles, 'morph3')

  gui.addColor(guiParameters, 'colorA').onChange((value) => {
    particles.material.uniforms.uColorA.value.set(value)
  })
  gui.addColor(guiParameters, 'colorB').onChange((value) => {
    particles.material.uniforms.uColorB.value.set(value)
  })
})

gui.addColor(guiParameters, 'clearColor').onChange(() => {
  renderer.setClearColor(guiParameters.clearColor)
})
renderer.setClearColor(guiParameters.clearColor)

function animate() {
  window.requestAnimationFrame(animate)
  renderer.render(scene, camera)
  orbitControls.update()
}
animate()
