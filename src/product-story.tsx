import { useEffect, useRef, useState } from 'react'

type Locale = 'ko' | 'en'
type PhoneAsset = { src: string; alt: string }
type StoryScene = {
  chapter: string
  title: string
  body: string
  signal: string
  kind: string
  phones: PhoneAsset[]
}

const asset = (name: string, alt: string): PhoneAsset => ({ src: `/showcase/omni-connect-phones/${name}.png`, alt })

function PhoneScene({ scene }: { scene: StoryScene }) {
  return <div className="figma-phone-scene" data-kind={scene.kind} data-count={scene.phones.length}>
    {scene.phones.map((phone, index) => <img className={`figma-phone figma-phone-${index + 1}`} src={phone.src} alt={phone.alt} loading="lazy" decoding="async" key={phone.src}/>) }
  </div>
}

export function ProductStory({ locale, title, intro }: { locale: Locale; title: string; intro: string }) {
  const [active, setActive] = useState(0)
  const sectionRef = useRef<HTMLElement>(null)
  const stories: StoryScene[] = locale === 'ko' ? [
    { chapter: '핵심 기능 01 · STEP 1', title: '관심 종목을 등록하면 실시간으로 연결됩니다.', body: '사용자가 보유하거나 관심 있는 종목을 등록하는 순간, 새 뉴스와 공시가 REST와 WebSocket을 통해 즉시 전달됩니다.', signal: 'Watchlist → live alert', kind: 'alerts', phones: [asset('alerts-search', 'Figma 관심 종목 검색 화면'), asset('alerts-market', 'Figma 시장 화면'), asset('alerts-notifications', 'Figma 실시간 알림 화면')] },
    { chapter: '핵심 기능 01 · STEP 2', title: '호재·악재와 중요도를 서로 다른 신호로 읽습니다.', body: '금융 특화 AI가 문장의 감성과 의미 중요도, 실제 시장영향 예측을 분리해 과도한 단일 판단을 피합니다.', signal: 'Sentiment · materiality · impact', kind: 'sentiment', phones: [asset('sentiment-detail', 'Figma 종목 뉴스 상세 화면'), asset('sentiment-list', 'Figma 뉴스 감성·중요도 화면')] },
    { chapter: '핵심 기능 01 · STEP 3', title: '낯선 한국 시장 용어까지 맥락으로 설명합니다.', body: '번역 전문과 금융 고유어 설명, What·Why·Impact 요약을 함께 제공해 해외 투자자가 의미를 놓치지 않게 합니다.', signal: 'Translation + contextual RAG', kind: 'explanation', phones: [asset('explanation-detail', 'Figma 한국 증시 고유어와 AI 분석 화면')] },
    { chapter: '핵심 기능 01 · STEP 4', title: '익숙한 글로벌 기업으로 한국 기업을 이해합니다.', body: '섹터와 사업 포트폴리오를 바탕으로 유사 글로벌 기업을 매칭하고 비교 근거와 강점을 함께 보여줍니다.', signal: 'Global peer matching AI', kind: 'peers', phones: [asset('peers-stock', 'Figma 삼성전자 종목 화면'), asset('peers-compare', 'Figma 글로벌 기업 매칭 화면')] },
    { chapter: '핵심 기능 02 · STEP 1', title: '외국인 지분율의 금일 경계를 미리 예측합니다.', body: '시계열 ML 모델이 외국인 보유 제한 종목의 장중 지분율 범위를 계산해 주문 위험을 사전에 확인할 수 있게 합니다.', signal: 'Intraday ownership boundary', kind: 'ownership', phones: [asset('ownership-order', 'Figma 외국인 보유 한도 경고 화면'), asset('ownership-chart', 'Figma 외국인 지분율 예측 화면')] },
    { chapter: '핵심 기능 02 · STEP 2', title: '현지 통화 가격과 체결 제한을 한 화면에서 확인합니다.', body: '실시간 환율을 적용한 시세와 VI, 상·하한가, 거래정지 여부를 주문 직전까지 일관된 계약으로 제공합니다.', signal: 'Live FX + order guard', kind: 'restrictions', phones: [asset('restrictions-order', 'Figma VI 발동 거래 제한 화면'), asset('restrictions-limit', 'Figma 상한가 도달 화면')] },
    { chapter: '핵심 기능 03 · STEP 1', title: '복잡한 세무 신청을 모바일 흐름으로 바꿉니다.', body: '개인정보 동의부터 거주자 증명서, 아포스티유, 제한세율 신청서까지 필요한 문서를 순서대로 안내합니다.', signal: 'Guided document intake', kind: 'tax-intake', phones: [asset('tax-intake-1', 'Figma 제한세율 신청 시작 화면'), asset('tax-intake-2', 'Figma 개인정보 동의 화면'), asset('tax-intake-3', 'Figma 거주자 증명서 업로드 화면'), asset('tax-intake-4', 'Figma 세무 문서 분석 화면')] },
    { chapter: '핵심 기능 03 · STEP 2', title: 'OCR이 문서를 읽고 서로 맞는지 검증합니다.', body: '서명, 납세번호, 국적, 주소와 발급 정보를 추출해 누락·오기입·문서 간 불일치를 신청 전에 찾아냅니다.', signal: 'OCR + cross-document validation', kind: 'tax-validation', phones: [asset('tax-validation-1', 'Figma 세무 문서 제출 완료 화면'), asset('tax-validation-2', 'Figma 아포스티유 OCR 화면'), asset('tax-validation-3', 'Figma 제한세율 신청서 OCR 화면')] },
  ] : [
    { chapter: 'CORE 01 · STEP 1', title: 'A watchlist becomes a real-time intelligence stream.', body: 'As soon as users register holdings or interests, new news and disclosures arrive through REST and WebSocket.', signal: 'Watchlist → live alert', kind: 'alerts', phones: [asset('alerts-search', 'Figma watchlist search screen'), asset('alerts-market', 'Figma market screen'), asset('alerts-notifications', 'Figma live notifications screen')] },
    { chapter: 'CORE 01 · STEP 2', title: 'Sentiment and materiality remain distinct signals.', body: 'Financial AI separates tone, semantic materiality, and predicted market impact instead of collapsing them into one verdict.', signal: 'Sentiment · materiality · impact', kind: 'sentiment', phones: [asset('sentiment-detail', 'Figma stock news detail screen'), asset('sentiment-list', 'Figma sentiment and materiality screen')] },
    { chapter: 'CORE 01 · STEP 3', title: 'Korean market language becomes understandable in context.', body: 'Full translation, terminology guidance, and What·Why·Impact summaries preserve meaning for overseas investors.', signal: 'Translation + contextual RAG', kind: 'explanation', phones: [asset('explanation-detail', 'Figma terminology and AI analysis screen')] },
    { chapter: 'CORE 01 · STEP 4', title: 'Korean companies become familiar through global peers.', body: 'AI matches companies by sector and business portfolio, then exposes comparison dimensions and strengths.', signal: 'Global peer matching AI', kind: 'peers', phones: [asset('peers-stock', 'Figma Samsung Electronics screen'), asset('peers-compare', 'Figma global peer comparison screen')] },
    { chapter: 'CORE 02 · STEP 1', title: 'Intraday foreign-ownership boundaries are forecast in advance.', body: 'Time-series ML estimates the ownership range for foreign-limit stocks before an order reaches a risky boundary.', signal: 'Intraday ownership boundary', kind: 'ownership', phones: [asset('ownership-order', 'Figma foreign ownership limit screen'), asset('ownership-chart', 'Figma ownership forecast screen')] },
    { chapter: 'CORE 02 · STEP 2', title: 'Local-currency pricing and trading limits stay together.', body: 'Live FX quotes, VI, daily limits, and trading halts are delivered under one consistent pre-order contract.', signal: 'Live FX + order guard', kind: 'restrictions', phones: [asset('restrictions-order', 'Figma VI trading restriction screen'), asset('restrictions-limit', 'Figma upper price limit screen')] },
    { chapter: 'CORE 03 · STEP 1', title: 'Complex tax intake becomes a guided mobile flow.', body: 'Users move from consent through certificates, apostilles, and reduced-rate applications one document at a time.', signal: 'Guided document intake', kind: 'tax-intake', phones: [asset('tax-intake-1', 'Figma reduced tax rate start screen'), asset('tax-intake-2', 'Figma consent screen'), asset('tax-intake-3', 'Figma certificate upload screen'), asset('tax-intake-4', 'Figma document analysis screen')] },
    { chapter: 'CORE 03 · STEP 2', title: 'OCR reads every document and validates them together.', body: 'Signatures, tax IDs, nationality, addresses, and issuer data are extracted and cross-checked before submission.', signal: 'OCR + cross-document validation', kind: 'tax-validation', phones: [asset('tax-validation-1', 'Figma document submission screen'), asset('tax-validation-2', 'Figma apostille OCR screen'), asset('tax-validation-3', 'Figma tax application OCR screen')] },
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
      <div className="story-copy">{stories.map((story, index) => <article key={story.kind} data-story-step={index} className={active === index ? 'active' : ''}><span>{story.chapter}</span><h3>{story.title}</h3><p>{story.body}</p><small>{story.signal}</small><div className="story-mobile-visual"><PhoneScene scene={story}/></div></article>)}</div>
      <div className="story-stage">
        <div className="story-visual-shell" aria-hidden="true">{stories.map((story, index) => <div className={`story-scene${active === index ? ' active' : ''}`} data-kind={story.kind} key={story.kind}><PhoneScene scene={story}/></div>)}</div>
        <div className="story-progress" aria-label={locale === 'ko' ? '기능 화면 이동' : 'Feature scene navigation'}>{stories.map((story, index) => <button type="button" aria-label={story.title} aria-current={active === index ? 'step' : undefined} onClick={() => goToScene(index)} className={active === index ? 'active' : ''} key={story.kind}><span>{String(index + 1).padStart(2, '0')}</span></button>)}</div>
      </div>
    </div>
  </section>
}
