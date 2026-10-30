// React Bits Flying Posters WebGL shaders adapted from the code supplied by the user.
const VERTEX = `#version 300 es
in vec2 aPosition;
in vec4 aPoster;
uniform mat4 uProjection;
uniform float uCamera;
uniform vec2 uPoster;
uniform float uDepth;
uniform float uSpacing;
uniform float uLoop;
uniform float uColumnGap;
uniform float uColumns;
uniform float uScroll;
uniform float uAlternate;
uniform float uViewHeight;
uniform float uRotation;
uniform float uDistortion;
uniform vec3 uAxis;
uniform float uLean;
out vec2 vUv;
out float vItem;
out float vFacing;
out float vScreenY;

mat4 rotationMatrix(vec3 axis, float angle) {
  axis = normalize(axis);
  float s = sin(angle);
  float c = cos(angle);
  float oc = 1.0 - c;
  return mat4(
    oc * axis.x * axis.x + c, oc * axis.x * axis.y - axis.z * s, oc * axis.z * axis.x + axis.y * s, 0.0,
    oc * axis.x * axis.y + axis.z * s, oc * axis.y * axis.y + c, oc * axis.y * axis.z - axis.x * s, 0.0,
    oc * axis.z * axis.x - axis.y * s, oc * axis.y * axis.z + axis.x * s, oc * axis.z * axis.z + c, 0.0,
    0.0, 0.0, 0.0, 1.0
  );
}

vec3 rotate(vec3 v, vec3 axis, float angle) {
  return (rotationMatrix(axis, angle) * vec4(v, 1.0)).xyz;
}

float qinticInOut(float t) {
  return t < 0.5 ? 16.0 * pow(t, 5.0) : -0.5 * abs(pow(2.0 * t - 2.0, 5.0)) + 1.0;
}

void main() {
  float column = aPoster.x;
  float direction = uAlternate > 0.5 && mod(column, 2.0) > 0.5 ? -1.0 : 1.0;
  float base = -uLoop * 0.5 + (aPoster.y + 0.5) * uSpacing + column * 0.41 * uSpacing;
  float y = mod(base - uScroll * direction + uLoop * 0.5, uLoop) - uLoop * 0.5;
  float x = (column - (uColumns - 1.0) * 0.5) * uColumnGap;
  float position = 5.0 + (y + uViewHeight) / (2.0 * uViewHeight) * 10.0;
  float offset = (dot(vec2(1.0, 1.0), aPosition) + 0.25) / 0.5;
  float progress = clamp(
    (clamp(position * 0.05, 0.0, 1.0) - 0.01 * uDistortion * offset) / (1.0 - 0.01 * uDistortion),
    0.0,
    2.0
  );
  float angle = qinticInOut(progress) * uRotation;
  vec3 local = rotate(vec3(aPosition, 0.0), uAxis, angle);
  vec3 normal = rotate(vec3(0.0, 0.0, 1.0), uAxis, angle);
  local = rotate(local * vec3(uPoster, uDepth), vec3(1.0, 0.0, 0.0), uLean * direction);
  normal = rotate(normal, vec3(1.0, 0.0, 0.0), uLean * direction);
  vec3 world = local + vec3(x, y, 0.0);
  gl_Position = uProjection * vec4(world.xy, world.z - uCamera, 1.0);
  vUv = aPosition + 0.5;
  vItem = aPoster.z;
  vFacing = normal.z;
  vScreenY = gl_Position.y / gl_Position.w;
}`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D uAtlas;
uniform float uCells;
uniform float uInset;
uniform vec2 uPoster;
uniform float uRadius;
uniform float uFade;
uniform float uShading;
uniform float uReveal;
in vec2 vUv;
in float vItem;
in float vFacing;
in float vScreenY;
out vec4 outColor;

