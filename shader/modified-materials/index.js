import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Clock,
  TextureLoader,
  SRGBColorSpace,
  MeshPhongMaterial,
  DirectionalLight,
  PlaneGeometry,
  MeshStandardMaterial,
  Mesh,
  MeshDepthMaterial,
  RGBADepthPacking
} from 'three'
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import GUI from 'lil-gui'
import vertexCommon from './vertexCommon.glsl.js'
import vertexVariable from './vertexVariable.glsl.js'
import vertexNormal from './vertexNormal.glsl.js'
import vertexShader from './vertex.glsl.js'

const gui = new GUI()
gui.domElement.addEventListener('mousedown', function (e) {
  e.stopPropagation()
}, false)

const scene = new Scene()

const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(0, 3, 6)

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
}, false)

// 时钟
const clock = new Clock()

// control
const orbitControls = new OrbitControls(camera, renderer.domElement)

const dirLight = new DirectionalLight( 0xffddcc, 3 )
dirLight.position.set( 1, 0.5, 1 )
scene.add( dirLight )

// modified materials
const loader = new GLTFLoader()
const textureLoader = new TextureLoader()

const map = textureLoader.load('/textures/MapColor.jpg')
map.colorSpace = SRGBColorSpace
const normalMap = textureLoader.load('/textures/MapNormal.jpg')
let mesh
const material = new MeshPhongMaterial({
  specular: 0x111111,
  map: map,
  normalMap: normalMap,
  shininess: 25
})
const depthMaterial = new MeshDepthMaterial({
  depthPacking: RGBADepthPacking
})
const uniformsObj = {
  uTime: { value: 0 }
}

// model
loader.load('/models/LeePerrySmith.glb', function (gltf) {
  gltf.scene.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true
      child.receiveShadow = true
    }
  })
  mesh = gltf.scene.children[0]
  mesh.material = material
  mesh.customDepthMaterial = depthMaterial
  mesh.material.onBeforeCompile = function(shader) {
    shader.uniforms.uTime = uniformsObj.uTime
    shader.vertexShader = shader.vertexShader.replace('#include <common>', vertexCommon)
    shader.vertexShader = shader.vertexShader.replace('#include <uv_vertex>', vertexVariable)
    shader.vertexShader = shader.vertexShader.replace('#include <beginnormal_vertex>', vertexNormal)
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', vertexShader)
  }
  mesh.customDepthMaterial.onBeforeCompile = function(shader) {
    shader.uniforms.uTime = uniformsObj.uTime
    shader.vertexShader = shader.vertexShader.replace('#include <common>', vertexCommon)
    shader.vertexShader = shader.vertexShader.replace('#include <uv_vertex>', vertexVariable)
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', vertexShader)
  }

  scene.add(mesh)
})

// plane
const planeMaterial = new MeshStandardMaterial()
const plane = new Mesh(
  new PlaneGeometry(20, 20),
  planeMaterial
)
plane.position.z = -5
scene.add(plane)

// shadow
renderer.shadowMap.enabled = true
dirLight.castShadow = true
dirLight.shadow.camera.far = 16

plane.receiveShadow = true

function animate() {
  window.requestAnimationFrame(animate)
  renderer.render(scene, camera)
  orbitControls.update()

  uniformsObj.uTime.value = clock.getElapsedTime()
}
animate()
