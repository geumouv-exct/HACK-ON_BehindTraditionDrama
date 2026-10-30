const records = [
  {
    year: '1420', era: '세종 2년', title: '집현전을 설치하다', short: '학문의 공간이 열리다', status: '사료로 확인됨',
    summary: '세종은 궁궐 안에 집현전을 설치했습니다. 처음에는 왕과 신하가 경전과 역사서를 함께 읽고 토론하는 일이 중심이었고, 이후 연구와 편찬으로 활동이 넓어졌습니다.',
    context: '집현전의 설치 연도와 초기 역할은 우리역사넷의 해설에서 확인할 수 있습니다.',
    source: 'https://contents.history.go.kr/mobile/kc/view.do?code=kc_age_30&levelId=kc_n305800'
  },
  {
    year: '1443', era: '세종 25년', title: '새 문자 28자를 만들다', short: '훈민정음의 탄생', status: '사료로 확인됨',
    summary: '세종이 우리말을 적기 위한 새 문자 28자를 창제했습니다. 오늘날 한글의 출발점으로 여겨지는 훈민정음이 이때 기록에 등장합니다.',
    context: '창제 연도는 『세종실록』 관련 기록과 우리역사넷 해설에 근거합니다.',
    source: 'https://contents.history.go.kr/front/km/view.do?levelId=km_037_0070_0020_0010'
  },
  {
    year: '1444', era: '세종 26년', title: '새 문자를 둘러싼 반대', short: '최만리 등의 상소', status: '사료로 확인됨',
    summary: '최만리 등 일부 신하가 새 문자에 반대하는 상소를 올렸습니다. 세종의 반박과 당시 조정의 논쟁도 기록으로 남아 있습니다.',
    context: '상소의 주장과 세종의 대응을 원문과 해설에서 직접 살펴볼 수 있습니다.',
    source: 'https://contents.history.go.kr/front/hm/view.do?levelId=hm_091_0040'
  },
  {
    year: '1446', era: '세종 28년', title: '『훈민정음』 해례본 간행', short: '원리를 책으로 남기다', status: '세부 시점은 해석이 갈림',
    summary: '문자를 만든 원리와 쓰임을 설명한 『훈민정음』 해례본이 완성되어 간행되었습니다. 흔히 이 무렵을 반포 시점으로 설명하지만, 정확히 언제 완성·반포되었는지는 해석에 차이가 있습니다.',
    context: '창제와 해례본 완성에는 대체로 합의가 있지만, 정확한 반포 시점은 연구자에 따라 달리 봅니다.',
    source: 'https://contents.history.go.kr/mobile/kc/view.do?code=kc_age_30&levelId=kc_r300900'
  }
];

const questions = [
  {
    question: '훈민정음은 언제 만들어졌나요?',
    answer: '새 문자 28자를 만든 해는 1443년으로 기록됩니다. 글자를 만든 원리를 설명한 『훈민정음』 해례본은 1446년에 완성되어 간행되었습니다.',
    source: 'https://contents.history.go.kr/front/km/view.do?levelId=km_037_0070_0020_0010', label: '우리역사넷 · 한글 창제와 훈민정음'
  },
  {
    question: '신하들은 모두 찬성했나요?',
    answer: '그렇지 않습니다. 1444년 최만리 등 일부 신하가 새 문자에 반대하는 상소를 올렸고, 세종이 이에 반박한 기록이 남아 있습니다.',
    source: 'https://contents.history.go.kr/front/hm/view.do?levelId=hm_091_0040', label: '사료로 본 한국사 · 반대 상소와 세종의 반박'
  },
  {
    question: '한글날은 정확한 반포일인가요?',
    answer: '해례본 정인지 서문에는 1446년 음력 9월 상순이라는 기록이 있습니다. 현재의 10월 9일은 이를 바탕으로 정해졌지만, 훈민정음의 정확한 반포 시점에는 해석 차이가 있습니다.',
    source: 'https://contents.history.go.kr/mobile/kc/view.do?code=kc_age_30&levelId=kc_r300900', label: '우리역사넷 · 훈민정음'
  }
];

const timeline = document.querySelector('#timeline');
const fields = {
  step: document.querySelector('#record-step'), year: document.querySelector('#record-year'), era: document.querySelector('#record-era'),
  title: document.querySelector('#record-title'), summary: document.querySelector('#record-summary'),
  status: document.querySelector('#record-status'), context: document.querySelector('#record-context'), link: document.querySelector('#record-link')
};

function selectRecord(index) {
  const record = records[index];
  fields.step.textContent = `기록 ${String(index + 1).padStart(2, '0')} / ${String(records.length).padStart(2, '0')}`;
  fields.year.textContent = record.year;
  fields.era.textContent = record.era;
  fields.title.textContent = record.title;
  fields.summary.textContent = record.summary;
  fields.status.textContent = record.status;
  fields.context.textContent = record.context;
  fields.link.href = record.source;
  [...timeline.querySelectorAll('button')].forEach((button, buttonIndex) => {
    const selected = buttonIndex === index;
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}

if (timeline) {
  records.forEach((record, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'timeline-item';
    button.innerHTML = `<span class="timeline-dot" aria-hidden="true"></span><span class="timeline-date">${record.year}</span><span class="timeline-title">${record.short}</span>`;
    button.setAttribute('aria-label', `${record.year}년, ${record.title}`);
    button.addEventListener('click', () => selectRecord(index));
    timeline.append(button);
  });
  selectRecord(1);
}

const questionOptions = document.querySelector('#question-options');
const questionAnswer = document.querySelector('#question-answer');
if (questionOptions && questionAnswer) {
  questions.forEach((item, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = item.question;
    button.addEventListener('click', () => {
      questionOptions.querySelectorAll('button').forEach((option, optionIndex) => option.setAttribute('aria-pressed', String(optionIndex === index)));
      questionAnswer.replaceChildren();
      const answer = document.createElement('p');
      answer.textContent = item.answer;
      const link = document.createElement('a');
      link.href = item.source;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = `${item.label} ↗`;
      questionAnswer.append(answer, link);
    });
    button.setAttribute('aria-pressed', 'false');
    questionOptions.append(button);
  });
}
