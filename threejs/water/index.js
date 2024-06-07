import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Clock,
  Color,
  TextureLoader,
  SRGBColorSpace,
  PlaneGeometry,
  Mesh,
  MeshBasicMaterial,
  ShaderMaterial,
  DoubleSide,
  Uniform,
  Vector2,
  ACESFilmicToneMapping,
  BoxGeometry
} from 'three'
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import GUI from 'lil-gui'
import vertexShader from './vertex.glsl'
import fragmentShader from './fragment.glsl'

const gui = new GUI()

const scene = new Scene()

const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(0, 1, 1)

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
orbitControls.enablePan = false

// Water
const waterParameters = {
  depthColor: 0x00d5ff,
  surfaceColor: 0x002d38,
  waterElevation: .06,
  waterFrequency: new Vector2(2, 4),
  speed: .8,
  wavesElevation: .04,
  wavesFrequency: 3,
  wavesSpped: .2,
  wavesIterations: 3,
  colorMultiplier: 0.9,
  colorOffset: 1
}

const geometry = new PlaneGeometry(2, 2, 512, 512)
// 删除一些无用的属性，减少 GPU 内存使用
geometry.deleteAttribute('normal')
geometry.deleteAttribute('uv')
const material = new ShaderMaterial({
  side: DoubleSide,
  vertexShader,
  fragmentShader,
  uniforms: {
    uTime: new Uniform(0),
    depthColor: new Uniform(new Color(waterParameters.depthColor)),
    surfaceColor: new Uniform(new Color(waterParameters.surfaceColor)),
    uWaterElevation: new Uniform(waterParameters.waterElevation),
    uWaterFrequency: new Uniform(waterParameters.waterFrequency),
    uSpeed: new Uniform(waterParameters.speed),
    uWavesElevation: new Uniform(waterParameters.wavesElevation),
    uWavesFrequency: new Uniform(waterParameters.wavesFrequency),
    uWavesSpped: new Uniform(waterParameters.wavesSpped),
    uWavesIterations: new Uniform(waterParameters.wavesIterations),
    uColorMultiplier: new Uniform(waterParameters.colorMultiplier),
    uColorOffset: new Uniform(waterParameters.colorOffset)
  }
})
const water = new Mesh(
  geometry,
  material
)
water.rotation.x = -Math.PI / 2
scene.add(water)

gui.addColor(waterParameters, 'depthColor').onChange((value) => {
  material.uniforms.depthColor.value.set(value)
})
gui.addColor(waterParameters, 'surfaceColor').onChange((value) => {
  material.uniforms.surfaceColor.value.set(value)
})
gui.add(material.uniforms.uWaterElevation, 'value').min(0).max(1).step(0.01).name('waterElevation')
gui.add(material.uniforms.uWaterFrequency.value, 'x').min(0).max(10).step(0.1).name('waterFrequency-X')
gui.add(material.uniforms.uWaterFrequency.value, 'y').min(0).max(10).step(0.1).name('waterFrequency-Y')
gui.add(material.uniforms.uSpeed, 'value').min(0).max(10).step(0.1).name('speed')
gui.add(material.uniforms.uWavesElevation, 'value').min(0).max(1).step(0.01).name('wavesElevation')
gui.add(material.uniforms.uWavesFrequency, 'value').min(0).max(10).step(0.1).name('wavesFrequency')
gui.add(material.uniforms.uWavesSpped, 'value').min(0).max(10).step(0.1).name('wavesSpped')
gui.add(material.uniforms.uWavesIterations, 'value').min(1).max(6).step(1).name('wavesIterations')
gui.add(material.uniforms.uColorMultiplier, 'value').min(0).max(10).step(0.1).name('colorMultiplier')
gui.add(material.uniforms.uColorOffset, 'value').min(-1).max(1).step(0.1).name('colorOffset')

// Cube
const cubeTexture = new TextureLoader().load('/textures/crate.gif');
cubeTexture.colorSpace = SRGBColorSpace;
const cube = new Mesh(
  new BoxGeometry(0.1, 0.1, 0.1),
  new MeshBasicMaterial({
    map: cubeTexture
  })
)
scene.add(cube)

function getElevation(position) {
  const { uWaterFrequency, uWaterElevation, uTime, uSpeed } = material.uniforms
  const elevation = Math.sin(position.x * uWaterFrequency.value.x + uTime.value * uSpeed.value) *
                    Math.sin(position.z * uWaterFrequency.value.y + uTime.value * uSpeed.value) *
                    uWaterElevation.value;
  return elevation
}

function animate() {
  window.requestAnimationFrame(animate)
  renderer.render(scene, camera)
  orbitControls.update()
  const elapseTime = clock.getElapsedTime()

  material.uniforms.uTime.value = elapseTime
  cube.position.y = getElevation(cube.position) - 0.02
}
animate()
