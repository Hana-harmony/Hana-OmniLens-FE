import { ReactNode, useEffect, useRef, useState } from 'react'

type Locale = 'ko' | 'en'
type SceneKind = 'alerts' | 'sentiment' | 'explanation' | 'peers' | 'ownership' | 'restrictions' | 'tax-intake' | 'tax-validation'
type StoryScene = {
  chapter: string
  title: string
  body: string
  signal: string
  kind: SceneKind
}

function Phone({ title, children, tone = 'light' }: { title: string; children: ReactNode; tone?: 'light' | 'mint' }) {
  return <div className={`product-phone ${tone === 'mint' ? 'mint' : ''}`}>
    <div className="phone-speaker"/>
    <div className="phone-status"><b>9:41</b><span>● ● ◢</span></div>
    <div className="phone-title"><button type="button" tabIndex={-1}>‹</button><strong>{title}</strong><span>•••</span></div>
    <div className="phone-content">{children}</div>
    <div className="phone-home"/>
  </div>
}

function StockRow({ code, name, price, active = false }: { code: string; name: string; price: string; active?: boolean }) {
  return <div className={`stock-row${active ? ' active' : ''}`}><span className="stock-mark">{name.slice(0, 1)}</span><div><b>{name}</b><small>{code}</small></div><strong>{price}</strong><i>♥</i></div>
}

function AlertsVisual() {
  return <div className="scene-composition alerts-visual">
    <Phone title="관심 종목" tone="mint"><div className="phone-search">⌕ 종목명 또는 코드 검색</div><div className="phone-tabs"><b>관심 종목</b><span>최근 본 종목</span></div><StockRow code="005930 · KOSPI" name="삼성전자" price="$52.41" active/><StockRow code="000660 · KOSPI" name="SK하이닉스" price="$126.08"/><StockRow code="035420 · KOSPI" name="NAVER" price="$143.70"/></Phone>
    <div className="live-alert-card"><div><span className="live-dot"/>LIVE ALERT</div><b>삼성전자 신규 공시</b><p>대규모 공급계약 체결</p><small>보유·관심 종목과 즉시 매칭</small></div>
    <div className="api-flow-pill"><span>REST</span><i>+</i><span>WebSocket</span></div>
  </div>
}

function SentimentVisual() {
  return <div className="scene-composition sentiment-visual">
    <Phone title="뉴스 상세"><div className="article-source">MARKET NEWS · 2분 전</div><h4>삼성전자, 차세대 반도체 공급 확대</h4><p className="article-copy">글로벌 데이터센터 수요에 대응해 고대역폭 메모리 공급을 확대합니다.</p><div className="analysis-label">HANA MONTANA AI</div><div className="sentiment-result"><span>호재</span><div><b>긍정 신호</b><small>시장 영향도와 의미 중요도를 분리 분석</small></div></div><div className="materiality-bar"><span style={{ width: '86%' }}/></div></Phone>
    <div className="signal-orbit"><span>의미 중요도</span><b>HIGH</b><i>86</i></div>
    <div className="signal-card"><span>시장 영향 예측</span><b>Positive · 0.82</b><small>KF-DeBERTa + K-FNSPID</small></div>
  </div>
}

function ExplanationVisual() {
  return <div className="scene-composition explanation-visual">
    <Phone title="AI 인텔리전스"><div className="term-chip">한국 증시 고유어</div><h4>기업가치 제고 계획</h4><p className="translated-copy">Corporate value-up plan</p><div className="why-grid"><article><span>WHAT</span><b>무엇이 달라졌나요?</b><p>중장기 주주환원 정책이 발표됐습니다.</p></article><article><span>WHY</span><b>왜 중요한가요?</b><p>자본 효율과 배당 정책의 기준이 구체화됐습니다.</p></article><article><span>IMPACT</span><b>투자자 영향</b><p>밸류에이션 재평가 가능성을 확인합니다.</p></article></div></Phone>
    <div className="dictionary-card"><span>CONTEXT RAG</span><b>낯선 용어도 문맥 안에서</b><p>단순 번역이 아닌 시장 배경과 투자자 영향을 함께 설명합니다.</p></div>
  </div>
}

