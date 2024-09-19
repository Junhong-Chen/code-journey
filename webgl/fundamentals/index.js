
const vertexShaderSource = `#version 300 es
 
// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec2 a_position;

uniform vec2 u_resolution;

// all shaders have a main function
void main() {
  // convert the position from pixels to 0.0 to 1.0
  vec2 zeroToOne = a_position / u_resolution;

  // convert from 0->1 to 0->2
  vec2 zeroToTwo = zeroToOne * 2.0;

  // convert from 0->2 to -1->+1 (clip space)
  vec2 clipSpace = zeroToTwo - 1.0;

  // gl_Position is a special variable a vertex shader is responsible for setting
  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1); // 反转 y 轴
}
`

const fragmentShaderSource = `#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

uniform vec4 u_color;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  // Just set the output to a constant reddish-purple
  outColor = u_color;
}
`

function createShader(gl, type, source) {
  const shader = gl.createShader(type) // 创建着色器实例
  gl.shaderSource(shader, source) // 传入 glsl 源码
  gl.compileShader(shader) // 编译着色器

  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
  if (success) {
    return shader
  }

  console.log(gl.getShaderInfoLog(shader))
  gl.deleteShader(shader)
}

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram()
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  const success = gl.getProgramParameter(program, gl.LINK_STATUS)
  if (success) {
    return program
  }

  console.log(gl.getProgramInfoLog(program))
  gl.deleteProgram(program)
}

// Returns a random integer from 0 to range - 1.
function randomInt(range) {
  return Math.floor(Math.random() * range);
}

// Fills the buffer with the values that define a rectangle.
function setRectangle(gl, x, y, width, height) {
  var x1 = x
  var x2 = x + width
  var y1 = y
  var y2 = y + height

  // NOTE: gl.bufferData(gl.ARRAY_BUFFER, ...) will affect
  // whatever buffer is bound to the `ARRAY_BUFFER` bind point
  // but so far we only have one buffer. If we had more than one
  // buffer we'd want to bind that buffer to `ARRAY_BUFFER` first.

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    x1, y1,
    x2, y1,
    x1, y2,
    x1, y2,
    x2, y1,
    x2, y2]), gl.STATIC_DRAW) // 通过绑定点把数据存放到缓冲区
}

function main() {
  const c = document.querySelector("#c")

  const gl = c.getContext("webgl2")

  if (!gl) {
    console.error("no webgl2")
  }

  // 创建着色器
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)

  // 将顶点着色器和片段着色器连接成一个程序
  const program = createProgram(gl, vertexShader, fragmentShader)

  // 将属性提供给 GPU
  const positionAttributeLocation = gl.getAttribLocation(program, "a_position")
  const positionBuffer = gl.createBuffer() // 属性从缓存区中取数据，所以需要创建缓冲区
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer) // WebGL通过绑定点来处理许多资源，绑定一个资源到某个绑定点，然后所有方法通过这个绑定点来对这个资源进行访问

  // 将 uniform 提供给 GPU
  const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution")
  const colorLocation = gl.getUniformLocation(program, "u_color")

  const vao = gl.createVertexArray() // 创建属性状态集合：顶点数组对象(Vertex Array Object)
  gl.bindVertexArray(vao) // 绑定这个顶点数组到WebGL
  gl.enableVertexAttribArray(positionAttributeLocation) // 如果没有开启这个属性，这个属性值会是一个常量

  // 设置属性值如何从缓存区取出数据
  const size = 2 // 2 components per iteration
  const type = gl.FLOAT // the data is 32bit floats
  const normalize = false // don't normalize the data
  const stride = 0 // 0 = move forward size * sizeof(type) each iteration to get the next position
  const offset = 0 // start at the beginning of the buffer

  gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset)

  // webglUtils.resizeCanvasToDisplaySize(gl.canvas)

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height) // 将裁剪空间 [-1, 1] 映射到屏幕空间，调用 gl.viewport 并将其传递给画布的当前大小

  gl.useProgram(program) // 运行着色器程序

  gl.bindVertexArray(vao) // 用哪个缓冲区以及如何从缓冲区取出数据给到属性

  // Pass in the canvas resolution so we can convert from pixels to clip space in the shader
  gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height)

  // draw 50 random rectangles in random colors
  for (let i = 0; i < 50; i++) {
    // Setup a random rectangle
    setRectangle(gl, randomInt(300), randomInt(300), randomInt(300), randomInt(300)) // 通过更新缓冲区来更新数据，正常不会这样做，这里方便演示所以这样执行

    // Set a random color.
    gl.uniform4f(colorLocation, Math.random(), Math.random(), Math.random(), 1)

    // Draw the rectangle.
    const primitiveType = gl.TRIANGLES
    const offset = 0
    const count = 6
    gl.drawArrays(primitiveType, offset, count)
  }
}

main()
