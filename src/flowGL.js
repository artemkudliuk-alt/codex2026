// WebGL pass over the energy video, cloned 1:1 from on.energy (HomeFullBleedTextVideo):
// same vertex/fragment structure (on.energy: radius .25, strength .015; here .34 / .035 plus a
// brand-colour glow - client wanted it clearly visible), smoothing .1, same pointer
// follow and fade in/out. Two adaptations: the trail direction follows our stream, and the
// chromatic split goes into the brand colours (#E7520F / #85B1DF) instead of red/blue.
// Displacement only moves pixels, so on the dark background nothing changes - the effect
// shows on the stream itself.
// Cost: the loop runs only while the pointer effect is visible; otherwise the caller shows
// the plain <video> (same frame, hardware-decoded) and this canvas is hidden.

const VERT = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}`

const FRAG = `
precision mediump float;
uniform sampler2D u_texture;
uniform vec2 u_mouse;
uniform float u_radius;
uniform float u_strength;
uniform float u_active;
uniform float u_time;
varying vec2 v_texCoord;

const vec3 ORANGE = vec3(0.906, 0.322, 0.059); // #E7520F
const vec3 BLUE = vec3(0.522, 0.694, 0.875);   // #85B1DF
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

void main() {
  vec2 uv = v_texCoord;

  // Calculate distance from mouse
  float dist = distance(uv, u_mouse);
  float influence = smoothstep(u_radius, 0.0, dist) * u_active;

  if (influence > 0.001) {
    // Direction of the light trails: our stream runs from top-left down to the right
    vec2 trailDirection = normalize(vec2(1.0, 0.45) + 0.3 * vec2(v_texCoord.y, v_texCoord.x));

    // Create flowing distortion along the trail path
    float positionAlongTrail = dot(uv, trailDirection);
    float wave = sin(positionAlongTrail * 15.0 - u_time * 3.0);
    vec2 flowOffset = trailDirection * wave * influence * u_strength * 2.0;

    // Chromatic aberration along the trail direction
    float offset = influence * u_strength;
    vec2 redOffset = trailDirection * offset * 1.5 + flowOffset;
    vec2 blueOffset = -trailDirection * offset * 1.5 + flowOffset;

    // on.energy: r from redOffset, g from flowOffset, b from blueOffset.
    // Brand: the same split, expressed in orange and light blue around the base.
    vec3 base = texture2D(u_texture, uv + flowOffset).rgb;
    float l = luma(base);
    float a = luma(texture2D(u_texture, uv + redOffset).rgb);
    float b = luma(texture2D(u_texture, uv + blueOffset).rgb);
    vec3 split = base + ((a - l) * ORANGE + (b - l) * BLUE) * 2.2;
    // client: stronger - a brand-coloured glow on the lit strands under the cursor, its hue
    // drifting orange <-> light blue along the stream
    float hue = 0.5 + 0.5 * sin(positionAlongTrail * 9.0 - u_time * 1.6);
    vec3 glow = mix(ORANGE, BLUE, hue) * smoothstep(0.08, 0.6, l) * influence * 0.9;
    gl_FragColor = vec4(split + glow, 1.0);
  } else {
    gl_FragColor = texture2D(u_texture, uv);
  }
}`

function compile(gl, type, src) {
  const s = gl.createShader(type)
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s))
  return s
}

// Returns null when WebGL is unavailable (the caller keeps the plain <video>).
export function createFlowGL(canvas, video, { radius = 0.34, strength = 0.035, smoothing = 0.1 } = {}) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false })
  if (!gl) return null

  const prog = gl.createProgram()
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT))
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG))
  gl.linkProgram(prog)
  gl.useProgram(prog)

  const buffer = (data, name) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, name)
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
  }
  buffer([-1, -1, 1, -1, -1, 1, 1, 1], 'a_position')
  buffer([0, 1, 1, 1, 0, 0, 1, 0], 'a_texCoord') // image top at uv.y = 0, like the pointer

  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture())
  for (const p of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

  const u = (n) => gl.getUniformLocation(prog, n)
  const U = { mouse: u('u_mouse'), radius: u('u_radius'), strength: u('u_strength'), active: u('u_active'), time: u('u_time') }
  gl.uniform1f(U.radius, radius)
  gl.uniform1f(U.strength, strength)

  let tx = 0.5, ty = 0.5, ta = 0 // target
  let x = 0.5, y = 0.5, a = 0 // smoothed
  let last = performance.now()

  return {
    move(nx, ny) { tx = nx; ty = ny; ta = 1 },
    leave() { ta = 0 },
    // true while the effect is (still) visible; false = the plain video can take over
    get visible() { return ta > 0 || a > 0.002 },
    render() {
      const now = performance.now()
      const k = 1 - Math.pow(1 - smoothing, (now - last) / 16.67)
      last = now
      x += (tx - x) * k
      y += (ty - y) * k
      a += (ta - a) * k
      if (video.readyState < 2) return
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video)
      gl.uniform2f(U.mouse, x, y)
      gl.uniform1f(U.active, a)
      gl.uniform1f(U.time, now / 1000)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    },
  }
}
