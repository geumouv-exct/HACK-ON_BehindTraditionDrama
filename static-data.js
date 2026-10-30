// GitHub Pages fallback: serve the saved Korean drama catalogue without a Worker API.
(() => {
  const normalize = (value) => String(value || '').normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]/gu, '');
  const clean = (value, max = 1400) => String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
  const sourceFor = (group) => group?.source?.url ? [{ title: group.source.title, url: group.source.url }] : [];
  const state = Promise.all([
    fetch(new URL('./data/catalog.json', location.href)).then((response) => { if (!response.ok) throw new Error('작품 자료를 읽지 못했습니다.'); return response.json(); }),
    fetch(new URL('./data/story-groups.json', location.href)).then((response) => { if (!response.ok) throw new Error('역사 자료를 읽지 못했습니다.'); return response.json(); }),
  ]).then(([dramas, groups]) => ({ dramas, groups }));

  function groupFor(drama, groups) {
    if (!drama) return null;
    const anchor = normalize(drama.storyAnchor || drama.title);
    return groups.find((group) => (group.titles || []).some((title) => normalize(title) === anchor))
      || groups.find((group) => (group.titles || []).some((title) => normalize(title) === normalize(drama.title))) || null;
  }

  function findDrama(input, dramas) {
    const key = normalize(String(input || '').replace(/[\s·]*(드라마|사극)$/u, '').trim());
    if (!key) return null;
    const candidates = dramas.filter((drama) => drama.country === '대한민국');
    return candidates.find((drama) => [drama.title, ...(drama.aliases || [])].some((name) => normalize(name) === key))
      || candidates.find((drama) => [drama.title, ...(drama.aliases || [])].some((name) => {
        const title = normalize(name);
        return title.length >= 3 && (title.includes(key) || key.includes(title));
      })) || null;
  }

  const expansions = [
    [/삼국시대|삼국/u, ['고구려', '백제', '신라', '삼국']], [/고려시대|고려/u, ['고려']], [/조선시대|조선/u, ['조선']],
    [/개항기|개항|대한제국|구한말/u, ['개항', '대한제국', '구한말', '일제강점기']],
    [/독립운동|일제강점기|3\.?1운동|임시정부/u, ['독립운동', '일제강점기', '3·1운동', '대한민국 임시정부', '광복']],
    [/임진왜란/u, ['임진왜란', '이순신', '전쟁']], [/한국전쟁|6\.?25/u, ['한국전쟁', '전쟁', '서울 수복']],
    [/고구려/u, ['고구려', '주몽']], [/신라/u, ['신라', '선덕여왕', '화랑']], [/백제/u, ['백제']],
  ];
  const stopWords = new Set(['시대', '역사', '한국', '사극', '드라마', '배경', '관련', '작품', '그리고', '에서', '으로', '대한', '대한민국']);
  function searchTerms(input) {
    const words = String(input).split(/[\s,·/]+/u).flatMap((word) => {
      const original = normalize(word);
      const stem = normalize(word.replace(/(에서|으로|부터|까지|에게|은|는|이|가|을|를|의|에|와|과)$/u, ''));
      return [original, ...(stem.length >= 2 && stem !== original ? [stem] : [])];
    }).filter((word) => word.length >= 2 && !stopWords.has(word));
    const expanded = [...words];
    for (const [pattern, values] of expansions) if (pattern.test(input)) expanded.push(...values.map(normalize));
    return [...new Set(expanded)];
  }

  function rankDrama(input, drama, groups) {
    const title = normalize(drama.title);
    const aliases = (drama.aliases || []).map(normalize);
    const group = groupFor(drama, groups);
    const historicalTerms = [
      ...(group?.titles || []), ...(group?.events || []).flatMap((event) => Array.isArray(event) ? [event[1]] : [event.title]),
    ].map(normalize).filter(Boolean);
    const searchable = normalize([
      drama.title, ...(drama.aliases || []), drama.period, drama.range, ...(drama.keywords || []), drama.context, drama.synopsis,
      drama.note, ...(drama.mainCharacters || []).flatMap((item) => [item.name, item.role]), ...historicalTerms,
    ].join(' '));
    const query = normalize(input);
    let score = title === query || aliases.includes(query) ? 24
      : query.length >= 3 && (title.includes(query) || aliases.some((alias) => alias.includes(query)) ? 16 : 0);
    for (const term of searchTerms(input)) {
      if (!term || !searchable.includes(term)) continue;
      score += title.includes(term) || aliases.some((alias) => alias.includes(term)) ? 10
        : (drama.keywords || []).some((keyword) => normalize(keyword).includes(term) || term.includes(normalize(keyword))) ? 7
          : historicalTerms.some((topic) => topic === term || topic.includes(term) || term.includes(topic)) ? 6
            : term.length >= 4 ? 4 : 2;
    }
    return score;
  }

  function keywordCatalog(dramas, groups) {
    const eras = ['삼국 시대', '남북국 시대', '고려 시대', '조선 전기', '조선 중기', '조선 후기', '개항기·대한제국', '조선 시대 (가상 서사)'];
    const catalog = new Map(eras.map((era) => [era, new Set()]));
    for (const drama of dramas.filter((item) => item.country === '대한민국')) {
      const text = normalize([drama.title, drama.period, drama.range, ...(drama.keywords || [])].join(' '));
      let era = '조선 시대 (가상 서사)';
      if (/개항|대한제국|고종|명성황후|을미사변|의병|조선말|개화기/u.test(text)) era = '개항기·대한제국';
      else if (/통일신라|발해|남북국|김춘추|삼국통일|장보고|청해진/u.test(text)) era = '남북국 시대';
      else if (/고구려|백제|신라|삼국|선덕여왕|연개소문|주몽/u.test(text)) era = '삼국 시대';
      else if (/고려|왕건|무신정권|거란|원간섭기|몽골/u.test(text)) era = '고려 시대';
      else if (/조선/u.test(text)) {
        if (/태조|태종|세종|세조|단종|성종|연산군|계유정난|조선건국|15세기/u.test(text)) era = '조선 전기';
        else if (/중종|명종|선조|광해군|임진왜란|16세기|조선중기/u.test(text)) era = '조선 중기';
        else if (/인조|정묘호란|병자호란|숙종|경종|영조|정조|순조|헌종|철종|17세기|18세기|19세기|조선후기/u.test(text)) era = '조선 후기';
      }
      const group = groupFor(drama, groups);
      const terms = [drama.title, ...(drama.aliases || []), drama.period, drama.range, ...(drama.keywords || []),
        ...(drama.mainCharacters || []).map((person) => person.name), ...(group?.titles || []),
        ...(group?.events || []).flatMap((event) => Array.isArray(event) ? [event[1]] : [event.title])];
      for (const term of terms) { const value = clean(term, 50); if (value.length >= 2) catalog.get(era).add(value); }
    }
    return [...catalog].map(([era, terms]) => ({ era, keywords: [...terms].sort((a, b) => a.localeCompare(b, 'ko')) }));
  }

  function storyFor(input, dramas, groups) {
    const drama = findDrama(input, dramas);
    const group = groupFor(drama, groups);
    if (!drama || !group) return null;
    const defaultSources = sourceFor(group);
    const chapters = (group.events || []).map((event, index) => {
      const [date, title, narrative, evidence] = Array.isArray(event)
        ? event : [event.date, event.title, event.narrative, event.evidence];
      const fallback = Array.isArray(event) ? event[4] : event.dramatization;
      const characters = (drama.mainCharacters || []).slice(0, 4).map((character) => clean(`${character.name}(${character.role})`, 100)).filter(Boolean);
      const characterLine = characters.length ? `중심 인물 설정은 ${characters.join('·')}이다.` : '';
      const fictional = (drama.mainCharacters || []).filter((character) => /(창작|가상|허구)/u.test(character.role || ''));
      const fictionalLine = fictional.length
        ? `${fictional.map((character) => character.name).join('·')}은 작품을 위해 만든 인물이며, 이 인물의 행적을 실제 인물의 전기로 읽을 근거는 사료에 없다.`
        : '작품이 덧붙인 사적 대화·감정·인물 관계는 사건 기록과 별도로 확인해야 한다.';
      const contextual = ['시대 배경 참고', '가상 인물·사건 중심'].includes(drama.historyConnection) || (drama.comparisonNote || '').includes('시대 배경');
      const beat = clean(drama.synopsis || drama.context, 520);
      const record = clean(evidence || narrative || '', 420);
      const dramatic = fallback && fallback.includes(`〈${drama.title}〉`) ? clean(fallback, 900)
        : contextual
          ? `이 작품의 배경은 ${beat} ${characterLine} 이 장에서 비교할 역사 대목은 ${title}이다. ${narrative} 이 자료는 ${title}의 시대·제도적 맥락을 설명하지만, 극중 주인공의 개별 행적이 실제였다는 근거는 아니다. ${fictionalLine}`
          : `이 작품의 줄거리는 ${beat} ${characterLine} 이 장에서 비교할 역사 대목은 ${title}이다. ${narrative} 기록의 핵심은 ${record || `${title}의 사건 경과`}이다. 드라마의 인물 관계와 사적 대화, 회차별 사건 연결이 사료에 적혀 있는지 구분해 읽는다. ${fictionalLine}`;
      const recordNarrative = String(narrative || '').split(/(?<=[.!?])\s+/u)
        .filter((sentence) => !/(드라마|작품 속|작품의|극의 설정|극중|가상 인물)/u.test(sentence)).join(' ');
      const recordText = clean([recordNarrative, evidence,
        contextual ? '이 자료는 해당 시대의 배경을 보여주는 근거이며 작품 속 가상 인물의 생애를 증명하지 않는다.'
          : '기록이 확인하는 범위와 드라마가 상상으로 채운 인물 관계·대화·장면의 범위를 구분한다.'].filter(Boolean).join(' '), 1400);
      const eventSources = Array.isArray(event) ? null : event.sources;
      return { date, title, narrative, evidence, dramatization: clean(dramatic, 1500), recordText,
        sources: eventSources?.length ? eventSources : defaultSources };
    });
    const context = clean(drama.context || drama.note, 1000);
    return { mode: 'database', title: drama.title, period: drama.period || '한국사', range: drama.range || '',
      introduction: context, summary: context, synopsis: clean(drama.synopsis || context, 600),
      mainCharacters: (drama.mainCharacters || []).slice(0, 6), historyConnection: drama.historyConnection || '시대 배경 참고',
      comparisonNote: clean(drama.comparisonNote || '작품의 줄거리와 인물 관계를 기록에 남은 사실과 구분해 읽는다.', 500),
      context, distinction: clean(drama.note || '인물의 대사·감정·사적 관계는 기록만으로 확인하기 어렵다. 작품의 장면과 사료가 확인하는 사건을 구분한다.', 500),
      chapters, sources: [...new Map(chapters.flatMap((chapter) => chapter.sources || []).map((source) => [source.url, source])).values()],
      posterUrl: drama.posterUrl || null, posterSourceUrl: drama.posterSourceUrl || null, posterSourceName: drama.posterSourceName || null };
  }

  window.SagukStatic = {
    ready: state,
    async storyFor(title) { const { dramas, groups } = await state; return storyFor(title, dramas, groups); },
    async recommendations(input) {
      const { dramas, groups } = await state;
      const recommendations = dramas.filter((drama) => drama.country === '대한민국')
        .map((drama) => ({ drama, score: rankDrama(input, drama, groups) })).filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score || a.drama.title.localeCompare(b.drama.title, 'ko')).slice(0, 5)
        .map(({ drama }) => { const group = groupFor(drama, groups); return {
          title: drama.title, searchTitle: drama.title, period: drama.period || '한국사', range: drama.range || '',
          reason: clean(drama.synopsis || drama.context, 340), learning: (drama.keywords || []).slice(0, 4).join(' · ') || drama.period || '한국사',
          note: clean(drama.note || '역사 기록에 남은 사실과 드라마의 각색을 나누어 살펴본다.', 250),
          posterUrl: drama.posterUrl || null, posterSourceUrl: drama.posterSourceUrl || null,
          posterSourceName: drama.posterSourceName || null, sources: sourceFor(group),
        }; });
      return { mode: 'database', period: input,
        introduction: recommendations.length ? '등록된 작품 정보에서 주제와 시대 배경이 가까운 작품을 골랐다.' : '등록된 작품 정보에서 일치하는 작품을 찾지 못했다.',
        recommendations, sources: [...new Map(recommendations.flatMap((item) => item.sources).map((source) => [source.url, source])).values()] };
    },
    async keywordCatalog() { const { dramas, groups } = await state; return { eras: keywordCatalog(dramas, groups) }; },
    async dramaWall() {
      const { dramas } = await state;
      return { items: dramas.filter((drama) => drama.country === '대한민국' && drama.posterUrl).map((drama) => ({
        title: drama.title, period: drama.period, posterUrl: drama.posterUrl,
        posterFallbackUrls: Array.isArray(drama.posterFallbackUrls) ? drama.posterFallbackUrls : [],
        posterSourceUrl: drama.posterSourceUrl || null, posterSourceName: drama.posterSourceName || null,
      })), source: '작품 데이터베이스' };
    },
  };
})();
