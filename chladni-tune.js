// Vanilla-canvas adaptation of OriginKit's Chladni Tune loader for the static story page.
(() => {
  const root = document.getElementById('story-loader');
  const canvas = document.getElementById('story-loader-canvas');
  if (!root || !canvas) return;
  const context = canvas.getContext('2d', { alpha: false });
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const random = (seed) => () => {
    seed |= 0; seed = seed + 0x6d2b79f5 | 0;
    let value = Math.imul(seed ^ seed >>> 15, 1 | seed);
    value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
  const rand = random(4211);
  const grains = Array.from({ length: 2600 }, () => ({ x: rand(), y: rand(), phase: rand() * Math.PI * 2, size: .7 + rand() * 1.1 }));
  let width = 0, height = 0, dpr = 1, frame = 0, time = 0, last = 0, pointer = null, stopTimer = 0;

  function resize() {
    const rect = root.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    draw(time);
  }

  function draw(t) {
    if (!width || !height) return;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.fillStyle = '#101513';
    context.fillRect(0, 0, width, height);
    const phase = t * .34;
    const n = 2 + Math.sin(phase) * .65;
    const m = 3 + Math.cos(phase * .77) * .75;
    const scale = Math.min(width, height);
    for (const grain of grains) {
      const x = grain.x;
      const y = grain.y;
      const a = Math.cos(Math.PI * n * x) * Math.cos(Math.PI * m * y);
      const b = Math.cos(Math.PI * m * x) * Math.cos(Math.PI * n * y);
      const node = Math.abs(a - b);
      const density = Math.max(0, 1 - node / .34);
      const drift = Math.sin(t * .8 + grain.phase) * .8;
      const influence = pointer ? Math.max(0, 1 - Math.hypot(x - pointer.x, y - pointer.y) * 3) : 0;
      const px = x * width + drift + (pointer ? (x - pointer.x) * influence * 5 : 0);
      const py = y * height + Math.cos(t * .65 + grain.phase) * .7 + (pointer ? (y - pointer.y) * influence * 5 : 0);
      context.globalAlpha = .13 + density * .72;
      context.fillStyle = density > .55 ? '#e5eee7' : '#789b80';
      const size = grain.size * dpr * (.72 + density * .55) * (scale / 460);
      context.fillRect(px, py, Math.max(.7, size), Math.max(.7, size));
    }
    context.globalAlpha = 1;
    const vignette = context.createRadialGradient(width / 2, height / 2, scale * .1, width / 2, height / 2, scale * .76);
    vignette.addColorStop(0, 'rgba(4,7,6,0)');
    vignette.addColorStop(1, 'rgba(4,7,6,.72)');
    context.fillStyle = vignette;
    context.fillRect(0, 0, width, height);
  }

  function animate(now) {
    frame = requestAnimationFrame(animate);
    const dt = last ? Math.min(.05, (now - last) / 1000) : 0;
    last = now;
    time += dt;
    draw(time);
  }

  root.addEventListener('pointermove', (event) => {
    const rect = root.getBoundingClientRect();
    pointer = { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
  }, { passive: true });
  root.addEventListener('pointerleave', () => { pointer = null; });

  window.storyChladni = {
    start() {
      clearTimeout(stopTimer);
      cancelAnimationFrame(frame);
      root.hidden = false;
      requestAnimationFrame(() => root.classList.add('is-active'));
      resize();
      last = 0;
      if (!reducedMotion) frame = requestAnimationFrame(animate);
      else draw(0);
    },
    stop() {
      root.classList.remove('is-active');
      stopTimer = window.setTimeout(() => {
        root.hidden = true;
        cancelAnimationFrame(frame);
      }, 420);
    },
  };
  new ResizeObserver(resize).observe(root);
})();
