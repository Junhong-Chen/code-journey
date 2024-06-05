import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Clock,
  Color,
  TextureLoader,
  SRGBColorSpace,
  Mesh,
  ShaderMaterial,
  Uniform,
  SphereGeometry,
  Vector3,
  Vector2,
  Spherical,
  BackSide,
  ACESFilmicToneMapping,
  Group,
} from 'three'
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { Lensflare, LensflareElement } from 'three/addons/objects/Lensflare.js'
import GUI from 'lil-gui'
import vertexShader from './vertex.glsl'
import fragmentShader from './fragment.glsl'
import atmosphereVertexShader from './atmosphereVertex.glsl'
import atmosphereFragmentShader from './atmosphereFragment.glsl'

const gui = new GUI()

const scene = new Scene()

const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(0, 0, 6)

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
}, false)

// 时钟
const clock = new Clock()

// Control
const orbitControls = new OrbitControls(camera, renderer.domElement)

// Loaders
const textureLoader = new TextureLoader()
const textureDay = textureLoader.load('/textures/earthDay.jpg')
const textureNight = textureLoader.load('/textures/earthNight.jpg')
const specularCloudsTexture = textureLoader.load('/textures/earthSpecularClouds.jpg')
const textureSun = textureLoader.load('/textures/sun.png')
const textureFlare = textureLoader.load('/textures/lensflare.png')
// Color Space
textureDay.colorSpace = SRGBColorSpace
textureNight.colorSpace = SRGBColorSpace
// Anisotropy Filtering
textureDay.anisotropy = 8
textureNight.anisotropy = 8
specularCloudsTexture.anisotropy = 8

// Sun
const sunSpherical = new Spherical(1, Math.PI / 2, -Math.PI / 2)
const sunDirection = new Vector3(-1, 0, 0)

// Earth
const earthParameters = {
  atmosphereDayColor: 0x00aaff,
  atmosphereTwilightColor: 0xff6600
}
const earthGeometry = new SphereGeometry(2, 64, 64)
const earthMaterial = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms:
    {
      uTextureDay: new Uniform(textureDay),
      uTextureNight: new Uniform(textureNight),
      uSpecularCloudsTexture: new Uniform(specularCloudsTexture),
      uSunDirection: new Uniform(sunDirection),
      uAtmosphereDayColor: new Uniform(new Color(earthParameters.atmosphereDayColor)),
      uAtmosphereTwilightColor: new Uniform(new Color(earthParameters.atmosphereTwilightColor))
    }
})
const earth = new Mesh(earthGeometry, earthMaterial)
scene.add(earth)

// Atmosphere
const atmosphereMaterial = new ShaderMaterial({
  vertexShader: atmosphereVertexShader,
  fragmentShader: atmosphereFragmentShader,
  uniforms:
  {
    uSunDirection: new Uniform(sunDirection),
    uAtmosphereDayColor: new Uniform(new Color(earthParameters.atmosphereDayColor)),
    uAtmosphereTwilightColor: new Uniform(new Color(earthParameters.atmosphereTwilightColor))
  },
  side: BackSide, // 展示球体的内面，因为 earth 被 atmosphere 包裹，所以在视觉上实现了 earth 遮挡 atmosphere 的效果
  transparent: true
})
const atmosphere = new Mesh(
  earthGeometry,
  atmosphereMaterial
)
atmosphere.scale.set(1.04, 1.04, 1.04)
scene.add(atmosphere)

// Sun Helper
const sun = new Group()
sun.add(crateLensflare())
scene.add(sun)

function updateSun() {
  sunDirection.setFromSpherical(sunSpherical)
  sun.position.copy(sunDirection).multiplyScalar(8)
}
updateSun()

function crateLensflare () {
  const lensflare = new Lensflare()
  lensflare.addElement(new LensflareElement(textureSun, 200, 0, new Color(0xeeeeee)))
  lensflare.addElement(new LensflareElement(textureFlare, 20, 0.74, new Color(0x33ff33)))
  lensflare.addElement(new LensflareElement(textureFlare, 100, 0.8))
  lensflare.addElement(new LensflareElement(textureFlare, 30, 1, new Color(0x48c9b0)))

  return lensflare
}

// GUI
gui.add(sunSpherical, 'phi').min(0).max(Math.PI).onChange(updateSun)
gui.add(sunSpherical, 'theta').min(-Math.PI).max(Math.PI).onChange(updateSun)
gui.addColor(earthParameters, 'atmosphereDayColor').onChange((value) => {
  earthMaterial.uniforms.uAtmosphereDayColor.value.set(value)
  atmosphereMaterial.uniforms.uAtmosphereDayColor.value.set(value)
})
gui.addColor(earthParameters, 'atmosphereTwilightColor').onChange((value) => {
  earthMaterial.uniforms.uAtmosphereTwilightColor.value.set(value)
  atmosphereMaterial.uniforms.uAtmosphereTwilightColor.value.set(value)
})

function animate() {
  window.requestAnimationFrame(animate)
  renderer.render(scene, camera)
  orbitControls.update()
  const elapsedTime = clock.getElapsedTime()

  earth.rotation.y = elapsedTime * 0.05
}
animate()
