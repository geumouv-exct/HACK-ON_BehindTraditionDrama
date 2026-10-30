// AccordionGallery interaction shared by the home-era selector and AI results.
// Hover/focus reveals the explanation; leaving restores the gallery's default card.
(() => {
  function initializeAccordionGallery(gallery) {
    if (!gallery || gallery.dataset.accordionReady === 'true') return;
    gallery.dataset.accordionReady = 'true';
    const panels = [...gallery.querySelectorAll('.era-panel')];
    const triggers = panels.map((panel) => panel.querySelector('.era-panel-trigger'));
    if (!panels.length) return;

    const initialIndex = Math.max(0, Math.min(panels.length - 1, Number(gallery.dataset.defaultIndex || 0)));
    const touchMode = matchMedia('(hover: none), (pointer: coarse)').matches;
    const clickToFlip = gallery.classList.contains('home-era-gallery');
    const setActive = (panel) => panels.forEach((item) => item.classList.toggle('is-active', item === panel));
    const setFlipped = (panel, flipped) => {
      const trigger = panel.querySelector('.era-panel-trigger');
      panel.classList.toggle('is-flipped', flipped);
      trigger?.setAttribute('aria-expanded', String(flipped));
      trigger?.setAttribute('aria-label', `${panel.dataset.era || '시대'} ${flipped ? '설명 닫기' : '설명 보기'}`);
    };
    const restoreDefault = () => {
      panels.forEach((panel) => {
        setFlipped(panel, false);
        panel.removeAttribute('data-touch-open');
      });
      setActive(panels[initialIndex]);
    };

    setActive(panels[initialIndex]);
    panels.forEach((panel, index) => {
      const trigger = triggers[index];
      if (!trigger) return;

      panel.addEventListener('pointerenter', (event) => {
        setActive(panel);
        if (!clickToFlip && event.pointerType !== 'touch') setFlipped(panel, true);
      });
      panel.addEventListener('pointerleave', (event) => {
        if (event.pointerType === 'touch' || panel.hasAttribute('data-touch-open')) return;
        restoreDefault();
      });
      panel.addEventListener('focusin', () => {
        setActive(panel);
        if (!clickToFlip) setFlipped(panel, true);
      });
      panel.addEventListener('focusout', (event) => {
        if (panel.contains(event.relatedTarget) || panel.hasAttribute('data-touch-open')) return;
        restoreDefault();
      });

      trigger.addEventListener('click', (event) => {
        const touchInput = event.pointerType === 'touch' || touchMode;
        const open = panel.classList.contains('is-flipped');
        if (open) {
          panel.removeAttribute('data-touch-open');
          setFlipped(panel, false);
        } else {
          if (touchInput) panel.dataset.touchOpen = 'true';
          setActive(panel);
          setFlipped(panel, true);
        }
      });
      trigger.addEventListener('keydown', (event) => {
        const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1
          : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
        if (direction) {
          event.preventDefault();
          const nextIndex = (index + direction + panels.length) % panels.length;
          triggers[nextIndex]?.focus();
        } else if (event.key === 'Home' || event.key === 'End') {
          event.preventDefault();
          const nextIndex = event.key === 'Home' ? 0 : panels.length - 1;
          triggers[nextIndex]?.focus();
        }
      });
    });

    document.addEventListener('pointerdown', (event) => {
      const touchOpen = gallery.querySelector('[data-touch-open]');
      if (event.pointerType === 'touch' && touchOpen && !touchOpen.contains(event.target)) restoreDefault();
    });
  }

  window.initAccordionGallery = initializeAccordionGallery;
  document.querySelectorAll('.era-gallery').forEach(initializeAccordionGallery);
})();
