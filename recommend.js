const siteHeader = document.querySelector('.page-recommend .site-header');
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

const make = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
function addSources(parent, sources) {
  if (!Array.isArray(sources) || !sources.length) return;
  const list = make('div', 'ai-source-list');
  list.append(make('strong', '', '역사 참고 자료'));
  sources.slice(0, 3).forEach((source) => {
    if (!/^https:\/\//.test(source?.url || '')) return;
    const link = make('a', '', `${source.title} ↗`);
    link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; list.append(link);
  });
  parent.append(list);
}

function createCircularGallery(items) {
  const gallery = make('section', 'circular-gallery recommendation-circular-gallery');
  gallery.setAttribute('role', 'region');
  gallery.setAttribute('aria-roledescription', '원형 갤러리');
  gallery.setAttribute('aria-label', '추천 한국 사극');
  gallery.tabIndex = 0;
  const track = make('div', 'circular-gallery-track');
  const cards = items.map((item, index) => {
    const card = make('article', 'circular-gallery-card');
    const poster = make('button', 'circular-gallery-poster');
    poster.type = 'button';
    poster.setAttribute('aria-label', `${item.title} · ${item.period || '한국 사극'} · 설명 보기`);
    poster.setAttribute('aria-expanded', 'false');
    const image = make('img', 'circular-gallery-image');
    image.alt = '';
    image.loading = index === 0 ? 'eager' : 'lazy';
    image.decoding = 'async';
    if (item.posterUrl) {
      image.src = item.posterUrl;
      image.referrerPolicy = 'no-referrer';
      image.addEventListener('error', () => { image.hidden = true; card.classList.add('has-no-poster'); }, { once: true });
    } else card.classList.add('has-no-poster');
    const fallback = make('span', 'circular-gallery-fallback');
    fallback.setAttribute('aria-hidden', 'true');
    fallback.append(make('span', 'circular-gallery-seal', '史'), make('strong', '', item.title));
    const shade = make('span', 'circular-gallery-shade');
    const meta = make('span', 'circular-gallery-meta');
    meta.append(make('small', '', `추천 ${String(index + 1).padStart(2, '0')}`), make('strong', '', item.title), make('em', '', [item.period, item.range].filter(Boolean).join(' · ')));
    poster.append(image, fallback, shade, meta);
    poster.addEventListener('click', () => select(index, true));

    const details = make('div', 'circular-gallery-details');
    details.hidden = true;
    const close = make('button', 'circular-gallery-close', '닫기');
    close.type = 'button';
    close.setAttribute('aria-label', `${item.title} 설명 닫기`);
    close.addEventListener('click', (event) => {
      event.stopPropagation(); open = false; render(true); poster.focus({ preventScroll: true });
    });
    details.append(close);
    details.append(make('small', 'circular-gallery-details-period', [item.period, item.range].filter(Boolean).join(' · ') || '한국 사극'));
    details.append(make('h3', 'circular-gallery-details-title', `${item.title}에서 볼 역사`));
    details.append(make('p', 'circular-gallery-description', item.reason || '작품의 시대와 역사적 배경을 기록과 비교해 살펴봅니다.'));
    details.append(make('p', 'circular-gallery-learning', `배워볼 주제 · ${item.learning || item.period || '역사적 배경'}`));
    const note = make('p', 'circular-gallery-note');
    note.append(make('strong', '', '드라마와 기록 비교'), document.createTextNode(` · ${item.note || '작품 속 인물과 사건을 남은 기록과 구분해 살펴보세요.'}`));
    details.append(note);
    if (item.posterSourceUrl && /^https:\/\//.test(item.posterSourceUrl)) {
      const source = make('a', 'circular-gallery-source', `포스터 출처 · ${item.posterSourceName || '출처'} ↗`);
      source.href = item.posterSourceUrl; source.target = '_blank'; source.rel = 'noopener noreferrer';
      details.append(source);
    }
    addSources(details, item.sources);
    const story = make('a', 'circular-gallery-story-link', '드라마와 기록 비교 ↗');
    story.href = `./drama.html?title=${encodeURIComponent(item.title)}`;
    details.append(story);
    card.append(poster, details);
    track.append(card);
    return { card, poster, details, item };
  });
  const live = make('span', 'circular-gallery-live');
  live.setAttribute('aria-live', 'polite');
  gallery.append(track, live);

  let position = 0;
  let target = 0;
  let open = false;
  let raf = 0;
  let snapTimer = 0;
  let drag = null;
  let suppressClick = false;
  let focusDetailsWhenSettled = false;
  let reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const modulo = (value, size) => ((value % size) + size) % size;
  const nearestSlot = (index) => index + Math.round((position - index) / items.length) * items.length;
  function updateLive(indexOverride) {
    const index = indexOverride ?? modulo(Math.round(position), items.length);
    live.textContent = open ? `${items[index].title} 설명을 열었습니다.` : `${items[index].title} 선택됨`;
  }

  function render(animate = false) {
    const width = Math.max(1, gallery.clientWidth);
    const spacing = Math.max(150, width * (width < 600 ? 0.43 : 0.26));
    const active = modulo(Math.round(position), items.length);
    const dx = position - Math.round(position);
    cards.forEach(({ card, poster, details }, index) => {
      const slot = nearestSlot(index);
      const offset = slot - position;
      const distance = Math.abs(offset);
      const x = offset * spacing;
      const y = Math.min(distance, 3) * (width < 600 ? 34 : 50);
      const scale = Math.max(0.48, 1 - distance * (width < 600 ? 0.2 : 0.18));
      const opacity = Math.max(0.12, 1 - distance * 0.24);
      card.style.transform = `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), 0) scale(${open && index === active ? 1.025 : scale})`;
      card.style.opacity = String(opacity);
      card.style.zIndex = String(20 - Math.round(distance * 3));
      card.style.pointerEvents = open && index !== active ? 'none' : distance > 2.2 ? 'none' : 'auto';
      card.classList.toggle('is-active', index === active);
      card.classList.toggle('is-open', open && index === active);
      poster.tabIndex = index === active && !(open && index === active) ? 0 : -1;
      poster.setAttribute('aria-current', index === active ? 'true' : 'false');
      poster.setAttribute('aria-expanded', String(open && index === active));
      details.hidden = !(open && index === active);
    });
    gallery.classList.toggle('is-open', open);
    gallery.style.setProperty('--gallery-center-offset', `${dx * spacing}px`);
    if (animate && !reducedMotion) wake();
  }

  function frame() {
    raf = 0;
    const ease = reducedMotion ? 1 : 0.16;
    position += (target - position) * ease;
    if (Math.abs(target - position) < 0.001) position = target;
    render();
    if (position !== target) raf = requestAnimationFrame(frame);
    else if (focusDetailsWhenSettled && open) {
      focusDetailsWhenSettled = false;
      cards[modulo(Math.round(position), items.length)].details.querySelector('.circular-gallery-close')?.focus({ preventScroll: true });
    }
  }
  function wake() { if (!raf) raf = requestAnimationFrame(frame); }
  function select(index, toggleOpen) {
    const slot = nearestSlot(index);
    const wasCurrent = modulo(Math.round(position), items.length) === index && Math.abs(position - Math.round(position)) < 0.18;
    target = slot;
    if (toggleOpen) {
      open = wasCurrent ? !open : true;
      focusDetailsWhenSettled = open;
      if (!open) cards[index].poster.focus({ preventScroll: true });
    }
    updateLive(toggleOpen && open ? index : undefined);
    render(true);
  }
  function onPointerDown(event) {
    if (event.button !== 0) return;
    drag = { id: event.pointerId, x: event.clientX, start: position, moved: false };
  }
  function onPointerMove(event) {
    if (!drag || drag.id !== event.pointerId) return;
    const delta = event.clientX - drag.x;
    if (!drag.moved && Math.abs(delta) > 6) {
      drag.moved = true; open = false;
      gallery.setPointerCapture?.(event.pointerId);
      gallery.setAttribute('data-dragging', '');
    }
    if (!drag.moved) return;
    const spacing = Math.max(150, gallery.clientWidth * (gallery.clientWidth < 600 ? 0.43 : 0.26));
    position = drag.start - delta / spacing;
    target = position;
    suppressClick = true;
    updateLive(); render();
  }
  function onPointerUp(event) {
    if (!drag || drag.id !== event.pointerId) return;
    const moved = drag.moved;
    drag = null;
    gallery.removeAttribute('data-dragging');
    if (gallery.hasPointerCapture?.(event.pointerId)) gallery.releasePointerCapture(event.pointerId);
    if (moved) {
      target = Math.round(position);
      open = false;
      updateLive(); wake();
      setTimeout(() => { suppressClick = false; }, 0);
    }
  }
  function onWheel(event) {
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (!delta) return;
    event.preventDefault();
    const spacing = Math.max(150, gallery.clientWidth * (gallery.clientWidth < 600 ? 0.43 : 0.26));
    target += delta / spacing * 0.8;
    open = false;
    clearTimeout(snapTimer);
    snapTimer = setTimeout(() => { target = Math.round(target); updateLive(); wake(); }, 160);
    wake();
  }
  function onKeyDown(event) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); select(modulo(Math.round(position) + 1, items.length), false); open = false; updateLive(); }
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); select(modulo(Math.round(position) - 1, items.length), false); open = false; updateLive(); }
    else if (event.key === 'Escape' && open) { event.preventDefault(); open = false; updateLive(); render(); }
  }
  gallery.addEventListener('pointerdown', onPointerDown);
  gallery.addEventListener('pointermove', onPointerMove);
  gallery.addEventListener('pointerup', onPointerUp);
  gallery.addEventListener('pointercancel', onPointerUp);
  gallery.addEventListener('wheel', onWheel, { passive: false });
  gallery.addEventListener('keydown', onKeyDown);
  gallery.addEventListener('click', (event) => { if (suppressClick) { event.preventDefault(); event.stopPropagation(); } }, true);
  const resizeObserver = new ResizeObserver(() => render());
  resizeObserver.observe(gallery);
  gallery.cleanup = () => { cancelAnimationFrame(raf); clearTimeout(snapTimer); resizeObserver.disconnect(); };
  updateLive(); render();
  return gallery;
}

