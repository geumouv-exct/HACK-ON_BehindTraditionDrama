(() => {
  const roots = document.querySelectorAll('.soda-atmosphere');
  if (!roots.length) return;

  roots.forEach((root) => {
    const field = root.querySelector('.soda-atmosphere-bubbles');
    if (field && !field.childElementCount) {
      for (let index = 0; index < 16; index += 1) {
        const bubble = document.createElement('i');
        const seed = (index * 37 + 13) % 100;
        bubble.style.setProperty('--bubble-x', `${seed}%`);
        bubble.style.setProperty('--bubble-size', `${4 + ((index * 7) % 11)}px`);
        bubble.style.setProperty('--bubble-duration', `${13 + ((index * 5) % 12)}s`);
        bubble.style.setProperty('--bubble-delay', `${-((index * 7) % 22)}s`);
        bubble.style.setProperty('--bubble-drift', `${((index * 19) % 74) - 37}px`);
        field.append(bubble);
      }
    }

    let frame = 0;
    root.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch' || frame) return;
      frame = requestAnimationFrame(() => {
        const bounds = root.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100));
        const y = Math.max(0, Math.min(100, ((event.clientY - bounds.top) / bounds.height) * 100));
        root.style.setProperty('--soda-x', `${x}%`);
        root.style.setProperty('--soda-y', `${y}%`);
        frame = 0;
      });
    }, { passive: true });
    root.addEventListener('pointerleave', () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      root.style.setProperty('--soda-x', '50%');
      root.style.setProperty('--soda-y', '36%');
    }, { passive: true });
  });
})();
