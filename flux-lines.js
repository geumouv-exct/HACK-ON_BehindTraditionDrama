// React Bits FluxLines shaders adapted from the component supplied by the user.
const MAX_COLORS = 8;
const INTRO_SECONDS = 1.8;
const FLOW = { up: [0, 1], down: [0, -1], left: [-1, 0], right: [1, 0] };

const VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const FIELD = `
float hash(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float smin(float a, float b, float k) {
  float r = exp2(-a / k) + exp2(-b / k);
  return -k * log2(r);
}

float sinlerp(float a, float b, float w) {
  return mix(a, b, (sin(w * 3.14159265 - 3.14159265 / 2.0) + 1.0) / 2.0);
}

float vn(vec2 p, float s, float seed) {
  vec2 cellp = floor(p / s);
  vec2 relp = mod(p, s);
  float g1 = hash(vec3(cellp, seed));
  float g2 = hash(vec3(cellp.x + 1.0, cellp.y, seed));
  float g3 = hash(vec3(cellp.x + 1.0, cellp.y + 1.0, seed));
  float g4 = hash(vec3(cellp.x, cellp.y + 1.0, seed));
  float bx = sinlerp(g1, g2, relp.x / s);
  float tx = sinlerp(g4, g3, relp.x / s);
  return sinlerp(bx, tx, relp.y / s);
}

float dbn(vec2 p, float s, float seed) {
  float o = s / 2.0;
  float n0 = vn(p, s, seed);
  float n1 = vn(p + vec2(o, o), s, seed + 0.1);
  float n2 = vn(p + vec2(-o, o), s, seed + 0.2);
  float n3 = vn(p + vec2(o, -o), s, seed + 0.3);
  float n4 = vn(p + vec2(-o, -o), s, seed + 0.4);
  return (2.0 * n0 + 1.5 * n1 + 1.25 * n2 + 1.125 * n3 + n4) / 7.0;
}
`;

