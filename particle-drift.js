// Adapted from OriginKit Particle Drift for this buildless site.
// https://www.originkit.dev/components/particle-drift
(() => {
  const canvas = document.querySelector('#hero-particles');
  if (!canvas) return;
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, depth: false, premultipliedAlpha: true });
  if (!gl) return;

  const lineVert = `precision highp float;
    attribute vec2 a_p0, a_p1, a_corner;
    attribute vec3 a_shade;
    uniform vec2 uSize;
    varying float v_alpha, v_mix, v_off, v_half;
    void main(){
      vec2 d=a_p1-a_p0; float len=max(length(d),1e-5);
      vec2 nrm=vec2(-d.y,d.x)/len;
      float half_=max(a_shade.z*0.5,0.35);
      float ext=half_+0.75;
      vec2 p=mix(a_p0,a_p1,a_corner.x)+nrm*a_corner.y*ext;
      v_alpha=a_shade.x; v_mix=a_shade.y; v_off=a_corner.y*ext; v_half=half_;
      gl_Position=vec4(p.x/uSize.x*2.0-1.0,1.0-p.y/uSize.y*2.0,0.0,1.0);
    }`;
  const lineFrag = `precision mediump float;
    uniform vec3 uBase, uAccent;
    varying float v_alpha, v_mix, v_off, v_half;
    void main(){
      float cov=clamp((v_half-abs(v_off))/0.75+0.5,0.0,1.0);
      float a=v_alpha*cov;
      vec3 col=mix(uBase,uAccent,v_mix);
      gl_FragColor=vec4(col*a,a);
    }`;
  const dotVert = `precision highp float;
    attribute vec2 a_pos;
    attribute float a_lit;
    uniform vec2 uSize;
    uniform float uDpr,uDot;
    varying float v_lit;
    void main(){
      gl_PointSize=max(1.0,uDot*uDpr);
      v_lit=a_lit;
      gl_Position=vec4(a_pos.x/uSize.x*2.0-1.0,1.0-a_pos.y/uSize.y*2.0,0.0,1.0);
    }`;
  const dotFrag = `precision mediump float;
    uniform vec3 uBase,uAccent;
    uniform float uRestAlpha;
    varying float v_lit;
    void main(){
      float d=length(gl_PointCoord-0.5)*2.0;
      float disc=1.0-smoothstep(0.72,1.0,d);
      vec3 col=mix(uBase,uAccent,v_lit);
      float a=disc*mix(uRestAlpha,1.0,v_lit);
      if(a<=0.004) discard;
      gl_FragColor=vec4(col*a,a);
    }`;

  function shader(type, source) {
    const item = gl.createShader(type);
    gl.shaderSource(item, source);
    gl.compileShader(item);
    if (!gl.getShaderParameter(item, gl.COMPILE_STATUS)) {
      console.warn('Particle Drift shader unavailable:', gl.getShaderInfoLog(item));
      return null;
    }
    return item;
  }
  function program(vertex, fragment) {
    const vs = shader(gl.VERTEX_SHADER, vertex);
    const fs = shader(gl.FRAGMENT_SHADER, fragment);
    if (!vs || !fs) return null;
    const result = gl.createProgram();
    gl.attachShader(result, vs);
    gl.attachShader(result, fs);
    gl.linkProgram(result);
    return gl.getProgramParameter(result, gl.LINK_STATUS) ? result : null;
  }
  const linesProgram = program(lineVert, lineFrag);
  const dotsProgram = program(dotVert, dotFrag);
  if (!linesProgram || !dotsProgram) return;

  const corners = [[0, -1], [1, -1], [1, 1], [0, -1], [1, 1], [0, 1]];
  const maxLines = 2400;
  const p0 = new Float32Array(maxLines * 12);
  const p1 = new Float32Array(maxLines * 12);
  const cornerData = new Float32Array(maxLines * 12);
  const shade = new Float32Array(maxLines * 18);
  for (let i = 0; i < maxLines; i++) for (let c = 0; c < 6; c++) {
    const at = (i * 6 + c) * 2;
    cornerData[at] = corners[c][0];
    cornerData[at + 1] = corners[c][1];
  }
  function buffer(bytes, data) {
    const result = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, result);
    gl.bufferData(gl.ARRAY_BUFFER, data || bytes, data ? gl.STATIC_DRAW : gl.DYNAMIC_DRAW);
    return result;
  }
  const lineBuffers = [buffer(p0.byteLength), buffer(p1.byteLength), buffer(0, cornerData), buffer(shade.byteLength)];
  const count = matchMedia('(max-width: 520px)').matches ? 55 : 95;
  const x = new Float32Array(count), y = new Float32Array(count), speed = new Float32Array(count);
  const positions = new Float32Array(count * 2), lit = new Float32Array(count);
  const dotBuffers = [buffer(positions.byteLength), buffer(lit.byteLength)];
  let seed = 20260824;
  const random = () => {
    seed += 0x6d2b79f5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pointer = { x: -10000, y: -10000 };
  let width = 0, height = 0, last = performance.now(), frame = 0, visible = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    if (w === width && h === height && canvas.width === Math.round(w * dpr)) return dpr;
    const sx = w / (width || w || 1), sy = h / (height || h || 1);
    width = w; height = h;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < count; i++) {
      if (!speed[i]) { x[i] = random() * w; y[i] = random() * h; speed[i] = (random() * .4 + .1) * 24; }
      else { x[i] *= sx; y[i] *= sy; }
    }
    return dpr;
  }
  function pushLine(index, x0, y0, x1, y1, alpha, mix, thickness) {
    if (index >= maxLines) return index;
    for (let c = 0; c < 6; c++) {
      const k = (index * 6 + c) * 2;
      const s = (index * 6 + c) * 3;
      p0[k] = x0; p0[k + 1] = y0;
      p1[k] = x1; p1[k + 1] = y1;
      shade[s] = alpha; shade[s + 1] = mix; shade[s + 2] = thickness;
    }
    return index + 1;
  }
  function attribute(program, name, bufferRef, data, size) {
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferRef);
    if (data) gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
    const loc = gl.getAttribLocation(program, name);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    return loc;
  }
  function colors(program) {
    gl.uniform3f(gl.getUniformLocation(program, 'uBase'), .88, .92, .9);
    gl.uniform3f(gl.getUniformLocation(program, 'uAccent'), 1, 1, 1);
    gl.uniform2f(gl.getUniformLocation(program, 'uSize'), width, height);
  }
  function render(now) {
    frame = 0;
    if (!visible || document.hidden) return;
    const dpr = resize();
    const dt = Math.min(.05, (now - last) / 1000);
    last = now;
    let lines = 0;
    for (let i = 0; i < count; i++) {
      if (!reduced) { x[i] += speed[i] * dt * .18; y[i] += speed[i] * dt; }
      if (x[i] > width + 20) x[i] = -20;
      if (y[i] > height + 20) { y[i] = -20; x[i] = random() * width; }
      const dx = pointer.x - x[i], dy = pointer.y - y[i];
      const distance = Math.hypot(dx, dy);
      lit[i] = distance < 145 ? 1 : 0;
      if (lit[i]) lines = pushLine(lines, x[i], y[i], pointer.x, pointer.y, .22 * (1 - distance / 145), 1, 1);
      positions[i * 2] = x[i]; positions[i * 2 + 1] = y[i];
    }
    for (let i = 0; i < count && lines < maxLines; i++) for (let j = i + 1; j < count && lines < maxLines; j++) {
      const distance = Math.hypot(x[i] - x[j], y[i] - y[j]);
      if (distance < 105) lines = pushLine(lines, x[i], y[i], x[j], y[j], .13 * (1 - distance / 105), 0, 1);
    }
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    if (lines) {
      gl.useProgram(linesProgram);
      const vertices = lines * 6;
      const attrs = [
        attribute(linesProgram, 'a_p0', lineBuffers[0], p0.subarray(0, vertices * 2), 2),
        attribute(linesProgram, 'a_p1', lineBuffers[1], p1.subarray(0, vertices * 2), 2),
        attribute(linesProgram, 'a_corner', lineBuffers[2], null, 2),
        attribute(linesProgram, 'a_shade', lineBuffers[3], shade.subarray(0, vertices * 3), 3)
      ];
      colors(linesProgram);
      gl.drawArrays(gl.TRIANGLES, 0, vertices);
      attrs.forEach((loc) => gl.disableVertexAttribArray(loc));
    }
    gl.useProgram(dotsProgram);
    const dotAttrs = [attribute(dotsProgram, 'a_pos', dotBuffers[0], positions, 2), attribute(dotsProgram, 'a_lit', dotBuffers[1], lit, 1)];
    colors(dotsProgram);
    gl.uniform1f(gl.getUniformLocation(dotsProgram, 'uDpr'), dpr);
    gl.uniform1f(gl.getUniformLocation(dotsProgram, 'uDot'), 2.5);
    gl.uniform1f(gl.getUniformLocation(dotsProgram, 'uRestAlpha'), .45);
    gl.drawArrays(gl.POINTS, 0, count);
    dotAttrs.forEach((loc) => gl.disableVertexAttribArray(loc));
    if (!reduced) frame = requestAnimationFrame(render);
  }
  function start() { if (!frame && !document.hidden && visible) { last = performance.now(); frame = requestAnimationFrame(render); } }
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start(); else { cancelAnimationFrame(frame); frame = 0; }
  });
  observer.observe(canvas);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else start();
  });
  canvas.addEventListener('pointermove', (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left; pointer.y = event.clientY - rect.top;
    if (reduced) start();
  });
  canvas.addEventListener('pointerleave', () => { pointer.x = -10000; pointer.y = -10000; if (reduced) start(); });
})();
