import { FormEvent, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const apiBaseUrl = import.meta.env.VITE_OMNILENS_API_BASE_URL ?? 'http://127.0.0.1:8080'
type Locale = 'ko' | 'en'
type Route = 'home' | 'docs' | 'auth' | 'portal' | 'admin'
type User = { userId: string; username: string; name: string; phoneNumber: string; role: 'MEMBER' | 'ADMIN' }
type Session = { accessToken: string; expiresAt: string; user: User }
type Application = { applicationId: string; partnerId: string; status: string; requestedAt: string; apiKeySha256Prefix?: string; apiKey?: string }
type TermStat = { normalizedTerm: string; locale: string; clickCount: number; cacheHitCount: number; lastClickedAt: string }
type VerifiedDocument = { documentId: string; documentType: string; fileName: string; extractedFields: Record<string, string> }
type TaxCase = { caseId: string; accountId: string; taxYear: number; treatyCountry: string; estimatedRefundUsd: string; status: string; taxOfficeSubmissionStatus: string; verifiedDocuments: VerifiedDocument[] }

const copy = {
  ko: {
    nav: ['기능', '적용 사례', 'AI 모델'], docs: 'API 문서', login: '로그인', heroTag: 'GLOBAL KOREA MARKET INTELLIGENCE',
    hero: '한국 금융 데이터를\n더 명확하게.', accent: '하나의 API로.',
    intro: '시세, 뉴스·공시 인텔리전스, 금융 고유어, 글로벌 세무 OCR을 안정적인 파트너 API로 제공합니다.',
    start: 'API 키 신청', explore: '개발자 문서 보기', trust: '실제 거래소 서비스에서 검증된 API',
    capabilities: '파트너 서비스에 필요한 핵심 기능', capabilityIntro: '하나금융의 데이터와 Hana Montana AI를 하나의 API 계약으로 연결합니다.',
    cases: '구현된 서비스로 확인하세요', casesIntro: '샘플 목업이 아닌, Hana OmniLens API와 연동된 현지 거래소의 실제 화면입니다.',
    ai: 'Hana Montana', aiTitle: 'OmniLens의 금융 AI 모델', aiBody: '뉴스 분석, 문맥 번역, 고유어 설명, 세무 문서 OCR과 위변조 위험 판단을 수행하는 Hana OmniLens API 서버의 전용 AI 모델입니다.',
  },
  en: {
    nav: ['Capabilities', 'Use cases', 'AI model'], docs: 'API Docs', login: 'Sign in', heroTag: 'GLOBAL KOREA MARKET INTELLIGENCE',
    hero: 'Korean financial data,\nmade clearer.', accent: 'Delivered by one API.',
    intro: 'Deliver live prices, news and disclosure intelligence, contextual terminology, and global tax OCR through one dependable partner API.',
    start: 'Request an API key', explore: 'Explore API docs', trust: 'Proven in a production-grade exchange experience',
    capabilities: 'Core intelligence for partner products', capabilityIntro: 'Hana Financial data and Hana Montana AI, delivered through one stable API contract.',
    cases: 'See it working in a real product', casesIntro: 'These are live screens from the local exchange integrated with Hana OmniLens API—not sample mockups.',
    ai: 'Hana Montana', aiTitle: 'The financial AI behind OmniLens', aiBody: 'The dedicated Hana OmniLens server model for news analysis, contextual translation, terminology, tax-document OCR, and fraud-risk assessment.',
  },
} as const

const endpoints = [
  { group: 'Market Data', method: 'GET', path: '/api/v1/market/quotes', title: '복수 종목 실시간 시세', titleEn: 'Multi-stock live quotes', description: '요청 종목의 원화·달러 환산 가격, 등락률, 장 상태를 반환합니다.', descriptionEn: 'Returns KRW and USD prices, change rates, and market sessions for requested stocks.' },
  { group: 'Market Data', method: 'GET', path: '/api/v1/market/indices', title: '시장 지수', titleEn: 'Market indices', description: 'KOSPI, KOSDAQ, KOSPI 200 지수와 장중 흐름을 제공합니다.', descriptionEn: 'Provides KOSPI, KOSDAQ, KOSPI 200 values and intraday movements.' },
  { group: 'Market Data', method: 'GET', path: '/api/v1/market/stocks/{stockCode}/orderbook', title: '호가', titleEn: 'Order book', description: '종목별 매수·매도 호가와 잔량을 반환합니다.', descriptionEn: 'Returns bid and ask levels with remaining quantities.' },
  { group: 'Intelligence', method: 'GET', path: '/api/v1/market-news', title: 'K-News 인텔리전스', titleEn: 'K-News intelligence', description: '영문 전문, 감성, 중요도, AI 요약과 원문 메타데이터를 제공합니다.', descriptionEn: 'Provides translated full text, sentiment, materiality, AI analysis, and source metadata.' },
  { group: 'Intelligence', method: 'GET', path: '/api/v1/disclosures', title: '공시 인텔리전스', titleEn: 'Disclosure intelligence', description: 'OpenDART 공시와 종목 연관성, 중요도, 번역 전문을 제공합니다.', descriptionEn: 'Provides OpenDART disclosures, stock relevance, materiality, and translated full text.' },
  { group: 'AI', method: 'POST', path: '/api/v1/terms/explain', title: '금융 고유어 설명', titleEn: 'Financial term explanation', description: '한국 금융 고유어의 문맥 기반 영문 설명과 표기를 생성합니다.', descriptionEn: 'Generates context-aware English labels and explanations for Korean financial terms.' },
  { group: 'Tax OCR', method: 'POST', path: '/api/v1/tax/documents/verify', title: '글로벌 세무 문서 검증', titleEn: 'Global tax-document verification', description: '거주자증명서, 아포스티유, 제한세율 적용신청서를 OCR 검증합니다.', descriptionEn: 'OCR-verifies residence certificates, apostilles, and reduced withholding applications.' },
  { group: 'Alerts', method: 'GET', path: '/ws/alerts/events', title: '실시간 알림 스트림', titleEn: 'Real-time alert stream', description: '뉴스·공시·중요 이벤트를 파트너 서버에 실시간 전달합니다.', descriptionEn: 'Streams news, disclosures, and material events to partner servers.' },
]

async function api<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers ?? {}) } })
  const payload = await response.json() as { success: boolean; message: string; data: T }
  if (!response.ok || !payload.success) throw new Error(payload.message || '요청을 처리하지 못했습니다.')
  return payload.data
}