const FRAGMENT = `#version 300 es
precision highp float;
precision highp int;
uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uFlow;
uniform float uSpeed;
uniform float uScale;
uniform float uTurbulence;
uniform float uFluidity;
uniform float uRimWidth;
uniform float uSharpness;
uniform float uShimmer;
uniform float uGlow;
uniform float uLine;
uniform float uMaxHalf;
uniform vec3 uColors[${MAX_COLORS}];
uniform int uColorCount;
uniform vec4 uMagnet;
uniform vec4 uSwirl;
uniform float uReveal;
uniform float uLight;
uniform float uOpaque;
uniform vec3 uBackground;
uniform float uOpacity;
out vec4 outColor;
${FIELD}

vec3 palette(float h) {
  float x = clamp(h, 0.0, 1.0) * float(uColorCount - 1);
  int i = int(floor(x));
  int j = min(i + 1, uColorCount - 1);
  return mix(uColors[i], uColors[j], smoothstep(0.0, 1.0, x - float(i)));
}

void main() {
  float ref = 700.0 / max(uScale, 0.05);
  vec2 frag = gl_FragCoord.xy;
  vec2 toMagnet = (frag - uMagnet.xy) / uResolution.y;
  float pull = uMagnet.z * exp(-dot(toMagnet, toMagnet) / (uMagnet.w * uMagnet.w));
  if (pull > 0.001) {
    float angle = pull * 0.55;
    float c = cos(angle);
    float s = sin(angle);
    frag = uMagnet.xy + mat2(c, s, -s, c) * (frag - uMagnet.xy);
  }
  if (uSwirl.w > 0.0) {
    vec2 d = frag - uSwirl.xy;
    float reach = uSwirl.z;
    float angle = uSwirl.w * exp(-dot(d, d) / (reach * reach));
    float c = cos(angle);
    float s = sin(angle);
    frag = uSwirl.xy + mat2(c, s, -s, c) * d;
  }
  vec2 p = frag / uResolution.y * ref;

  float spd = 200.0 * uSpeed;
  float t = uTime;
  vec2 dir = uFlow;
  vec2 perp = vec2(-dir.y, dir.x);
  float distort1 = vn(p + perp * (t * spd), 60.0, 10.0) * 50.0 * uTurbulence;
  float distort2 = vn(p - perp * (t * spd), 120.0, 15.0) * 100.0 * uTurbulence;
  float peaks = dbn(p + distort1 + dir * (t * spd * 0.5), 40.0, 1.0);
  float peaks2 = dbn(p + distort2 - dir * (t * spd * 0.5), 40.0, 0.0);
  float field = smin(peaks, peaks2, max(uFluidity, 0.001));

  float slope = length(vec2(dFdx(field), dFdy(field)));
  float gap = abs(field - 0.4);
  float pixels = gap / max(slope, 1e-6);
  float halfBand = max(uRimWidth, 0.001) * 0.5;
  float across = max(gap / halfBand, pixels / uMaxHalf);
  float band = 5.0 * uRimWidth * (1.0 - across);
  float reveal = smoothstep(0.2, 0.85, pull);
  float shimmer = vn(p + dir * (t * spd * 0.5), 60.0, 12.0) * uShimmer * (1.0 - reveal * 0.75);
  float lit = clamp(band - shimmer, 0.0, 1.0);
  float glow = pow(lit, uSharpness) * uGlow * (1.0 + reveal * 0.25);
  float core = uLine > 0.0 ? smoothstep(uLine + 0.75, uLine - 0.75, pixels) * max(smoothstep(0.08, 0.6, glow), reveal) : 0.0;
  float shine = clamp(glow, 0.0, 1.0);
  float energy = max(shine * shine, core * 0.85) * uReveal;

  float h = clamp(0.5 + (peaks - peaks2) * 0.8, 0.0, 1.0);
  vec3 tint = palette(h);

  if (uLight > 0.5) {
    float chroma = max(tint.r, max(tint.g, tint.b)) - min(tint.r, min(tint.g, tint.b));
    vec3 ink = mix(vec3(0.07, 0.07, 0.08), tint * 0.55, clamp(chroma * 1.6, 0.0, 1.0));
    float cover = energy * uOpacity;
    outColor = uOpaque > 0.5 ? vec4(mix(uBackground, ink, cover), 1.0) : vec4(ink * cover, cover);
    return;
  }

  vec3 light = tint * energy * uOpacity;
  outColor = uOpaque > 0.5 ? vec4(uBackground + light, 1.0) : vec4(light, max(light.r, max(light.g, light.b)));
}`;