void main() {
  vec2 p = (vUv - 0.5) * uPoster;
  float r = min(uRadius, 0.5 * min(uPoster.x, uPoster.y));
  vec2 q = abs(p) - (0.5 * uPoster - r);
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  float aa = max(fwidth(d), 0.0001);
  float mask = r > 0.0 ? 1.0 - smoothstep(-aa, aa, d) : 1.0;
  vec2 cell = vec2(mod(vItem, uCells), floor(vItem / uCells));
  vec2 local = vec2(vUv.x, 1.0 - vUv.y);
  vec4 sampled = texture(uAtlas, (cell + uInset + local * (1.0 - 2.0 * uInset)) / uCells);
  vec3 color = sampled.rgb;
  color *= mix(1.0, 0.4 + 0.6 * abs(vFacing), uShading);
  float t = clamp((1.0 - abs(vScreenY)) / max(uFade, 0.0001), 0.0, 1.0);
  float fade = uFade > 0.0 ? t * t * t * (t * (t * 6.0 - 15.0) + 10.0) : 1.0;
  float alpha = sampled.a * mask * fade * uReveal;
  if (alpha < 0.002) discard;
  outColor = vec4(color * alpha, alpha);
}`;


// Standalone adapter for the story page. Poster art is rendered locally from sourced chapter titles.
window.renderFlyingPosters = (root, chapters) => {
  const canvas = root.querySelector('canvas');
  const gl = canvas?.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: true });
  if (!gl || !chapters?.length) return;
  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return null;
    return shader;
  };
  const vertex = compile(gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT);
  if (!vertex || !fragment) return;
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  const names = ['uProjection','uCamera','uPoster','uDepth','uSpacing','uLoop','uColumnGap','uColumns','uScroll','uAlternate','uViewHeight','uRotation','uDistortion','uAxis','uLean','uAtlas','uCells','uInset','uRadius','uFade','uShading','uReveal'];
  const u = Object.fromEntries(names.map((name) => [name, gl.getUniformLocation(program, name)]));
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-.5,-.5,.5,-.5,-.5,.5,.5,.5]), gl.STATIC_DRAW);
  const pos = gl.getAttribLocation(program, 'aPosition');
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([2,0,3,0,1,3]), gl.STATIC_DRAW);
  const posterBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posterBuffer);
  const poster = gl.getAttribLocation(program, 'aPoster');
  gl.enableVertexAttribArray(poster);
  gl.vertexAttribPointer(poster, 4, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(poster, 1);
  gl.bindVertexArray(null);
  const atlas = document.createElement('canvas');
  const ctx = atlas.getContext('2d');
  const cells = Math.ceil(Math.sqrt(chapters.length));
  const cell = 512;
  atlas.width = atlas.height = cells * cell;
  const palette = [
    ['#10251a','#86a98d'],['#142c20','#9eb7a1'],['#183222','#a4bea8'],
    ['#152a20','#91b09a'],['#182b30','#aac3c1'],['#14291d','#8eae95']
  ];
  chapters.forEach((chapter, index) => {
    const x = (index % cells) * cell, y = Math.floor(index / cells) * cell;
    const [dark, accent] = palette[index % palette.length];
    const grad = ctx.createLinearGradient(x, y, x + cell, y + cell);
    grad.addColorStop(0, dark); grad.addColorStop(1, '#101a1a');
    ctx.fillStyle = grad; ctx.fillRect(x, y, cell, cell);
    ctx.strokeStyle = `${accent}60`; ctx.lineWidth = 2;
    for (let ring = 0; ring < 4; ring++) {
      ctx.beginPath(); ctx.arc(x + 256, y + 205, 105 + ring * 28, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = `${accent}33`; ctx.font = "220px 'Noto Serif KR',serif"; ctx.textAlign = 'center';
    ctx.fillText('史', x + 256, y + 274);
    ctx.strokeStyle = `${accent}8a`; ctx.strokeRect(x + 28, y + 28, 456, 456);
    ctx.fillStyle = accent; ctx.textAlign = 'left';
    ctx.font = '600 21px DM Sans,sans-serif';
    ctx.fillText(String(index + 1).padStart(2, '0') + '  /  장면', x + 55, y + 65);
    ctx.font = '500 34px "Noto Serif KR",serif';
    const title = [...String(chapter.title || '')];
    let row = '', lines = [];
    title.forEach((char) => {
      if (ctx.measureText(row + char).width > 390 && row) { lines.push(row); row = char; }
      else row += char;
    });
    if (row) lines.push(row);
    lines.slice(0, 2).forEach((line, lineIndex) => ctx.fillText(line, x + 55, y + 359 + lineIndex * 46));
    ctx.font = '500 23px "Noto Serif KR",serif';
    ctx.fillStyle = '#eef2ee';
    ctx.fillText(String(chapter.date || '').slice(0, 18), x + 55, y + 451);
  });
  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
  gl.generateMipmap(gl.TEXTURE_2D);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width = 1, height = 1, count = 0, slots = 0, columns = 2;
  let target = 0, scroll = 0, lean = 0, visible = true, raf = 0, last = 0, pageY = window.scrollY;
  const metrics = () => {
    const fov = Math.PI / 4;
    const unit = height / (2 * Math.tan(fov / 2) * 20);
    const distance = 20 * unit;
    const scale = 2 * distance * Math.tan(fov / 2) / height;
    const spacing = 287 + 4 * unit;
    return { fov, unit, distance, scale, spacing };
  };
  const render = () => {
    const { fov, unit, distance, spacing } = metrics();
    const aspect = width / height;
    const f = 1 / Math.tan(fov / 2);
    const near = distance * 0.02, far = distance * 4;
    const projection = new Float32Array(16);
    projection[0] = f / aspect; projection[5] = f;
    projection[10] = (far + near) / (near - far);
    projection[11] = -1;
    projection[14] = 2 * far * near / (near - far);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(program);
    gl.uniformMatrix4fv(u.uProjection, false, projection);
    gl.uniform1f(u.uCamera, distance);
    gl.uniform2f(u.uPoster, 215, 287);
    gl.uniform1f(u.uDepth, unit);
    gl.uniform1f(u.uSpacing, spacing);
    gl.uniform1f(u.uLoop, slots * spacing);
    gl.uniform1f(u.uColumnGap, 245);
    gl.uniform1f(u.uColumns, columns);
    gl.uniform1f(u.uScroll, scroll);
    gl.uniform1f(u.uAlternate, 1);
    gl.uniform1f(u.uViewHeight, height);
    gl.uniform1f(u.uRotation, 0.20);
    gl.uniform1f(u.uDistortion, 1.7);
    gl.uniform3f(u.uAxis, 0, 1, 0);
    gl.uniform1f(u.uLean, lean);
    gl.uniform1f(u.uCells, cells);
    gl.uniform1f(u.uInset, 1.5 / cell);
    gl.uniform1f(u.uRadius, 8);
    gl.uniform1f(u.uFade, 0.13);
    gl.uniform1f(u.uShading, 0.3);
    gl.uniform1f(u.uReveal, 1);
    gl.uniform1i(u.uAtlas, 0);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.bindVertexArray(vao);
    gl.drawElementsInstanced(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0, count);
    gl.bindVertexArray(null);
  };
  const resize = () => {
    width = Math.max(1, root.clientWidth); height = Math.max(1, root.clientHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 1.8);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    columns = width < 500 ? 1 : width < 760 ? 2 : 3;
    slots = Math.max(chapters.length, 4);
    count = slots * columns;
    const items = new Float32Array(count * 4);
    for (let col = 0; col < columns; col++) for (let slot = 0; slot < slots; slot++)
      items.set([col, slot, (slot + col * 2) % chapters.length, 0], (col * slots + slot) * 4);
    gl.bindBuffer(gl.ARRAY_BUFFER, posterBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, items, gl.STATIC_DRAW);
    render(); wake();
  };
  const tick = (now) => {
    raf = 0;
    if (!visible || document.hidden) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1/60;
    last = now;
    if (!reduced) target -= 15 * dt;
    const prior = scroll;
    scroll += (target - scroll) * (1 - Math.pow(.92, dt * 60));
    const velocity = (scroll - prior) / dt;
    lean += ((reduced ? 0 : Math.max(-.18, Math.min(.18, -velocity * .00035))) - lean) * .06;
    render();
    if (!reduced || Math.abs(target-scroll) > .1) raf = requestAnimationFrame(tick);
  };
  const wake = () => { if (!raf) raf = requestAnimationFrame(tick); };
  root.addEventListener('pointermove', (event) => {
    if (reduced) return;
    const rect = root.getBoundingClientRect();
    root.style.setProperty('--poster-pointer', `${(event.clientX - rect.left) / rect.width}`);
  }, { passive: true });
  window.addEventListener('scroll', () => {
    const next = window.scrollY;
    target += (next - pageY) * .18;
    pageY = next; wake();
  }, { passive: true });
  new ResizeObserver(resize).observe(root);
  new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; if (visible) { last = 0; wake(); } }).observe(root);
  root.classList.add('poster-ready');
  resize();
};