async function downloadCorrectionPdf(path: string, body: unknown, token: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) })
  if (!response.ok) throw new Error('경정청구서 PDF를 생성하지 못했습니다.')
  const href = URL.createObjectURL(new Blob([await response.arrayBuffer()], { type: 'application/pdf' }))
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = '경정청구서.pdf'
  anchor.click()
  URL.revokeObjectURL(href)
}

function useRoute(): [Route, (route: Route) => void] {
  const parse = () => ((location.hash.replace('#/', '') || 'home').split('?')[0] as Route)
  const [route, setRoute] = useState<Route>(parse)
  useEffect(() => { const listener = () => setRoute(parse()); addEventListener('hashchange', listener); return () => removeEventListener('hashchange', listener) }, [])
  return [route, (next) => { location.hash = `/${next}` }]
}

function App() {
  const [route, navigate] = useRoute()
  const [locale, setLocale] = useState<Locale>(() => (localStorage.getItem('omnilens-locale') as Locale) || 'ko')
  const [session, setSession] = useState<Session | null>(() => { const saved = sessionStorage.getItem('hana-omnilens-session'); return saved ? JSON.parse(saved) : null })
  const changeLocale = (next: Locale) => { setLocale(next); localStorage.setItem('omnilens-locale', next) }
  const signOut = () => { sessionStorage.removeItem('hana-omnilens-session'); setSession(null); navigate('home') }
  if (route === 'auth') return <AuthPage locale={locale} onLocale={changeLocale} onAuthenticated={(next) => { setSession(next); navigate(next.user.role === 'ADMIN' ? 'admin' : 'portal') }} onHome={() => navigate('home')} />
  if (route === 'docs') return <DocsPage locale={locale} onLocale={changeLocale} onHome={() => navigate('home')} />
  if (route === 'admin') return <AdminPage session={session} onSignIn={() => navigate('auth')} onHome={() => navigate('home')} onSignOut={signOut} />
  if (route === 'portal') return <MemberPortal session={session} onSignIn={() => navigate('auth')} onHome={() => navigate('home')} onAdmin={() => navigate('admin')} onSignOut={signOut} />
  return <Home locale={locale} onLocale={changeLocale} navigate={navigate} session={session} />
}

