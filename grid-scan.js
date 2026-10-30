// GridScan canvas adaptation for the static history-story transition.
// Uses the supplied GridScan WebGL room shader with a white grid and scan.
(() => {
  const root = document.getElementById("story-loader");
  const canvas = document.getElementById("story-loader-canvas");
  if (!root || !canvas) return;
  const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const VERTEX = `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;
  const ROOM = `#version 300 es
precision highp float;
precision highp int;
uniform float uAspect;
uniform float uPixel;
uniform vec3 uEye;
uniform float uDepth;
uniform vec3 uCell;
uniform float uThick;
uniform float uDot;
uniform int uStyle;
uniform vec3 uLineColor;
uniform vec3 uScanColor;
uniform vec3 uCoreColor;
uniform float uFade;
uniform float uScanZ;
uniform float uScanDir;
uniform float uScanAlpha;
uniform float uScanWidth;
uniform float uTrail;
uniform float uReveal;
uniform float uPoints;
uniform float uReflect;
uniform float uHaze;
uniform float uShade;
uniform float uLight;
uniform vec4 uPing[4];
uniform float uPingAlpha[4];
uniform vec4 uHover;
uniform float uTime;
in vec2 vUv;
layout(location = 0) out vec4 outColor;
layout(location = 1) out vec4 outGlow;

struct Light {
  float grid;
  float fade;
  float core;
  float trail;
  float spill;
  float ping;
  float wake;
  float reveal;
};

float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

vec2 hash2(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.103, 0.0973));
  q += dot(q, q.yzx + 33.33);
  return fract((q.xx + q.yz) * q.zy);
}

float lines(float across, float along, float period, float dash, float fa, float fb) {
  float u = across / period;
  float du = fa / period;
  float d = abs(fract(u + 0.5) - 0.5) / max(du, 1e-5);
  float dense = smoothstep(0.1, 0.4, du);
  if (uStyle == 2) {
    float c = along / dash * 5.0;
    float dc = fb / dash * 5.0;
    float e = abs(fract(c + 0.5) - 0.5) / max(dc, 1e-5);
    float cov = clamp(uThick + 1.0 - length(vec2(d, e)), 0.0, 1.0);
    float mean = min(1.0, 3.1416 * (uThick + 0.5) * (uThick + 0.5) * du * dc);
    return mix(cov, mean, max(dense, smoothstep(0.1, 0.4, dc)));
  }
  float cov = clamp(uThick + 0.5 - d, 0.0, 1.0);
  float mean = min(1.0, 2.0 * uThick * du);
  if (uStyle == 1) {
    float c = along / dash * 4.0;
    float dc = fb / dash * 4.0;
    float e = abs(fract(c + 0.5) - 0.5);
    float m = clamp((0.25 - e) / max(dc, 1e-5) + 0.5, 0.0, 1.0);
    cov *= mix(m, 0.5, smoothstep(0.1, 0.4, dc));
    mean *= 0.5;
  }
  return mix(cov, mean, dense);
}

float depthFade(float z) {
  float n = clamp(z / uDepth, 0.0, 1.0);
  return mix(1.0, (exp(-3.0 * n) - 0.0497871) / 0.9502129, uFade);
}

vec3 project(vec3 eye, vec3 o, int face, float plane) {
  vec3 d = o - eye;
  float t = face == 0 ? (plane - o.x) / d.x : (face == 1 ? (plane - o.y) / d.y : (plane - o.z) / d.z);
  return o + d * t;
}

void trace(vec3 o, vec3 d, out int face, out float plane, out vec3 h) {
  float sx = d.x > 0.0 ? 0.5 * uAspect : -0.5 * uAspect;
  float sy = d.y > 0.0 ? 0.5 : -0.5;
  float tx = abs(d.x) > 1e-6 ? (sx - o.x) / d.x : 1e9;
  float ty = abs(d.y) > 1e-6 ? (sy - o.y) / d.y : 1e9;
  float t = (uDepth - o.z) / d.z;
  face = 2;
  plane = uDepth;
  if (tx < t) {
    face = 0;
    plane = sx;
    t = tx;
  }
  if (ty < t) {
    face = 1;
    plane = sy;
    t = ty;
  }
  h = o + d * t;
}

