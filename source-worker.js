const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
const normalize = (value) => String(value || '').normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]/gu, '');
const clean = (value, max = 1400) => String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const withCors = (response, origin) => {
  const headers = new Headers(response.headers);
  headers.set('access-control-allow-origin', origin);
  headers.set('access-control-allow-methods', 'GET, POST, OPTIONS');
  headers.set('access-control-allow-headers', 'content-type');
  headers.set('access-control-max-age', '86400');
  headers.append('vary', 'Origin');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};
const sourceFor = (group) => group?.source?.url ? [{ title: group.source.title, url: group.source.url }] : [];
const koreanDramas = () => (Array.isArray(DRAMA_DATABASE) ? DRAMA_DATABASE : []).filter((drama) => drama.country === '대한민국');

function findDrama(input) {
  const key = normalize(input.replace(/[\s·]*(드라마|사극)$/u, '').trim());
  if (!key) return null;
  const dramas = koreanDramas();
  return dramas.find((drama) => [drama.title, ...(drama.aliases || [])].some((name) => normalize(name) === key))
    || dramas.find((drama) => [drama.title, ...(drama.aliases || [])].some((name) => {
      const title = normalize(name);
      return title.length >= 3 && (title.includes(key) || key.includes(title));
    })) || null;
}

function groupFor(drama) {
  if (!drama) return null;
  const groups = Array.isArray(STORY_GROUPS) ? STORY_GROUPS : [];
  const anchor = normalize(drama.storyAnchor || drama.title);
  return groups.find((group) => (group.titles || []).some((title) => normalize(title) === anchor))
    || groups.find((group) => (group.titles || []).some((title) => normalize(title) === normalize(drama.title))) || null;
}

function plotBeats(drama) {
  const candidates = [drama.synopsis, drama.context]
    .filter(Boolean)
    .flatMap((value) => clean(value, 700).split(/(?<=[.!?])\s+/u))
    .map((value) => clean(value, 220))
    .filter((value) => value.length >= 9)
    .filter((value, index, all) => all.findIndex((candidate) => normalize(candidate) === normalize(value)) === index);
  const characters = (drama.mainCharacters || []).map((character) =>
    clean(`주요 인물: ${character.name} · ${character.role}`, 180)).filter(Boolean);
  const beats = [...candidates, ...characters];
  return [0, 1, 2].map((index) => beats[index % Math.max(1, beats.length)] || clean(drama.synopsis || drama.context, 180));
}

function comparePoint(drama, event, index, fallbackDramatization = '') {
  if (fallbackDramatization && fallbackDramatization.includes(`〈${drama.title}〉`)) return clean(fallbackDramatization, 900);
  const beat = clean(drama.synopsis || plotBeats(drama)[index] || drama.context, 520);
  const characters = (drama.mainCharacters || []).slice(0, 4).map((character) =>
    clean(`${character.name}(${character.role})`, 100)).filter(Boolean);
  const characterLine = characters.length ? `중심 인물 설정은 ${characters.join('·')}이다.` : '';
  const fictional = (drama.mainCharacters || []).filter((character) => /(창작|가상|허구)/u.test(character.role || ''));
  const fictionalLine = fictional.length
    ? `${fictional.map((character) => character.name).join('·')}은 작품을 위해 만든 인물이며, 이 인물의 행적을 실제 인물의 전기로 읽을 근거는 사료에 없다.`
    : '작품이 덧붙인 사적 대화·감정·인물 관계는 사건 기록과 별도로 확인해야 한다.';
  const contextual = ['시대 배경 참고', '가상 인물·사건 중심'].includes(drama.historyConnection)
    || (drama.comparisonNote || '').includes('시대 배경');
  const narrative = clean(event.narrative || '', 420);
  const record = clean(event.evidence || '', 420);
  const focus = `이 장에서 비교할 역사 대목은 ${event.title}이다. ${narrative}`;
  const distinction = contextual
    ? `이 작품의 배경은 ${beat} ${characterLine} ${focus} 이 자료는 ${event.title}의 시대·제도적 맥락을 설명하지만, 극중 주인공의 개별 행적이 실제였다는 근거는 아니다. ${fictionalLine}`
    : `이 작품의 줄거리는 ${beat} ${characterLine} ${focus} 기록의 핵심은 ${record || `${event.title}의 사건 경과`}이다. 드라마의 인물 관계와 사적 대화, 회차별 사건 연결이 사료에 적혀 있는지 구분해 읽는다. ${fictionalLine}`;
  return clean(distinction, 1500);
}