// Standalone WebGL2 adapter. The historical ink palette replaces the demo palette.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const compile = (gl, type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return null;
    return shader;
  };
  document.querySelectorAll('[data-flux-lines]').forEach((root) => {
    const canvas = document.createElement('canvas');
    canvas.className = 'flux-lines-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    root.append(canvas);
    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, depth: false, antialias: false });
    if (!gl) return;
    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    if (!vertex || !fragment) return;
    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.bindAttribLocation(program, 0, 'aPosition');
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    const u = {};
    for (let i = 0; i < gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS); i++) {
      const info = gl.getActiveUniform(program, i);
      u[info.name.replace('[0]', '')] = gl.getUniformLocation(program, info.name);
    }
    const vao = gl.createVertexArray();
    const buffer = gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const light = root.dataset.fluxLines === 'light';
    const homeWhite = root.classList.contains('home-flux');
    const palette = light ? [0.46,0.37,0.27, 0.67,0.42,0.31, 0.32,0.40,0.34] : homeWhite ? [0.78,0.84,0.8, 1,1,1, 0.62,0.7,0.66] : [0.69,0.42,0.28, 0.52,0.65,0.54, 0.93,0.76,0.53];
    const colors = new Float32Array(MAX_COLORS * 3);
    colors.set(palette);
    let visible = true, frame = 0, time = 0, last = 0, reveal = reduced ? 1 : 0;
    const magnet = { x: 0, y: 0, targetX: 0, targetY: 0, active: 0, inside: false };
    const swirl = { x: 0, y: 0, age: 10 };
    const draw = () => {
      const ratio = canvas.width / Math.max(1, root.clientWidth);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);
      gl.bindVertexArray(vao);
      gl.uniform2f(u.uResolution, canvas.width, canvas.height);
      gl.uniform1f(u.uTime, time);
      gl.uniform2f(u.uFlow, 0, -1);
      gl.uniform1f(u.uSpeed, 0.11);
      gl.uniform1f(u.uScale, 1.55);
      gl.uniform1f(u.uTurbulence, 0.52);
      gl.uniform1f(u.uFluidity, 0.12);
      gl.uniform1f(u.uRimWidth, 0.14);
      gl.uniform1f(u.uSharpness, 2.4);
      gl.uniform1f(u.uShimmer, 0.75);
      gl.uniform1f(u.uGlow, 1.45);
      gl.uniform1f(u.uLine, 0.6 * ratio);
      gl.uniform1f(u.uMaxHalf, 28 * ratio);
      gl.uniform3fv(u.uColors, colors);
      gl.uniform1i(u.uColorCount, 3);
      gl.uniform4f(u.uMagnet, magnet.x, magnet.y, magnet.active * 0.75, 0.36);
      const twist = 1.6 * Math.min(1, swirl.age / 0.23) * Math.exp(-Math.max(0, swirl.age - 0.23) * 1.1);
      gl.uniform4f(u.uSwirl, swirl.x, swirl.y, canvas.height * 0.22, swirl.age < 5 ? twist : 0);
      gl.uniform1f(u.uReveal, reveal * reveal * (3 - 2 * reveal));
      gl.uniform1f(u.uLight, light ? 1 : 0);
      gl.uniform1f(u.uOpaque, 0);
      gl.uniform3f(u.uBackground, 0, 0, 0);
      gl.uniform1f(u.uOpacity, light ? 0.38 : homeWhite ? 0.8 : 0.57);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const tick = (now) => {
      frame = 0;
      if (!visible || document.hidden) return;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      if (!reduced) time += dt;
      reveal = Math.min(1, reveal + dt / 1.5);
      swirl.age += dt;
      const ease = 1 - Math.exp(-dt / 0.15);
      magnet.x += (magnet.targetX - magnet.x) * ease;
      magnet.y += (magnet.targetY - magnet.y) * ease;
      magnet.active += ((magnet.inside ? 1 : 0) - magnet.active) * ease;
      draw();
      if (!reduced || reveal < 1) frame = requestAnimationFrame(tick);
    };
    const wake = () => { if (!frame) frame = requestAnimationFrame(tick); };
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.35);
      canvas.width = Math.max(1, Math.round(root.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(root.clientHeight * dpr));
      draw(); wake();
    };
    root.addEventListener('pointermove', (event) => {
      const rect = root.getBoundingClientRect();
      const ratio = canvas.width / rect.width;
      magnet.targetX = (event.clientX - rect.left) * ratio;
      magnet.targetY = (rect.bottom - event.clientY) * ratio;
      if (!magnet.inside) { magnet.x = magnet.targetX; magnet.y = magnet.targetY; }
      magnet.inside = true; wake();
    }, { passive: true });
    root.addEventListener('pointerleave', () => { magnet.inside = false; wake(); });
    root.addEventListener('pointerdown', (event) => {
      if (reduced) return;
      const rect = root.getBoundingClientRect();
      const ratio = canvas.width / rect.width;
      swirl.x = (event.clientX - rect.left) * ratio;
      swirl.y = (rect.bottom - event.clientY) * ratio;
      swirl.age = 0; wake();
    }, { passive: true });
    new ResizeObserver(resize).observe(root);
    new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; if (visible) { last = 0; wake(); } }).observe(root);
    resize();
  });
})();