vec2 faceUv(vec3 h, int face) {
  if (face == 0) return vec2(h.z, h.y + 0.5);
  if (face == 1) return vec2(h.x + 0.5 * uAspect, h.z);
  return vec2(h.x + 0.5 * uAspect, h.y + 0.5);
}

Light illuminate(vec3 h, int face, vec2 uv, vec2 foot, float blur) {
  Light l;
  vec2 cell = face == 0 ? uCell.zy : (face == 1 ? uCell.xz : uCell.xy);
  vec2 f = foot * blur;
  float minor = max(lines(uv.x, uv.y, cell.x, cell.y, f.x, f.y), lines(uv.y, uv.x, cell.y, cell.x, f.y, f.x));
  float major = max(
    lines(uv.x, uv.y, cell.x * 4.0, cell.y, f.x, f.y),
    lines(uv.y, uv.x, cell.y * 4.0, cell.x, f.y, f.x)
  );
  l.grid = max(minor * 0.75, major) / blur;
  float z = h.z;
  l.fade = depthFade(z);
  l.reveal = smoothstep(uReveal, uReveal - 0.2, z);
  float zFoot = face == 0 ? f.x : (face == 1 ? f.y : 0.0);
  float width = max(uScanWidth, zFoot * 1.1);
  float dz = z - uScanZ;
  l.core = exp(-dz * dz / (width * width)) * (face == 2 ? 0.45 : 1.0) * uScanAlpha;
  float behind = -dz * uScanDir;
  l.trail = exp(-max(behind, 0.0) / uTrail) * smoothstep(-width, width * 0.5, behind) * uScanAlpha;
  l.spill = exp(-dz * dz / 0.05) * uScanAlpha;
  l.ping = 0.0;
  l.wake = 0.0;
  for (int i = 0; i < 4; i++) {
    float alpha = uPingAlpha[i];
    if (alpha <= 0.0) continue;
    float dist = length(h - uPing[i].xyz) - uPing[i].w;
    l.ping += exp(-dist * dist / 0.0012) * alpha;
    l.wake += exp(min(dist, 0.0) / 0.22) * smoothstep(0.03, -0.03, dist) * alpha;
  }
  return l;
}

void over(inout vec4 acc, vec3 color, float alpha) {
  alpha = clamp(alpha, 0.0, 1.0);
  acc = vec4(color * alpha, alpha) + acc * (1.0 - alpha);
}

void paint(inout vec4 color, inout float energy, Light l, float gain, float lift, float hover) {
  float base = l.grid * l.fade * l.reveal * lift;
  float far = l.fade * l.reveal * gain;
  float lit = l.grid * (l.core * 1.2 + l.trail * 0.75 + l.ping * 1.4 + l.wake * 0.5 + hover * 0.5) * far;
  float sheen = (l.core * 0.14 + l.spill * 0.05 + l.trail * 0.03 + l.ping * 0.2 + l.wake * 0.04) * far;
  float laser = (l.core + l.ping * 0.35) * far;
  over(color, uLineColor, base);
  over(color, uScanColor, sheen);
  over(color, uScanColor, lit);
  over(color, uCoreColor, laser * 0.9);
  energy += laser * 0.9 + lit * 0.5;
}

