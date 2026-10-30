const siteHeader = document.querySelector('.page-ai .site-header');
if (siteHeader && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  let hideTimer = 0;
  const show = () => { clearTimeout(hideTimer); siteHeader.classList.remove('is-auto-hidden'); };
  const hide = () => {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (!siteHeader.matches(':hover') && !siteHeader.contains(document.activeElement) && !siteHeader.querySelector('details[open]')) siteHeader.classList.add('is-auto-hidden');
    }, 180);
  };
  siteHeader.classList.add('is-auto-hidden');
  siteHeader.addEventListener('pointerenter', show, { passive: true });
  siteHeader.addEventListener('pointerleave', hide, { passive: true });
  document.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') return;
    if (event.clientY <= 18) show(); else if (!siteHeader.matches(':hover')) hide();
  }, { passive: true });
  document.addEventListener('focusin', (event) => siteHeader.contains(event.target) ? show() : hide());
}

const dramaForm = document.querySelector('#drama-form');
const dramaInput = document.querySelector('#drama-input');
if (dramaForm && dramaInput) {
  dramaForm.addEventListener('submit', (event) => {
    if (dramaInput.value.trim().length < 2) { event.preventDefault(); dramaInput.focus(); }
  });
  document.querySelectorAll('[data-drama-example]').forEach((button) => button.addEventListener('click', () => {
    dramaInput.value = button.dataset.dramaExample;
    dramaForm.requestSubmit();
  }));
}