function storyFor(drama) {
  const group = groupFor(drama);
  if (!group) return null;
  const defaultSources = sourceFor(group);
  const chapters = (group.events || []).map((event, index) => {
    const [date, title, narrative, evidence] = Array.isArray(event)
      ? event
      : [event.date, event.title, event.narrative, event.evidence];
    const fallbackDramatization = Array.isArray(event) ? event[4] : event.dramatization;
    const eventValue = Array.isArray(event)
      ? { date, title, narrative, evidence, sources: null }
      : event;
    return {
      date, title, narrative, evidence,
      dramatization: comparePoint(drama, eventValue, index, fallbackDramatization),
      recordText: clean([
        narrative.split(/(?<=[.!?])\s+/u)
          .filter((sentence) => !/(드라마|작품 속|작품의|극의 설정|극중|가상 인물)/u.test(sentence))
          .join(' '),
        evidence,
      ]
        .concat([drama.historyConnection === '시대 배경 참고' || drama.historyConnection === '가상 인물·사건 중심'
          ? '이 자료는 해당 시대의 배경을 보여주는 근거이며 작품 속 가상 인물의 생애를 증명하지 않는다.'
          : '기록이 확인하는 범위와 드라마가 상상으로 채운 인물 관계·대화·장면의 범위를 구분한다.'])
        .join(' '), 1400),
      sources: (Array.isArray(event) ? null : event.sources)?.length ? event.sources : defaultSources,
    };
  });
  const historicalContext = clean(drama.context || drama.note, 1000);
  return {
    mode: 'database',
    title: drama.title,
    period: drama.period || '한국사',
    range: drama.range || '',
    introduction: historicalContext,
    summary: historicalContext,
    synopsis: clean(drama.synopsis || historicalContext, 600),
    mainCharacters: (drama.mainCharacters || []).slice(0, 6),
    historyConnection: drama.historyConnection || '시대 배경 참고',
    comparisonNote: clean(drama.comparisonNote || '작품의 줄거리와 인물 관계를 기록에 남은 사실과 구분해 읽습니다.', 500),
    context: historicalContext,
    distinction: clean(drama.note || '인물의 대사·감정·사적 관계는 기록만으로 확인하기 어렵다. 작품의 장면과 사료가 확인하는 사건을 구분한다.', 500),
    chapters,
    sources: [...new Map(chapters.flatMap((chapter) => chapter.sources || []).map((source) => [source.url, source])).values()],
    posterUrl: drama.posterUrl || null,
    posterSourceUrl: drama.posterSourceUrl || null,
    posterSourceName: drama.posterSourceName || null,
  };
}

const TOPIC_EXPANSIONS = [
  [/삼국시대|삼국/u, ['고구려', '백제', '신라', '삼국']],
  [/고려시대|고려/u, ['고려']],
  [/조선시대|조선/u, ['조선']],
  [/개항기|개항|대한제국|구한말/u, ['개항', '대한제국', '구한말', '일제강점기']],
  [/독립운동|일제강점기|3\.?1운동|임시정부/u, ['독립운동', '일제강점기', '3·1운동', '대한민국 임시정부', '광복']],
  [/임진왜란/u, ['임진왜란', '이순신', '전쟁']],
  [/한국전쟁|6\.?25/u, ['한국전쟁', '전쟁', '서울 수복']],
  [/고구려/u, ['고구려', '주몽']],
  [/신라/u, ['신라', '선덕여왕', '화랑']],
  [/백제/u, ['백제']],
];
const STOP_WORDS = new Set(['시대', '역사', '한국', '사극', '드라마', '배경', '관련', '작품', '그리고', '에서', '으로', '대한', '대한민국']);

