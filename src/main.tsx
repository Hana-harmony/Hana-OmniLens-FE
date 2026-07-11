import { FormEvent, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const apiBaseUrl = import.meta.env.VITE_OMNILENS_API_BASE_URL ?? 'http://127.0.0.1:8080'

type User = { userId: string; username: string; name: string; phoneNumber: string; role: 'MEMBER' | 'ADMIN' }
type Session = { accessToken: string; expiresAt: string; user: User }
type Application = { applicationId: string; partnerId: string; status: string; requestedAt: string; reviewedAt?: string; apiKeySha256Prefix?: string; apiKey?: string; rejectionReason?: string }
type TermStat = { normalizedTerm: string; locale: string; clickCount: number; cacheHitCount: number; reviewRequiredCount: number; lastClickedAt: string }
type VerifiedDocument = { documentId: string; documentType: string; fileName: string; extractedFields: Record<string, string> }
type TaxRefundCase = { caseId: string; accountId: string; taxYear: number; treatyCountry: string; estimatedRefundUsd: string; status: string; taxOfficeSubmissionStatus: string; syncedAt: string; verifiedDocuments: VerifiedDocument[] }

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })
  const payload = await response.json() as { success: boolean; message: string; data: T }
  if (!response.ok || !payload.success) throw new Error(payload.message || 'Request failed')
  return payload.data
}

async function downloadCorrectionPdf(path: string, body: unknown, token: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) })
  if (!response.ok) throw new Error('Unable to render the correction-request PDF')
  const file = new Blob([await response.arrayBuffer()], { type: 'application/pdf' })
  const href = URL.createObjectURL(file)
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = 'correction-request.pdf'
  anchor.click()
  URL.revokeObjectURL(href)
}