function Header({ locale, onLocale, navigate, session }: { locale: Locale; onLocale: (locale: Locale) => void; navigate: (route: Route) => void; session?: Session | null }) {
  const t = copy[locale]
  const scrollTo = (id: string) => { navigate('home'); window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0) }
  return <header className="topbar"><button className="brand-button" onClick={() => navigate('home')}><img src="/brand/hana-omnilens-api.png" alt="Hana OmniLens API" /></button><nav><button onClick={() => scrollTo('capabilities')}>{t.nav[0]}</button><button onClick={() => scrollTo('use-cases')}>{t.nav[1]}</button><button onClick={() => scrollTo('ai-model')}>{t.nav[2]}</button><button onClick={() => navigate('docs')}>{t.docs}</button></nav><div className="header-actions"><button className="admin-link" onClick={() => navigate('admin')}>{locale === 'ko' ? '관리자 백오피스' : 'Admin'}</button><div className="language-switch" aria-label="Language"><button className={locale === 'ko' ? 'active' : ''} onClick={() => onLocale('ko')}>KO</button><button className={locale === 'en' ? 'active' : ''} onClick={() => onLocale('en')}>EN</button></div><button className="login-button" onClick={() => navigate(session ? (session.user.role === 'ADMIN' ? 'admin' : 'portal') : 'auth')}>{session ? session.user.name : t.login}</button></div></header>
}

