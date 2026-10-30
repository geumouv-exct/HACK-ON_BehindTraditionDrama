// The model runs in the visitor's browser. No API key or paid inference endpoint is used.
const MODEL = 'onnx-community/granite-embedding-97m-multilingual-r2-ONNX';
const LIBRARY = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1';
let catalogPromise;
let extractorPromise;
let catalogVectorsPromise;
const normalize = (text) => String(text || '').normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]/gu, '');
const aliases = { 한글: '훈민정음', 한글창제: '훈민정음', 조선초: '조선 건국', 구한말: '대한제국', 임란: '임진왜란', 동학: '동학농민운동' };
function terms(query) {
  const expanded = `${query} ${Object.entries(aliases).filter(([key]) => normalize(query).includes(key)).map(([, value]) => value).join(' ')}`;
  return [...new Set(expanded.split(/[\s,·]+/).map((word) => normalize(word.replace(/(에서|으로|부터|까지|시대|왕조|에게|하고|와|과|의|을|를)$/u, ''))).filter((word) => word.length >= 2))];
}
function wordScore(query, drama) {
  const queryText = normalize(query);
  const words = terms(query);
  let score = queryText.includes(normalize(drama.title)) ? 12 : 0;
  const fields = [drama.period, drama.context, ...drama.keywords].map(normalize);
  for (const word of words) {
    if (fields.some((field) => field === word)) score += 5;
    else if (fields.some((field) => field.includes(word) || (word.length >= 3 && word.includes(field) && field.length >= 3))) score += 2;
  }
  return score;
}
function asResults(query, ranked, mode) {
  return { mode, period: query,
    introduction: mode === 'browser-ai'
      ? '기기에서 실행한 한국어 언어 모델이 질문과 작품 설명의 의미를 비교했습니다. 준비된 작품 23편 안에서 고른 결과입니다.'
      : '모델이 준비되는 동안 시대·인물·사건 단서를 비교한 기본 추천입니다. 준비된 작품 23편 안에서 고릅니다.',
    recommendations: ranked.slice(0, 3).map(({ drama }, index) => ({
      rank: index + 1, title: drama.title, period: drama.period, range: drama.range,
      reason: drama.context, learning: drama.keywords.slice(0, 3).join(' · '), note: drama.note, sources: []
    })) };
}
async function catalog() {
  catalogPromise ||= fetch('./dramas.json').then((response) => {
    if (!response.ok) throw new Error('작품 목록을 불러오지 못했습니다.');
    return response.json();
  });
  return catalogPromise;
}
function getExtractor(progress) {
  extractorPromise ||= import(LIBRARY).then(({ pipeline }) => pipeline('feature-extraction', MODEL, {
    dtype: 'q8', device: 'wasm', progress_callback: (event) => {
      if (event?.status === 'progress' && Number.isFinite(event.progress))
        progress?.(`한국어 인공지능 모델을 준비하고 있어요… ${Math.round(event.progress)}%`);
    }
  }));
  return extractorPromise;
}
function dot(left, right) {
  let total = 0;
  for (let i = 0; i < left.length; i++) total += left[i] * right[i];
  return total;
}
function texts(dramas) {
  return dramas.map((drama) => `${drama.title}. ${drama.period}. ${drama.range}. ${drama.context}. ${drama.keywords.join(', ')}.`);
}
async function modelResults(query, dramas, progress) {
  const extractor = await getExtractor(progress);
  catalogVectorsPromise ||= extractor(texts(dramas), { pooling: 'cls', normalize: true }).then((tensor) => tensor.tolist());
  const [vectors, queryTensor] = await Promise.all([
    catalogVectorsPromise,
    extractor(query, { pooling: 'cls', normalize: true })
  ]);
  const queryVector = queryTensor.tolist()[0];
  if (!Array.isArray(queryVector) || vectors.length !== dramas.length) throw new Error('인공지능 모델의 결과 형식이 예상과 다릅니다.');
  const ranked = dramas.map((drama, index) => ({
    drama, lexical: wordScore(query, drama), semantic: dot(queryVector, vectors[index])
  })).map((item) => ({ ...item, score: item.semantic + Math.min(item.lexical, 12) * .025 }))
    .filter((item) => item.lexical > 0 || item.semantic >= .5)
    .sort((a, b) => b.score - a.score);
  return asResults(query, ranked, 'browser-ai');
}
export async function prepareRecommendations(query, progress) {
  const dramas = await catalog();
  const basic = dramas.map((drama) => ({ drama, score: wordScore(query, drama) }))
    .filter((item) => item.score > 0).sort((a, b) => b.score - a.score);
  return {
    initial: asResults(query, basic, 'catalog'),
    upgraded: modelResults(query, dramas, progress).catch((error) => {
      console.warn('On-device recommendation unavailable:', error instanceof Error ? error.message : String(error));
      return null;
    })
  };
}
