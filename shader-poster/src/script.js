/*********
 * made by Matthias Hurrle (@atzedent)
 */

const dpr = Math.min(1,.5*window.devicePixelRatio)

function render() {
  const fragmentShaders = [...document.querySelectorAll(
    'script[type="x-shader/x-fragment"]'
  )]
  const vertexShader = document.querySelector(
    'script[type="x-shader/x-vertex"]'
  ).innerHTML

  const canvases = document.querySelectorAll("canvas")

  function* choose() {
    let i = 0
    yield fragmentShaders.shift()
    while (true) {
      yield fragmentShaders[i]
      i = (i + 1) % fragmentShaders.length
    }
  }

  const getNextShader = choose()

  let canvasIndex = 0
  for (let canvas of canvases) {
    const cvidx = canvasIndex++
    canvas.width *= dpr
    canvas.height *= dpr
    const gl = canvas.getContext("webgl2")
    const fragmentShader = getNextShader.next().value.innerHTML

    let time
    let buffer
    let program
    let resolution
    let scene
    let vertices = []

    setup()
    draw()

    function compile(shader, source) {
      gl.shaderSource(shader, source)
      gl.compileShader(shader)

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader))
      }
    }

    function setup() {
      const vs = gl.createShader(gl.VERTEX_SHADER)
      const fs = gl.createShader(gl.FRAGMENT_SHADER)

      program = gl.createProgram()

      compile(vs, vertexShader)
      compile(fs, fragmentShader)

      gl.attachShader(program, vs)
      gl.attachShader(program, fs)
      gl.linkProgram(program)

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program))
      }

      vertices = [
        -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0,
      ]

      buffer = gl.createBuffer()

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)

      const position = gl.getAttribLocation(program, "position")

      gl.enableVertexAttribArray(position)
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

      time = gl.getUniformLocation(program, "time")
      resolution = gl.getUniformLocation(program, "resolution")
      scene = gl.getUniformLocation(program, "scene")
    }

    function draw(now) {
      gl.clearColor(0, 0, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)

      gl.useProgram(program)
      gl.bindBuffer(gl.ARRAY_BUFFER, null)
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)

      gl.uniform1f(time, now * 0.001)
      gl.uniform2f(resolution, canvas.width, canvas.height)
      gl.uniform1i(scene, cvidx)
      gl.drawArrays(gl.TRIANGLES, 0, vertices.length * 0.5)

      requestAnimationFrame(draw)
    }
  }
}

function main() {
  render()
}

document.body.onload = main