function PeersVisual() {
  return <div className="scene-composition peers-visual">
    <Phone title="글로벌 기업 매칭"><div className="company-hero"><span>삼</span><div><small>005930 · KOSPI</small><h4>삼성전자</h4><b>반도체 · 모바일 · 디스플레이</b></div></div><div className="match-divider"><span/>AI MATCH<span/></div><div className="peer-list"><article><i>NV</i><div><b>NVIDIA</b><small>AI 반도체 · 데이터센터</small></div><strong>92%</strong></article><article><i>TS</i><div><b>TSMC</b><small>파운드리 · 첨단 공정</small></div><strong>88%</strong></article><article><i>MU</i><div><b>Micron</b><small>메모리 · HBM</small></div><strong>84%</strong></article></div></Phone>
    <div className="peer-axis-card"><span>비교 차원</span><b>사업 포트폴리오</b><b>글로벌 공급망</b><b>기술 경쟁력</b></div>
  </div>
}

function OwnershipVisual() {
  return <div className="scene-composition ownership-visual">
    <Phone title="외국인 지분율"><div className="quote-head"><div><small>한국전력 · 015760</small><h4>₩21,350</h4></div><span>+1.42%</span></div><div className="forecast-label"><span>금일 예측 범위</span><b>27.8% — 28.4%</b></div><svg className="forecast-chart" viewBox="0 0 300 150" role="img" aria-label="외국인 지분율 예측 차트"><defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#20b58f" stopOpacity=".34"/><stop offset="1" stopColor="#20b58f" stopOpacity="0"/></linearGradient></defs><path className="chart-area" d="M0 130 C36 120 42 84 74 91 S126 62 151 72 S199 36 226 49 S267 23 300 31 L300 150 L0 150 Z"/><path className="chart-line" d="M0 130 C36 120 42 84 74 91 S126 62 151 72 S199 36 226 49 S267 23 300 31"/><path className="chart-boundary" d="M0 48 H300"/><circle cx="300" cy="31" r="5"/></svg><div className="chart-axis"><span>09:00</span><span>12:00</span><span>15:30</span></div><div className="limit-meter"><span style={{ width: '56%' }}/><i>현재 28.1%</i><b>한도 49%</b></div></Phone>
    <div className="model-callout"><span>TIME-SERIES ML</span><b>32개 제한 종목 감시</b><small>예측 경계를 벗어나기 전 선제 안내</small></div>
  </div>
}

function RestrictionsVisual() {
  return <div className="scene-composition restrictions-visual">
    <Phone title="주문 확인"><div className="quote-head compact"><div><small>삼성전자 · 005930</small><h4>$52.41</h4></div><span>₩72,800</span></div><div className="fx-chip"><span>실시간 환율</span><b>1 USD = 1,389.00 KRW</b><i>LIVE</i></div><div className="order-form"><label>주문 가격<strong>$52.41</strong></label><label>수량<strong>10주</strong></label></div><button className="order-button" type="button" tabIndex={-1}>매수 주문 확인</button></Phone>
    <div className="restriction-toast"><span>ORDER GUARD</span><b>가격 상한가 도달</b><p>현재 가격에서는 신규 매수 체결이 제한됩니다.</p><small>VI · 상/하한가 · 거래정지 실시간 확인</small></div>
    <div className="currency-float">USD <b>↔</b> KRW</div>
  </div>
}

function TaxIntakeVisual() {
  return <div className="scene-composition tax-intake-visual">
    <Phone title="세금 환급 신청" tone="mint"><div className="step-line"><span className="done">1</span><i/><span className="active">2</span><i/><span>3</span></div><h4>거주자 증명서를<br/>업로드해 주세요</h4><p className="tax-copy">카메라로 촬영하거나 PDF 파일을 선택할 수 있습니다.</p><div className="upload-zone"><span>＋</span><b>문서 추가</b><small>JPG, PNG, PDF · 최대 10MB</small></div><div className="uploaded-file"><i>PDF</i><div><b>certificate_2026.pdf</b><small>1.8 MB · 업로드 완료</small></div><span>✓</span></div><button className="tax-next" type="button" tabIndex={-1}>다음 단계</button></Phone>
    <div className="tax-doc-stack"><article><span>01</span><b>거주자 증명서</b><i>✓</i></article><article><span>02</span><b>아포스티유</b><i>→</i></article><article><span>03</span><b>제한세율 신청서</b><i>→</i></article></div>
  </div>
}