function Home({ locale, onLocale, navigate, session }: { locale: Locale; onLocale: (locale: Locale) => void; navigate: (route: Route) => void; session: Session | null }) {
  const t = copy[locale]
  return <div className="site-shell"><Header locale={locale} onLocale={onLocale} navigate={navigate} session={session}/><main>
    <section className="hero"><div className="orb orb-one"/><div className="orb orb-two"/><div className="hero-copy"><p className="eyebrow">{t.heroTag}</p><h1>{t.hero.split('\n').map((line) => <span key={line}>{line}<br/></span>)}<em>{t.accent}</em></h1><p>{t.intro}</p><div className="actions"><button className="primary" onClick={() => navigate(session ? 'portal' : 'auth')}>{t.start}<span>→</span></button><button className="secondary" onClick={() => navigate('docs')}>{t.explore}</button></div><div className="trust-line"><span className="pulse-dot"/>{t.trust}</div></div><div className="hero-visual"><div className="data-ring ring-one"/><div className="data-ring ring-two"/><img className="hero-logo" src="/brand/hana-omnilens-api.png" alt="Hana OmniLens API characters"/><div className="floating-card card-market"><span>MARKET</span><b>KOSPI 7,475.94</b><i>+2.52%</i></div><div className="floating-card card-signal"><span>AI SIGNAL</span><b>High materiality</b><small>Disclosure detected</small></div></div></section>
    <div className="ticker"><div>LIVE MARKET DATA <b>·</b> K-NEWS INTELLIGENCE <b>·</b> DISCLOSURES <b>·</b> TAX OCR <b>·</b> CONTEXTUAL TERMS <b>·</b> REAL-TIME ALERTS <b>·</b></div></div>
    <section id="capabilities" className="section"><p className="eyebrow">API CAPABILITIES</p><div className="section-head"><h2>{t.capabilities}</h2><p>{t.capabilityIntro}</p></div><div className="capability-grid"><Capability icon="↗" number="01" title={locale === 'ko' ? '실시간 시장 데이터' : 'Live market data'} body={locale === 'ko' ? '시세, 지수, 호가와 매매 제한을 일관된 계약으로 제공합니다.' : 'Quotes, indices, order books, and trading restrictions through one contract.'}/><Capability icon="✦" number="02" title={locale === 'ko' ? '뉴스·공시 인텔리전스' : 'News & disclosures'} body={locale === 'ko' ? '번역 전문, 감성, 중요도와 AI 분석을 함께 제공합니다.' : 'Translated full text, sentiment, materiality, and AI analysis.'}/><Capability icon="◎" number="03" title={locale === 'ko' ? '글로벌 세무 OCR' : 'Global tax OCR'} body={locale === 'ko' ? '3종 세무 서류의 OCR·위변조 위험·필수값을 검증합니다.' : 'OCR and risk validation for three essential tax documents.'}/><Capability icon="⌁" number="04" title={locale === 'ko' ? '고유어·실시간 알림' : 'Terms & live alerts'} body={locale === 'ko' ? '문맥 설명과 보유·관심종목 이벤트를 실시간 전달합니다.' : 'Contextual term guidance and portfolio-aware real-time alerts.'}/></div></section>
    <section id="use-cases" className="showcase-section"><p className="eyebrow">LIVE IMPLEMENTATION</p><div className="section-head"><h2>{t.cases}</h2><p>{t.casesIntro}</p></div><div className="showcase-grid"><Showcase image="/showcase/exchange-quotes.png" tag="MARKET DATA API" title={locale === 'ko' ? '실시간 시세와 시장 지수' : 'Live quotes and indices'}/><Showcase image="/showcase/exchange-market.png" tag="K-NEWS API" title={locale === 'ko' ? '감성·중요도 기반 뉴스' : 'Sentiment-aware K-News'}/><Showcase image="/showcase/exchange-news.png" tag="HANA MONTANA AI" title={locale === 'ko' ? '문맥 번역과 AI 분석' : 'Contextual translation & AI'}/></div></section>
    <section id="ai-model" className="ai-section"><div className="ai-logo-wrap"><div className="ai-glow"/><img src="/brand/hana-montana.png" alt="Hana Montana AI model"/></div><div><p className="eyebrow">FINANCIAL AI MODEL</p><h2>{t.aiTitle}</h2><p>{t.aiBody}</p><div className="model-pills"><span>Context Translation</span><span>Tax OCR</span><span>Sentiment</span><span>Fraud Risk</span></div><button className="text-link" onClick={() => navigate('docs')}>{locale === 'ko' ? 'AI API 살펴보기' : 'Explore AI APIs'} →</button></div></section>
    <section className="cta"><img src="/brand/hana-omnilens-api.png" alt=""/><div><p className="eyebrow">BUILD WITH HANA</p><h2>{locale === 'ko' ? '한국 금융 인텔리전스를 서비스에 연결하세요.' : 'Connect Korean financial intelligence to your product.'}</h2></div><button className="primary light" onClick={() => navigate('auth')}>{t.start} →</button></section>
  </main><Footer locale={locale}/></div>
}

function Capability({ icon, number, title, body }: { icon: string; number: string; title: string; body: string }) { return <article className="capability"><div className="capability-icon">{icon}</div><span>{number}</span><h3>{title}</h3><p>{body}</p></article> }
function Showcase({ image, tag, title }: { image: string; tag: string; title: string }) { return <article className="showcase-card"><div className="screen-wrap"><img src={image} alt={title}/><div className="screen-shine"/></div><span>{tag}</span><h3>{title}</h3></article> }

