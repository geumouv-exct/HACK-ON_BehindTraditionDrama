(() => {
  const menu = document.querySelector('#recommend-keyword-menu');
  const input = document.querySelector('#period-input');
  const form = document.querySelector('#recommend-form');
  const drawer = document.querySelector('#keyword-drawer');
  const drawerTrigger = drawer?.querySelector('.keyword-drawer-trigger');
  const sidebar = drawer?.querySelector('.keyword-sidebar');
  if (!menu || !input || !form || !drawer || !drawerTrigger || !sidebar) return;

  let drawerOpen = false;
  const setDrawerOpen = (open) => {
    drawerOpen = Boolean(open);
    drawer.dataset.open = String(drawerOpen);
    drawerTrigger.setAttribute('aria-expanded', String(drawerOpen));
    sidebar.setAttribute('aria-hidden', String(!drawerOpen));
    sidebar.inert = !drawerOpen;
  };
  const coarsePointer = matchMedia('(pointer: coarse)').matches;
  drawerTrigger.addEventListener('click', () => setDrawerOpen(coarsePointer ? !drawerOpen : true));
  drawer.addEventListener('focusin', (event) => {
    if (sidebar.contains(event.target)) setDrawerOpen(true);
  });
  drawer.addEventListener('focusout', (event) => {
    if (!drawer.contains(event.relatedTarget)) setDrawerOpen(false);
  });
  document.addEventListener('pointermove', (event) => {
    if (coarsePointer) return;
    const inRevealEdge = event.clientX <= 20 && event.clientY >= 82 && event.clientY < innerHeight - 4;
    const inDrawerArea = event.clientX <= 310 && event.clientY >= 82 && event.clientY < innerHeight - 4;
    if (inRevealEdge) setDrawerOpen(true);
    else if (drawerOpen && !inDrawerArea) setDrawerOpen(false);
  }, { passive: true });
  document.addEventListener('pointerdown', (event) => {
    if (coarsePointer && drawerOpen && !drawer.contains(event.target)) setDrawerOpen(false);
  });
  drawer.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && drawerOpen) {
      setDrawerOpen(false);
      drawerTrigger.focus();
    }
  });

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const marker = el('span', 'branched-menu__marker');
  marker.setAttribute('aria-hidden', 'true');
  menu.append(marker);

  const setOpen = (section, open) => {
    section.toggleAttribute('data-open', open);
    section.querySelector('.branched-menu__head')?.setAttribute('aria-expanded', String(open));
    section.querySelector('.branched-menu__body')?.setAttribute('aria-hidden', String(!open));
    section.querySelectorAll('.branched-menu__item').forEach((button) => { button.tabIndex = open ? 0 : -1; });
  };
  const moveMarker = (button) => {
    if (!button) return;
    requestAnimationFrame(() => {
      const navRect = menu.getBoundingClientRect();
      const itemRect = button.getBoundingClientRect();
      marker.style.top = `${itemRect.top - navRect.top + (itemRect.height - 16) / 2}px`;
      marker.dataset.on = '';
    });
  };

  const drawSection = (group, groupIndex) => {
    const section = el('div', 'branched-menu__section');
    const sectionId = `recommend-era-${groupIndex}`;
    const head = el('button', 'branched-menu__head', group.era);
    head.type = 'button'; head.setAttribute('aria-expanded', 'false'); head.setAttribute('aria-controls', `${sectionId}-body`);
    const body = el('div', 'branched-menu__body'); body.id = `${sectionId}-body`; body.setAttribute('aria-hidden', 'true');
    const fold = el('div', 'branched-menu__fold');
    const tree = el('div', 'branched-menu__tree');
    const children = Array.isArray(group.keywords) ? group.keywords : [];
    const rowHeight = 34;
    const pad = 5;
    const indent = 29;
    const radius = 7;
    const trunk = 8;
    const endX = indent - 5;
    const y = (index) => pad + index * rowHeight + rowHeight / 2;
    const branch = (index) => `M ${trunk} ${y(index) - radius} A ${radius} ${radius} 0 0 0 ${trunk + radius} ${y(index)} H ${endX}`;
    const reach = (index) => `M ${trunk} 0 V ${y(index) - radius} A ${radius} ${radius} 0 0 0 ${trunk + radius} ${y(index)} H ${endX}`;
    const length = (index) => y(index) - radius + (Math.PI * radius) / 2 + (endX - trunk - radius);
    tree.style.height = `${pad * 2 + Math.max(children.length, 1) * rowHeight}px`;
    if (children.length) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.classList.add('branched-menu__lines');
      svg.setAttribute('width', String(indent)); svg.setAttribute('height', String(pad * 2 + children.length * rowHeight));
      svg.setAttribute('aria-hidden', 'true');
      const spine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      spine.classList.add('branched-menu__base'); spine.setAttribute('d', `M ${trunk} 0 V ${y(children.length - 1) - radius}`); svg.append(spine);
      children.forEach((_, index) => {
        const base = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        base.classList.add('branched-menu__base'); base.setAttribute('d', branch(index)); svg.append(base);
        const active = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        active.classList.add('branched-menu__reach'); active.dataset.keywordIndex = String(index);
        active.setAttribute('d', reach(index)); active.style.strokeDasharray = String(length(index)); active.style.strokeDashoffset = String(length(index)); svg.append(active);
      });
      tree.append(svg);
    }
    children.forEach((keyword, index) => {
      const button = el('button', 'branched-menu__item', keyword);
      button.type = 'button'; button.dataset.keyword = keyword; button.dataset.group = String(groupIndex); button.dataset.index = String(index); button.tabIndex = -1;
      button.addEventListener('click', () => {
        menu.querySelectorAll('.branched-menu__item[data-active]').forEach((item) => item.removeAttribute('data-active'));
        menu.querySelectorAll('.branched-menu__reach').forEach((path) => { path.style.strokeDashoffset = path.style.strokeDasharray; });
        button.dataset.active = '';
        const path = tree.querySelector(`.branched-menu__reach[data-keyword-index="${index}"]`);
        if (path) path.style.strokeDashoffset = '0';
        setOpen(section, true);
        input.value = keyword;
        moveMarker(button);
        form.requestSubmit();
      });
      tree.append(button);
    });
    fold.append(tree); body.append(fold);
    head.addEventListener('click', () => setOpen(section, !section.hasAttribute('data-open')));
    section.append(head, body);
    return section;
  };

  window.SagukStatic.keywordCatalog()
    .then((response) => response.ok ? response.json() : Promise.reject(new Error('키워드 목록을 불러오지 못했습니다.')))
    .then((data) => {
      const eras = Array.isArray(data?.eras) ? data.eras.filter((group) => group.era && group.keywords?.length) : [];
      if (!eras.length) throw new Error('검색 키워드가 없습니다.');
      menu.replaceChildren(marker, ...eras.map(drawSection));
      const sections = [...menu.querySelectorAll('.branched-menu__section')];
      const requested = new URLSearchParams(location.search).get('period')?.trim();
      let activeButton = null;
      if (requested) activeButton = [...menu.querySelectorAll('.branched-menu__item')].find((button) => button.dataset.keyword === requested) || null;
      if (activeButton) {
        activeButton.dataset.active = '';
        const owner = activeButton.closest('.branched-menu__section');
        setOpen(owner, true);
        const path = owner.querySelector(`.branched-menu__reach[data-keyword-index="${activeButton.dataset.index}"]`);
        if (path) path.style.strokeDashoffset = '0';
      } else if (sections[0]) setOpen(sections[0], true);
      if (activeButton) moveMarker(activeButton);
      menu.addEventListener('scroll', () => activeButton && moveMarker(activeButton), { passive: true });
    })
    .catch(() => { menu.replaceChildren(el('p', 'keyword-menu-loading', '키워드 목록을 불러오지 못했습니다. 검색창에서 직접 입력해 주세요.')); });
})();
