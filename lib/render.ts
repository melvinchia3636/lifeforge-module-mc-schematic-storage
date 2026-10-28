// WebGL2 outline renderer.
// Pass 1 rasterises faces into an RGBA32F buffer (normal + plane) with a depth
// buffer; pass 2 detects normal/plane discontinuities and draws the edges.
// The camera is free: pass yaw/pitch/zoom to draw().

import { basis } from './camera'
import type { Scene, Vec3 } from './types'

export { basis }

export type { CameraBasis } from './camera'

const VS = `#version 300 es
in vec3 aPos;
in vec3 aNormal;
in float aPlane;
uniform vec3 uRight;
uniform vec3 uUp;
uniform vec3 uDir;
uniform vec2 uScale;
uniform vec2 uCenter;
uniform float uDepthScale;
uniform float uDepthCenter;
out vec3 vNormal;
out float vPlane;
void main() {
  float sx = dot(aPos, uRight);
  float sy = dot(aPos, uUp);
  float d  = dot(aPos, uDir);
  gl_Position = vec4((sx - uCenter.x) * uScale.x, (sy - uCenter.y) * uScale.y,
                     (d - uDepthCenter) * uDepthScale, 1.0);
  vNormal = aNormal;
  vPlane = aPlane;
}`

const FS_BUFFER = `#version 300 es
precision highp float;
in vec3 vNormal;
in float vPlane;
out vec4 outColor;
void main() {
  outColor = vec4(vNormal * 0.5 + 0.5, vPlane);
}`

const FS_EDGE = `#version 300 es
precision highp float;
precision highp sampler2D;
uniform sampler2D uBuffer;
uniform ivec2 uSize;
uniform int uSS;
out vec4 outColor;

bool differs(vec4 a, vec4 b) {
  return any(greaterThan(abs(a.rgb - b.rgb), vec3(1e-4))) || abs(a.a - b.a) > 1e-2;
}
vec4 at(ivec2 p) {
  p = clamp(p, ivec2(0), uSize - 1);
  return texelFetch(uBuffer, p, 0);
}
void main() {
  ivec2 base = ivec2(gl_FragCoord.xy) * uSS;
  float hits = 0.0;
  float total = float(uSS * uSS);
  for (int dy = 0; dy < 4; dy++) {
    if (dy >= uSS) break;
    for (int dx = 0; dx < 4; dx++) {
      if (dx >= uSS) break;
      ivec2 p = base + ivec2(dx, dy);
      vec4 c = at(p);
      if (differs(c, at(p + ivec2(1, 0))) || differs(c, at(p + ivec2(0, 1))) ||
          differs(c, at(p - ivec2(1, 0))) || differs(c, at(p - ivec2(0, 1)))) hits += 1.0;
    }
  }
  float cover = hits / total;
  outColor = vec4(vec3(1.0 - cover), 1.0);
}`