function searchTerms(input) {
  const words = String(input).split(/[\s,·/]+/u).flatMap((word) => {
    const original = normalize(word);
    const stem = normalize(word.replace(/(에서|으로|부터|까지|에게|은|는|이|가|을|를|의|에|와|과)$/u, ''));
    return [original, ...(stem.length >= 2 && stem !== original ? [stem] : [])];
  }).filter((word) => word.length >= 2 && !STOP_WORDS.has(word));
  const expanded = [...words];
  for (const [pattern, values] of TOPIC_EXPANSIONS) if (pattern.test(input)) expanded.push(...values.map(normalize));
  return [...new Set(expanded)];
}

function rankDrama(input, drama) {
  const title = normalize(drama.title);
  const aliases = (drama.aliases || []).map(normalize);
  const keywords = (drama.keywords || []).map(normalize);
  const group = groupFor(drama);
  const historicalTerms = [
    ...(group?.titles || []),
    ...(group?.events || []).flatMap((event) => Array.isArray(event) ? [event[1]] : [event.title]),
  ].map(normalize).filter(Boolean);
  const searchable = normalize([
    drama.title, ...(drama.aliases || []), drama.period, drama.range, ...(drama.keywords || []),
    drama.context, drama.synopsis, drama.note, ...(drama.mainCharacters || []).flatMap((item) => [item.name, item.role]),
    ...historicalTerms,
  ].join(' '));
  const query = normalize(input);
  let score = 0;
  if (title === query || aliases.includes(query)) score += 24;
  else if (query.length >= 3 && (title.includes(query) || aliases.some((alias) => alias.includes(query)))) score += 16;
  const terms = searchTerms(input);
  for (const term of terms) {
    if (!term || !searchable.includes(term)) continue;
    score += title.includes(term) || aliases.some((alias) => alias.includes(term)) ? 10
      : keywords.some((keyword) => keyword.includes(term) || term.includes(keyword)) ? 7
        : historicalTerms.some((topic) => topic === term || topic.includes(term) || term.includes(topic)) ? 6
          : term.length >= 4 ? 4 : 2;
  }
  return score;
}