function TaxValidationVisual() {
  return <div className="scene-composition tax-validation-visual">
    <Phone title="서류 검증 결과"><div className="validation-hero"><span>✓</span><h4>검증이 완료됐습니다</h4><p>세 문서의 필수 정보가 서로 일치합니다.</p></div><div className="validation-list"><article><span>✓</span><div><b>이름 · 생년월일</b><small>3개 문서 일치</small></div><i>정상</i></article><article><span>✓</span><div><b>납세자 식별번호</b><small>형식 및 국가 코드 확인</small></div><i>정상</i></article><article><span>✓</span><div><b>서명 · 발급기관</b><small>위변조 위험 신호 없음</small></div><i>정상</i></article></div><button className="tax-next" type="button" tabIndex={-1}>신청서 제출</button></Phone>
    <div className="ocr-score"><span>DOCUMENT OCR</span><b>98.7<small>%</small></b><p>필수값 추출 신뢰도</p><div><i style={{ width: '98.7%' }}/></div></div>
  </div>
}

function SceneVisual({ kind }: { kind: SceneKind }) {
  if (kind === 'alerts') return <AlertsVisual/>
  if (kind === 'sentiment') return <SentimentVisual/>
  if (kind === 'explanation') return <ExplanationVisual/>
  if (kind === 'peers') return <PeersVisual/>
  if (kind === 'ownership') return <OwnershipVisual/>
  if (kind === 'restrictions') return <RestrictionsVisual/>
  if (kind === 'tax-intake') return <TaxIntakeVisual/>
  return <TaxValidationVisual/>
}