function DocsPage({ locale, onLocale, onHome }: { locale: Locale; onLocale: (locale: Locale) => void; onHome: () => void }) {
  const [selected, setSelected] = useState(endpoints[0])
  const groups = [...new Set(endpoints.map((endpoint) => endpoint.group))]
  return <div className="docs-shell"><header className="docs-header"><button className="brand-button" onClick={onHome}><img src="/brand/hana-omnilens-api.png" alt="Hana OmniLens API"/></button><div><span className="version">API v1</span><div className="language-switch"><button className={locale === 'ko' ? 'active' : ''} onClick={() => onLocale('ko')}>KO</button><button className={locale === 'en' ? 'active' : ''} onClick={() => onLocale('en')}>EN</button></div></div></header><div className="docs-layout"><aside><div className="docs-search">⌕ <span>{locale === 'ko' ? 'API 검색' : 'Search APIs'}</span></div>{groups.map((group) => <div className="docs-group" key={group}><b>{group}</b>{endpoints.filter((endpoint) => endpoint.group === group).map((endpoint) => <button className={selected.path === endpoint.path ? 'active' : ''} key={endpoint.path} onClick={() => setSelected(endpoint)}><span className={endpoint.method.toLowerCase()}>{endpoint.method}</span>{locale === 'ko' ? endpoint.title : endpoint.titleEn}</button>)}</div>)}</aside><main className="docs-content"><p className="breadcrumb">Hana OmniLens API / {selected.group}</p><h1>{locale === 'ko' ? selected.title : selected.titleEn}</h1><p className="docs-description">{locale === 'ko' ? selected.description : selected.descriptionEn}</p><div className="endpoint-bar"><span className={selected.method.toLowerCase()}>{selected.method}</span><code>{selected.path}</code></div><section className="docs-section"><h2>Authentication</h2><p>{locale === 'ko' ? '모든 파트너 API 요청에는 승인된 서버 전용 API 키가 필요합니다.' : 'Every partner API request requires an approved server-side API key.'}</p><div className="parameter"><code>X-HANA-OMNILENS-API-KEY</code><span>header · required</span></div></section><section className="docs-section"><h2>Request</h2><div className="parameter"><code>stockCodes</code><span>query · string[]</span><p>{locale === 'ko' ? '한국거래소 6자리 종목 코드 목록' : 'List of six-digit Korea Exchange stock codes'}</p></div></section></main><aside className="code-panel"><div className="code-tabs"><span>cURL</span><span>JavaScript</span></div><pre><code>{`curl --request ${selected.method} \\\n  --url '${apiBaseUrl}${selected.path}' \\\n  --header 'X-HANA-OMNILENS-API-KEY: $API_KEY'`}</code></pre><h3>Response</h3><pre><code>{`{\n  "success": true,\n  "status": 200,\n  "data": {\n    "source": "HANA_OMNILENS_API"\n  }\n}`}</code></pre></aside></div></div>
}

function AuthPage({ locale, onLocale, onAuthenticated, onHome }: { locale: Locale; onLocale: (locale: Locale) => void; onAuthenticated: (session: Session) => void; onHome: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login'); const [message, setMessage] = useState(''); const [loading, setLoading] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setLoading(true); const form = new FormData(event.currentTarget); try { const body = mode === 'login' ? { username: form.get('username'), password: form.get('password') } : { username: form.get('username'), password: form.get('password'), name: form.get('name'), phoneNumber: form.get('phoneNumber') }; const next = await api<Session>(`/api/v1/portal/auth/${mode === 'login' ? 'login' : 'sign-up'}`, { method: 'POST', body: JSON.stringify(body) }); sessionStorage.setItem('hana-omnilens-session', JSON.stringify(next)); onAuthenticated(next) } catch (error) { setMessage(error instanceof Error ? error.message : 'Authentication failed') } finally { setLoading(false) } }
  return <div className="auth-page"><div className="auth-brand"><button className="brand-button" onClick={onHome}><img src="/brand/hana-omnilens-api.png" alt="Hana OmniLens API"/></button><div className="auth-orbit"><img src="/brand/hana-montana.png" alt="Hana Montana"/></div><h1>{locale === 'ko' ? '파트너와 함께 만드는\n금융 인텔리전스' : 'Financial intelligence,\nbuilt with partners'}</h1></div><main className="auth-panel"><div className="auth-top"><button onClick={onHome}>← {locale === 'ko' ? '홈으로' : 'Home'}</button><div className="language-switch"><button className={locale === 'ko' ? 'active' : ''} onClick={() => onLocale('ko')}>KO</button><button className={locale === 'en' ? 'active' : ''} onClick={() => onLocale('en')}>EN</button></div></div><form onSubmit={submit}><p className="eyebrow">PARTNER PORTAL</p><h2>{mode === 'login' ? (locale === 'ko' ? '로그인' : 'Sign in') : (locale === 'ko' ? '회원가입' : 'Create account')}</h2><p>{locale === 'ko' ? 'API 키를 신청하고 파트너 서비스를 관리하세요.' : 'Request API keys and manage your partner service.'}</p><label>{locale === 'ko' ? '아이디' : 'Username'}<input name="username" minLength={4} autoComplete="username" required/></label><label>{locale === 'ko' ? '비밀번호' : 'Password'}<input name="password" type="password" minLength={10} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required/></label>{mode === 'signup' && <><label>{locale === 'ko' ? '이름' : 'Name'}<input name="name" required/></label><label>{locale === 'ko' ? '전화번호' : 'Phone number'}<input name="phoneNumber" required/></label></>}{message && <p className="form-error">{message}</p>}<button className="primary full" disabled={loading}>{loading ? '...' : mode === 'login' ? (locale === 'ko' ? '로그인' : 'Sign in') : (locale === 'ko' ? '회원가입' : 'Create account')}</button><button type="button" className="switch-auth" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage('') }}>{mode === 'login' ? (locale === 'ko' ? '처음이신가요? 회원가입' : 'New partner? Create account') : (locale === 'ko' ? '이미 계정이 있나요? 로그인' : 'Already registered? Sign in')}</button></form></main></div>
}