function App() {
  const [session, setSession] = useState<Session | null>(() => {
    const saved = sessionStorage.getItem('hana-omnilens-session')
    return saved ? JSON.parse(saved) as Session : null
  })
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [message, setMessage] = useState<string | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [termStats, setTermStats] = useState<TermStat[]>([])
  const [taxCases, setTaxCases] = useState<TaxRefundCase[]>([])

  const isAdmin = session?.user.role === 'ADMIN'
  const token = session?.accessToken

  const refreshPortalData = async () => {
    if (!token) return
    try {
      const [nextApplications, nextTerms, nextTaxCases] = await Promise.all([
        request<Application[]>(isAdmin ? '/api/v1/portal/admin/api-key-applications' : '/api/v1/portal/api-key-applications', {}, token),
        isAdmin ? request<TermStat[]>('/api/v1/portal/admin/term-analytics', {}, token) : Promise.resolve([]),
        isAdmin ? request<TaxRefundCase[]>('/api/v1/portal/admin/tax/refund-cases', {}, token) : Promise.resolve([]),
      ])
      setApplications(nextApplications)
      setTermStats(nextTerms)
      setTaxCases(nextTaxCases)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load portal data')
    }
  }

  useEffect(() => { void refreshPortalData() }, [token, isAdmin])

  const activeKey = useMemo(() => applications.find((application) => application.status === 'APPROVED' && application.apiKey), [applications])

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const body = mode === 'signup'
      ? { username: form.get('username'), password: form.get('password'), name: form.get('name'), phoneNumber: form.get('phoneNumber') }
      : { username: form.get('username'), password: form.get('password') }
    try {
      const nextSession = await request<Session>(`/api/v1/portal/auth/${mode === 'signup' ? 'sign-up' : 'login'}`, { method: 'POST', body: JSON.stringify(body) })
      sessionStorage.setItem('hana-omnilens-session', JSON.stringify(nextSession))
      setSession(nextSession)
      setMessage(mode === 'signup' ? 'Account created. You can now request an API key.' : `Welcome back, ${nextSession.user.name}.`)
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Authentication failed') }
  }

  const requestKey = async () => {
    if (!token) return
    try {
      await request<Application>('/api/v1/portal/api-key-applications', { method: 'POST' }, token)
      setMessage('Your permanent API key request is pending administrator approval.')
      await refreshPortalData()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to request an API key') }
  }

  const approve = async (applicationId: string) => {
    if (!token) return
    try {
      await request<Application>(`/api/v1/portal/admin/api-key-applications/${applicationId}/approve`, { method: 'POST' }, token)
      setMessage('API key approved and issued securely.')
      await refreshPortalData()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to approve application') }
  }

  const signOut = () => { sessionStorage.removeItem('hana-omnilens-session'); setSession(null); setApplications([]); setTermStats([]); setTaxCases([]) }

  return <div className="site-shell">
    <header className="topbar"><a className="brand" href="#top"><span>Hana</span> OmniLens</a><nav><a href="#capabilities">Capabilities</a><a href="#use-cases">Use cases</a><a href={`${apiBaseUrl}/swagger-ui/index.html`} target="_blank" rel="noreferrer">Swagger</a>{session ? <button className="text-button" onClick={signOut}>Sign out</button> : <a href="#portal">Partner portal</a>}</nav></header>
    <main id="top">
      <section className="hero"><div><p className="eyebrow">KOREA MARKET INTELLIGENCE API</p><h1>Clearer Korean market data.<br/><em>Built for global partners.</em></h1><p className="hero-copy">Hana OmniLens turns live prices, K-News, disclosures, Korean financial terms, tax-document verification and alert intelligence into dependable partner APIs.</p><div className="actions"><a className="primary-button" href="#portal">Get an API key</a><a className="secondary-button" href={`${apiBaseUrl}/swagger-ui/index.html`} target="_blank" rel="noreferrer">Explore Swagger</a></div></div><div className="hero-panel"><span className="live-dot">Live intelligence</span><div className="quote-row"><b>KOSPI</b><strong>2,747.59</strong><i>+2.52%</i></div><div className="signal-card"><span>Market signal</span><b>Samsung Electronics</b><p>High-impact disclosure detected · translated for your member workflow</p></div><div className="chart"><span/><span/><span/><span/><span/><span/></div></div></section>
      <section id="capabilities" className="section"><p className="eyebrow">ONE PARTNER SURFACE</p><h2>Everything a local brokerage needs to serve Korean equities with confidence.</h2><div className="capability-grid"><Capability number="01" title="Live market & orderability" text="KOSPI/KOSDAQ quotes, order books, market sessions and trading restrictions in one stable contract."/><Capability number="02" title="K-News & disclosure intelligence" text="Readable English full text, sentiment, materiality, original sources and related-stock context."/><Capability number="03" title="Tax document verification" text="OCR verification for residence certificates, apostilles and reduced withholding applications."/><Capability number="04" title="Glossary & partner analytics" text="Contextual Korean term explanations and privacy-preserving explanation engagement analytics."/></div></section>
      <section id="use-cases" className="showcase"><div className="phone-frame"><div className="phone-top"/><div className="phone-card"><span>Reduced withholding tax</span><b>Documents submitted</b><p>OCR verified · Review in progress</p><button>View status</button></div><div className="phone-list"><span>Samsung Electronics</span><b>USD 188.10</b><i>+2.52%</i></div></div><div><p className="eyebrow">APPLIED EXPERIENCE</p><h2>Designed to become part of your product, not another dashboard.</h2><p>Use the same intelligence across your exchange app: notification cards, translated detail pages, tax flows and operational back office.</p><a className="inline-link" href="#portal">Open partner portal →</a></div></section>
      <section id="portal" className="portal-section"><div className="portal-intro"><p className="eyebrow">PARTNER PORTAL</p><h2>{session ? `Welcome, ${session.user.name}.` : 'Build with Hana OmniLens.'}</h2><p>{session ? 'Request and manage your permanent partner API credential. Administrators can securely review applications and analyse real glossary engagement.' : 'Create a portal account to request a permanent API key. No separate verification step is required.'}</p></div>{session ? <div className="portal-console"><div className="console-head"><div><span className="role-pill">{session.user.role}</span><h3>{session.user.username}</h3></div>{!isAdmin && <button className="primary-button" onClick={requestKey}>Request API key</button>}</div>{message && <p className="notice">{message}</p>}{activeKey && <div className="api-key-card"><span>Issued partner API key</span><code>{activeKey.apiKey}</code><small>Store this key in server-side configuration only. Never expose it to a browser or mobile client.</small></div>}<ApplicationTable applications={applications} admin={isAdmin} onApprove={approve}/>{isAdmin && <><TaxCases cases={taxCases} token={token!} onChanged={refreshPortalData}/><Analytics stats={termStats}/></>}</div> : <form className="auth-card" onSubmit={submitAuth}><div className="mode-switch"><button type="button" className={mode === 'login' ? 'selected' : ''} onClick={() => setMode('login')}>Sign in</button><button type="button" className={mode === 'signup' ? 'selected' : ''} onClick={() => setMode('signup')}>Create account</button></div><label>Username<input name="username" minLength={4} required /></label><label>Password<input name="password" type="password" minLength={10} required /></label>{mode === 'signup' && <><label>Name<input name="name" required /></label><label>Phone number<input name="phoneNumber" required /></label></>}{message && <p className="notice">{message}</p>}<button className="primary-button" type="submit">{mode === 'login' ? 'Sign in to portal' : 'Create portal account'}</button></form>}</section>
    </main><footer>© Hana Financial Group · Hana OmniLens API</footer>
  </div>
}

function Capability({ number, title, text }: { number: string; title: string; text: string }) { return <article className="capability"><span>{number}</span><h3>{title}</h3><p>{text}</p><a href={`${apiBaseUrl}/swagger-ui/index.html`} target="_blank" rel="noreferrer">API reference ↗</a></article> }
function ApplicationTable({ applications, admin, onApprove }: { applications: Application[]; admin: boolean; onApprove: (id: string) => void }) { return <section className="data-panel"><h3>{admin ? 'API key applications' : 'My API key applications'}</h3>{applications.length === 0 ? <p className="empty">No API key applications yet.</p> : <div className="table"><div className="table-head"><span>Partner</span><span>Status</span><span>Requested</span><span>Action</span></div>{applications.map((application) => <div className="table-row" key={application.applicationId}><span>{application.partnerId}</span><b className={`status ${application.status.toLowerCase()}`}>{application.status}</b><span>{new Date(application.requestedAt).toLocaleDateString()}</span>{admin && application.status === 'PENDING' ? <button onClick={() => onApprove(application.applicationId)}>Approve</button> : <span>{application.apiKeySha256Prefix ? `Key · ${application.apiKeySha256Prefix}` : '—'}</span>}</div>)}</div>}</section> }
function TaxCases({ cases, token, onChanged }: { cases: TaxRefundCase[]; token: string; onChanged: () => Promise<void> }) {
  const [selected, setSelected] = useState<TaxRefundCase | null>(null)
  const [fields, setFields] = useState<Record<string, string>>({})
  const [template, setTemplate] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const open = async (taxCase: TaxRefundCase) => { try { setSelected(taxCase); setFields(await request<Record<string, string>>(`/api/v1/portal/admin/tax/refund-cases/${taxCase.caseId}/correction-fields`, {}, token)); setError(null) } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to load verified values') } }
  const chooseTemplate = async (file?: File) => { if (!file) return; setTemplate(await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1] ?? ''); reader.onerror = () => reject(reader.error); reader.readAsDataURL(file) })) }
  const download = async () => { if (!selected) return; try { await downloadCorrectionPdf(`/api/v1/portal/admin/tax/refund-cases/${selected.caseId}/correction-request.pdf`, { fields, templateBase64: template }, token); setError(null) } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to download PDF') } }
  const submit = async () => { if (!selected || !confirm('Mark this correction request as submitted to the simulated National Tax Service?')) return; try { await request(`/api/v1/portal/admin/tax/refund-cases/${selected.caseId}/submit-to-nts`, { method: 'POST' }, token); await onChanged(); setError('Submitted to the simulated National Tax Service.') } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to submit request') } }
  return <section className="data-panel"><h3>Tax correction submissions</h3><p className="muted">Verified exchange documents are loaded into a correction-request editor without replacing the original case record.</p>{cases.length === 0 ? <p className="empty">No submitted tax cases have synchronized yet.</p> : <div className="table"><div className="table-head"><span>Case</span><span>Status</span><span>Refund</span><span>Tax office</span></div>{cases.map((taxCase) => <div className="table-row" key={taxCase.caseId}><button className="table-link" onClick={() => void open(taxCase)}>{taxCase.caseId} · {taxCase.treatyCountry}</button><b className="status approved">{taxCase.status}</b><span>USD {taxCase.estimatedRefundUsd}</span><span>{taxCase.taxOfficeSubmissionStatus}</span></div>)}</div>}{selected && <div className="tax-editor"><div><p className="eyebrow">CORRECTION REQUEST EDITOR</p><h4>{selected.caseId}</h4><p className="muted">Three verified documents: {selected.verifiedDocuments.map((document) => document.fileName).join(' · ')}</p></div><label>Correction-request template (PDF)<input type="file" accept="application/pdf" onChange={(event) => void chooseTemplate(event.target.files?.[0])}/></label>{Object.entries(fields).map(([key, value]) => <label key={key}>{key}<input value={value} onChange={(event) => setFields({ ...fields, [key]: event.target.value })}/></label>)}<div className="editor-actions"><button onClick={() => void download()}>Download PDF</button><button className="primary-button" onClick={() => void submit()}>Submit to NTS</button></div>{error && <p className="notice">{error}</p>}</div>}</section>
}
function Analytics({ stats }: { stats: TermStat[] }) { return <section className="data-panel"><h3>Glossary explanation analytics</h3><p className="muted">Aggregated clicks from the local exchange's Korean-term explanations.</p>{stats.length === 0 ? <p className="empty">No explanation events recorded yet.</p> : <div className="analytics-list">{stats.slice(0, 8).map((stat) => <div key={`${stat.normalizedTerm}-${stat.locale}`}><span>{stat.normalizedTerm}</span><b>{stat.clickCount.toLocaleString()}</b><small>{stat.locale} · cache {stat.cacheHitCount}</small></div>)}</div>}</section> }

createRoot(document.getElementById('root')!).render(<App />)