export function ProductStory({ locale, title, intro }: { locale: Locale; title: string; intro: string }) {
  const [active, setActive] = useState(0)
  const sectionRef = useRef<HTMLElement>(null)
  const stories: StoryScene[] = locale === 'ko' ? [
    { chapter: '핵심 기능 01 · STEP 1', title: '관심 종목을 등록하면 실시간으로 연결됩니다.', body: '사용자가 보유하거나 관심 있는 종목을 등록하는 순간, 새 뉴스와 공시가 REST와 WebSocket을 통해 즉시 전달됩니다.', signal: 'Watchlist → live alert', kind: 'alerts' },
    { chapter: '핵심 기능 01 · STEP 2', title: '호재·악재와 중요도를 서로 다른 신호로 읽습니다.', body: '금융 특화 AI가 문장의 감성과 의미 중요도, 실제 시장영향 예측을 분리해 과도한 단일 판단을 피합니다.', signal: 'Sentiment · materiality · impact', kind: 'sentiment' },
    { chapter: '핵심 기능 01 · STEP 3', title: '낯선 한국 시장 용어까지 맥락으로 설명합니다.', body: '번역 전문과 금융 고유어 설명, What·Why·Impact 요약을 함께 제공해 해외 투자자가 의미를 놓치지 않게 합니다.', signal: 'Translation + contextual RAG', kind: 'explanation' },
    { chapter: '핵심 기능 01 · STEP 4', title: '익숙한 글로벌 기업으로 한국 기업을 이해합니다.', body: '섹터와 사업 포트폴리오를 바탕으로 유사 글로벌 기업을 매칭하고 비교 근거와 강점을 함께 보여줍니다.', signal: 'Global peer matching AI', kind: 'peers' },
    { chapter: '핵심 기능 02 · STEP 1', title: '외국인 지분율의 금일 경계를 미리 예측합니다.', body: '시계열 ML 모델이 외국인 보유 제한 종목의 장중 지분율 범위를 계산해 주문 위험을 사전에 확인할 수 있게 합니다.', signal: 'Intraday ownership boundary', kind: 'ownership' },
    { chapter: '핵심 기능 02 · STEP 2', title: '현지 통화 가격과 체결 제한을 한 화면에서 확인합니다.', body: '실시간 환율을 적용한 시세와 VI, 상·하한가, 거래정지 여부를 주문 직전까지 일관된 계약으로 제공합니다.', signal: 'Live FX + order guard', kind: 'restrictions' },
    { chapter: '핵심 기능 03 · STEP 1', title: '복잡한 세무 신청을 모바일 흐름으로 바꿉니다.', body: '개인정보 동의부터 거주자 증명서, 아포스티유, 제한세율 신청서까지 필요한 문서를 순서대로 안내합니다.', signal: 'Guided document intake', kind: 'tax-intake' },
    { chapter: '핵심 기능 03 · STEP 2', title: 'OCR이 문서를 읽고 서로 맞는지 검증합니다.', body: '서명, 납세번호, 국적, 주소와 발급 정보를 추출해 누락·오기입·문서 간 불일치를 신청 전에 찾아냅니다.', signal: 'OCR + cross-document validation', kind: 'tax-validation' },
  ] : [
    { chapter: 'CORE 01 · STEP 1', title: 'A watchlist becomes a real-time intelligence stream.', body: 'As soon as users register holdings or interests, new news and disclosures arrive through REST and WebSocket.', signal: 'Watchlist → live alert', kind: 'alerts' },
    { chapter: 'CORE 01 · STEP 2', title: 'Sentiment and materiality remain distinct signals.', body: 'Financial AI separates tone, semantic materiality, and predicted market impact instead of collapsing them into one verdict.', signal: 'Sentiment · materiality · impact', kind: 'sentiment' },
    { chapter: 'CORE 01 · STEP 3', title: 'Korean market language becomes understandable in context.', body: 'Full translation, terminology guidance, and What·Why·Impact summaries preserve meaning for overseas investors.', signal: 'Translation + contextual RAG', kind: 'explanation' },
    { chapter: 'CORE 01 · STEP 4', title: 'Korean companies become familiar through global peers.', body: 'AI matches companies by sector and business portfolio, then exposes comparison dimensions and strengths.', signal: 'Global peer matching AI', kind: 'peers' },
    { chapter: 'CORE 02 · STEP 1', title: 'Intraday foreign-ownership boundaries are forecast in advance.', body: 'Time-series ML estimates the ownership range for foreign-limit stocks before an order reaches a risky boundary.', signal: 'Intraday ownership boundary', kind: 'ownership' },
    { chapter: 'CORE 02 · STEP 2', title: 'Local-currency pricing and trading limits stay together.', body: 'Live FX quotes, VI, daily limits, and trading halts are delivered under one consistent pre-order contract.', signal: 'Live FX + order guard', kind: 'restrictions' },
    { chapter: 'CORE 03 · STEP 1', title: 'Complex tax intake becomes a guided mobile flow.', body: 'Users move from consent through certificates, apostilles, and reduced-rate applications one document at a time.', signal: 'Guided document intake', kind: 'tax-intake' },
    { chapter: 'CORE 03 · STEP 2', title: 'OCR reads every document and validates them together.', body: 'Signatures, tax IDs, nationality, addresses, and issuer data are extracted and cross-checked before submission.', signal: 'OCR + cross-document validation', kind: 'tax-validation' },
  ]

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const elements = [...section.querySelectorAll<HTMLElement>('[data-story-step]')]
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible) setActive(Number((visible.target as HTMLElement).dataset.storyStep))
    }, { rootMargin: '-34% 0px -34% 0px', threshold: [0, .25, .5, .75, 1] })
    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])

  const goToScene = (index: number) => sectionRef.current?.querySelector<HTMLElement>(`[data-story-step="${index}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })

  return <section id="use-cases" className="product-story" ref={sectionRef}>
    <div className="story-heading"><p className="eyebrow">LIVE IMPLEMENTATION</p><h2>{title}</h2><p>{intro}</p></div>
    <div className="story-layout">
      <div className="story-copy">{stories.map((story, index) => <article key={story.kind} data-story-step={index} className={active === index ? 'active' : ''}><span>{story.chapter}</span><h3>{story.title}</h3><p>{story.body}</p><small>{story.signal}</small><div className="story-mobile-visual"><SceneVisual kind={story.kind}/></div></article>)}</div>
      <div className="story-stage">
        <div className="story-visual-shell" aria-hidden="true">{stories.map((story, index) => <div className={`story-scene${active === index ? ' active' : ''}`} data-kind={story.kind} key={story.kind}><SceneVisual kind={story.kind}/></div>)}</div>
        <div className="story-progress" aria-label={locale === 'ko' ? '기능 화면 이동' : 'Feature scene navigation'}>{stories.map((story, index) => <button type="button" aria-label={story.title} aria-current={active === index ? 'step' : undefined} onClick={() => goToScene(index)} className={active === index ? 'active' : ''} key={story.kind}><span>{String(index + 1).padStart(2, '0')}</span></button>)}</div>
        <div className="story-stage-caption"><span>{stories[active].chapter}</span><b>{stories[active].signal}</b></div>
      </div>
    </div>
  </section>
}