void main() {
  vec3 p = vec3((vUv.x - 0.5) * uAspect, vUv.y - 0.5, 0.0);
  vec3 d = p - uEye;
  int face;
  float plane;
  vec3 h;
  trace(p, d, face, plane, h);
  vec3 hx = project(uEye, p + vec3(uPixel, 0.0, 0.0), face, plane);
  vec3 hy = project(uEye, p + vec3(0.0, uPixel, 0.0), face, plane);
  vec2 uv = faceUv(h, face);
  vec2 ux = faceUv(hx, face) - uv;
  vec2 uy = faceUv(hy, face) - uv;
  vec2 foot = vec2(length(vec2(ux.x, uy.x)), length(vec2(ux.y, uy.y)));
  Light l = illuminate(h, face, uv, foot, 1.0);

  vec4 color = vec4(0.0);
  float energy = 0.0;

  if (uShade > 0.0) {
    vec2 gaps = face == 0
      ? vec2(0.5 - abs(h.y), uDepth - h.z)
      : (face == 1 ? vec2(0.5 * uAspect - abs(h.x), uDepth - h.z) : vec2(0.5 * uAspect - abs(h.x), 0.5 - abs(h.y)));
    vec2 crease = 1.0 - exp(-max(gaps, 0.0) / 0.16);
    float occlusion = crease.x * crease.y;
    float lamp = 1.0 / (1.0 + h.z * h.z * 0.9);
    float tilt = face == 1 ? (plane < 0.0 ? 1.1 : 0.85) : (face == 2 ? 0.8 : 1.0);
    float glowSpill = (l.spill * 0.5 + l.trail * 0.12) * l.reveal * l.fade;
    if (uLight > 0.5) {
      float shadow = (1.0 - lamp * tilt) * 0.09 + (1.0 - occlusion) * 0.2;
      over(color, vec3(0.0), shadow * uShade * l.reveal * l.fade);
    } else {
      over(color, vec3(1.0), lamp * tilt * occlusion * 0.11 * uShade * l.reveal * l.fade);
    }
    over(color, uScanColor, glowSpill * uShade * occlusion * 0.35);
  }

  if (face == 1 && plane < 0.0 && uReflect > 0.0) {
    vec3 mirror = vec3(uEye.x, -1.0 - uEye.y, uEye.z);
    vec3 r = h - mirror;
    int face2;
    float plane2;
    vec3 h2;
    trace(h, r, face2, plane2, h2);
    vec2 uv2 = faceUv(h2, face2);
    vec2 ux2 = faceUv(project(mirror, hx, face2, plane2), face2) - uv2;
    vec2 uy2 = faceUv(project(mirror, hy, face2, plane2), face2) - uv2;
    vec2 foot2 = vec2(length(vec2(ux2.x, uy2.x)), length(vec2(ux2.y, uy2.y)));
    float travel = length(h2 - h);
    Light m = illuminate(h2, face2, uv2, foot2, 1.0 + travel * 4.0);
    m.reveal *= l.reveal;
    float grazing = 1.0 - normalize(r).y;
    float gain = (0.3 + 0.7 * grazing * grazing * grazing * grazing) * uReflect * exp(-travel * 1.1) * (uLight > 0.5 ? 0.6 : 1.0);
    float reflected = 0.0;
    paint(color, reflected, m, gain, 0.0, 0.0);
    energy += reflected * 0.6;
  }

  vec3 near = h - uHover.xyz;
  float hover = exp(-dot(near, near) / 0.08) * uHover.w;
  paint(color, energy, l, 1.0, 1.0, hover);

  if (uPoints > 0.5) {
    vec2 cell = face == 0 ? uCell.zy : (face == 1 ? uCell.xz : uCell.xy);
    vec2 spacing = cell / 2.5;
    vec2 q = uv / spacing;
    vec2 id = floor(q);
    vec2 seed = id + vec2(float(face) * 13.7 + plane * 5.3, float(face) * 3.1);
    vec2 delta = (q - id - (0.2 + 0.6 * hash2(seed))) * spacing;
    float det = ux.x * uy.y - ux.y * uy.x;
    vec2 s = vec2(delta.x * uy.y - delta.y * uy.x, ux.x * delta.y - ux.y * delta.x) / det;
    float radius = uDot * mix(1.0, 0.55, clamp(h.z / uDepth, 0.0, 1.0));
    float spot = clamp(radius + 0.5 - length(s), 0.0, 1.0);
    float gap = min(spacing.x / foot.x, spacing.y / foot.y);
    float r = hash(seed + 7.7);
    float flicker = 0.75 + 0.25 * sin(uTime * (3.0 + r * 5.0) + r * 40.0);
    float dots = spot * smoothstep(5.0, 10.0, gap) * smoothstep(0.25, 0.6, r) * (0.3 + 0.7 * r * r) * flicker;
    float hot = l.core * 2.5 + l.ping * 1.6;
    float warm = l.trail * l.trail * 1.3 + l.wake * 0.6 + hover * 1.3;
    float spark = dots * (hot + warm) * l.fade * l.reveal;
    over(color, mix(uScanColor, uCoreColor, clamp(hot / max(hot + warm, 1e-4), 0.0, 1.0)), spark);
    energy += spark * 0.9;
  }

  if (uHaze > 0.0 && uScanAlpha > 0.0 && uScanZ > 0.0 && h.z > uScanZ) {
    vec3 c = p + d * (uScanZ / d.z);
    float grain = hash(floor(c.xy * 180.0) + floor(uTime * 24.0) * 7.0);
    float edge = min(0.5 * uAspect - abs(c.x), 0.5 - abs(c.y));
    float rim = exp(-edge / 0.06);
    float veil = uHaze * uScanAlpha * (0.45 + 0.9 * grain) * (0.55 + rim * 1.6);
    over(color, uScanColor, veil * depthFade(uScanZ) * l.reveal);
  }

  energy = clamp(energy, 0.0, 1.0);
  outColor = color;
  outGlow = vec4(uScanColor * energy, energy);
}`;
  const COMPOSITE = `#version 300 es
