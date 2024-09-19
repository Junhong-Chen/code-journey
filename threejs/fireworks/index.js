import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Clock,
  Color,
  Points,
  AdditiveBlending,
  BufferGeometry,
  BufferAttribute,
  TextureLoader,
  ShaderMaterial,
  Uniform,
  Vector3,
  Vector2,
  Spherical,
} from 'three'
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import gsap from 'gsap'
import vertexShader from './vertex.glsl'
import fragmentShader from './fragment.glsl'

function random (min, max) {
  return min + Math.random() * (max - min)
}

function remap(value, low1, high1, low2, high2) {
  return low2 + (high2 - low2) * (value - low1) / (high1 - low1)
}

// 计算鼠标对应场景的位置
function calcPosition(mouse, camera) {
  const height = Math.tan(camera.fov / 2 / 180 * Math.PI) * camera.position.length()
  const width = height * camera.aspect
  const position = new Vector3(remap(mouse.x, -1, 1, -width, width), remap(mouse.y, -1, 1, -height, height), 0)
  position.applyEuler(camera.rotation)
  return position
}

const scene = new Scene()

const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(0, 0, 2)

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

  const { width, height, pixelRatio } = sizes

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

// Fireworks
const textureLoader = new TextureLoader()
const textures = [
  textureLoader.load('/textures/particles/1.png'),
  textureLoader.load('/textures/particles/2.png'),
  textureLoader.load('/textures/particles/3.png'),
  textureLoader.load('/textures/particles/4.png'),
  textureLoader.load('/textures/particles/5.png'),
  textureLoader.load('/textures/particles/6.png'),
]

function crateFireworks({
  count,
  position,
  size,
  texture,
  colors,
  radius
}) {
  texture.flipY = false // invert texture

  const positionsArray = new Float32Array(count * 3)
  const sizesArray = new Float32Array(count)
  const timeMultiplierArray = new Float32Array(count)
  const colorRandomness = new Float32Array(count)
  const spherePosition = new Vector3()
  
  for (let i = 0; i < count; i++) {
    const j = i * 3
    const spherical = new Spherical(
      radius * Math.pow(Math.random(), 0.1),
      Math.random() * Math.PI,
      Math.random() * Math.PI * 2
    )
    spherePosition.setFromSpherical(spherical)

    positionsArray[j + 0] = spherePosition.x
    positionsArray[j + 1] = spherePosition.y
    positionsArray[j + 2] = spherePosition.z

    sizesArray[i] = .5 + Math.random() * .5
    timeMultiplierArray[i] = 1 + Math.random()
    colorRandomness[i] = ~~random(0, 3)
  }

  const geometry = new BufferGeometry()
  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uSize: new Uniform(size),
      uPixelRatio: new Uniform(sizes.pixelRatio),
      uResolution: new Uniform(sizes.resolution),
      uTexture: new Uniform(texture),
      uColors: new Uniform(colors),
      uProgress: new Uniform(0),
    }
  })

  geometry.setAttribute('position', new BufferAttribute(positionsArray, 3))
  geometry.setAttribute('aSize', new BufferAttribute(sizesArray, 1))
  geometry.setAttribute('aTimeMultiplier', new BufferAttribute(timeMultiplierArray, 1))
  geometry.setAttribute('aColorRandomness', new BufferAttribute(colorRandomness, 1))

  const fireworks = new Points(
    geometry,
    material
  )
  fireworks.position.copy(position)
  scene.add(fireworks)

  gsap.to(
    material.uniforms.uProgress,
    {
      value: 1,
      duration: 3,
      ease: 'linear',
      onComplete: function() {
        scene.remove(fireworks)
        geometry.dispose()
        material.dispose()
      }
    }
  )
}

window.addEventListener('click', function(e) {
  const mouse = new Vector2()
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
  const position = calcPosition(mouse, camera)
  const count = ~~random(250, 500)
  const size = random(.04, .08)
  const texture = textures[~~random(0, 6)]
  const colors = []
  colors.push(new Color('#f7f7c7'))
  colors.push(new Color().setHSL(Math.random(), 1, 0.7))
  colors.push(colors[0].clone().lerp(colors[1], 0.5))

  crateFireworks({
    count,
    position,
    size,
    texture,
    colors,
    radius: 1,
  })
}, false)

function animate() {
  window.requestAnimationFrame(animate)
  renderer.render(scene, camera)
  orbitControls.update()
}
animate()
