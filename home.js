// Home interactions: Soda atmosphere, portrait cylinder carousel and two history finders.
(() => {
  const hero = document.querySelector('#home-hero');
  if (!hero) return;
  const historicalEvents = [
    { title: '훈민정음 반포', date: '1446', place: '조선 · 문자와 기록', alt: '훈민정음 해례본의 옛 글씨', image: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Hunminjeongum.jpg', source: 'https://commons.wikimedia.org/wiki/File:Hunminjeongum.jpg', credit: '위키미디어 공용 · 저작권 보호기간 만료', dramaTitle: '뿌리깊은 나무' },
    { title: '한산도 대첩', date: '1592', place: '임진왜란 · 조선 수군', alt: '한산도 앞바다의 조선 수군을 그린 전쟁기념관 그림', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Documentary_painting_of_the_Battle_of_Hansan_Island.jpg?width=900', source: 'https://commons.wikimedia.org/wiki/File:Documentary_painting_of_the_Battle_of_Hansan_Island.jpg', credit: '전쟁기념관 공개아카이브 · 공공누리 1유형', dramaTitle: '불멸의 이순신' },
    { title: '화성 행차', date: '1795', place: '정조 · 화성 능행', alt: '정조의 화성 행차를 그린 화성능행도 병풍', image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/70/Painting_of_the_Royal_Procession_to_Hwaseong_on_Eight-panel_Folding_Screen.jpeg/960px-Painting_of_the_Royal_Procession_to_Hwaseong_on_Eight-panel_Folding_Screen.jpeg', source: 'https://commons.wikimedia.org/wiki/File:Painting_of_the_Royal_Procession_to_Hwaseong_on_Eight-panel_Folding_Screen.jpeg', credit: '국립고궁박물관 소장 · 저작권 보호기간 만료', dramaTitle: '이산' },
    { title: '동학농민혁명', date: '1894–1895', place: '조선 말기 · 농민운동', alt: '1895년 법무아문으로 압송되는 전봉준', image: 'https://upload.wikimedia.org/wikipedia/commons/8/86/Jeon_Bong-jun_under_arrest_%2827_February_1895%29.jpg', source: 'https://commons.wikimedia.org/wiki/File:Jeon_Bong-jun_under_arrest_(27_February_1895).jpg', credit: '무라카미 텐신 · 저작권 보호기간 만료', dramaTitle: '녹두꽃' },
    { title: '대한제국 선포', date: '1897', place: '고종 · 광무개혁', alt: '대한제국 시기 서양식 예복을 입은 고종', image: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Gojong_of_the_Korean_Empire_02.jpg', source: 'https://commons.wikimedia.org/wiki/File:Gojong_of_the_Korean_Empire_02.jpg', credit: '위키미디어 공용 · 저작권 보호기간 만료', dramaTitle: '명성황후' },
    { title: '고려 건국', date: '918', place: '왕건 · 후삼국 통일', alt: '개성에 남은 고려 태조 왕건릉의 표지석', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Kaesong06.JPG?width=800', source: 'https://commons.wikimedia.org/wiki/File:Kaesong06.JPG', credit: '위키미디어 공용 · CC BY-SA 1.0', dramaTitle: '태조 왕건' },
    { title: '귀주대첩', date: '1019', place: '고려 · 거란과의 전쟁', alt: '강감찬이 이끈 고려군의 귀주대첩을 그린 우리역사넷 그림', image: 'https://contents.history.go.kr/data/img/eh/eh_n0260/eh_n0260_p01.jpg', source: 'https://contents.history.go.kr/mobile/eh/view.do?code=eh_age_20&levelId=eh_n0260_0010', credit: '우리역사넷 · 귀주대첩 그림', dramaTitle: '고려 거란 전쟁' },
    { title: '조선 건국', date: '1392', place: '태조 이성계 · 새 왕조', alt: '조선 태조 이성계의 초상화', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Portrait_of_King_Taejo_of_Joseon.jpg?width=800', source: 'https://commons.wikimedia.org/wiki/File:Portrait_of_King_Taejo_of_Joseon.jpg', credit: '위키미디어 공용 · CC BY-SA 4.0', dramaTitle: '정도전' },
    { title: '기묘사화', date: '1519', place: '중종 · 조광조의 개혁', alt: '기묘사화로 처형된 조광조의 1750년 초상화', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Cho_Gwang-jo_03.jpg?width=700', source: 'https://commons.wikimedia.org/wiki/File:Cho_Gwang-jo_03.jpg', credit: '정홍래 · 저작권 보호기간 만료', dramaTitle: '대장금' },
    { title: '을사늑약과 고종의 친서', date: '1905', place: '대한제국 · 외교권 박탈', alt: '을사늑약이 무효임을 알리기 위해 영국에 보낸 고종의 친서', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Eulsa_retraction.jpg?width=700', source: 'https://commons.wikimedia.org/wiki/File:Eulsa_retraction.jpg', credit: '위키미디어 공용 · 저작권 보호기간 만료', dramaTitle: '미스터 션샤인' }
  ];
  const figureItems = [
    { title: '세종대왕', years: '1397 — 1450 · 조선', alt: '세종대왕 어진', image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/86/%EC%84%B8%EC%A2%85%EB%8C%80%EC%99%95_%EC%96%B4%EC%A7%84.png/500px-%EC%84%B8%EC%A2%85%EB%8C%80%EC%99%95_%EC%96%B4%EC%A7%84.png', source: 'https://commons.wikimedia.org/wiki/File:%EC%84%B8%EC%A2%85%EB%8C%80%EC%99%95_%EC%96%B4%EC%A7%84.png', credit: '세종대왕사가독서기념사업회 · 자유 이용', dramaTitle: '뿌리깊은 나무' },
    { title: '이순신', years: '1545 — 1598 · 조선', alt: '이순신 장군 초상', image: 'https://upload.wikimedia.org/wikipedia/commons/e/e9/%EC%9D%B4%EC%88%9C%EC%8B%A0.jpg', source: 'https://commons.wikimedia.org/wiki/File:%EC%9D%B4%EC%88%9C%EC%8B%A0.jpg', credit: '동아대학교 박물관 · 저작권 보호기간 만료', dramaTitle: '불멸의 이순신' },
    { title: '왕건', years: '877 — 943 · 고려', alt: '고려 태조 왕건의 왕릉 표지석', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Taejo_Wangkun.jpg?width=700', source: 'https://commons.wikimedia.org/wiki/File:Taejo_Wangkun.jpg', credit: '위키미디어 공용 · 저작권 보호기간 만료', dramaTitle: '태조 왕건' },
    { title: '고종', years: '1852 — 1919 · 대한제국', alt: '대한제국 황제 고종의 초상', image: 'https://upload.wikimedia.org/wikipedia/commons/c/c0/Portrait_of_Gojong_01.jpg', source: 'https://commons.wikimedia.org/wiki/File:Portrait_of_Gojong_01.jpg', credit: '국립전주박물관 · 저작권 보호기간 만료', dramaTitle: '명성황후' },
    { title: '선덕여왕', years: '재위 632 — 647 · 신라', alt: '경주 선덕여왕릉', image: 'https://contents.history.go.kr/data/img/kc/thumb/kc_n101170.jpg', source: 'https://contents.history.go.kr/mobile/kc/view.do?code=kc_age_10&levelId=kc_n101170', credit: '국가문화유산포털 · 우리역사넷', dramaTitle: '선덕여왕' },
    { title: '정조', years: '1752 — 1800 · 조선', alt: '조선 제22대 왕 정조의 초상', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/King%20JeongJo%20of%20Joseon.jpg?width=700', source: 'https://commons.wikimedia.org/wiki/File:King_JeongJo_of_Joseon.jpg', credit: '위키미디어 공용 · 저작권 보호기간 만료', dramaTitle: '이산' },
    { title: '영조', years: '1694 — 1776 · 조선', alt: '영조 어진', image: 'https://upload.wikimedia.org/wikipedia/commons/2/29/Korea-Yeongjo-King_of_Joseon-c1.jpg', source: 'https://commons.wikimedia.org/wiki/File:Korea-Yeongjo-King_of_Joseon-c1.jpg', credit: '문화재 정보센터 · 저작권 보호기간 만료', dramaTitle: '비밀의 문' },
    { title: '김홍도', years: '1745 — 1806 · 조선', alt: '김홍도가 그린 자화상', image: 'https://upload.wikimedia.org/wikipedia/commons/9/93/Kim_Hongdo.jpg', source: 'https://commons.wikimedia.org/wiki/File:Kim_Hongdo.jpg', credit: '김홍도 자화상 · 저작권 보호기간 만료', dramaTitle: '바람의 화원' },
    { title: '강감찬', years: '948 — 1031 · 고려', alt: '우리역사넷에 실린 강감찬 장군 삽화', image: 'https://contents.history.go.kr/data/img/eh/thumb/eh_n0260_thumb.png', source: 'https://contents.history.go.kr/mobile/eh/view.do?code=eh_age_20&levelId=eh_n0260_0010', credit: '우리역사넷 · 인물 삽화', dramaTitle: '고려 거란 전쟁' },
    { title: '장영실', years: '15세기 · 조선', alt: '아산 장영실 동상', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Jang_Youngsil_1.jpg?width=700', source: 'https://commons.wikimedia.org/wiki/File:Jang_Youngsil_1.jpg', credit: 'Himasaram · CC BY-SA 3.0', dramaTitle: '장영실' },
    { title: '신사임당', years: '1504 — 1551 · 조선', alt: '강릉 오죽헌의 신사임당 동상', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Statue_of_Sin_Saimdang_at_Ojukheon.jpg?width=700', source: 'https://commons.wikimedia.org/wiki/File:Statue_of_Sin_Saimdang_at_Ojukheon.jpg', credit: 'Christophe95 · 위키미디어 공용', dramaTitle: '사임당, 빛의 일기' }
  ];
  const figureCards = [...document.querySelectorAll('[data-portrait-index]')];
  figureCards.forEach((card) => {
    card.dataset.kind = 'figure';
    const figure = figureItems[Number(card.dataset.portraitIndex)];
    if (figure) {
      const image = card.querySelector('img');
      image.src = figure.image; image.alt = figure.alt;
      const caption = card.querySelector('.home-portrait-caption');
      caption.querySelector('small').textContent = figure.years;
      caption.querySelector('strong').textContent = figure.title;
      card.dataset.source = figure.source;
      card.dataset.sourceName = figure.credit;
      card.dataset.recommendQuery = figure.dramaTitle;
    }
    const typeBadge = document.createElement('span');
    typeBadge.className = 'home-portrait-type';
    typeBadge.textContent = '인물';
    card.append(typeBadge);
  });
  historicalEvents.forEach((event, index) => {
    const figure = figureCards[index];
    if (!figure) return;
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'home-portrait-card home-event-card';
    card.dataset.kind = 'event';
    // Include dynamically inserted events in the same cylinder layout as portraits.
    card.dataset.portraitIndex = 'event';
    card.dataset.source = event.source;
    card.dataset.sourceName = event.credit;
    card.setAttribute('aria-current', 'false');
    card.dataset.recommendQuery = event.dramaTitle;
    card.setAttribute('aria-label', `${event.title}, ${event.date}년. 관련 드라마 추천 보기`);
    card.innerHTML = `<span class="home-portrait-image"><img src="${event.image}" alt="${event.alt}" loading="lazy" /></span><span class="home-portrait-type">역사 사건</span><span class="home-portrait-caption"><small>${event.date} · ${event.place}</small><strong>${event.title}</strong></span>`;
    figure.after(card);
  });
  const cards = [...document.querySelectorAll('[data-portrait-index]')];
  const linkedDramaTitles = new Set([...figureItems, ...historicalEvents].map((item) => item.dramaTitle));
  cards.forEach((card, index) => {
    card.dataset.portraitIndex = String(index);
    const title = card.querySelector('.home-portrait-caption strong')?.textContent?.trim() || '';
    if (!linkedDramaTitles.has(card.dataset.recommendQuery)) { card.remove(); return; }
    card.setAttribute('aria-label', `${title} · 관련 드라마 추천 보기`);
  });
  const cylinder = document.querySelector('#hero-carousel-cylinder');
  const stage = document.querySelector('#hero-carousel');
  const count = document.querySelector('#home-portrait-count');
  const totalCount = document.querySelector('#home-portrait-total');
  const source = document.querySelector('#home-portrait-source');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const step = 360 / Math.max(cards.length, 1);
  let rotation = 0;
  let targetRotation = 0;
  let tiltX = 0;
  let targetTiltX = 0;
  let radius = 0;
  let lastFrame = 0;
  let frame = 0;
  let pointerStart = null;
  let dragged = false;

  const homeHeader = document.querySelector('.home-header');
  if (homeHeader && finePointer) {
    let menuHideTimer = 0;
    const revealMenu = () => {
      window.clearTimeout(menuHideTimer);
      homeHeader.classList.remove('is-auto-hidden');
    };
    const hideMenuSoon = () => {
      window.clearTimeout(menuHideTimer);
      menuHideTimer = window.setTimeout(() => {
        if (homeHeader.matches(':hover') || homeHeader.contains(document.activeElement) || homeHeader.querySelector('details[open]')) return;
        homeHeader.classList.add('is-auto-hidden');
      }, 180);
    };
    homeHeader.classList.add('is-auto-hidden');
    homeHeader.addEventListener('pointerenter', revealMenu, { passive: true });
    homeHeader.addEventListener('pointerleave', hideMenuSoon, { passive: true });
    document.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse') return;
      if (event.clientY <= 20) revealMenu();
      else if (!homeHeader.matches(':hover')) hideMenuSoon();
    }, { passive: true });
    document.addEventListener('focusin', (event) => {
      if (homeHeader.contains(event.target)) revealMenu();
      else hideMenuSoon();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !homeHeader.contains(document.activeElement)) hideMenuSoon();
    });
  }

  function normalizeAngle(angle) { return ((angle % 360) + 540) % 360 - 180; }

  function setRadius() {
    if (!stage || !cards.length) return;
    const width = stage.clientWidth;
    const cardWidth = cards[0].getBoundingClientRect().width || (width < 560 ? 145 : 190);
    const chord = 2 * Math.sin(Math.PI / cards.length);
    const gap = width < 560 ? 68 : 106;
    // Size the orbit from the enlarged card width plus a clear gap, so cards never overlap.
    radius = (cardWidth + gap) / chord;
    stage.style.setProperty('--carousel-radius', `${radius}px`);
    cards.forEach((card, index) => {
      card.style.transform = `translate(-50%, -50%) rotateY(${index * step}deg) translateZ(${radius}px)`;
    });
  }

  function nearestCard() {
    let selected = 0;
    let nearest = Infinity;
    cards.forEach((_, index) => {
      const distance = Math.abs(normalizeAngle(index * step + rotation));
      if (distance < nearest) { nearest = distance; selected = index; }
    });
    return selected;
  }

  function updateActive(index = nearestCard()) {
    const active = cards[index];
    if (!active) return;
    cards.forEach((card, cardIndex) => {
      const selected = cardIndex === index;
      card.classList.toggle('is-current', selected);
      card.setAttribute('aria-current', String(selected));
    });
    if (count) count.textContent = String(index + 1).padStart(2, '0');
    if (totalCount) totalCount.textContent = String(cards.length).padStart(2, '0');
    if (source) {
      const sourceUrl = active.dataset.source || '';
      if (/^https?:\/\//i.test(sourceUrl)) {
        source.href = sourceUrl;
        source.target = '_blank';
        source.rel = 'noopener noreferrer';
      } else {
        source.removeAttribute('href');
        source.removeAttribute('target');
        source.removeAttribute('rel');
      }
      const sourceLabel = active.dataset.sourceName || '위키미디어 공용';
      source.textContent = `${active.dataset.kind === 'event' ? '사건' : '초상'} 출처 · ${sourceLabel}${/^https?:\/\//i.test(sourceUrl) ? ' ↗' : ''}`;
    }
  }

  function selectPortrait(index) {
    const wrapped = (index + cards.length) % cards.length;
    targetRotation = -wrapped * step;
    targetRotation += 360 * Math.round((rotation - targetRotation) / 360);
    updateActive(wrapped);
    wake();
  }

  function tick(now) {
    frame = 0;
    const elapsed = lastFrame ? Math.min(40, now - lastFrame) : 16;
    lastFrame = now;
    rotation += (targetRotation - rotation) * Math.min(.18, elapsed / 180);
    tiltX += (targetTiltX - tiltX) * Math.min(.16, elapsed / 150);
    if (Math.abs(targetRotation - rotation) < .015) rotation = targetRotation;
    if (Math.abs(targetTiltX - tiltX) < .015) tiltX = targetTiltX;
    cylinder.style.transform = `translateZ(${-radius}px) rotateX(${tiltX.toFixed(3)}deg) rotateY(${rotation.toFixed(3)}deg)`;
    updateActive();
    if (!reducedMotion && document.visibilityState === 'visible') frame = requestAnimationFrame(tick);
    else lastFrame = 0;
  }

  function wake() {
    if (!frame && !reducedMotion && document.visibilityState === 'visible') frame = requestAnimationFrame(tick);
    if (reducedMotion) {
      rotation = targetRotation;
      tiltX = targetTiltX;
      cylinder.style.transform = `translateZ(${-radius}px) rotateX(${tiltX}deg) rotateY(${rotation}deg)`;
      updateActive();
    }
  }

  let clickCandidateCard = null;
  cards.forEach((card, index) => {
    card.dataset.source = card.dataset.source || 'https://commons.wikimedia.org/';
    card.addEventListener('focus', () => { if (card.matches(':focus-visible')) selectPortrait(index); });
  });

  stage.addEventListener('pointerdown', (event) => {
    if ((event.pointerType === 'mouse' && event.button !== 0) || event.target.closest('.home-portrait-source')) return;
    pointerStart = { x: event.clientX, y: event.clientY, rotation, pointerId: event.pointerId, card: event.target.closest('.home-portrait-card') };
    dragged = false;
    stage.setPointerCapture?.(event.pointerId);
    stage.classList.add('is-dragging');
  });
  stage.addEventListener('pointermove', (event) => {
    if (!reducedMotion) {
      const rect = stage.getBoundingClientRect();
      const relativeY = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      const tiltLimit = Math.min(2.4, 22 / Math.max(radius, 1) * 180 / Math.PI);
      targetTiltX = (0.5 - relativeY) * 2 * tiltLimit;
      wake();
    }
    if (!pointerStart || pointerStart.pointerId !== event.pointerId) return;
    const dx = event.clientX - pointerStart.x;
    if (Math.abs(dx) > 4) dragged = true;
    if (!dragged) return;
    targetRotation = pointerStart.rotation + dx * .38;
    rotation += (targetRotation - rotation) * .26;
    cylinder.style.transform = `translateZ(${-radius}px) rotateX(${tiltX.toFixed(3)}deg) rotateY(${rotation}deg)`;
    updateActive();
  }, { passive: true });
  const finishDrag = () => {
    clickCandidateCard = !dragged ? pointerStart?.card || null : null;
    window.setTimeout(() => { clickCandidateCard = null; }, 180);
    pointerStart = null;
    stage.classList.remove('is-dragging');
    if (dragged) {
      targetRotation = -nearestCard() * step + 360 * Math.round((rotation + nearestCard() * step) / 360);
      window.setTimeout(() => { dragged = false; }, 80);
    }
    wake();
  };
  stage.addEventListener('pointerup', finishDrag);
  stage.addEventListener('pointercancel', finishDrag);
  stage.addEventListener('click', (event) => {
    const card = event.target.closest('.home-portrait-card') || clickCandidateCard;
    clickCandidateCard = null;
    if (!card || dragged) return;
    const query = card.dataset.recommendQuery;
    if (query) location.href = `./recommend.html?period=${encodeURIComponent(query)}`;
  });
  stage.addEventListener('pointerleave', () => {
    targetTiltX = 0;
    wake();
  }, { passive: true });
  stage.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); selectPortrait(nearestCard() - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); selectPortrait(nearestCard() + 1); }
  });

  // A horizontal two-finger trackpad swipe emits a burst of wheel events.
  // Apply every delta to the rotation, then settle on the nearest card when the
  // gesture ends. This lets one swipe travel across several cards naturally.
  let wheelResetTimer = 0;
  stage.addEventListener('wheel', (event) => {
    const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY) * 1.15;
    if (!horizontal || Math.abs(event.deltaX) < 0.15) return;
    event.preventDefault();
    const deltaScale = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16
      : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? stage.clientWidth : 1;
    const delta = event.deltaX * deltaScale;
    targetRotation -= delta * .38;
    wake();
    window.clearTimeout(wheelResetTimer);
    wheelResetTimer = window.setTimeout(() => {
      const nearest = Math.round(-targetRotation / step);
      targetRotation = -nearest * step;
      targetRotation += 360 * Math.round((rotation - targetRotation) / 360);
    }, 145);
  }, { passive: false });

  if ('ResizeObserver' in window) new ResizeObserver(setRadius).observe(stage);
  else window.addEventListener('resize', setRadius, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') wake();
    else if (frame) { cancelAnimationFrame(frame); frame = 0; lastFrame = 0; }
  });
  setRadius();
  updateActive(0);
  wake();

  document.querySelectorAll('[data-rail-shift]').forEach((button) => button.addEventListener('click', () => {
    const rail = document.querySelector('#home-sample-rail');
    const cardWidth = rail?.querySelector('.home-sample-card')?.getBoundingClientRect().width || 280;
    rail?.scrollBy({ left: Number(button.dataset.railShift) * (cardWidth + 18), behavior: reducedMotion ? 'instant' : 'smooth' });
  }));

  // Pointer light keeps the Soda-inspired depth responsive without moving layout.
  if (finePointer && !reducedMotion) {
    hero.addEventListener('pointermove', (event) => {
      const rect = hero.getBoundingClientRect();
      hero.style.setProperty('--pointer-x', `${event.clientX - rect.left}px`);
      hero.style.setProperty('--pointer-y', `${event.clientY - rect.top}px`);
      hero.style.setProperty('--shadow-x', `${((event.clientX - rect.left) / rect.width - .5) * 28}px`);
      hero.style.setProperty('--shadow-y', `${((event.clientY - rect.top) / rect.height - .5) * 22}px`);
    }, { passive: true });
    hero.addEventListener('pointerleave', () => {
      hero.style.setProperty('--shadow-x', '0px'); hero.style.setProperty('--shadow-y', '0px');
    });
  }

  document.querySelectorAll('.home-sample-image img').forEach((image) => {
    image.addEventListener('error', () => { image.closest('.home-sample-image')?.classList.add('image-missing'); }, { once: true });
  });
})();

// Drift Wall, adapted from the supplied React Bits component for the static site.
(() => {
  const wall = document.querySelector('#home-drift-wall[data-visual="drift"]');
  if (!wall) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const columns = () => innerWidth < 560 ? 2 : 5;
  const unit = () => {
    const mobile = innerWidth < 560;
    const gap = mobile ? 8 : 14;
    const count = columns();
    const available = Math.max(0, wall.clientWidth - gap * (count - 1));
    const maxWidth = mobile ? 190 : 350;
    const fill = .88;
    return { width: Math.min(maxWidth, available / count * fill), gap };
  };
  const state = { tracks: [], groups: [], offsets: [], velocities: [], hoverColumn: -1, last: 0, frame: 0, visible: true, pointer: { x: 0, y: 0 }, pointerDamped: { x: 0, y: 0 } };
  let activeTile = null;
  let pointerInside = false;

  function markActive(tile) {
    if (activeTile === tile) return;
    activeTile?.classList.remove('is-active');
    activeTile = tile;
    activeTile?.classList.add('is-active');
    state.hoverColumn = activeTile ? Number(activeTile.dataset.col) : -1;
  }

  function render(items) {
    if (!items.length) {
      state.tracks = []; state.groups = []; state.offsets = []; state.velocities = [];
      wall.innerHTML = '<div class="drift-wall__empty">실시간 작품 포스터를 찾지 못했습니다.</div>';
      return;
    }
    const count = columns();
    const dimensions = unit();
    wall.style.setProperty('--dw-tile-w', `${dimensions.width}px`);
    wall.style.setProperty('--dw-tile-h', `${Math.round(dimensions.width * 1.5)}px`);
    wall.style.setProperty('--dw-gap', `${dimensions.gap}px`);
    wall.style.setProperty('--dw-radius', '0px');
    const groups = Array.from({ length: count }, (_, column) => items.filter((_, index) => index % count === column));
    const plane = document.createElement('div');
    plane.className = 'drift-wall__plane';
    plane.style.transform = 'translate(-50%,-50%) scale(1.18) rotateX(16deg) rotateY(-14deg) rotateZ(0deg) translateZ(-120px)';
    const tracks = [];
    const offsets = [];
    const velocities = [];
    groups.forEach((group, column) => {
      const col = document.createElement('div');
      col.className = 'drift-wall__col';
      const track = document.createElement('div');
      track.className = 'drift-wall__track';
      const copyHeight = group.length * (Math.round(dimensions.width * 1.5) + dimensions.gap);
      const copies = Math.max(3, Math.ceil((wall.clientHeight * 2.2) / Math.max(copyHeight, 1)) + 1);
      for (let copy = 0; copy < copies; copy++) group.forEach((item, itemIndex) => {
        const link = document.createElement('a');
        link.className = 'drift-wall__tile';
        link.classList.add('is-loading');
        link.dataset.col = String(column);
        link.dataset.flowOffset = String(copy * copyHeight + itemIndex * (Math.round(dimensions.width * 1.5) + dimensions.gap));
        if (copy > 0) { link.setAttribute('aria-hidden', 'true'); link.tabIndex = -1; }
        link.href = `./drama.html?title=${encodeURIComponent(item.title)}`;
        link.setAttribute('aria-label', `${item.title} 포스터 보기 · 역사 배경 이야기로 이동`);
        const inner = document.createElement('span'); inner.className = 'drift-wall__inner';
        const fallback = document.createElement('span'); fallback.className = 'drift-wall__fallback'; fallback.setAttribute('aria-hidden', 'true');
        const image = document.createElement('img');
        image.alt = `${item.title} 드라마 포스터`;
        image.referrerPolicy = 'no-referrer';
        const prioritizeFirstLoad = copy === 0 && itemIndex < 4;
        image.loading = prioritizeFirstLoad ? 'eager' : 'lazy'; image.decoding = 'async'; image.draggable = false;
        image.fetchPriority = prioritizeFirstLoad ? 'low' : 'auto';
        const posterCandidates = [...new Set([item.posterUrl, ...(item.posterFallbackUrls || [])].filter(Boolean))];
        let candidateIndex = 0;
        const useNextPoster = () => {
          if (candidateIndex >= posterCandidates.length) {
            link.classList.remove('is-loading', 'has-poster');
            link.classList.add('is-missing');
            link.setAttribute('aria-label', `${item.title}의 포스터 이미지를 불러오지 못했습니다. 역사 배경 이야기로 이동`);
            image.alt = '';
            image.removeAttribute('src');
            return;
          }
          link.classList.remove('has-poster', 'is-missing');
          link.classList.add('is-loading');
          image.src = posterCandidates[candidateIndex++];
        };
        image.addEventListener('load', () => {
          // Try only curated, title-matched poster URLs. Keep a neutral
          // charcoal fallback visible if a candidate is broken or not portrait.
          const portraitRatio = image.naturalHeight / Math.max(image.naturalWidth, 1);
          if (image.naturalWidth > 0 && portraitRatio >= 1.08) {
            link.classList.remove('is-loading', 'is-missing');
            link.classList.add('has-poster');
          } else useNextPoster();
        });
        image.addEventListener('error', useNextPoster);
        useNextPoster();
        const title = document.createElement('span'); title.className = 'drift-wall__meta';
        const period = document.createElement('small'); period.textContent = item.period || '한국 사극';
        const name = document.createElement('strong'); name.textContent = item.title;
        title.append(period, name); inner.append(fallback, image, title); link.append(inner); track.append(link);
      });
      col.append(track); plane.append(col); tracks.push(track); offsets.push((column * .37) % 1 * copyHeight); velocities.push(0);
    });
    wall.replaceChildren(plane);
    state.tracks = tracks; state.groups = groups; state.offsets = offsets; state.velocities = velocities; state.last = 0;
    if (!reduced) wake();
  }

  function animate(now) {
    state.frame = 0;
    if (!state.visible || document.visibilityState !== 'visible') return;
    const dt = Math.min(.05, state.last ? (now - state.last) / 1000 : 1 / 60);
    state.last = now;
    const plane = wall.querySelector('.drift-wall__plane');
    const maxTilt = 0.6 * 8;
    const targetX = state.pointer.x * maxTilt;
    const targetY = -state.pointer.y * maxTilt;
    const pointerDamp = 1 - Math.exp(-dt / 0.12);
    state.pointerDamped.x += (targetX - state.pointerDamped.x) * pointerDamp;
    state.pointerDamped.y += (targetY - state.pointerDamped.y) * pointerDamp;
    if (plane) plane.style.transform = `translate(-50%,-50%) scale(1.18) rotateX(${16 + state.pointerDamped.y}deg) rotateY(${-14 + state.pointerDamped.x}deg) rotateZ(0deg) translateZ(-120px)`;
    const dims = unit();
    const tileHeight = Math.round(dims.width * 1.5);
    state.tracks.forEach((track, column) => {
      const group = state.groups[column] || [];
      const copyHeight = group.length * (tileHeight + dims.gap);
      const dir = column % 2 ? -1 : 1;
      const variance = 0.45;
      const factor = 1 + variance * ((((column * 0.6180339887 + 0.35) % 1) * 2) - 1);
      const target = !reduced && state.hoverColumn !== column ? 42 * factor * dir : 0;
      state.velocities[column] += (target - state.velocities[column]) * (1 - Math.exp(-dt / (target ? .28 : .16)));
      state.offsets[column] = ((state.offsets[column] + state.velocities[column] * dt) % copyHeight + copyHeight) % copyHeight;
      track.style.transform = `translate3d(0,${-state.offsets[column]}px,0)`;
    });
    if (!reduced && (pointerInside || state.hoverColumn >= 0 || state.velocities.some((speed) => Math.abs(speed) > .25))) state.frame = requestAnimationFrame(animate);
    else state.last = 0;
  }
  function wake() { if (!reduced && !state.frame && state.visible) state.frame = requestAnimationFrame(animate); }

  wall.addEventListener('pointermove', (event) => {
    const rect = wall.getBoundingClientRect();
    if (rect.width && rect.height && !reduced) {
      state.pointer.x = (event.clientX - rect.left) / rect.width - 0.5;
      state.pointer.y = (event.clientY - rect.top) / rect.height - 0.5;
    }
    const tile = event.target.closest('.drift-wall__tile');
    if (tile) markActive(tile);
    wake();
  }, { passive: true });
  wall.addEventListener('pointerenter', (event) => { pointerInside = true; if (event.target.closest('.drift-wall__tile')) markActive(event.target.closest('.drift-wall__tile')); wake(); }, { passive: true });
  wall.addEventListener('pointerleave', () => { pointerInside = false; state.pointer = { x: 0, y: 0 }; markActive(null); wake(); }, { passive: true });
  wall.addEventListener('focusin', (event) => { const tile = event.target.closest('.drift-wall__tile'); if (tile) markActive(tile); wake(); });
  wall.addEventListener('focusout', (event) => { if (!wall.contains(event.relatedTarget)) { markActive(null); wake(); } });
  window.addEventListener('resize', () => { if (state.items?.length) render(state.items); }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') { state.visible = true; wake(); }
    else { state.visible = false; if (state.frame) cancelAnimationFrame(state.frame); state.frame = 0; state.last = 0; }
  });
  if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => {
    state.visible = entry.isIntersecting;
    if (state.visible) wake(); else if (state.frame) { cancelAnimationFrame(state.frame); state.frame = 0; state.last = 0; }
  }, { rootMargin: '120px' }).observe(wall);
  function validatePoster(item) {
    const candidates = [...new Set([item.posterUrl, ...(item.posterFallbackUrls || [])].filter(Boolean))];
    return new Promise((resolve) => {
      let index = 0;
      const tryNext = () => {
        if (index >= candidates.length) return resolve(null);
        const url = candidates[index++];
        const image = new Image();
        image.referrerPolicy = 'no-referrer';
        let settled = false;
        const timeout = setTimeout(() => {
          if (settled) return;
          settled = true;
          image.onload = null; image.onerror = null; image.src = '';
          tryNext();
        }, 8000);
        image.onload = () => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          if (image.naturalWidth > 0 && image.naturalHeight / image.naturalWidth >= 1.08) {
            resolve({ ...item, posterUrl: url, posterFallbackUrls: candidates.slice(index) });
          } else tryNext();
        };
        image.onerror = () => { if (settled) return; settled = true; clearTimeout(timeout); tryNext(); };
        image.src = url;
      };
      tryNext();
    });
  }
  async function validatePosters(items) {
    const valid = new Array(items.length);
    let cursor = 0;
    const workers = Array.from({ length: Math.min(5, items.length) }, async () => {
      while (cursor < items.length) {
        const index = cursor++;
        valid[index] = await validatePoster(items[index]);
      }
    });
    await Promise.all(workers);
    return valid.filter(Boolean);
  }
  window.SagukStatic.dramaWall().then(async (data) => {
      const items = Array.isArray(data?.items) ? data.items.filter((item) => item?.title && item?.posterUrl).slice(0, 25) : [];
      state.items = await validatePosters(items);
      render(state.items);
    })
    .catch(() => {
      const plane = wall.querySelector('.drift-wall__plane');
      if (plane) plane.innerHTML = '<p class="drift-wall__loading">포스터 목록을 불러오지 못했습니다.</p>';
    });
})();