function MemberPortal({ session, onSignIn, onHome, onAdmin, onSignOut }: { session: Session | null; onSignIn: () => void; onHome: () => void; onAdmin: () => void; onSignOut: () => void }) {
  const [applications, setApplications] = useState<Application[]>([]); const [message, setMessage] = useState('')
  useEffect(() => { if (session) void api<Application[]>('/api/v1/portal/api-key-applications', {}, session.accessToken).then(setApplications).catch((error) => setMessage(error.message)) }, [session])
  if (!session) return <AccessGate title="파트너 포털 로그인이 필요합니다" onSignIn={onSignIn} onHome={onHome}/>
  const requestKey = async () => { try { await api('/api/v1/portal/api-key-applications', { method: 'POST' }, session.accessToken); setApplications(await api('/api/v1/portal/api-key-applications', {}, session.accessToken)); setMessage('API 키 신청이 접수되었습니다.') } catch (error) { setMessage(error instanceof Error ? error.message : '요청 실패') } }
  return <ConsoleShell title="파트너 포털" user={session.user} onHome={onHome} onSignOut={onSignOut} adminAction={session.user.role === 'ADMIN' ? onAdmin : undefined}><div className="console-hero"><div><p className="eyebrow">PARTNER WORKSPACE</p><h2>{session.user.name}님, 반갑습니다.</h2><p>발급된 API 키와 신청 상태를 안전하게 관리하세요.</p></div><button className="primary" onClick={requestKey}>API 키 신청</button></div>{message && <p className="notice">{message}</p>}<ApplicationTable applications={applications}/></ConsoleShell>
}

