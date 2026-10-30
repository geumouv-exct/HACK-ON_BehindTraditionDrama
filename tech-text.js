// Canvas adaptation of the supplied TechText interaction for the archive name.
(() => {
  const title = document.querySelector('.home-tech-title');
  const canvas = document.querySelector('#home-tech-canvas');
  const context = canvas?.getContext('2d');
  if (!title || !canvas || !context) return;

  const text = '사극의 뒤편';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const glyphs = Array.from(text).map((char) => ({ char, x: 0, width: 0, dx: 0, dy: 0, vx: 0, vy: 0, alpha: 0 }));
  const pointer = { x: -1000, y: -1000, active: false };
  let width = 1, height = 1, dpr = 1, size = 48, baseline = 0;
  let frame = 0, last = 0, start = performance.now(), dragging = -1;

  function resize() {
    const rect = title.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, rect.width); height = Math.max(1, rect.height);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    size = Math.min(height * .82, width / (text.length * .96));
    context.font = `600 ${size}px "Noto Sans KR", sans-serif`;
    const gap = size * .02;
    const total = glyphs.reduce((sum, glyph) => sum + context.measureText(glyph.char).width + gap, -gap);
    let x = (width - total) / 2;
    glyphs.forEach((glyph) => {
      glyph.x = x;
      glyph.width = context.measureText(glyph.char).width;
      x += glyph.width + gap;
    });
    baseline = (height + size * .68) / 2;
    wake();
  }

  function nearestGlyph(x, y) {
    if (Math.abs(y - baseline + size * .36) > size * .72) return -1;
    return glyphs.reduce((best, glyph, index) => {
      const distance = x < glyph.x ? glyph.x - x : x > glyph.x + glyph.width ? x - glyph.x - glyph.width : 0;
      return distance < best.distance ? { index, distance } : best;
    }, { index: -1, distance: Infinity }).index;
  }

  function draw(now) {
    frame = 0;
    const dt = Math.min(.04, last ? (now - last) / 1000 : 1 / 60);
    last = now;
    const intro = reduced ? 1 : Math.min(1, (now - start) / 980);
    const focus = pointer.active ? nearestGlyph(pointer.x, pointer.y) : -1;
    context.clearRect(0, 0, width, height);
    context.textBaseline = 'alphabetic';
    context.font = `600 ${size}px "Noto Sans KR", sans-serif`;
    let moving = intro < 1;
    glyphs.forEach((glyph, index) => {
      const localIntro = reduced ? 1 : Math.max(0, Math.min(1, (intro - index / glyphs.length * .35) / .65));
      const backC1 = 1.70158, backC3 = backC1 + 1;
      const spring = 1 + backC3 * Math.pow(localIntro - 1, 3) + backC1 * Math.pow(localIntro - 1, 2);
      const entranceX = reduced ? 0 : (spring - 1) * Math.min(150, width * .32);
      glyph.alpha += (localIntro - glyph.alpha) * Math.min(1, dt * 9);
      const selected = index === focus;
      if (dragging !== index) {
        glyph.vx += -glyph.dx * 82 * dt;
        glyph.vy += -glyph.dy * 82 * dt;
        glyph.vx *= Math.exp(-11 * dt); glyph.vy *= Math.exp(-11 * dt);
        glyph.dx += glyph.vx * dt; glyph.dy += glyph.vy * dt;
      }
      if (Math.abs(glyph.dx) + Math.abs(glyph.dy) + Math.abs(glyph.vx) + Math.abs(glyph.vy) > .08) moving = true;
      context.save();
      context.globalAlpha = glyph.alpha;
      context.fillStyle = selected ? '#3b8058' : '#eef2ee';
      context.shadowColor = selected ? '#246342cc' : '#315c3f35';
      context.shadowBlur = selected ? 20 : 7;
      context.fillText(glyph.char, glyph.x + entranceX + glyph.dx, baseline + glyph.dy);
      if (selected && !reduced) {
        context.shadowBlur = 0; context.globalAlpha = .9;
        context.strokeStyle = '#2d714b'; context.lineWidth = Math.max(1, size / 62);
        context.setLineDash([Math.max(2, size / 22), Math.max(2, size / 34)]);
        context.lineDashOffset = -now * .018;
        context.strokeText(glyph.char, glyph.x + entranceX + glyph.dx, baseline + glyph.dy);
        context.setLineDash([]);
        context.globalAlpha = .78; context.strokeStyle = '#1c5638'; context.strokeRect(glyph.x + entranceX + glyph.dx - 5, baseline - size * .82 + glyph.dy, glyph.width + 10, size * .99);
      }
      context.restore();
    });
    if ((moving || pointer.active || dragging >= 0) && !reduced) frame = requestAnimationFrame(draw);
    else last = 0;
  }

  function wake() { if (!frame && !reduced) frame = requestAnimationFrame(draw); else if (reduced) draw(performance.now()); }
  function locate(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left; pointer.y = event.clientY - rect.top; pointer.active = true;
  }
  canvas.addEventListener('pointermove', (event) => {
    locate(event);
    if (dragging >= 0) {
      const glyph = glyphs[dragging];
      glyph.dx = pointer.x - glyph.x - glyph.width / 2;
      glyph.dy = pointer.y - baseline + size * .36;
      glyph.vx = glyph.vy = 0;
    }
    wake();
  }, { passive: true });
  canvas.addEventListener('pointerleave', () => { pointer.active = false; if (dragging < 0) wake(); });
  canvas.addEventListener('pointerdown', (event) => {
    locate(event);
    const index = nearestGlyph(pointer.x, pointer.y);
    if (index < 0 || (event.pointerType === 'mouse' && event.button !== 0)) return;
    dragging = index; canvas.setPointerCapture?.(event.pointerId); wake();
  });
  const release = () => {
    if (dragging < 0) return;
    const glyph = glyphs[dragging];
    glyph.vx = (Math.random() - .5) * 24; glyph.vy = -20;
    dragging = -1; wake();
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(title);
  else window.addEventListener('resize', resize, { passive: true });
  resize();
  const reveal = () => {
    glyphs.forEach((glyph) => { glyph.alpha = 0; glyph.dx = glyph.dy = glyph.vx = glyph.vy = 0; });
    start = performance.now();
    resize();
    title.classList.add('is-ready');
  };
  if (document.fonts?.ready) document.fonts.ready.then(reveal);
  else reveal();
})();