function renderRecommendations(data, container) {
  container.querySelector('.circular-gallery')?.cleanup?.();
  container.replaceChildren();
  container.append(make('h2', 'ai-result-title', data.period));
  if (!data.recommendations?.length) {
    container.append(make('p', 'ai-empty', '조건에 맞는 작품을 찾지 못했습니다. 시대나 사건의 대표 단어를 더해 검색해 보세요.'));
    addSources(container, data.sources); container.hidden = false; return;
  }
  const gallery = createCircularGallery(data.recommendations.slice(0, 5));
  container.append(gallery); container.hidden = false;
}

const recommendForm = document.querySelector('#recommend-form');
if (recommendForm) {
  const recommendInput = document.querySelector('#period-input');
  const status = document.querySelector('#recommend-status');
  const result = document.querySelector('#recommend-result');
  const submit = recommendForm.querySelector('[type="submit"]');
  let current = null;
  recommendForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const value = recommendInput.value.trim();
    if (value.length < 2) { status.hidden = false; status.textContent = '두 글자 이상 입력해 주세요.'; recommendInput.focus(); return; }
    current?.abort(); const controller = new AbortController(); current = controller;
    submit.disabled = true; result.hidden = true; status.hidden = false; status.textContent = '한국 사극에서 관련 작품을 찾고 있어요…';
    try {
      const data = await window.SagukStatic.recommendations(value);
      if (current !== controller) return;
      renderRecommendations(data, result);
      status.hidden = true; status.textContent = '';
    } catch (error) {
      if (controller.signal.aborted) return;
      status.hidden = false;
      status.textContent = error instanceof Error ? error.message : '검색에 실패했습니다. 다시 시도해 주세요.';
    } finally { if (current === controller) { current = null; submit.disabled = false; } }
  });
  document.querySelectorAll('[data-period-example]').forEach((button) => button.addEventListener('click', () => {
    recommendInput.value = button.dataset.periodExample; recommendForm.requestSubmit();
  }));
  const prefilledPeriod = new URLSearchParams(location.search).get('period')?.trim();
  if (prefilledPeriod && prefilledPeriod.length <= 80) { recommendInput.value = prefilledPeriod; recommendForm.requestSubmit(); }
}