precision highp float;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform float uGlow;
in vec2 vUv;
out vec4 outColor;
float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
void main() {
  vec4 scene = texture(uScene, vUv);
  vec4 bloom = texture(uBloom, vUv) * uGlow;
  bloom.a = min(bloom.a, 1.0);
  bloom.rgb = min(bloom.rgb, vec3(bloom.a));
  vec4 color = scene + bloom * (1.0 - scene.a);
  float noise = (hash(gl_FragCoord.xy) - 0.5) / 255.0;
  color.a = clamp(color.a + noise, 0.0, 1.0);
  color.rgb = clamp(color.rgb + noise, vec3(0.0), vec3(color.a));
  outColor = color;
}`;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source); gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    console.warn("GridScan shader compile failed:", gl.getShaderInfoLog(shader)); gl.deleteShader(shader); return null;
  };
  const link = (fragment) => {
    const vs = compile(gl.VERTEX_SHADER, VERTEX), fs = compile(gl.FRAGMENT_SHADER, fragment);
    if (!vs || !fs) return null;
    const program = gl.createProgram(); gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
    gl.deleteShader(vs); gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { console.warn("GridScan link failed:", gl.getProgramInfoLog(program)); gl.deleteProgram(program); return null; }
    const uniforms = {};
    for (let i = 0; i < gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS); i++) {
      const info = gl.getActiveUniform(program, i); if (info) uniforms[info.name.replace(/\[0\]$/, "")] = gl.getUniformLocation(program, info.name.replace(/\[0\]$/, ""));
    }
    return { program, uniforms };
  };
  const makeTarget = () => {
    const texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return { texture, width: 0, height: 0 };
  };
  const sizeTarget = target => {
    if (target.width === canvas.width && target.height === canvas.height) return;
    target.width = canvas.width; target.height = canvas.height; gl.bindTexture(gl.TEXTURE_2D, target.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, target.width, target.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  };
  let frame = 0, last = 0, time = 0, intro = reduced ? 1 : 0, stopTimer = 0, visible = true, startedAt = 0;
  let width = 1, height = 1, dpr = 1, pointerInside = false;
  const eye = { x: 0, y: 0, f: 1.25, tx: 0, ty: 0, tf: 1.25, vx: 0, vy: 0, vf: 0 };
  const pointer = { x: .5, y: .5 };
  const look = { x: 0, y: 0, held: false };
  const scan = { z: 0, dir: 1, alpha: 0, start: 0, sweeps: 0, waiting: false };
  const pings = [], pingData = new Float32Array(16), pingAlpha = new Float32Array(4);
  const hover = { x: 0, y: 0, z: 0, strength: 0, ready: false };
  const room = gl ? link(ROOM) : null;
  const composite = gl ? link(COMPOSITE) : null;
  const scene = gl ? makeTarget() : null, glow = gl ? makeTarget() : null, framebuffer = gl ? gl.createFramebuffer() : null;
  const vao = gl?.createVertexArray();
  if (gl && room && composite) {
    gl.bindVertexArray(vao);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, scene.texture, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, glow.texture, 0);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  const aspect = () => width / Math.max(1, height);
  const roomSize = () => {
    const a = aspect(), cy = 1 / 8, cx = a / Math.max(1, Math.round(a / cy));
    return { aspect: a, cx, cy, depth: Math.max(cy, Math.round(4.2 / cy) * cy) };
  };
  const castRay = (u, v) => {
    const r = roomSize(), px = (u - .5) * r.aspect, py = v - .5;
    const dx = px - eye.x, dy = py - eye.y, dz = eye.f;
    const sx = dx > 0 ? .5 * r.aspect : -.5 * r.aspect, sy = dy > 0 ? .5 : -.5;
    let t = r.depth / dz;
    if (Math.abs(dx) > 1e-6) t = Math.min(t, (sx - px) / dx);
    if (Math.abs(dy) > 1e-6) t = Math.min(t, (sy - py) / dy);
    return { x: px + dx * t, y: py + dy * t, z: dz * t };
  };
  const resize = () => {
    const rect = root.getBoundingClientRect(); width = Math.max(1, rect.width); height = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 1.5); canvas.width = Math.max(1, Math.round(width * dpr)); canvas.height = Math.max(1, Math.round(height * dpr));
    if (gl && room && composite) {
      sizeTarget(scene); sizeTarget(glow); gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, scene.texture, 0);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, glow.texture, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    draw(); wake();
  };
  const drawFallback = () => {
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, width, height);
    const cx = width * (.5 + eye.x * .12), cy = height * (.5 - eye.y * .12), spread = Math.min(width, height) * .76;
    ctx.strokeStyle = "rgba(255,255,255,.48)"; ctx.lineWidth = 1;
    for (let i = 0; i < 14; i++) { const t = (i + 1) / 14; const w = spread * t, h = spread * .66 * t; ctx.strokeRect(cx - w / 2, cy - h / 2, w, h); }
    for (let i = -5; i <= 5; i++) { ctx.beginPath(); ctx.moveTo(cx + i * 4, cy); ctx.lineTo(width / 2 + i * width * .13, height); ctx.stroke(); }
    const y = (time * 95 % Math.max(1, height)); const gradient = ctx.createLinearGradient(0, y - 48, 0, y + 48);
    gradient.addColorStop(0, "rgba(255,255,255,0)"); gradient.addColorStop(.5, "rgba(255,255,255,.28)"); gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient; ctx.fillRect(0, y - 48, width, 96);
  };
  function draw() {
    if (!gl || !room || !composite) { drawFallback(); return; }
    const s = roomSize(), u = room.uniforms, c = composite.uniforms;
    const line = [1, 1, 1];
    gl.bindVertexArray(vao); gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer); gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    gl.viewport(0, 0, canvas.width, canvas.height); gl.useProgram(room.program);
    gl.uniform1f(u.uAspect, s.aspect); gl.uniform1f(u.uPixel, 1 / canvas.height); gl.uniform3f(u.uEye, eye.x, eye.y, -eye.f); gl.uniform1f(u.uDepth, s.depth);
    gl.uniform3f(u.uCell, s.cx, s.cy, s.cy); gl.uniform1f(u.uThick, .72 * dpr); gl.uniform1f(u.uDot, 1.8 * dpr); gl.uniform1i(u.uStyle, 0);
    gl.uniform3fv(u.uLineColor, line); gl.uniform3fv(u.uScanColor, line); gl.uniform3fv(u.uCoreColor, line);
    gl.uniform1f(u.uFade, .66); gl.uniform1f(u.uScanZ, scan.z); gl.uniform1f(u.uScanDir, scan.dir); gl.uniform1f(u.uScanAlpha, scan.alpha);
    gl.uniform1f(u.uScanWidth, .006); gl.uniform1f(u.uTrail, .59); gl.uniform1f(u.uReveal, intro < 1 ? scan.z + .05 : 1e4); gl.uniform1f(u.uPoints, 1);
    gl.uniform1f(u.uReflect, .24); gl.uniform1f(u.uHaze, .03); gl.uniform1f(u.uShade, .56); gl.uniform1f(u.uLight, 1);
    gl.uniform4fv(u.uPing, pingData); gl.uniform1fv(u.uPingAlpha, pingAlpha); gl.uniform4f(u.uHover, hover.x, hover.y, hover.z, hover.strength); gl.uniform1f(u.uTime, time);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, canvas.width, canvas.height); gl.useProgram(composite.program);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, scene.texture); gl.uniform1i(c.uScene, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, glow.texture); gl.uniform1i(c.uBloom, 1); gl.uniform1f(c.uGlow, .46);
    gl.drawArrays(gl.TRIANGLES, 0, 3); gl.activeTexture(gl.TEXTURE0);
  }
  const startSweep = () => { scan.dir = scan.sweeps % 2 ? -1 : 1; scan.start = time; scan.waiting = false; scan.sweeps++; };
  const updateScan = depth => {
    if (intro < 1) { scan.dir = 1; scan.z = intro * (depth + .4) - .2; scan.alpha = Math.min(1, intro * 6) * (1 - Math.max(0, intro - .85) / .15); return; }
    if (scan.sweeps === 0 && !scan.waiting) { scan.waiting = true; scan.start = time; scan.alpha = 0; }
    if (scan.waiting) { scan.alpha = 0; if (!reduced && time - scan.start > .22) startSweep(); return; }
    const k = (time - scan.start) / 2.4;
    if (k >= 1) { scan.waiting = true; scan.start = time; scan.alpha = 0; return; }
    const travel = k * (depth + .3) - .15; scan.z = scan.dir > 0 ? travel : depth - travel; scan.alpha = Math.min(1, k / .12) * Math.min(1, (1 - k) / .12);
  };
  function animate(now) {
    frame = 0; if (!visible || document.hidden || root.hidden) return;
    const dt = last ? clamp((now - last) / 1000, .001, .05) : 1 / 60; last = now; time += dt;
    if (intro < 1) intro = Math.min(1, intro + dt / 2.2);
    const r = roomSize(); updateScan(r.depth);
    const driftX = reduced ? 0 : Math.sin(time * .21) * .2 + Math.sin(time * .083 + 1.3) * .12;
    const driftY = reduced ? 0 : Math.sin(time * .17 + 2.1) * .16;
    eye.tx = (look.held ? look.x : driftX) * .65 * .22 * r.aspect; eye.ty = (look.held ? look.y : driftY) * .65 * .22;
    const steps = Math.max(1, Math.ceil(dt / (1 / 120))), h = dt / steps;
    for (let i = 0; i < steps; i++) { eye.vx += ((eye.tx - eye.x) * 42 - eye.vx * 11) * h; eye.vy += ((eye.ty - eye.y) * 42 - eye.vy * 11) * h; eye.vf += ((eye.tf - eye.f) * 42 - eye.vf * 11) * h; eye.x += eye.vx * h; eye.y += eye.vy * h; eye.f += eye.vf * h; }
    if (pointerInside && !reduced) { const target = castRay(pointer.x, pointer.y), k = 1 - Math.exp(-dt / .08); if (!hover.ready) { Object.assign(hover, target, { ready: true }); } hover.x += (target.x-hover.x)*k; hover.y += (target.y-hover.y)*k; hover.z += (target.z-hover.z)*k; }
    const hoverTarget = pointerInside && !reduced ? 1 : 0; hover.strength += (hoverTarget - hover.strength) * (1 - Math.exp(-dt / .25));
    for (let i = pings.length - 1; i >= 0; i--) { pings[i].age += dt; if (pings[i].age > 2.4) pings.splice(i, 1); }
    for (let i = 0; i < 4; i++) { const p = pings[i]; if (!p) { pingAlpha[i] = 0; continue; } const k = p.age / 2.4; pingData.set([p.x, p.y, p.z, p.age * 1.15], i * 4); pingAlpha[i] = Math.min(1, p.age / .05) * (1-k) * (1-k); }
    draw();
    if (intro < 1 || (!reduced && !scan.waiting) || (!reduced && scan.waiting) || pings.length || hover.strength > .002 || (!reduced && !look.held)) frame = requestAnimationFrame(animate); else last = 0;
  }
  function wake() { if (!frame && visible && !document.hidden && !root.hidden) frame = requestAnimationFrame(animate); }
  const locate = event => { const rect = root.getBoundingClientRect(); const u = (event.clientX - rect.left) / Math.max(1, rect.width), v = 1 - (event.clientY - rect.top) / Math.max(1, rect.height); return { u, v, inside: u >= 0 && u <= 1 && v >= 0 && v <= 1 }; };
  const onMove = event => { const p = locate(event); pointer.x = p.u; pointer.y = p.v; pointerInside = p.inside; if (p.inside) { look.x = p.u * 2 - 1; look.y = p.v * 2 - 1; look.held = true; } else look.held = false; wake(); };
  root.addEventListener("pointermove", onMove, { passive: true });
  root.addEventListener("pointerleave", () => { pointerInside = false; look.held = false; wake(); });
  root.addEventListener("pointerdown", event => { if (reduced) return; const p = locate(event); if (!p.inside) return; const hit = castRay(p.u, p.v); pings.unshift({ ...hit, age: 0 }); if (pings.length > 4) pings.pop(); wake(); }, { passive: true });
  document.addEventListener("visibilitychange", () => { last = 0; if (!document.hidden) wake(); else { cancelAnimationFrame(frame); frame = 0; } });
  new ResizeObserver(resize).observe(root);
  if ("IntersectionObserver" in window) new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); if (visible) wake(); else { cancelAnimationFrame(frame); frame = 0; } }).observe(root);
  resize();
  window.storyGridScan = {
    start() { clearTimeout(stopTimer); startedAt = performance.now(); cancelAnimationFrame(frame); root.hidden = false; requestAnimationFrame(() => root.classList.add("is-active")); intro = reduced ? 1 : 0; time = 0; scan.sweeps = 0; scan.waiting = false; scan.alpha = 0; scan.start = 0; last = 0; resize(); if (reduced) draw(); else wake(); },
    stop() {
      clearTimeout(stopTimer);
      const minimumVisibleMs = 4000;
      const remaining = Math.max(0, minimumVisibleMs - (performance.now() - startedAt));
      stopTimer = window.setTimeout(() => {
        root.classList.remove("is-active");
        stopTimer = window.setTimeout(() => { root.hidden = true; cancelAnimationFrame(frame); frame = 0; }, 420);
      }, remaining);
    }
  };
})();