function recommendations(input) {
  const ranked = koreanDramas().map((drama) => ({ drama, score: rankDrama(input, drama) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.drama.title.localeCompare(b.drama.title, 'ko'))
    .slice(0, 5);
  const picks = ranked.map(({ drama }) => {
    const group = groupFor(drama);
    return {
      title: drama.title,
      searchTitle: drama.title,
      period: drama.period || '한국사',
      range: drama.range || '',
      reason: clean(drama.synopsis || drama.context, 340),
      learning: (drama.keywords || []).slice(0, 4).join(' · ') || drama.period || '한국사',
      note: clean(drama.note || '역사 기록에 남은 사실과 드라마의 각색을 나누어 살펴보세요.', 250),
      posterUrl: drama.posterUrl || null,
      posterSourceUrl: drama.posterSourceUrl || null,
      posterSourceName: drama.posterSourceName || null,
      sources: sourceFor(group),
    };
  });
  return json({
    mode: 'database',
    period: input,
    introduction: picks.length ? '등록된 작품 정보에서 주제와 시대 배경이 가까운 작품을 골랐습니다.' : '등록된 작품 정보에서 일치하는 작품을 찾지 못했습니다.',
    recommendations: picks,
    sources: [...new Map(picks.flatMap((item) => item.sources).map((source) => [source.url, source])).values()],
  });
}

function recommendationKeywordCatalog() {
  const eras = ['삼국 시대', '남북국 시대', '고려 시대', '조선 전기', '조선 중기', '조선 후기', '개항기·대한제국', '조선 시대 (가상 서사)'];
  const catalog = new Map(eras.map((era) => [era, new Set()]));
  for (const drama of koreanDramas()) {
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
    const group = groupFor(drama);
    const terms = [
      drama.title, ...(drama.aliases || []), drama.period, drama.range,
      ...(drama.keywords || []), ...(drama.mainCharacters || []).map((person) => person.name),
      ...(group?.titles || []),
      ...(group?.events || []).flatMap((event) => Array.isArray(event) ? [event[1]] : [event.title]),
    ];
    for (const term of terms) {
      const value = clean(term, 50);
      if (value.length >= 2) catalog.get(era).add(value);
    }
  }
  return [...catalog].map(([era, terms]) => ({ era, keywords: [...terms].sort((a, b) => a.localeCompare(b, 'ko')) }));
}

async function readJson(request, maxBytes = 4096) {
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') return null;
  const length = Number(request.headers.get('content-length') || 0);
  if (length > maxBytes) return null;
  try { return await request.json(); } catch { return null; }
}

let discoveredVoiceId = '';
let discoveredVoiceExpiresAt = 0;

async function getVoiceId(env) {
  if (env.ELEVENLABS_VOICE_ID) return env.ELEVENLABS_VOICE_ID;
  if (discoveredVoiceId && Date.now() < discoveredVoiceExpiresAt) return discoveredVoiceId;
  const response = await fetch('https://api.elevenlabs.io/v1/voices?show_legacy=true', {
    headers: { 'xi-api-key': env.ELEVENLABS_API_KEY, accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`VOICE_LIST_${response.status}`);
  const data = await response.json();
  const voices = Array.isArray(data?.voices) ? data.voices.filter((voice) => voice?.voice_id) : [];
  if (!voices.length) throw new Error('NO_VOICES');
  const score = (voice) => {
    const labels = Object.values(voice.labels || {}).join(' ');
    const about = `${voice.name || ''} ${voice.description || ''} ${labels}`.toLowerCase();
    return (/korean|한국어|ko[-_ ]?kr/.test(about) ? 100 : 0)
      + (/narrat|audiobook|해설/.test(about) ? 20 : 0)
      + (/multilingual/.test(about) ? 5 : 0);
  };
  voices.sort((a, b) => score(b) - score(a));
  discoveredVoiceId = voices[0].voice_id;
  discoveredVoiceExpiresAt = Date.now() + 10 * 60 * 1000;
  return discoveredVoiceId;
}

async function voice(request, env) {
  const body = await readJson(request, 1024);
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const index = body?.chapterIndex;
  const kind = body?.kind;
  if (title.length < 2 || title.length > 80 || !Number.isInteger(index) || index < 0 || !['drama', 'record'].includes(kind)) {
    return json({ error: '작품과 장면 정보를 확인할 수 없습니다.' }, 400);
  }
  if (!env.ELEVENLABS_API_KEY) return json({ error: '해설 음성이 아직 연결되지 않았습니다. 운영자가 ELEVENLABS_API_KEY를 설정하면 이용할 수 있습니다.' }, 503);
  const drama = findDrama(title);
  const story = storyFor(drama);
  const chapter = story?.chapters[index];
  if (!chapter) return json({ error: '해당 작품의 해설 장면을 찾을 수 없습니다.' }, 404);
  const narration = kind === 'drama' ? chapter.dramatization : chapter.recordText || chapter.evidence;
  const text = clean(narration, 1800);
  if (!text) return json({ error: '읽어 들려줄 해설이 없습니다.' }, 404);

  const modelId = env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';
  let voiceId;
  try { voiceId = await getVoiceId(env); }
  catch (error) {
    console.error('ELEVENLABS_VOICE_UNAVAILABLE', error instanceof Error ? error.message : 'unknown');
    return json({ error: '사용할 음성을 찾지 못했습니다. ElevenLabs 계정에 이용 가능한 음성이 있는지 확인해 주세요.' }, 502);
  }
  const hashInput = new TextEncoder().encode(`${voiceId}\n${modelId}\n${text}`);
  const digest = await crypto.subtle.digest('SHA-256', hashInput);
  const hash = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
  const cacheRequest = new Request(`https://audio-cache.saguk-archive.invalid/${hash}`);
  let cache = null;
  try { cache = globalThis.caches?.default || null; } catch { /* Sites Workers may not expose the Cache API. */ }
  if (cache) {
    try {
      const cached = await cache.match(cacheRequest);
      if (cached) return cached;
    } catch {
      cache = null;
    }
  }

  let response;
  try {
    response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/stream`, {
      method: 'POST',
      headers: { 'xi-api-key': env.ELEVENLABS_API_KEY, 'content-type': 'application/json', accept: 'audio/mpeg' },
      body: JSON.stringify({ text, model_id: modelId, voice_settings: { stability: 0.58, similarity_boost: 0.72, style: 0.12, use_speaker_boost: true } }),
      signal: AbortSignal.timeout(45000),
    });
  } catch {
    return json({ error: '해설 음성 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.' }, 502);
  }
  if (!response.ok) {
    console.error('ELEVENLABS_TTS_REJECTED', response.status);
    return json({ error: '해설 음성을 만들지 못했습니다. 운영자의 ElevenLabs 설정을 확인해 주세요.' }, 502);
  }
  const audio = await response.arrayBuffer();
  const headers = { 'content-type': 'audio/mpeg', 'cache-control': 'public, max-age=31536000, immutable', 'x-content-type-options': 'nosniff' };
  if (cache) {
    try { await cache.put(cacheRequest, new Response(audio.slice(0), { headers })); } catch { /* Audio generation should work without an edge cache. */ }
  }
  return new Response(audio, { headers });
}

async function dramaWall() {
  return json({ items: koreanDramas().filter((drama) => drama.posterUrl).map((drama) => ({
    title: drama.title, period: drama.period, posterUrl: drama.posterUrl,
    posterFallbackUrls: Array.isArray(drama.posterFallbackUrls) ? drama.posterFallbackUrls : [],
    posterSourceUrl: drama.posterSourceUrl || null, posterSourceName: drama.posterSourceName || null,
  })), source: '작품 데이터베이스' });
}

export default {
  async fetch(request, env = {}) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      const origin = request.headers.get('origin');
      const isCrossOrigin = Boolean(origin && origin !== url.origin);
      const allowedOrigins = String(env.SAGUK_ALLOWED_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean);
      if (isCrossOrigin && !allowedOrigins.includes(origin)) return json({ error: '허용되지 않은 사이트에서 요청했습니다.' }, 403);
      if (isCrossOrigin && request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: {
          'access-control-allow-origin': origin,
          'access-control-allow-methods': 'GET, POST, OPTIONS',
          'access-control-allow-headers': 'content-type',
          'access-control-max-age': '86400',
          'vary': 'Origin',
        } });
      }
      const response = await (async () => {
        if (url.pathname === '/api/drama-wall' && request.method === 'GET') return dramaWall();
        if (url.pathname === '/api/recommendation-keywords' && request.method === 'GET') return json({ eras: recommendationKeywordCatalog() });
        if (request.method !== 'POST') return json({ error: 'POST 요청만 지원합니다.' }, 405);
        if (url.pathname === '/api/voice') return voice(request, env);
        if (url.pathname !== '/api/story' && url.pathname !== '/api/drama-context' && url.pathname !== '/api/recommendations') {
          return json({ error: '없는 API입니다.' }, 404);
        }
        const body = await readJson(request);
        const key = url.pathname === '/api/recommendations' ? 'period' : 'title';
        const input = typeof body?.[key] === 'string' ? body[key].trim() : '';
        if (input.length < 2 || input.length > 80) return json({ error: '2~80자의 내용을 입력해 주세요.' }, 400);
        if (key === 'period') return recommendations(input);
        const drama = findDrama(input);
        if (!drama) return json({ error: `“${input}” 작품은 데이터베이스에서 찾지 못했습니다. 제목을 확인하거나 등록된 사극을 검색해 주세요.` }, 404);
        const data = storyFor(drama);
        if (!data) return json({ error: '이 작품의 역사 흐름 자료를 준비하지 못했습니다.' }, 404);
        return json(data);
      })();
      return isCrossOrigin ? withCors(response, origin) : response;
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405 });
    const asset = STATIC_ASSETS[url.pathname === '/' ? '/index.html' : url.pathname];
    if (!asset) return new Response('Not found', { status: 404 });
    const body = asset.encoding === 'base64' ? Uint8Array.from(atob(asset.body), (character) => character.charCodeAt(0)) : asset.body;
    return new Response(request.method === 'HEAD' ? null : body, { headers: { 'content-type': asset.type, 'cache-control': 'no-cache', 'x-content-type-options': 'nosniff' } });
  },
};
