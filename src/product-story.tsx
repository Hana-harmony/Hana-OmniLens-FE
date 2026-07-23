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

const asset = (name: string, alt: string, extension = 'png'): PhoneAsset => ({ src: `/showcase/omni-connect-phones/${name}.${extension}`, alt })

function PhoneScene({ scene }: { scene: StoryScene }) {
  return <div className="figma-phone-scene" data-kind={scene.kind} data-count={scene.phones.length}>
    {scene.phones.map((phone, index) => <img className={`figma-phone figma-phone-${index + 1}`} src={phone.src} alt={phone.alt} loading="lazy" decoding="async" key={phone.src}/>) }
  </div>
}

export function ProductStory({ locale, title, intro }: { locale: Locale; title: string; intro: string }) {
  const [active, setActive] = useState(0)
  const sectionRef = useRef<HTMLElement>(null)
  const stories: StoryScene[] = locale === 'ko' ? [
    { chapter: '핵심 기능 01 · STEP 1', title: '관심 종목 실시간 알림', body: '실시간으로 새로운 뉴스/공시 발생 시 파이프라인을 통해 제공합니다.', signal: '관심 종목 Watchlist 등록 · 보유/관심 종목 실시간 알림', kind: 'alerts', phones: [asset('alerts-search', '관심 종목 검색 화면'), asset('alerts-market', '관심 종목 등록 화면'), asset('alerts-notifications', '보유·관심 종목 실시간 알림 화면')] },
    { chapter: '핵심 기능 01 · STEP 2', title: '금융 감성·중요도 분석', body: '금융 특화 NLP 기반으로 뉴스/공시 감성 중요도 정보를 제공합니다.', signal: 'High / Medium / Low · Positive / Neutral / Negative', kind: 'sentiment', phones: [asset('sentiment-detail', '뉴스 상세 감성·중요도 화면'), asset('sentiment-list', '뉴스 목록 감성·중요도 태그 화면')] },
    { chapter: '핵심 기능 01 · STEP 3', title: '뉴스·공시 번역·요약·용어 해설', body: '로컬 LLM 기반 뉴스/공시 번역 및 요약과 RAG 기반 한국 증시 특유 용어 원클릭 해설을 제공합니다.', signal: 'What · Why · Impact · 한국 증시 특유 용어 해설', kind: 'explanation', phones: [asset('explanation-detail', '뉴스 번역·AI 분석 요약·한국 증시 용어 해설 화면')] },
    { chapter: '핵심 기능 01 · STEP 4', title: '글로벌 기업 매칭 AI', body: '섹터 및 기업 정보를 바탕으로 글로벌 기업 매칭 AI를 통해 유사 글로벌 기업 정보로 한국 기업을 설명합니다.', signal: '유사 글로벌 기업 정보로 한국 기업 설명', kind: 'peers', phones: [asset('peers-stock', '한국 종목 정보 화면'), asset('peers-compare', '글로벌 유사 기업 매칭 화면')] },
    { chapter: '핵심 기능 02 · STEP 1', title: '외국인 지분율 예측 AI', body: '시계열 ML 예측 모델 기반 외국인 지분율 예측 AI를 사용하여 외국인 보유 제한 32개 종목에 대해 장중 외국인 지분율 예측치를 제공합니다.', signal: '금일 외국인 지분율 예측 바운더리', kind: 'ownership', phones: [asset('ownership-order', '외국인 보유 제한 종목 주문 화면'), asset('ownership-chart', '금일 외국인 지분율 예측 바운더리 화면')] },
    { chapter: '핵심 기능 02 · STEP 2', title: '실시간 환율·체결 제한 안내', body: 'WebSocket으로 실시간 환율 적용 시세를 제공하며 체결 제한 시 사전 고지합니다.', signal: '상·하한가 · 실시간 환율 · 가격 급등락(VI)', kind: 'restrictions', phones: [asset('restrictions-order', '가격 급등락 종목 체결 제한 안내 화면'), asset('restrictions-limit', '상·하한가 도달 체결 제한 안내 화면')] },
    { chapter: '핵심 기능 03 · STEP 1', title: '모바일 절세 신청', body: '기존의 수작업 기반 세무처리 절차를 디지털화하여, 모바일 절세 신청을 지원합니다.', signal: '개인 정보 활용 동의 · 거주자 증명서 업로드', kind: 'tax-intake', phones: [asset('tax-intake-1', '모바일 절세 신청 시작 화면'), asset('tax-intake-2', '개인 정보 활용 동의 화면'), asset('tax-intake-3', '거주자 증명서 업로드 화면'), asset('tax-intake-4', '거주자 증명서 필드 확인 화면')] },
    { chapter: '핵심 기능 03 · STEP 2', title: '세무 서류 OCR 자동 검수', body: 'OCR로 제출 서류의 정보를 자동 추출해 누락·오기입을 검증하고, 서류 간 정보를 교차 확인해 일치 여부와 검수 통과 여부를 판별합니다.', signal: '아포스티유 업로드 · 제한세율신청서 업로드', kind: 'tax-validation', phones: [asset('tax-validation-1', '세무 서류 검수 결과 화면'), asset('tax-validation-2', '아포스티유 OCR 검수 화면'), asset('tax-validation-3', '제한세율신청서 OCR 검수 화면')] },
    { chapter: '핵심 기능 03 · STEP 3', title: '경정청구 백오피스', body: '하나증권 백오피스에서 외국 금융사 고객별 경정청구 진행 현황을 실시간으로 모니터링하고, 신청서 자동 작성과 검토를 거쳐 국세청에 원클릭으로 제출할 수 있도록 지원합니다.', signal: '실시간 진행 현황 · 신청서 자동 작성 · 국세청 원클릭 제출', kind: 'tax-backoffice', phones: [asset('tax-backoffice-monitoring', '경정청구서 자동 작성·검토 화면'), asset('tax-backoffice', '제한세율 적용신청 처리 백오피스 화면', 'gif')] },
  ] : [
    { chapter: 'CORE 01 · STEP 1', title: 'Real-time watchlist alerts', body: 'New news and disclosures are delivered through the pipeline in real time.', signal: 'Watchlist registration · real-time alerts', kind: 'alerts', phones: [asset('alerts-search', 'Watchlist search screen'), asset('alerts-market', 'Watchlist registration screen'), asset('alerts-notifications', 'Real-time alert screen')] },
    { chapter: 'CORE 01 · STEP 2', title: 'Financial sentiment and importance', body: 'Financial-domain NLP provides sentiment and importance information for news and disclosures.', signal: 'High / Medium / Low · Positive / Neutral / Negative', kind: 'sentiment', phones: [asset('sentiment-detail', 'Sentiment and importance detail screen'), asset('sentiment-list', 'Sentiment and importance list screen')] },
    { chapter: 'CORE 01 · STEP 3', title: 'Translation, summaries, and term guidance', body: 'A local LLM translates and summarizes news and disclosures, while RAG provides one-click explanations of Korean-market terminology.', signal: 'What · Why · Impact · Korean market terms', kind: 'explanation', phones: [asset('explanation-detail', 'Translation, AI summary, and terminology screen')] },
    { chapter: 'CORE 01 · STEP 4', title: 'Global company matching AI', body: 'Global company matching AI explains Korean companies through similar global-company information based on sector and company data.', signal: 'Explain Korean companies through global peers', kind: 'peers', phones: [asset('peers-stock', 'Korean stock screen'), asset('peers-compare', 'Global peer matching screen')] },
    { chapter: 'CORE 02 · STEP 1', title: 'Foreign ownership forecasting AI', body: 'A time-series ML forecasting model provides intraday foreign-ownership estimates for 32 stocks subject to foreign ownership limits.', signal: 'Today’s foreign-ownership forecast boundary', kind: 'ownership', phones: [asset('ownership-order', 'Foreign ownership limit order screen'), asset('ownership-chart', 'Foreign ownership forecast screen')] },
    { chapter: 'CORE 02 · STEP 2', title: 'Live FX and trading-limit notices', body: 'WebSocket provides live FX-adjusted quotes and advance notice of trading restrictions.', signal: 'Daily limits · live FX · volatility interruption', kind: 'restrictions', phones: [asset('restrictions-order', 'Volatility interruption notice screen'), asset('restrictions-limit', 'Daily price-limit notice screen')] },
    { chapter: 'CORE 03 · STEP 1', title: 'Mobile tax-saving application', body: 'The manual tax-processing workflow is digitized to support mobile tax-saving applications.', signal: 'Consent · certificate of residence upload', kind: 'tax-intake', phones: [asset('tax-intake-1', 'Mobile tax application start screen'), asset('tax-intake-2', 'Personal-data consent screen'), asset('tax-intake-3', 'Certificate of residence upload screen'), asset('tax-intake-4', 'Certificate field review screen')] },
    { chapter: 'CORE 03 · STEP 2', title: 'Automated tax-document OCR review', body: 'OCR automatically extracts submitted document data, detects omissions and input errors, and cross-checks documents to determine consistency and review status.', signal: 'Apostille upload · reduced-rate application upload', kind: 'tax-validation', phones: [asset('tax-validation-1', 'Tax-document review result screen'), asset('tax-validation-2', 'Apostille OCR review screen'), asset('tax-validation-3', 'Reduced-rate application OCR review screen')] },
    { chapter: 'CORE 03 · STEP 3', title: 'Tax-correction back office', body: 'The Hana Securities back office monitors correction-claim progress by overseas financial-institution client in real time, automatically prepares and reviews applications, and supports one-click submission to the National Tax Service.', signal: 'Live status · automatic application · one-click submission', kind: 'tax-backoffice', phones: [asset('tax-backoffice-monitoring', 'Automatic correction-claim preparation and review screen'), asset('tax-backoffice', 'Tax-application processing back-office screen', 'gif')] },
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
