const $ = (selector) => document.querySelector(selector);
const make = (tag, className, value) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (value !== undefined) node.textContent = value;
  return node;
};
const append = (parent, tag, className, value) => {
  const node = make(tag, className, value);
  parent.append(node);
  return node;
};
const validPosterUrl = (value) => {
  try { const url = new URL(value); return url.protocol === 'https:' && Boolean(url.hostname); }
  catch { return false; }
};

let activeStory = null;
let activeChapterIndex = 0;
let flipRotation = 0;
let dragState = null;
let navigationPending = false;
let depthPosition = 0;
let depthDragState = null;
let depthWheelTimer = 0;
const voiceAudioCache = new Map();
let activeVoiceAudio = null;
let activeVoiceButton = null;

function emphasizeText(parent, value, chapterTitle) {
  const text = String(value || '');
  if (!text) return;
  const terms = [chapterTitle, '기록', '사료', '실록', '각색', '창작', '허구', '설화', '신화', '전쟁', '왕위', '정치', '편찬', '설치', '건국', '조약']
    .filter((term, index, all) => term && all.indexOf(term) === index && text.includes(term))
    .sort((a, b) => b.length - a.length);
  if (!terms.length) { parent.append(document.createTextNode(text)); return; }
  const matcher = new RegExp(`(${terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gu');
  let cursor = 0;
  for (const match of text.matchAll(matcher)) {
    const start = match.index;
    if (start > cursor) parent.append(document.createTextNode(text.slice(cursor, start)));
    const strong = append(parent, 'strong', 'story-depth-emphasis', match[0]);
    strong.setAttribute('aria-label', `${match[0]} 강조`);
    cursor = start + match[0].length;
  }
  if (cursor < text.length) parent.append(document.createTextNode(text.slice(cursor)));
}

function conciseText(value, limit = 700) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > limit ? `${text.slice(0, limit).replace(/[\s,·]+$/u, '')}…` : text;
}

function setVoiceState(button, status, label = button.dataset.idleLabel) {
  if (!button?.isConnected) return;
  button.disabled = false;
  button.classList.remove('is-loading', 'is-playing');
  if (label) button.querySelector('.story-audio-text').textContent = label;
  const message = button.parentElement.querySelector('.story-audio-status');
  if (message) message.textContent = status;
}

function stopActiveVoice(status = '재생을 멈췄습니다.') {
  if (!activeVoiceAudio) return;
  activeVoiceAudio.pause();
  activeVoiceAudio.currentTime = 0;
  const button = activeVoiceButton;
  activeVoiceAudio = null;
  activeVoiceButton = null;
  if (button?.isConnected) setVoiceState(button, status);
}

function addVoiceControl(section, kind, label) {
  const control = append(section, 'div', 'story-audio-control');
  const button = append(control, 'button', 'story-audio-button');
  button.type = 'button';
  button.dataset.voiceKind = kind;
  button.dataset.idleLabel = label;
  button.setAttribute('aria-label', label);
  append(button, 'span', 'story-audio-icon', '▶');
  append(button, 'span', 'story-audio-text', label);
  append(control, 'span', 'story-audio-status', '');
  append(control, 'div', 'story-audio-player');
}

async function playNarration(button) {
  const card = button.closest('.story-depth-card');
  const chapterIndex = Number(card?.dataset.chapterIndex);
  const kind = button.dataset.voiceKind;
  if (!activeStory || !Number.isInteger(chapterIndex) || !['drama', 'record'].includes(kind)) return;

  if (activeVoiceButton === button && activeVoiceAudio && !activeVoiceAudio.paused) {
    stopActiveVoice();
    return;
  }
  if (activeVoiceAudio) stopActiveVoice('다른 해설을 재생합니다.');

  const key = `${activeStory.title}\u0000${chapterIndex}\u0000${kind}`;
  button.disabled = true;
  button.classList.add('is-loading');
  button.querySelector('.story-audio-text').textContent = '음성을 준비하는 중';
  const status = button.parentElement.querySelector('.story-audio-status');
  status.textContent = '잠시만 기다려 주세요.';

  try {
    let audioUrl = voiceAudioCache.get(key);
    if (!audioUrl) {
      const apiBase = String(window.SAGUK_VOICE_API_BASE || '').trim();
      const endpoint = apiBase ? new URL('/api/voice', apiBase).href : '/api/voice';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: activeStory.title, chapterIndex, kind }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || '음성을 만들지 못했습니다.');
      }
      const blob = await response.blob();
      if (!blob.type.startsWith('audio/')) throw new Error('음성 파일을 확인하지 못했습니다.');
      audioUrl = URL.createObjectURL(blob);
      voiceAudioCache.set(key, audioUrl);
    }

    const player = button.parentElement.querySelector('.story-audio-player');
    const audio = document.createElement('audio');
    audio.className = 'story-audio-native';
    audio.controls = true;
    audio.preload = 'auto';
    audio.src = audioUrl;
    player.replaceChildren(audio);
    activeVoiceAudio = audio;
    activeVoiceButton = button;
    audio.addEventListener('ended', () => {
      if (activeVoiceAudio === audio) {
        activeVoiceAudio = null;
        activeVoiceButton = null;
      }
      setVoiceState(button, '재생이 끝났습니다.');
    }, { once: true });
    audio.addEventListener('error', () => {
      if (activeVoiceAudio === audio) {
        activeVoiceAudio = null;
        activeVoiceButton = null;
      }
      setVoiceState(button, '음성 재생에 실패했습니다. 다시 눌러 주세요.');
    }, { once: true });
    button.disabled = false;
    button.classList.remove('is-loading');
    button.classList.add('is-playing');
    button.querySelector('.story-audio-text').textContent = '재생 중 · 멈추기';
    status.textContent = '재생 중입니다.';
    try {
      await audio.play();
    } catch {
      button.classList.remove('is-playing');
      button.querySelector('.story-audio-text').textContent = '다시 재생';
      status.textContent = '아래 재생 버튼을 눌러 해설을 들을 수 있습니다.';
      activeVoiceAudio = null;
      activeVoiceButton = null;
    }
  } catch (error) {
    voiceAudioCache.delete(key);
    setVoiceState(button, error instanceof Error ? error.message : '음성 연결에 실패했습니다.');
  }
}

function layoutDepthCards(position = depthPosition) {
  const carousel = $('#story-depth-carousel');
  const stage = $('#story-depth-stage');
  if (!carousel || !stage) return;
  const cards = [...stage.querySelectorAll('.story-depth-card')];
  const count = cards.length;
  if (!count) return;
  cards.forEach((card, index) => {
    let distance = index - position;
    distance = ((distance + count / 2) % count + count) % count - count / 2;
    const absolute = Math.abs(distance);
    const side = Math.sign(distance);
    const offset = distance * 34;
    const depth = absolute * 180;
    const rotate = side * Math.min(9, absolute * 8);
    const scale = Math.max(.82, 1 - absolute * .075);
    card.style.transform = `translate(-50%,-50%) translateX(${offset}%) translateZ(${-depth}px) rotateY(${-rotate}deg) scale(${scale})`;
    card.style.opacity = String(Math.max(0, 1 - absolute * .78));
    card.style.filter = absolute < .08 ? 'none' : `blur(${Math.min(3.5, absolute * 2.6)}px) brightness(${Math.max(.38, 1 - absolute * .28)})`;
    card.style.zIndex = String(100 - Math.round(absolute * 10));
    card.style.pointerEvents = absolute < .62 ? 'auto' : 'none';
    card.classList.toggle('is-current', absolute < .08);
    card.setAttribute('aria-hidden', String(absolute >= .62));
    card.tabIndex = absolute < .62 ? 0 : -1;
  });
}

function renderDepthChapters() {
  const stage = $('#story-depth-stage');
  stage.replaceChildren();
  const chapters = activeStory?.chapters || [];
  chapters.forEach((chapter, index) => {
    const card = append(stage, 'article', 'story-depth-card');
    card.dataset.chapterIndex = String(index);
    card.setAttribute('aria-label', `${chapter.date || ''} ${chapter.title || '역사적 사건'}: 드라마와 기록 비교`);
    const meta = append(card, 'div', 'story-depth-meta');
    append(meta, 'span', 'story-depth-index-tag', `${String(index + 1).padStart(2, '0')} / ${String(chapters.length).padStart(2, '0')}`);
    append(meta, 'span', 'story-depth-date-tag', chapter.date || '시대 배경');
    append(meta, 'span', 'story-depth-work-tag', `작품 · ${activeStory.title}`);
    append(meta, 'span', 'story-depth-scope-tag', activeStory.historyConnection || '시대 배경 참고');
    const pair = append(card, 'div', 'story-depth-pair');
    const drama = append(pair, 'section', 'story-depth-section story-depth-drama');
    append(drama, 'span', 'story-depth-label', '드라마에서 볼 대목');
    const dramaText = append(drama, 'p', 'story-depth-copy');
    const copyLimit = innerWidth <= 700 ? 390 : 700;
    emphasizeText(dramaText, conciseText(chapter.dramatization || activeStory.distinction || '인물의 대사와 감정은 기록과 구분한다.', copyLimit), chapter.title);
    addVoiceControl(drama, 'drama', '드라마 설명 듣기');
    const record = append(pair, 'section', 'story-depth-section story-depth-record');
    const contextOnly = ['시대 배경 참고', '가상 인물·사건 중심'].includes(activeStory.historyConnection);
    append(record, 'span', 'story-depth-label', contextOnly ? '같은 시대의 실제 기록' : '사료에서 확인되는 사실');
    const recordText = append(record, 'p', 'story-depth-copy');
    emphasizeText(recordText, conciseText(chapter.recordText || chapter.evidence || '확인 가능한 기록 설명 없음', copyLimit), chapter.title);
    addVoiceControl(record, 'record', '기록 설명 듣기');
    const sources = append(card, 'div', 'story-depth-sources');
    for (const source of (chapter.sources || []).slice(0, 2)) {
      if (!/^https:\/\//.test(source.url || '')) continue;
      const link = append(sources, 'a', 'story-depth-source', `${source.title} ↗`);
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
  });
  depthPosition = 0;
  layoutDepthCards(0);
}

function setFlipState(flipped, animate = true) {
  const card = $('#story-overview-card');
  const rotor = card.querySelector('.story-overview-rotor');
  flipRotation = flipped ? 180 : 0;
  rotor.classList.toggle('is-settling', animate);
  rotor.style.transform = `perspective(1200px) rotateY(${flipRotation}deg)`;
  card.classList.toggle('is-flipped', flipped);
  card.setAttribute('aria-label', flipped
    ? '드라마와 기록 비교. 눌러 작품 요약으로 돌아가기'
    : '포스터와 작품 요약. 눌러 드라마와 기록 비교 보기');
  card.querySelector('.story-overview-front').setAttribute('aria-hidden', String(flipped));
  card.querySelector('.story-overview-front').inert = flipped;
  card.querySelector('.story-overview-back').setAttribute('aria-hidden', String(!flipped));
  card.querySelector('.story-overview-back').inert = !flipped;
  $('#story-chapter-controls').hidden = !flipped;
  if (animate) window.setTimeout(() => rotor.classList.remove('is-settling'), 600);
}

function fillChapter(index) {
  if (!activeStory?.chapters?.length) return;
  activeChapterIndex = (index + activeStory.chapters.length) % activeStory.chapters.length;
  const chapter = activeStory.chapters[activeChapterIndex];
  $('#story-slide-date').textContent = chapter.date || '';
  $('#story-slide-title').textContent = chapter.title || '역사적 사건';
  $('#chapter-current').textContent = String(activeChapterIndex + 1).padStart(2, '0');
  $('#chapter-total').textContent = String(activeStory.chapters.length).padStart(2, '0');
  depthPosition = activeChapterIndex;
  layoutDepthCards(depthPosition);
  const dots = $('#chapter-nav');
  dots.replaceChildren();
  activeStory.chapters.forEach((item, itemIndex) => {
    const button = append(dots, 'button', 'story-chapter-dot', String(itemIndex + 1).padStart(2, '0'));
    button.type = 'button';
    button.setAttribute('aria-label', `${item.date} ${item.title} 비교 보기`);
    button.setAttribute('aria-current', itemIndex === activeChapterIndex ? 'step' : 'false');
    button.classList.toggle('is-current', itemIndex === activeChapterIndex);
    button.addEventListener('click', () => fillChapter(itemIndex));
  });
}

function bindDepthCarousel() {
  const carousel = $('#story-depth-carousel');
  if (!carousel) return;
  carousel.addEventListener('click', (event) => {
    const button = event.target.closest('.story-audio-button');
    if (button) playNarration(button);
  });
  carousel.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || event.target.closest('a,button')) return;
    depthDragState = { id: event.pointerId, x: event.clientX, start: depthPosition, moved: false };
    carousel.setPointerCapture?.(event.pointerId);
  });
  carousel.addEventListener('pointermove', (event) => {
    if (!depthDragState || depthDragState.id !== event.pointerId) return;
    const delta = event.clientX - depthDragState.x;
    if (!depthDragState.moved && Math.abs(delta) < 5) return;
    depthDragState.moved = true;
    const stepPx = Math.max(180, carousel.clientWidth * .58);
    depthPosition = depthDragState.start - delta / stepPx;
    layoutDepthCards(depthPosition);
  });
  const finish = (event) => {
    if (!depthDragState || depthDragState.id !== event.pointerId) return;
    const moved = depthDragState.moved;
    const selected = Math.round(depthPosition);
    depthDragState = null;
    if (moved) {
      fillChapter(selected);
      carousel.dataset.dragHandled = 'true';
      window.setTimeout(() => { delete carousel.dataset.dragHandled; }, 0);
    }
  };
  carousel.addEventListener('pointerup', finish);
  carousel.addEventListener('pointercancel', finish);
  carousel.addEventListener('lostpointercapture', finish);
  carousel.addEventListener('click', (event) => {
    if (carousel.dataset.dragHandled === 'true' || event.target.closest('a,button')) return;
    const card = event.target.closest('.story-depth-card');
    if (card && Number(card.dataset.chapterIndex) !== activeChapterIndex) fillChapter(Number(card.dataset.chapterIndex));
  });
  carousel.addEventListener('wheel', (event) => {
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (Math.abs(delta) < 1) return;
    event.preventDefault();
    depthPosition += Math.sign(delta) * Math.min(.62, Math.abs(delta) / Math.max(carousel.clientWidth * .75, 1));
    layoutDepthCards(depthPosition);
    clearTimeout(depthWheelTimer);
    depthWheelTimer = window.setTimeout(() => fillChapter(Math.round(depthPosition)), 130);
  }, { passive: false });
  carousel.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      fillChapter(activeChapterIndex + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
}

function renderSummary(data) {
  const list = $('#story-quick-lines');
  list.replaceChildren();
  const characters = Array.isArray(data.mainCharacters)
    ? data.mainCharacters.slice(0, 3).map((person) => typeof person === 'string' ? person : [person.name, person.role].filter(Boolean).join(' · ')).filter(Boolean)
    : [];
  const chapterItems = Array.isArray(data.chapters) ? data.chapters : [];
  const events = chapterItems.slice(0, 3).map((chapter) => `${chapter.date} ${chapter.title}`.trim());
  const historicalLabels = characters.length ? characters.join(' · ')
    : chapterItems.slice(0, 2).map((chapter) => chapter.title).filter(Boolean).join(' · ');
  const lines = [
    ['줄거리', data.synopsis || data.summary || data.context || '작품의 역사적 배경을 확인합니다.'],
    ['시대', `${data.period || '한국사'}${data.range ? ` · ${data.range}` : ''}`],
    [characters.length ? '주요 인물' : '인물·사건', historicalLabels || '확인 가능한 인물·사건 정보가 없습니다.'],
    ['기록 범위', `${data.historyConnection || '시대 배경 참고'} · ${data.comparisonNote || '작품의 줄거리와 기록에 남은 사실을 구분해 읽습니다.'}`],
    ['이어지는 흐름', events[2] || (data.distinction || '드라마의 각색과 기록을 구분해 살펴봅니다.')],
  ];
  for (const [label, value] of lines) {
    const item = append(list, 'li', 'story-quick-line');
    append(item, 'strong', '', label);
    append(item, 'span', '', value);
  }
}

function renderPoster(data) {
  const image = $('#story-poster-image');
  const fallback = $('#story-poster-fallback');
  const credit = $('#story-poster-credit');
  $('#story-poster-caption').textContent = `${data.title} 포스터`;
  image.hidden = true;
  image.alt = `${data.title} 드라마 포스터`;
  image.onerror = () => { image.hidden = true; fallback.hidden = false; };
  if (validPosterUrl(data.posterUrl)) {
    image.src = data.posterUrl;
    image.hidden = false;
    fallback.hidden = true;
  } else {
    image.removeAttribute('src');
    fallback.hidden = false;
  }
  if (data.posterSourceUrl && /^https:\/\//.test(data.posterSourceUrl)) {
    credit.href = data.posterSourceUrl;
    credit.textContent = `포스터 출처 · ${data.posterSourceName || '자료'} ↗`;
    credit.hidden = false;
  } else credit.hidden = true;
}

function renderStory(data) {
  if (activeVoiceAudio) stopActiveVoice('새 작품 해설을 준비했습니다.');
  activeStory = data;
  document.title = `${data.title} · 드라마와 기록 비교 — 사극의 뒤편`;
  $('#story-title').textContent = data.title;
  $('#story-period').textContent = `${data.period || '한국사'}${data.range ? ` · ${data.range}` : ''}`;
  renderPoster(data);
  renderSummary(data);
  renderDepthChapters();
  $('#story-content').hidden = false;
  $('#story-empty').hidden = true;
  fillChapter(0);
}

function bindFlipCard() {
  const card = $('#story-overview-card');
  const rotor = card.querySelector('.story-overview-rotor');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  card.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || !activeStory || event.target.closest('a,button,.story-depth-carousel')) return;
    dragState = { id: event.pointerId, x: event.clientX, base: flipRotation, moved: false, time: performance.now() };
    try { card.setPointerCapture(event.pointerId); } catch {}
    rotor.classList.remove('is-settling');
  });
  card.addEventListener('pointermove', (event) => {
    if (!dragState || dragState.id !== event.pointerId) return;
    const dx = event.clientX - dragState.x;
    if (!dragState.moved && Math.abs(dx) < 4) return;
    dragState.moved = true;
    const width = Math.max(card.clientWidth, 1);
    const delta = Math.max(-190, Math.min(190, dx / width * 180));
    rotor.style.transform = `perspective(1200px) rotateY(${dragState.base + delta}deg)`;
  });
  const release = (event, cancelled = false) => {
    if (!dragState || dragState.id !== event.pointerId) return;
    const state = dragState;
    dragState = null;
    if (!state.moved) return;
    const dx = event.clientX - state.x;
    const duration = Math.max(performance.now() - state.time, 1);
    const fastFlick = Math.abs(dx / duration) > .45;
    const flipped = cancelled ? state.base >= 90 : Math.abs(dx) > card.clientWidth * .17 || fastFlick ? state.base < 90 : state.base >= 90;
    setFlipState(flipped, !reducedMotion);
    card.dataset.dragHandled = 'true';
    window.setTimeout(() => { delete card.dataset.dragHandled; }, 0);
  };
  card.addEventListener('pointerup', (event) => release(event, false));
  card.addEventListener('pointercancel', (event) => release(event, true));
  card.addEventListener('lostpointercapture', (event) => release(event, true));
  card.addEventListener('click', (event) => {
    if (!activeStory || event.target.closest('a,button,.story-depth-carousel') || card.dataset.dragHandled === 'true') return;
    setFlipState(!card.classList.contains('is-flipped'), !reducedMotion);
  });
  card.addEventListener('keydown', (event) => {
    if (event.target.closest('.story-depth-carousel')) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      setFlipState(event.key === 'ArrowLeft', !reducedMotion);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setFlipState(!card.classList.contains('is-flipped'), !reducedMotion);
    }
  });
}

const form = $('.story-search');
const input = $('#story-title-input');
form.action = location.pathname;
form.addEventListener('submit', (event) => {
  const query = input.value.trim();
  if (query.length < 2 || query.length > 80 || navigationPending) {
    event.preventDefault();
    input.focus();
    return;
  }
  event.preventDefault();
  navigationPending = true;
  window.storyGridScan?.start();
  const page = location.pathname.endsWith('/drama.html') ? './drama.html' : './story.html';
  window.setTimeout(() => location.assign(`${page}?title=${encodeURIComponent(query)}`), matchMedia('(prefers-reduced-motion: reduce)').matches ? 50 : 350);
});

$('#chapter-prev').addEventListener('click', () => fillChapter(activeChapterIndex - 1));
$('#chapter-next').addEventListener('click', () => fillChapter(activeChapterIndex + 1));
bindFlipCard();
bindDepthCarousel();

const requested = new URLSearchParams(location.search).get('title')?.trim();
if (requested) input.value = requested.slice(0, 80);
if (requested && requested.length >= 2 && requested.length <= 80) {
  window.storyGridScan?.start();
  window.SagukStatic.storyFor(requested).then((data) => {
    if (!data) throw new Error('작품 자료를 찾지 못했습니다.');
    return data;
  })
    .then((data) => { renderStory(data); window.storyGridScan?.stop(); })
    .catch((error) => {
      window.storyGridScan?.stop();
      $('#story-empty').hidden = false;
      $('#story-empty p').textContent = error instanceof Error ? error.message : '검색 결과가 없습니다.';
    });
}

const siteHeader = $('.page-story .site-header');
if (siteHeader && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  let hideTimer = 0;
  const show = () => { clearTimeout(hideTimer); siteHeader.classList.remove('is-auto-hidden'); };
  const hide = () => {
    clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => {
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
}