function AdminPage({ session, onSignIn, onHome, onSignOut }: { session: Session | null; onSignIn: () => void; onHome: () => void; onSignOut: () => void }) {
  const [applications, setApplications] = useState<Application[]>([]); const [stats, setStats] = useState<TermStat[]>([]); const [cases, setCases] = useState<TaxCase[]>([]); const [message, setMessage] = useState('')
  const refresh = async () => { if (!session || session.user.role !== 'ADMIN') return; try { const [a, s, c] = await Promise.all([api<Application[]>('/api/v1/portal/admin/api-key-applications', {}, session.accessToken), api<TermStat[]>('/api/v1/portal/admin/term-analytics', {}, session.accessToken), api<TaxCase[]>('/api/v1/portal/admin/tax/refund-cases', {}, session.accessToken)]); setApplications(a); setStats(s); setCases(c) } catch (error) { setMessage(error instanceof Error ? error.message : '관리자 데이터를 불러오지 못했습니다.') } }
  useEffect(() => { void refresh() }, [session])
  if (!session || session.user.role !== 'ADMIN') return <AccessGate title="관리자 로그인이 필요합니다" body="하나증권 관리자 계정으로 로그인해 주세요." onSignIn={onSignIn} onHome={onHome}/>
  const approve = async (id: string) => { await api(`/api/v1/portal/admin/api-key-applications/${id}/approve`, { method: 'POST' }, session.accessToken); await refresh() }
  return <ConsoleShell title="Hana OmniLens 관리자 백오피스" user={session.user} onHome={onHome} onSignOut={onSignOut}><div className="admin-summary"><Summary label="API 키 신청" value={applications.length}/><Summary label="세무 처리 신청" value={cases.length}/><Summary label="고유어 설명 클릭" value={stats.reduce((sum, stat) => sum + stat.clickCount, 0)}/></div>{message && <p className="notice">{message}</p>}<section className="admin-panel"><div className="panel-title"><div><p className="eyebrow">API KEY MANAGEMENT</p><h2>API 키 신청 관리</h2></div></div><ApplicationTable applications={applications} admin onApprove={approve}/></section><section className="admin-grid"><TaxAdmin cases={cases} token={session.accessToken} onChanged={refresh}/><Analytics stats={stats}/></section></ConsoleShell>
}