const VS_QUAD = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`

function compile(
  gl: WebGL2RenderingContext,
  type: number,
  src: string
): WebGLShader {
  const sh = gl.createShader(type)

  if (!sh) {
    throw new Error('Failed to create shader')
  }

  gl.shaderSource(sh, src)
  gl.compileShader(sh)

  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(sh) ?? 'Shader compilation failed')
  }

  return sh
}

function program(
  gl: WebGL2RenderingContext,
  vs: string,
  fs: string
): WebGLProgram {
  const p = gl.createProgram()

  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs))
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs))
  gl.linkProgram(p)

  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(p) ?? 'Program link failed')
  }

  return p
}

export interface CameraOptions {
  yaw?: number
  pitch?: number
  zoom?: number
  offset?: [number, number]
}

export interface RendererOptions {
  size?: number
  supersample?: number
  margin?: number
}

export interface Renderer {
  draw: (options?: CameraOptions) => void
  size: number
  faces: number
  vertices: number
}

function boundingVolume(
  data: Float32Array,
  stride: number
): { center: Vec3; radius: number } {
  const mn: Vec3 = [Infinity, Infinity, Infinity]
  const mx: Vec3 = [-Infinity, -Infinity, -Infinity]

  for (let i = 0; i < data.length; i += stride) {
    for (let k = 0; k < 3; k++) {
      const v = data[i + k]

      if (v === undefined) {
        continue
      }

      if (v < mn[k]!) mn[k] = v
      if (v > mx[k]!) mx[k] = v
    }
  }

  const center: Vec3 = [
    (mn[0] + mx[0]) / 2,
    (mn[1] + mx[1]) / 2,
    (mn[2] + mx[2]) / 2
  ]
  // bounding sphere: framing from this keeps the model the same size for any
  // camera angle (a projected-box fit would zoom in and out while orbiting)
  const radius =
    0.5 * Math.hypot(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2])

  return { center, radius }
}

/** Build a reusable renderer for one scene (keeps GL buffers between draws). */
export function createRenderer(
  canvas: HTMLCanvasElement,
  scene: Scene,
  options: RendererOptions = {}
): Renderer {
  const { size = 512, supersample = 3, margin = 0.06 } = options
  const gl = canvas.getContext('webgl2', {
    antialias: false,
    preserveDrawingBuffer: true
  })

  if (!gl) {
    throw new Error('WebGL2 unavailable')
  }

  if (!gl.getExtension('EXT_color_buffer_float')) {
    throw new Error('EXT_color_buffer_float unavailable')
  }

  const ss = Math.max(1, Math.min(4, supersample))

  canvas.width = size
  canvas.height = size

  const w = size * ss
  const h = size * ss

  const tex = gl.createTexture()

  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, w, h)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  const depth = gl.createRenderbuffer()

  gl.bindRenderbuffer(gl.RENDERBUFFER, depth)
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h)

  const fbo = gl.createFramebuffer()

  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    tex,
    0
  )
  gl.framebufferRenderbuffer(
    gl.FRAMEBUFFER,
    gl.DEPTH_ATTACHMENT,
    gl.RENDERBUFFER,
    depth
  )
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)

  const geo = program(gl, VS, FS_BUFFER)
  const vao = gl.createVertexArray()

  gl.bindVertexArray(vao) // scene VAO: attribute state lives here

  const vbo = gl.createBuffer()

  gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
  gl.bufferData(gl.ARRAY_BUFFER, scene.data, gl.STATIC_DRAW)

  const stride = scene.stride * 4
  const aPos = gl.getAttribLocation(geo, 'aPos')
  const aNormal = gl.getAttribLocation(geo, 'aNormal')
  const aPlane = gl.getAttribLocation(geo, 'aPlane')

  gl.enableVertexAttribArray(aPos)
  gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, stride, 0)
  gl.enableVertexAttribArray(aNormal)
  gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, stride, 12)
  gl.enableVertexAttribArray(aPlane)
  gl.vertexAttribPointer(aPlane, 1, gl.FLOAT, false, stride, 24)

  const edge = program(gl, VS_QUAD, FS_EDGE)
  // separate VAO for the full-screen triangle, otherwise its attribute setup
  // overwrites the scene VAO and later frames render garbage
  const quadVao = gl.createVertexArray()

  gl.bindVertexArray(quadVao)

  const quad = gl.createBuffer()

  gl.bindBuffer(gl.ARRAY_BUFFER, quad)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW
  )

  const quadLoc = gl.getAttribLocation(edge, 'aPos')

  gl.enableVertexAttribArray(quadLoc)
  gl.vertexAttribPointer(quadLoc, 2, gl.FLOAT, false, 0, 0)
  gl.bindVertexArray(null)

  const uniforms = {
    uRight: gl.getUniformLocation(geo, 'uRight'),
    uUp: gl.getUniformLocation(geo, 'uUp'),
    uDir: gl.getUniformLocation(geo, 'uDir'),
    uScale: gl.getUniformLocation(geo, 'uScale'),
    uCenter: gl.getUniformLocation(geo, 'uCenter'),
    uDepthScale: gl.getUniformLocation(geo, 'uDepthScale'),
    uDepthCenter: gl.getUniformLocation(geo, 'uDepthCenter')
  }

  const { center, radius } = boundingVolume(scene.data, scene.stride)
  const vertexCount = scene.data.length / scene.stride

  const draw = ({
    yaw = Math.PI / 4,
    pitch = 0.615,
    zoom = 1,
    offset = [0, 0] as [number, number]
  }: CameraOptions = {}) => {
    const { d, r, u: up } = basis(yaw, pitch)

    const cx =
      center[0] * r[0] +
      center[1] * r[1] +
      center[2] * r[2] +
      offset[0]
    const cy =
      center[0] * up[0] +
      center[1] * up[1] +
      center[2] * up[2] +
      offset[1]
    const cd = center[0] * d[0] + center[1] * d[1] + center[2] * d[2]
    const side = (2 * radius * (1 + 2 * margin)) / zoom

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    gl.viewport(0, 0, w, h)
    gl.clearColor(0, 0, 0, 0)
    gl.clearDepth(0)
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.GREATER) // larger depth = nearer the camera
    gl.disable(gl.CULL_FACE) // faces are depth-tested, winding is not guaranteed
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    gl.useProgram(geo)
    
gl.bindVertexArray(vao)
    gl.uniform3f(uniforms.uRight, r[0], r[1], r[2])
    gl.uniform3f(uniforms.uUp, up[0], up[1], up[2])
    gl.uniform3f(uniforms.uDir, d[0], d[1], d[2])
    gl.uniform2f(uniforms.uScale, 2 / side, 2 / side)
    gl.uniform2f(uniforms.uCenter, cx, cy)
    gl.uniform1f(uniforms.uDepthScale, 2 / (2 * radius + 2))
    gl.uniform1f(uniforms.uDepthCenter, cd)
    gl.drawArrays(gl.TRIANGLES, 0, vertexCount)

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, size, size)
    gl.disable(gl.DEPTH_TEST)
    
gl.useProgram(edge)
    
gl.bindVertexArray(quadVao)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.uniform1i(gl.getUniformLocation(edge, 'uBuffer'), 0)
    gl.uniform2i(gl.getUniformLocation(edge, 'uSize'), w, h)
    gl.uniform1i(gl.getUniformLocation(edge, 'uSS'), ss)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  return { draw, size, faces: scene.faces, vertices: vertexCount }
}

/** One-shot convenience wrapper. */
export function renderScene(
  scene: Scene,
  canvas: HTMLCanvasElement,
  options: RendererOptions & CameraOptions = {}
): HTMLCanvasElement {
  const renderer = createRenderer(canvas, scene, options)

  renderer.draw(options)

  return canvas
}
