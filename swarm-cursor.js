// Lightweight canvas adaptation of the supplied SwarmCursor for a static site.
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce), (pointer: coarse)').matches) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'swarm-cursor-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);
  const context = canvas.getContext('2d', { alpha: true, desynchronized: true });
  if (!context) { canvas.remove(); return; }

  const count = Math.min(230, Math.max(145, Math.round(innerWidth * .13)));
  const particles = Array.from({ length: count }, () => ({
    x: innerWidth / 2, y: innerHeight / 2, vx: 0, vy: 0,
    angle: Math.random() * Math.PI * 2,
    orbit: 4 + Math.random() * 27,
    size: .7 + Math.random() * 2.2,
    tint: Math.random(), phase: Math.random() * Math.PI * 2,
    stretch: Math.random() < .32
  }));
  const pointer = { x: innerWidth / 2, y: innerHeight / 2, px: innerWidth / 2, py: innerHeight / 2, inside: false, down: false, burst: 0 };
  let width = innerWidth, height = innerHeight, dpr = 1, frame = 0, previous = 0, visible = true;
  let lastMove = 0, speed = 0;

  function resize() {
    width = innerWidth; height = innerHeight; dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function tick(now) {
    frame = 0;
    if (!visible || document.visibilityState !== 'visible') return;
    const delta = Math.min(.035, previous ? (now - previous) / 1000 : 1 / 60);
    previous = now;
    context.clearRect(0, 0, width, height);
    const moving = now - lastMove < 100;
    const impulse = moving ? Math.min(1, speed / 18) : 0;
    pointer.burst *= Math.exp(-delta * 4.2);
    const radius = 24 + impulse * 17;
    particles.forEach((particle, index) => {
      particle.phase += delta * (1.3 + particle.tint);
      particle.angle += delta * (.2 + particle.tint * .55) * (particle.tint > .5 ? 1 : -1);
      const sway = Math.sin(particle.phase) * (2 + impulse * 5);
      const targetX = pointer.x + Math.cos(particle.angle) * (particle.orbit + impulse * radius) + sway;
      const targetY = pointer.y + Math.sin(particle.angle) * (particle.orbit * .65 + impulse * radius * .7);
      const dx = targetX - particle.x, dy = targetY - particle.y;
      const curl = impulse * .09;
      particle.vx += (dx * 78 - dy * curl) * delta;
      particle.vy += (dy * 78 + dx * curl) * delta;
      particle.vx *= Math.exp(-delta * 12); particle.vy *= Math.exp(-delta * 12);
      particle.x += particle.vx * delta; particle.y += particle.vy * delta;

      const alpha = pointer.inside ? .2 + Math.min(.38, particle.orbit / 120) + impulse * .12 : .035;
      context.globalAlpha = alpha * (.74 + Math.sin(particle.phase * .7) * .26);
      context.fillStyle = particle.tint > .68 ? '#80aa88' : particle.tint > .34 ? '#9fc2a6' : '#e7eee8';
      if (particle.stretch && impulse > .08) {
        context.beginPath(); context.moveTo(particle.x, particle.y);
        context.lineTo(particle.x - particle.vx * .016, particle.y - particle.vy * .016);
        context.lineWidth = particle.size; context.strokeStyle = context.fillStyle; context.stroke();
      } else {
        context.beginPath(); context.arc(particle.x, particle.y, particle.size * (1 + impulse * .55), 0, Math.PI * 2); context.fill();
      }
    });
    if (pointer.inside && impulse > .03) {
      context.globalAlpha = .045 + impulse * .07; context.beginPath();
      context.arc(pointer.x, pointer.y, radius + 8, 0, Math.PI * 2);
      context.strokeStyle = '#5c8a67'; context.lineWidth = 1; context.stroke();
    }
    if (pointer.burst > .02) {
      context.globalAlpha = pointer.burst * .42; context.beginPath();
      context.arc(pointer.x, pointer.y, (1 - pointer.burst) * 64, 0, Math.PI * 2);
      context.strokeStyle = '#83ad8b'; context.lineWidth = 1.2; context.stroke();
    }
    context.globalAlpha = 1;
    if (now - lastMove < 1600 || pointer.burst > .02) frame = requestAnimationFrame(tick);
  }
  function wake() { if (!frame && visible) frame = requestAnimationFrame(tick); }
  function move(event) {
    if (event.pointerType === 'touch') return;
    pointer.px = pointer.x; pointer.py = pointer.y;
    pointer.x = event.clientX; pointer.y = event.clientY; pointer.inside = true;
    speed = Math.hypot(pointer.x - pointer.px, pointer.y - pointer.py);
    lastMove = performance.now(); wake();
  }
  window.addEventListener('pointermove', move, { passive: true });
  window.addEventListener('pointerdown', (event) => { move(event); pointer.down = true; pointer.burst = 1; wake(); }, { passive: true });
  window.addEventListener('pointerup', () => { pointer.down = false; });
  document.documentElement.addEventListener('pointerleave', () => { pointer.inside = false; wake(); }, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', () => {
    visible = document.visibilityState === 'visible';
    if (!visible && frame) { cancelAnimationFrame(frame); frame = 0; previous = 0; }
    else wake();
  });
  resize();
})();