function ConsoleShell({ title, user, onHome, onSignOut, adminAction, children }: { title: string; user: User; onHome: () => void; onSignOut: () => void; adminAction?: () => void; children: React.ReactNode }) { return <div className="console-shell"><aside className="console-sidebar"><button className="brand-button" onClick={onHome}><img src="/brand/hana-omnilens-api.png" alt="Hana OmniLens API"/></button><p>{title}</p><nav><button className="active">대시보드</button><button>API 키 관리</button><button>사용량 분석</button>{adminAction && <button onClick={adminAction}>관리자 백오피스 →</button>}</nav><div className="sidebar-user"><b>{user.name}</b><span>{user.role}</span><button onClick={onSignOut}>로그아웃</button></div></aside><main className="console-main">{children}</main></div> }
function AccessGate({ title, body, onSignIn, onHome }: { title: string; body?: string; onSignIn: () => void; onHome: () => void }) { return <div className="access-gate"><img src="/brand/hana-omnilens-api.png" alt="Hana OmniLens API"/><h1>{title}</h1><p>{body ?? '파트너 계정으로 로그인해 주세요.'}</p><div><button className="secondary" onClick={onHome}>홈으로</button><button className="primary" onClick={onSignIn}>로그인</button></div></div> }
function Summary({ label, value }: { label: string; value: number }) { return <article><span>{label}</span><b>{value.toLocaleString()}</b><i>실시간</i></article> }
function ApplicationTable({ applications, admin, onApprove }: { applications: Application[]; admin?: boolean; onApprove?: (id: string) => void }) { const activeKey = useMemo(() => applications.find((item) => item.status === 'APPROVED' && item.apiKey), [applications]); return <div className="data-table">{activeKey && <div className="key-callout"><span>발급된 서버 API 키</span><code>{activeKey.apiKey}</code><small>브라우저나 모바일 앱에 노출하지 말고 서버 설정에만 보관하세요.</small></div>}<div className="table-head"><span>파트너</span><span>상태</span><span>신청일</span><span>처리</span></div>{applications.length === 0 ? <p className="empty">신청 내역이 없습니다.</p> : applications.map((item) => <div className="table-row" key={item.applicationId}><span>{item.partnerId}</span><b className={`status ${item.status.toLowerCase()}`}>{item.status}</b><span>{new Date(item.requestedAt).toLocaleDateString('ko-KR')}</span>{admin && item.status === 'PENDING' ? <button onClick={() => onApprove?.(item.applicationId)}>승인</button> : <span>{item.apiKeySha256Prefix || '—'}</span>}</div>)}</div> }
function TaxAdmin({ cases, token, onChanged }: { cases: TaxCase[]; token: string; onChanged: () => Promise<void> }) {
  const [selected, setSelected] = useState<TaxCase | null>(null); const [fields, setFields] = useState<Record<string, string>>({}); const [template, setTemplate] = useState<string | null>(null); const [message, setMessage] = useState('')
  const open = async (item: TaxCase) => { try { setSelected(item); setFields(await api<Record<string, string>>(`/api/v1/portal/admin/tax/refund-cases/${item.caseId}/correction-fields`, {}, token)); setMessage('') } catch (error) { setMessage(error instanceof Error ? error.message : '검증 값을 불러오지 못했습니다.') } }
  const chooseTemplate = async (file?: File) => { if (!file) return; const value = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1] ?? ''); reader.onerror = () => reject(reader.error); reader.readAsDataURL(file) }); setTemplate(value) }
  const download = async () => { if (!selected) return; try { await downloadCorrectionPdf(`/api/v1/portal/admin/tax/refund-cases/${selected.caseId}/correction-request.pdf`, { fields, templateBase64: template }, token); setMessage('PDF를 생성했습니다.') } catch (error) { setMessage(error instanceof Error ? error.message : 'PDF 생성에 실패했습니다.') } }
  const submit = async () => { if (!selected || !window.confirm('작성한 경정청구서를 국세청 제출 완료로 처리하시겠습니까?')) return; try { await api(`/api/v1/portal/admin/tax/refund-cases/${selected.caseId}/submit-to-nts`, { method: 'POST' }, token); await onChanged(); setMessage('국세청 제출 완료로 처리했습니다.') } catch (error) { setMessage(error instanceof Error ? error.message : '제출 처리에 실패했습니다.') } }
  return <section className="admin-panel"><p className="eyebrow">TAX OPERATIONS</p><h2>세무 서류 관리</h2>{cases.length === 0 ? <p className="empty">동기화된 신청 건이 없습니다.</p> : cases.map((item) => <button className="case-row" key={item.caseId} onClick={() => void open(item)}><div><b>{item.caseId}</b><span>{item.taxYear} · {item.treatyCountry} · USD {item.estimatedRefundUsd}</span></div><strong>{item.taxOfficeSubmissionStatus}</strong></button>)}{selected && <div className="tax-editor"><p className="eyebrow">경정청구서 편집기</p><h3>{selected.caseId}</h3><p className="muted">검증 완료 서류: {selected.verifiedDocuments.map((document) => document.fileName).join(' · ')}</p><label>경정청구서 PDF 양식<input type="file" accept="application/pdf" onChange={(event) => void chooseTemplate(event.target.files?.[0])}/></label>{Object.entries(fields).map(([key, value]) => <label key={key}>{key}<input value={value} onChange={(event) => setFields({ ...fields, [key]: event.target.value })}/></label>)}<div className="editor-actions"><button onClick={() => void download()}>PDF 다운로드</button><button className="primary" onClick={() => void submit()}>국세청 제출 처리</button></div></div>}{message && <p className="notice">{message}</p>}</section>
}
function Analytics({ stats }: { stats: TermStat[] }) { return <section className="admin-panel"><p className="eyebrow">TERM ANALYTICS</p><h2>고유어 설명 분석</h2>{stats.length === 0 ? <p className="empty">수집된 클릭이 없습니다.</p> : stats.slice(0, 7).map((stat) => <div className="stat-row" key={`${stat.normalizedTerm}-${stat.locale}`}><span>{stat.normalizedTerm}<small>{stat.locale}</small></span><b>{stat.clickCount}</b><i style={{ width: `${Math.min(100, stat.clickCount * 5)}%` }}/></div>)}</section> }
function Footer({ locale }: { locale: Locale }) { return <footer><img src="/brand/hana-omnilens-api.png" alt="Hana OmniLens API"/><p>{locale === 'ko' ? '해외 파트너를 위한 한국 금융 인텔리전스 API' : 'Korean financial intelligence for global partners'}</p><span>© 2026 Hana Financial Group</span></footer> }

createRoot(document.getElementById('root')!).render(<App />)
