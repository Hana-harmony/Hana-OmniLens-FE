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
type RequestField = { name: string; location: 'path' | 'query' | 'body'; type: string; required?: boolean; description: string; descriptionEn: string }
type Endpoint = {
  group: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'WS'
  path: string
  title: string
  titleEn: string
  description: string
  descriptionEn: string
  fields: RequestField[]
  requestBody?: string
  response: string
  protocol?: 'RAW_JSON' | 'STOMP'
}

const copy = {
  ko: {
    nav: ['기능', '적용 사례', 'AI 모델'], docs: 'API 문서', login: '로그인', heroTag: 'GLOBAL KOREA MARKET INTELLIGENCE',
    hero: '한국 금융 데이터를\n더 명확하게.', accent: '하나의 API로.',
    intro: '시세, 뉴스·공시 인텔리전스, 금융 고유어, 글로벌 세무 OCR을 안정적인 파트너 API로 제공합니다.',
    start: 'API 키 신청', explore: '개발자 문서 보기', trust: '실제 거래소 서비스에서 검증된 API',
    capabilities: '파트너 서비스에 필요한 핵심 기능', capabilityIntro: '하나금융의 데이터와 Hana Montana AI를 하나의 API 계약으로 연결합니다.',
    cases: '구현된 서비스로 확인하세요', casesIntro: 'Hana OmniLens API와 연동된 현지 거래소의 실제 화면에서 세 가지 핵심 기능을 확인하세요.',
    ai: 'Hana Montana', aiTitle: 'OmniLens의 금융 AI 모델', aiBody: '뉴스 분석, 문맥 번역, 고유어 설명, 세무 문서 OCR과 위변조 위험 판단을 수행하는 Hana OmniLens API 서버의 전용 AI 모델입니다.',
  },
  en: {
    nav: ['Capabilities', 'Use cases', 'AI model'], docs: 'API Docs', login: 'Sign in', heroTag: 'GLOBAL KOREA MARKET INTELLIGENCE',
    hero: 'Korean financial data,\nmade clearer.', accent: 'Delivered by one API.',
    intro: 'Deliver live prices, news and disclosure intelligence, contextual terminology, and global tax OCR through one dependable partner API.',
    start: 'Request an API key', explore: 'Explore API docs', trust: 'Proven in a production-grade exchange experience',
    capabilities: 'Core intelligence for partner products', capabilityIntro: 'Hana Financial data and Hana Montana AI, delivered through one stable API contract.',
    cases: 'See it working in a real product', casesIntro: 'Explore three core capabilities through live screens from the local exchange integrated with Hana OmniLens API.',
    ai: 'Hana Montana', aiTitle: 'The financial AI behind OmniLens', aiBody: 'The dedicated Hana OmniLens server model for news analysis, contextual translation, terminology, tax-document OCR, and fraud-risk assessment.',
  },
} as const

const endpoints: Endpoint[] = [
  {
    group: 'Market Data', method: 'GET', path: '/api/v1/market/stocks/search', title: '국내 종목 검색', titleEn: 'Search Korean stocks',
    description: '종목 코드·국문명·영문명으로 지원 종목을 검색합니다.', descriptionEn: 'Searches supported stocks by code, Korean name, or English name.',
    fields: [{ name: 'query', location: 'query', type: 'string', required: true, description: '검색어 1~40자', descriptionEn: 'Search text from 1 to 40 characters' }],
    response: `{"success":true,"status":200,"data":[{"stockCode":"005930","stockName":"삼성전자","stockNameEn":"Samsung Electronics","market":"KOSPI"}]}`,
  },
  {
    group: 'Market Data', method: 'GET', path: '/api/v1/market/stocks/{stockCode}', title: '종목 기본정보', titleEn: 'Stock master',
    description: '지원 종목의 명칭·시장·ISIN·DART 법인 코드를 조회합니다.', descriptionEn: 'Returns name, market, ISIN, and DART corporation code for a supported stock.',
    fields: [{ name: 'stockCode', location: 'path', type: 'string', required: true, description: '6자리 종목 코드', descriptionEn: 'Six-digit stock code' }],
    response: `{"success":true,"status":200,"data":{"stockCode":"005930","stockName":"삼성전자","market":"KOSPI","isinCode":"KR7005930003"}}`,
  },
  {
    group: 'Market Data', method: 'GET', path: '/api/v1/market/stocks/{stockCode}/quote', title: '단일 종목 현재가', titleEn: 'Single-stock quote',
    description: '현재가·시간외 시세·환산가·외국인 보유 현황을 조회합니다.', descriptionEn: 'Returns live, after-hours, converted, and foreign-ownership quote fields.',
    fields: [
      { name: 'stockCode', location: 'path', type: 'string', required: true, description: '6자리 종목 코드', descriptionEn: 'Six-digit stock code' },
      { name: 'currency', location: 'query', type: 'ISO 4217', description: '환산 통화, 기본값 USD', descriptionEn: 'Local currency; defaults to USD' },
      { name: 'fxRate', location: 'query', type: 'decimal > 0', description: '선택적 KRW 환산율', descriptionEn: 'Optional KRW conversion rate' },
    ],
    response: `{"success":true,"status":200,"data":{"stockCode":"005930","currentPriceKrw":75000,"localCurrency":"USD","foreignOwnershipRate":51.2,"source":"KIS"}}`,
  },
  {
    group: 'Market Data', method: 'GET', path: '/api/v1/market/stocks/{stockCode}/detail', title: '종목 상세 화면 데이터', titleEn: 'Stock detail view',
    description: '시세·환산가·외국인 보유 예측·VI·가격 제한·거래정지 정보를 하나의 응답으로 제공합니다.', descriptionEn: 'Returns quote, FX, foreign-ownership prediction, VI, price-limit, and halt fields in one response.',
    fields: [
      { name: 'stockCode', location: 'path', type: 'string', required: true, description: '6자리 종목 코드', descriptionEn: 'Six-digit stock code' },
      { name: 'currency', location: 'query', type: 'ISO 4217', description: '환산 통화, 기본값 USD', descriptionEn: 'Local currency; defaults to USD' },
      { name: 'fxRate', location: 'query', type: 'decimal > 0', description: '선택적 KRW 환산율', descriptionEn: 'Optional KRW conversion rate' },
    ],
    response: `{"success":true,"status":200,"data":{"stockCode":"005930","predictedForeignOwnershipRateMin":50.8,"predictedForeignOwnershipRateMax":51.6,"viActive":false,"tradingHalted":false,"orderable":true}}`,
  },
  {
    group: 'Market Data', method: 'GET', path: '/api/v1/market/stocks/{stockCode}/global-peers', title: '글로벌 피어 매칭', titleEn: 'Global peer matching',
    description: '검증된 글로벌 비교기업·비교 차원·핵심 강점과 모델 신뢰도를 조회합니다.', descriptionEn: 'Returns validated global peers, comparison dimensions, key strengths, and model confidence.',
    fields: [{ name: 'stockCode', location: 'path', type: 'string', required: true, description: '6자리 종목 코드', descriptionEn: 'Six-digit stock code' }],
    response: `{"success":true,"status":200,"data":{"stockCode":"005930","primaryPeer":{},"peers":[],"comparisons":[],"keyStrengths":[],"modelVersion":"<MODEL_VERSION>"}}`,
  },
  {
    group: 'Market Data', method: 'GET', path: '/api/v1/market/quotes', title: '복수 종목 현재가', titleEn: 'Multi-stock quotes',
    description: '전체 또는 요청한 국내 종목의 현재가와 요청 통화 환산가를 조회합니다.', descriptionEn: 'Returns all or selected Korean stock quotes with converted prices.',
    fields: [
      { name: 'stockCodes', location: 'query', type: 'string[]', description: '선택 조회할 6자리 종목 코드, 최대 200개', descriptionEn: 'Optional six-digit stock codes, up to 200' },
      { name: 'market', location: 'query', type: 'KOSPI | KOSDAQ | KONEX', description: '시장 필터', descriptionEn: 'Optional market filter' },
      { name: 'currency', location: 'query', type: 'ISO 4217', description: '환산 통화, 기본값 USD', descriptionEn: 'Quote currency; defaults to USD' },
      { name: 'limit', location: 'query', type: 'integer', description: '응답 개수 1~2,000, 기본값 500', descriptionEn: 'Result size from 1 to 2,000; defaults to 500' },
    ],
    response: `{"success":true,"status":200,"data":[{"stockCode":"005930","stockName":"삼성전자","currentPriceKrw":75000,"localCurrency":"USD","localCurrencyPrice":54.3,"source":"KIS"}]}`,
  },
  {
    group: 'Market Data', method: 'GET', path: '/api/v1/market/indices', title: '국내 시장 지수', titleEn: 'Korean market indices',
    description: 'KOSPI·KOSDAQ·KOSPI 200 실시간 스냅샷을 조회합니다.', descriptionEn: 'Returns live KOSPI, KOSDAQ, and KOSPI 200 snapshots.', fields: [],
    response: `{"success":true,"status":200,"data":[{"indexCode":"0001","indexName":"KOSPI","currentValue":3200.15,"changeRate":0.83,"source":"KIS_REALTIME"}]}`,
  },
  {
    group: 'Market Data', method: 'GET', path: '/api/v1/market/indices/{indexCode}/intraday', title: '시장 지수 당일 분봉', titleEn: 'Index intraday bars',
    description: 'KOSPI·KOSDAQ·KOSPI 200의 당일 분봉 OHLC와 거래량을 조회합니다.', descriptionEn: 'Returns intraday OHLC and volume bars for KOSPI, KOSDAQ, or KOSPI 200.',
    fields: [
      { name: 'indexCode', location: 'path', type: '0001 | 1001 | 2001', required: true, description: '시장 지수 코드', descriptionEn: 'Market index code' },
      { name: 'date', location: 'query', type: 'YYYY-MM-DD', description: '조회일, 미입력 시 당일', descriptionEn: 'Date; defaults to today' },
      { name: 'limit', location: 'query', type: 'integer 1~600', description: '분봉 수, 기본값 390', descriptionEn: 'Bar count; defaults to 390' },
    ],
    response: `{"success":true,"status":200,"data":[{"indexCode":"0001","bucketStart":"2026-07-12T09:01:00","openValue":3200.1,"closeValue":3201.2,"source":"KIS"}]}`,
  },
  {
    group: 'Market Data', method: 'GET', path: '/api/v1/market/stocks/{stockCode}/orderbook', title: '종목 호가', titleEn: 'Stock order book',
    description: '종목별 매수·매도 호가와 잔량을 조회합니다.', descriptionEn: 'Returns bid and ask levels with remaining quantities.',
    fields: [{ name: 'stockCode', location: 'path', type: 'string', required: true, description: '한국거래소 6자리 종목 코드', descriptionEn: 'Six-digit Korea Exchange stock code' }],
    response: `{"success":true,"status":200,"data":{"stockCode":"005930","asks":[{"priceKrw":75100,"quantity":1200}],"bids":[{"priceKrw":75000,"quantity":950}],"source":"KIS"}}`,
  },
  {
    group: 'Market Data', method: 'GET', path: '/api/v1/market/stocks/{stockCode}/orderability', title: '주문 가능 경계 확인', titleEn: 'Orderability boundary',
    description: '현지 모의 주문 전에 외국인 한도·VI·가격제한·거래정지 경계를 확인합니다. 실제 주문을 실행하지 않습니다.', descriptionEn: 'Checks foreign-limit, VI, price-limit, and halt boundaries before partner-side mock orders; it does not place orders.',
    fields: [
      { name: 'stockCode', location: 'path', type: 'string', required: true, description: '6자리 종목 코드', descriptionEn: 'Six-digit stock code' },
      { name: 'side', location: 'query', type: 'BUY | SELL', required: true, description: '주문 방향', descriptionEn: 'Order side' },
      { name: 'quantity', location: 'query', type: 'integer >= 1', required: true, description: '주문 수량', descriptionEn: 'Order quantity' },
    ],
    response: `{"success":true,"status":200,"data":{"stockCode":"005930","side":"BUY","quantity":10,"orderable":true,"foreignLimitExceeded":false,"viActive":false}}`,
  },
  {
    group: 'Market Data', method: 'GET', path: '/api/v1/market/stocks/{stockCode}/history', title: '종목 일봉 OHLCV', titleEn: 'Daily OHLCV history',
    description: 'KRX 기반 일봉 시가·고가·저가·종가·거래량을 조회합니다.', descriptionEn: 'Returns KRX-based daily OHLCV history.',
    fields: [
      { name: 'stockCode', location: 'path', type: 'string', required: true, description: '6자리 종목 코드', descriptionEn: 'Six-digit stock code' },
      { name: 'from', location: 'query', type: 'YYYY-MM-DD', description: '시작일', descriptionEn: 'Start date' },
      { name: 'to', location: 'query', type: 'YYYY-MM-DD', description: '종료일', descriptionEn: 'End date' },
      { name: 'limit', location: 'query', type: 'integer 1~5000', description: '응답 개수, 기본값 365', descriptionEn: 'Result size; defaults to 365' },
    ],
    response: `{"success":true,"status":200,"data":[{"stockCode":"005930","tradeDate":"2026-07-11","openPriceKrw":74500,"closePriceKrw":75000,"tradingVolume":1234567,"source":"KRX"}]}`,
  },
  {
    group: 'Market Data', method: 'GET', path: '/api/v1/market/stocks/{stockCode}/intraday', title: '종목 당일 분봉 OHLCV', titleEn: 'Stock intraday OHLCV',
    description: 'KIS 기반 종목 분봉 시가·고가·저가·종가·거래량을 조회합니다.', descriptionEn: 'Returns KIS-based stock intraday OHLCV bars.',
    fields: [
      { name: 'stockCode', location: 'path', type: 'string', required: true, description: '6자리 종목 코드', descriptionEn: 'Six-digit stock code' },
      { name: 'date', location: 'query', type: 'YYYY-MM-DD', description: '조회일, 미입력 시 당일', descriptionEn: 'Date; defaults to today' },
      { name: 'limit', location: 'query', type: 'integer 1~600', description: '분봉 수, 기본값 390', descriptionEn: 'Bar count; defaults to 390' },
      { name: 'fetchMissing', location: 'query', type: 'boolean', description: '누락 데이터 공급자 조회 여부, 기본값 true', descriptionEn: 'Fetch missing bars from provider; defaults to true' },
    ],
    response: `{"success":true,"status":200,"data":[{"stockCode":"005930","bucketStart":"2026-07-12T09:01:00","openPriceKrw":75000,"closePriceKrw":75100,"source":"KIS"}]}`,
  },
  {
    group: 'Market Data', method: 'POST', path: '/api/v1/market/stocks/{stockCode}/realtime-subscription', title: '실시간 시세 원천 구독', titleEn: 'Subscribe realtime source',
    description: '해당 종목의 KIS 실시간 체결 원천 구독을 시작하고 시세 WebSocket 전달을 준비합니다.', descriptionEn: 'Starts the KIS realtime source subscription used by the market quote WebSocket.',
    fields: [
      { name: 'stockCode', location: 'path', type: 'string', required: true, description: '6자리 종목 코드', descriptionEn: 'Six-digit stock code' },
      { name: 'session', location: 'query', type: 'REGULAR | AFTER_HOURS_REAL', description: '거래 세션, 기본값 REGULAR', descriptionEn: 'Trading session; defaults to REGULAR' },
    ],
    response: `{"success":true,"status":200,"data":{"stockCode":"005930","subscribed":true,"session":"REGULAR"}}`,
  },
  {
    group: 'Market Data', method: 'DELETE', path: '/api/v1/market/stocks/{stockCode}/realtime-subscription', title: '실시간 시세 원천 구독 해제', titleEn: 'Unsubscribe realtime source',
    description: '해당 종목의 KIS 실시간 체결 원천 구독을 해제합니다.', descriptionEn: 'Stops the KIS realtime source subscription for a stock.',
    fields: [
      { name: 'stockCode', location: 'path', type: 'string', required: true, description: '6자리 종목 코드', descriptionEn: 'Six-digit stock code' },
      { name: 'session', location: 'query', type: 'REGULAR | AFTER_HOURS_REAL', description: '거래 세션, 기본값 REGULAR', descriptionEn: 'Trading session; defaults to REGULAR' },
    ],
    response: `{"success":true,"status":200,"data":{"stockCode":"005930","subscribed":false,"session":"REGULAR"}}`,
  },
  {
    group: 'Market Data', method: 'PUT', path: '/api/v1/market/exchange-rates/{currency}', title: '파트너 환율 저장', titleEn: 'Store partner FX rate',
    description: '파트너가 사용하는 KRW 대비 현지통화 환율을 저장합니다.', descriptionEn: 'Stores a partner-provided KRW-to-local-currency rate.',
    fields: [
      { name: 'currency', location: 'path', type: 'ISO 4217', required: true, description: '현지통화 코드', descriptionEn: 'Local currency code' },
      { name: 'fxRate', location: 'body', type: 'decimal > 0', required: true, description: 'KRW 환산율', descriptionEn: 'KRW conversion rate' },
    ],
    requestBody: `{"fxRate":0.00072}`,
    response: `{"success":true,"status":200,"data":{"currency":"USD","fxRate":0.00072,"source":"PARTNER"}}`,
  },
  {
    group: 'Intelligence', method: 'GET', path: '/api/v1/market/news', title: '한국 시장 뉴스', titleEn: 'Korean market news',
    description: '번역 전문·감성·중요도·What/Why/Impact 분석이 포함된 시장 뉴스를 커서 기반으로 조회합니다.', descriptionEn: 'Lists cursor-paginated market news with translation, sentiment, materiality, and What/Why/Impact analysis.',
    fields: [
      { name: 'limit', location: 'query', type: 'integer', description: '응답 개수 1~100, 기본값 20', descriptionEn: 'Result size from 1 to 100; defaults to 20' },
      { name: 'cursor', location: 'query', type: 'string', description: '다음 페이지 커서, 최대 512자', descriptionEn: 'Optional next-page cursor, up to 512 characters' },
    ],
    response: `{"success":true,"status":200,"data":{"count":1,"news":[{"newsId":"NEWS-...","title":"...","translatedTitle":"...","sentiment":"POSITIVE","importance":"HIGH","contentAvailability":"FULL_TEXT"}],"nextCursor":null}}`,
  },
  {
    group: 'Intelligence', method: 'GET', path: '/api/v1/market/news/trending', title: '인기 한국 시장 뉴스', titleEn: 'Trending Korean market news',
    description: '최근 상세 조회 수를 기준으로 한국 시장 뉴스를 정렬합니다.', descriptionEn: 'Ranks Korean market news by recent detail views.',
    fields: [
      { name: 'windowHours', location: 'query', type: 'integer 1~720', description: '집계 시간, 기본값 24', descriptionEn: 'Ranking window in hours; defaults to 24' },
      { name: 'limit', location: 'query', type: 'integer 1~100', description: '응답 개수, 기본값 10', descriptionEn: 'Result size; defaults to 10' },
    ],
    response: `{"success":true,"status":200,"data":{"count":1,"news":[{"newsId":"NEWS-...","title":"...","publishedAt":"2026-07-12T00:00:00Z"}]}}`,
  },
  {
    group: 'Intelligence', method: 'GET', path: '/api/v1/market/news/{newsId}', title: '한국 시장 뉴스 상세', titleEn: 'Korean market news detail',
    description: '표시 가능한 뉴스 전문·번역·What/Why/Impact·고유어 해설을 조회하고 조회 수를 기록합니다.', descriptionEn: 'Returns displayable full text, translation, What/Why/Impact, and glossary data and records a view.',
    fields: [{ name: 'newsId', location: 'path', type: 'string', required: true, description: '뉴스 ID, 최대 80자', descriptionEn: 'News ID, up to 80 characters' }],
    response: `{"success":true,"status":200,"data":{"newsId":"NEWS-...","originalContent":"...","translatedContent":"...","summaryLines":{"what":"...","why":"...","impact":"..."},"glossaryTerms":[]}}`,
  },
  {
    group: 'Intelligence', method: 'GET', path: '/api/v1/alerts/watchlists/{partnerId}', title: '파트너 관심종목 조회', titleEn: 'Get partner watchlist',
    description: '인증된 파트너의 실시간 뉴스·공시 수집 대상 종목을 조회합니다.', descriptionEn: 'Returns the authenticated partner watchlist used for alert collection.',
    fields: [{ name: 'partnerId', location: 'path', type: 'string', required: true, description: '발급된 파트너 ID', descriptionEn: 'Issued partner ID' }],
    response: `{"success":true,"status":200,"data":{"partnerId":"demo-partner","stockCodes":["005930"],"updatedAt":"2026-07-12T00:00:00Z"}}`,
  },
  {
    group: 'Intelligence', method: 'PUT', path: '/api/v1/alerts/watchlists/{partnerId}', title: '파트너 관심종목 교체', titleEn: 'Replace partner watchlist',
    description: '인증된 파트너의 관심종목 전체 목록을 교체합니다. 빈 배열은 목록을 비웁니다.', descriptionEn: 'Replaces the authenticated partner watchlist; an empty array clears it.',
    fields: [
      { name: 'partnerId', location: 'path', type: 'string', required: true, description: '발급된 파트너 ID', descriptionEn: 'Issued partner ID' },
      { name: 'stockCodes', location: 'body', type: 'string[]', required: true, description: '6자리 종목 코드 목록', descriptionEn: 'List of six-digit stock codes' },
    ],
    requestBody: `{"stockCodes":["005930","000660"]}`,
    response: `{"success":true,"status":200,"data":{"partnerId":"demo-partner","stockCodes":["005930","000660"]}}`,
  },
  {
    group: 'Intelligence', method: 'GET', path: '/api/v1/alerts/stocks/{stockCode}/events', title: '종목별 뉴스·공시 이벤트', titleEn: 'Stock news and disclosure events',
    description: '저장된 종목별 뉴스·공시 이벤트를 최신순으로 조회합니다.', descriptionEn: 'Lists stored news and disclosure events for one stock.',
    fields: [
      { name: 'stockCode', location: 'path', type: 'string', required: true, description: '한국거래소 6자리 종목 코드', descriptionEn: 'Six-digit Korea Exchange stock code' },
      { name: 'limit', location: 'query', type: 'integer', description: '응답 개수, 기본값 20', descriptionEn: 'Result size; defaults to 20' },
      { name: 'cursor', location: 'query', type: 'string', description: '다음 페이지 커서, 최대 512자', descriptionEn: 'Optional next-page cursor, up to 512 characters' },
    ],
    response: `{"success":true,"status":200,"data":{"stockCode":"005930","events":[{"alertId":"ALERT-...","sourceType":"NEWS","sentiment":"POSITIVE","importance":"HIGH"}],"nextCursor":null}}`,
  },
  {
    group: 'Intelligence', method: 'GET', path: '/api/v1/alerts/events/{alertId}', title: '뉴스·공시 이벤트 상세', titleEn: 'Alert event detail',
    description: '저장된 뉴스·공시 이벤트의 원문·번역·분류·신뢰도와 타깃 정보를 조회합니다.', descriptionEn: 'Returns stored alert source, translation, classification, confidence, and targeting fields.',
    fields: [{ name: 'alertId', location: 'path', type: 'string', required: true, description: '이벤트 ID, 최대 80자', descriptionEn: 'Alert ID, up to 80 characters' }],
    response: `{"success":true,"status":200,"data":{"alertId":"ALERT-...","stockCode":"005930","sourceType":"DISCLOSURE","summaryLines":{"what":"...","why":"...","impact":"..."},"holderTarget":true,"watchlistTarget":true}}`,
  },
  {
    group: 'AI', method: 'POST', path: '/api/v1/korean-financial-terms/explain', title: '한국 금융 용어 해설', titleEn: 'Korean financial term explanation',
    description: '뉴스·공시 문맥에서 한국 금융 용어의 영문 표기와 해설을 생성하고 클릭 통계를 기록합니다.', descriptionEn: 'Explains a Korean financial term in context and records explanation analytics.',
    fields: [
      { name: 'term', location: 'body', type: 'string', required: true, description: '해설할 용어, 최대 80자', descriptionEn: 'Term to explain, up to 80 characters' },
      { name: 'locale', location: 'body', type: 'en', description: '응답 언어, 기본값 en', descriptionEn: 'Response locale; defaults to en' },
      { name: 'sourceType', location: 'body', type: 'NEWS | DISCLOSURE', description: '문맥 출처, 기본값 NEWS', descriptionEn: 'Context source; defaults to NEWS' },
      { name: 'context', location: 'body', type: 'string', description: '용어가 포함된 문맥, 최대 4,000자', descriptionEn: 'Surrounding context, up to 4,000 characters' },
      { name: 'stockCode', location: 'body', type: 'string', description: '연관 6자리 종목 코드', descriptionEn: 'Related six-digit stock code' },
    ],
    requestBody: `{"term":"개미","locale":"en","sourceType":"NEWS","context":"개미 순매수가 지속됐다.","stockCode":"005930"}`,
    response: `{"success":true,"status":200,"data":{"term":"개미","label":"Ant","locale":"en"}}`,
  },
  {
    group: 'Tax OCR', method: 'POST', path: '/api/v1/tax/documents/verify', title: '세무 문서 검증', titleEn: 'Tax-document verification',
    description: '거주자 증명서·아포스티유·제한세율 적용신청서의 형식, 필수 필드, 일관성과 위변조 위험을 검증합니다.', descriptionEn: 'Validates format, required fields, consistency, and fraud risk for the three tax documents.',
    fields: [
      { name: 'documentType', location: 'body', type: 'string', required: true, description: '검증할 문서 유형', descriptionEn: 'Document type to verify' },
      { name: 'fileName', location: 'body', type: 'string', required: true, description: '마스킹된 파일명, 최대 180자', descriptionEn: 'Masked file name, up to 180 characters' },
      { name: 'documentContentBase64', location: 'body', type: 'string', description: '문서 바이너리의 Base64 인코딩', descriptionEn: 'Base64-encoded document bytes' },
      { name: 'contentType', location: 'body', type: 'string', description: '실제 MIME 유형', descriptionEn: 'Detected MIME type' },
      { name: 'expectedResidencyCountry', location: 'body', type: 'ISO 3166-1 alpha-2', description: '기대 거주지 국가', descriptionEn: 'Expected residency country' },
    ],
    requestBody: `{"documentType":"RESIDENCE_CERTIFICATE","fileName":"resident-***.pdf","documentContentBase64":"<BASE64_DOCUMENT>","contentType":"application/pdf","expectedResidencyCountry":"US"}`,
    response: `{"success":true,"status":200,"data":{"verificationStatus":"PENDING","ocrConfidence":0.93,"fraudRiskScore":0.08,"riskLevel":"LOW","manualReviewRequired":true,"missingRequiredFields":[],"documentModelVersion":"<MODEL_VERSION>"}}`,
  },
  {
    group: 'Tax OCR', method: 'POST', path: '/api/v1/tax/refund-cases/sync', title: '세무 환급 케이스 동기화', titleEn: 'Sync tax refund case',
    description: '현지 증권사에서 신청한 세무 환급 케이스와 검증 완료 문서 스냅샷을 OmniLens 백오피스로 동기화합니다.', descriptionEn: 'Synchronizes a partner tax-refund case and verified-document snapshots to the OmniLens back office.',
    fields: [
      { name: 'caseId', location: 'body', type: 'string', required: true, description: '파트너 케이스 ID', descriptionEn: 'Partner case ID' },
      { name: 'accountId', location: 'body', type: 'string', required: true, description: '파트너 계좌 ID', descriptionEn: 'Partner account ID' },
      { name: 'taxYear', location: 'body', type: 'integer', required: true, description: '과세 연도', descriptionEn: 'Tax year' },
      { name: 'treatyCountry', location: 'body', type: 'ISO 3166-1 alpha-2', required: true, description: '조세조약 국가', descriptionEn: 'Treaty country' },
      { name: 'verifiedDocuments', location: 'body', type: 'object[]', required: true, description: '검증 완료 문서 스냅샷', descriptionEn: 'Verified-document snapshots' },
      { name: 'requestedAt', location: 'body', type: 'ISO-8601 instant', required: true, description: '신청 시각', descriptionEn: 'Request timestamp' },
    ],
    requestBody: `{"caseId":"TAX-...","accountId":"ACC-...","userId":"USER-...","taxYear":2025,"treatyCountry":"US","estimatedRefundUsd":"120.50","advancePaymentRequested":false,"advancePaymentEligible":false,"matchedTradeIds":[],"verifiedDocuments":[],"requestedAt":"2026-07-12T00:00:00Z"}`,
    response: `{"success":true,"status":200,"data":{"caseId":"TAX-...","status":"SYNCED","syncedAt":"2026-07-12T00:00:01Z","source":"STOCK_EXCHANGE"}}`,
  },
  {
    group: 'WebSocket', method: 'WS', path: '/ws/market/quotes', title: '실시간 종목 체결 시세', titleEn: 'Realtime stock quote stream',
    description: 'KIS 실시간 체결 틱을 MarketQuote JSON으로 전달합니다. 연결 후 replay 또는 종목 구독 프레임을 전송할 수 있습니다.', descriptionEn: 'Streams KIS trade ticks as MarketQuote JSON and accepts replay or stock-subscription frames.',
    fields: [
      { name: 'type', location: 'body', type: 'QUOTE_STREAM_REPLAY | QUOTE_STREAM_SUBSCRIBE', required: true, description: '클라이언트 프레임 유형', descriptionEn: 'Client frame type' },
      { name: 'currency', location: 'body', type: 'ISO 4217', description: 'replay 환산 통화, 기본값 USD', descriptionEn: 'Replay currency; defaults to USD' },
      { name: 'stockCodes', location: 'body', type: 'string[]', description: 'SUBSCRIBE 대상 6자리 종목 코드', descriptionEn: 'Six-digit stock codes for SUBSCRIBE' },
    ],
    requestBody: `{"type":"QUOTE_STREAM_SUBSCRIBE","currency":"USD","stockCodes":["005930","000660"]}`,
    response: `{"stockCode":"005930","currentPriceKrw":75000,"changeRate":0.8,"localCurrency":"USD","marketDataTime":"2026-07-12T00:00:00Z","source":"KIS_REALTIME"}`,
    protocol: 'RAW_JSON',
  },
  {
    group: 'WebSocket', method: 'WS', path: '/ws/market/indices', title: '실시간 시장 지수', titleEn: 'Realtime market index stream',
    description: 'KOSPI·KOSDAQ·KOSPI 200 지수 틱을 JSON으로 전달하며 현재 스냅샷 replay를 지원합니다.', descriptionEn: 'Streams KOSPI, KOSDAQ, and KOSPI 200 ticks and supports current-snapshot replay.',
    fields: [{ name: 'type', location: 'body', type: 'INDEX_STREAM_REPLAY', required: true, description: '현재 지수 replay 요청', descriptionEn: 'Current index replay request' }],
    requestBody: `{"type":"INDEX_STREAM_REPLAY"}`,
    response: `{"indexCode":"0001","indexName":"KOSPI","currentValue":3200.15,"changeRate":0.83,"marketDataTime":"2026-07-12T00:00:00Z","source":"KIS_REALTIME"}`,
    protocol: 'RAW_JSON',
  },
  {
    group: 'WebSocket', method: 'WS', path: '/ws/alerts', title: '파트너 뉴스·공시 STOMP 구독', titleEn: 'Partner alert STOMP stream',
    description: '인증된 파트너 전용 STOMP topic으로 보유·관심종목 뉴스·공시를 구독합니다.', descriptionEn: 'Subscribes to portfolio and watchlist alerts through partner-scoped STOMP topics.',
    fields: [
      { name: 'destination', location: 'body', type: '/topic/partners/{partnerId}/alerts', required: true, description: '파트너 전체 이벤트 topic', descriptionEn: 'Partner-wide event topic' },
      { name: 'destination', location: 'body', type: '/topic/partners/{partnerId}/stocks/{stockCode}/alerts', description: '파트너 종목별 이벤트 topic', descriptionEn: 'Partner stock-specific event topic' },
    ],
    requestBody: `CONNECT\naccept-version:1.2\nhost:api.hana-omnilens.example.com\n\n\u0000\nSUBSCRIBE\nid:alerts-0\ndestination:/topic/partners/demo-partner/alerts\nack:auto\n\n\u0000`,
    response: `{"eventId":"ALERT-...","sourceType":"NEWS","stockCode":"005930","sentiment":"POSITIVE","importance":"HIGH","watchlistTarget":true,"holderTarget":false,"publishedAt":"2026-07-12T00:00:00Z"}`,
    protocol: 'STOMP',
  },
  {
    group: 'WebSocket', method: 'WS', path: '/ws/alerts/events', title: '실시간 뉴스·공시 이벤트', titleEn: 'Real-time news and disclosure events',
    description: '분석·저장된 뉴스·공시 이벤트를 raw WebSocket JSON 프레임으로 전달합니다.', descriptionEn: 'Streams analyzed and stored news and disclosure events as raw WebSocket JSON frames.', fields: [],
    response: `{"eventId":"ALERT-...","sourceType":"DISCLOSURE","stockCode":"005930","sentiment":"NEUTRAL","importance":"HIGH","watchlistTarget":true,"holderTarget":true,"publishedAt":"2026-07-12T00:00:00Z"}`,
    protocol: 'RAW_JSON',
  },
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
  const [menuOpen, setMenuOpen] = useState(false)
  const scrollTo = (id: string) => { setMenuOpen(false); navigate('home'); window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0) }
  return <header className="topbar"><Wordmark onClick={() => navigate('home')}/><button className="menu-toggle" aria-label={locale === 'ko' ? '메뉴 열기' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><span/><span/><span/></button><nav className={menuOpen ? 'open' : ''}><button onClick={() => scrollTo('capabilities')}>{t.nav[0]}</button><button onClick={() => scrollTo('use-cases')}>{t.nav[1]}</button><button onClick={() => scrollTo('ai-model')}>{t.nav[2]}</button><button onClick={() => { setMenuOpen(false); navigate('docs') }}>{t.docs}</button></nav><div className="header-actions"><button className="admin-link" onClick={() => navigate('admin')}>{locale === 'ko' ? '관리자 백오피스' : 'Admin'}</button><div className="language-switch" aria-label="Language"><button className={locale === 'ko' ? 'active' : ''} onClick={() => onLocale('ko')}>KO</button><button className={locale === 'en' ? 'active' : ''} onClick={() => onLocale('en')}>EN</button></div><button className="login-button" onClick={() => navigate(session ? (session.user.role === 'ADMIN' ? 'admin' : 'portal') : 'auth')}>{session ? session.user.name : t.login}</button></div></header>
}

function Wordmark({ onClick, inverse = false }: { onClick: () => void; inverse?: boolean }) { return <button className={`wordmark${inverse ? ' inverse' : ''}`} onClick={onClick} aria-label="Hana OmniLens API 홈"><span>Hana</span><b>OmniLens</b><i>API</i></button> }

function Home({ locale, onLocale, navigate, session }: { locale: Locale; onLocale: (locale: Locale) => void; navigate: (route: Route) => void; session: Session | null }) {
  const t = copy[locale]
  return <div className="site-shell"><Header locale={locale} onLocale={onLocale} navigate={navigate} session={session}/><main>
    <section className="hero"><div className="orb orb-one"/><div className="orb orb-two"/><div className="hero-copy"><p className="eyebrow">{t.heroTag}</p><h1>{t.hero.split('\n').map((line) => <span key={line}>{line}<br/></span>)}<em>{t.accent}</em></h1><p>{t.intro}</p><div className="actions"><button className="primary" onClick={() => navigate(session ? 'portal' : 'auth')}>{t.start}<span>→</span></button><button className="secondary" onClick={() => navigate('docs')}>{t.explore}</button></div><div className="trust-line"><span className="pulse-dot"/>{t.trust}</div></div><div className="hero-visual"><div className="data-ring ring-one"/><div className="data-ring ring-two"/><img className="hero-logo logo-on-light" src="/brand/hana-omnilens-api.png" alt="Hana OmniLens API"/><div className="floating-card card-market"><span>PARTNER API</span><b>REST</b><small>Request / Response</small></div><div className="floating-card card-signal"><span>LIVE STREAM</span><b>WEBSOCKET</b><small>Real-time events</small></div></div></section>
    <Ticker/>
    <section id="capabilities" className="section"><p className="eyebrow">API CAPABILITIES</p><div className="section-head"><h2>{t.capabilities}</h2><p>{t.capabilityIntro}</p></div><div className="capability-grid"><Capability number="01" title={locale === 'ko' ? '실시간 시장 데이터' : 'Live market data'} body={locale === 'ko' ? '시세, 지수, 호가와 매매 제한을 일관된 계약으로 제공합니다.' : 'Quotes, indices, order books, and trading restrictions through one contract.'}/><Capability number="02" title={locale === 'ko' ? '뉴스·공시 인텔리전스' : 'News & disclosures'} body={locale === 'ko' ? '번역 전문, 감성, 중요도와 AI 분석을 함께 제공합니다.' : 'Translated full text, sentiment, materiality, and AI analysis.'}/><Capability number="03" title={locale === 'ko' ? '글로벌 세무 OCR' : 'Global tax OCR'} body={locale === 'ko' ? '3종 세무 서류의 OCR·위변조 위험·필수값을 검증합니다.' : 'OCR and risk validation for three essential tax documents.'}/><Capability number="04" title={locale === 'ko' ? '고유어·실시간 알림' : 'Terms & live alerts'} body={locale === 'ko' ? '문맥 설명과 보유·관심종목 이벤트를 실시간 전달합니다.' : 'Contextual term guidance and portfolio-aware real-time alerts.'}/></div></section>
    <ProductStory locale={locale} title={t.cases} intro={t.casesIntro}/>
    <section id="ai-model" className="ai-section"><div className="ai-logo-wrap"><div className="ai-glow"/><img className="logo-on-light" src="/brand/hana-montana.png" alt="Hana Montana AI model"/></div><div><p className="eyebrow">FINANCIAL AI MODEL</p><h2>{t.aiTitle}</h2><p>{t.aiBody}</p><div className="model-pills"><span>Context Translation</span><span>Tax OCR</span><span>Sentiment</span><span>Fraud Risk</span></div></div></section>
    <ModelPerformance locale={locale}/>
    <section className="cta"><Wordmark onClick={() => navigate('home')} inverse/><div><p className="eyebrow">BUILD WITH HANA</p><h2>{locale === 'ko' ? '한국 금융 인텔리전스를 서비스에 연결하세요.' : 'Connect Korean financial intelligence to your product.'}</h2></div><button className="primary light" onClick={() => navigate('auth')}>{t.start} →</button></section>
  </main><Footer locale={locale}/></div>
}

function Capability({ number, title, body }: { number: string; title: string; body: string }) { return <article className="capability"><span>{number}</span><h3>{title}</h3><p>{body}</p></article> }
function Ticker() {
  const items = ['LIVE MARKET DATA', 'K-NEWS INTELLIGENCE', 'DISCLOSURES', 'TAX OCR', 'CONTEXTUAL TERMS', 'REAL-TIME ALERTS']
  const group = (hidden = false) => <div className="ticker-group" aria-hidden={hidden || undefined}>{items.map((item) => <span key={item}>{item}<b>·</b></span>)}</div>
  return <div className="ticker" aria-label={items.join(', ')}><div className="ticker-track">{group()}{group(true)}</div></div>
}
function Showcase({ image, tag, title }: { image: string; tag: string; title: string }) { return <article className="showcase-card"><div className="screen-wrap"><img src={image} alt={title}/><div className="screen-shine"/></div><span>{tag}</span><h3>{title}</h3></article> }

function ProductStory({ locale, title, intro }: { locale: Locale; title: string; intro: string }) {
  const [active, setActive] = useState(0)
  useEffect(() => { const elements = [...document.querySelectorAll<HTMLElement>('[data-story-step]')]; const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.storyStep)) }), { rootMargin: '-38% 0px -38% 0px' }); elements.forEach((element) => observer.observe(element)); return () => observer.disconnect() }, [])
  const stories = locale === 'ko' ? [
    { tag: '핵심 기능 01', title: '한국 증시 인텔리전스', body: '신규 뉴스·공시가 발생하면 수집·분석 파이프라인을 거쳐 현지 증권사에 REST와 WebSocket으로 전달합니다.', detail: '보유·관심종목 이벤트를 실시간으로 연결해 해외 MTS 피드와 알림에 활용합니다.', points: ['금융 특화 NLP 기반 뉴스·공시 감성과 중요도 분류', '로컬 LLM 기반 번역과 What·Why·Impact 요약', 'RAG 기반 한국 증시 고유어 원클릭 해설', '섹터·산업·기업 매칭과 글로벌 피어 기업 매칭'], image: '/showcase/exchange-market.png', focus: 'focus-news' },
    { tag: '핵심 기능 02', title: '실시간 종목 스크리너', body: '시계열 ML 예측 모델이 외국인 보유 제한 32개 종목의 장중 외국인 지분율 예상치를 제공합니다.', detail: '실시간 환율 적용 시세를 WebSocket으로 제공하고 호가 틱·VI·가격 제한·거래정지·외국인 한도를 주문 전 필터링 신호로 반환합니다.', points: ['KIS·KRX 기반 현재가, 지수, 호가, 일봉·분봉 조회', '요청 통화 환산 시세와 실시간 quote replay', '제한 신호와 출처·계산 버전을 포함한 주문 가능 여부'], image: '/showcase/exchange-quotes.png', focus: 'focus-quotes' },
    { tag: '핵심 기능 03', title: '글로벌 세무 처리 자동화', body: '배당소득 제한세율 적용에 필요한 거주자 증명서, 아포스티유, 제한세율 적용신청서를 OCR 기반으로 검증합니다.', detail: '문서 유형·필수 필드·국가·문서 간 일관성·위변조 위험을 확인하고 검토 상태와 근거를 반환합니다.', points: ['파일 형식·크기·magic byte·MIME 일치 검사', '문서별 OCR parser·reviewer와 누락 필드 탐지', 'VERIFIED·REVIEW_REQUIRED·REJECTED 상태와 model version 제공'], image: '/showcase/exchange-tax.png', focus: 'focus-tax' },
  ] : [
    { tag: 'CORE 01', title: 'Korean market intelligence', body: 'New news and disclosures flow through collection and analysis, then reach partner brokerages over REST and WebSocket.', detail: 'Portfolio and watchlist events power live overseas MTS feeds and alerts.', points: ['Financial NLP for sentiment and materiality', 'Local-LLM translation and What·Why·Impact summaries', 'RAG explanations for Korean market terminology', 'Sector, industry, company, and global-peer matching'], image: '/showcase/exchange-market.png', focus: 'focus-news' },
    { tag: 'CORE 02', title: 'Real-time stock screener', body: 'A time-series ML model estimates intraday foreign ownership for 32 foreign-limit stocks.', detail: 'WebSocket FX-adjusted quotes and order-book-tick restrictions support pre-trade screening.', points: ['KIS and KRX quotes, indices, order books, and charts', 'Currency-converted quote replay', 'Sourced VI, price-limit, suspension, and foreign-limit signals'], image: '/showcase/exchange-quotes.png', focus: 'focus-quotes' },
    { tag: 'CORE 03', title: 'Global tax automation', body: 'OCR validation covers residence certificates, apostilles, and reduced withholding applications.', detail: 'Format, required fields, cross-document consistency, and fraud risk are returned with review evidence.', points: ['File type, size, magic-byte, and MIME validation', 'Document-specific OCR parsers and reviewers', 'VERIFIED, REVIEW_REQUIRED, or REJECTED with model version'], image: '/showcase/exchange-tax.png', focus: 'focus-tax' },
  ]
  return <section id="use-cases" className="product-story"><div className="story-heading"><p className="eyebrow">LIVE IMPLEMENTATION</p><h2>{title}</h2><p>{intro}</p></div><div className="story-layout"><div className="story-copy">{stories.map((story, index) => <article key={story.tag} data-story-step={index} className={active === index ? 'active' : ''}><span>{story.tag}</span><h3>{story.title}</h3><p>{story.body}</p><ul>{story.points.map((point) => <li key={point}>{point}</li>)}</ul><small>{story.detail}</small></article>)}</div><div className="story-stage"><div className="device-frame">{stories.map((story, index) => <div className={`story-screen ${story.focus}${active === index ? ' active' : ''}`} key={story.tag}><img src={story.image} alt={story.title}/><span className="focus-ring"/><div className="story-caption"><b>{story.tag}</b><span>{story.detail}</span></div></div>)}</div><div className="story-progress">{stories.map((story, index) => <span className={active === index ? 'active' : ''} key={story.tag}/>)}</div></div></div></section>
}

function ModelPerformance({ locale }: { locale: Locale }) {
  type Metric = { label: string; value: number; display: string; scale?: number }
  type Benchmark = { name: string; mape: number; mae: string; rmse: string; hana?: boolean }
  type Feature = { title: string; model: string; description: string; metrics?: Metric[]; benchmarks?: Benchmark[] }
  const foreignBenchmarks: Benchmark[] = [
    { name: 'Hana Montana', mape: 4.4908, mae: '51,539.19', rmse: '147,477.74', hana: true },
    { name: 'N-HiTS', mape: 4.6955, mae: '52,863.38', rmse: '150,345.74' },
    { name: 'Persistence', mape: 4.6983, mae: '53,912.99', rmse: '152,521.80' },
    { name: 'PatchTST', mape: 4.9739, mae: '54,521.01', rmse: '154,153.91' },
  ]
  const foreignOwnershipImprovement = (() => {
    const hanaMape = foreignBenchmarks.find((item) => item.hana)!.mape
    const improvements = foreignBenchmarks
      .filter((item) => !item.hana)
      .map((item) => (item.mape - hanaMape) / item.mape * 100)
    return `${Math.min(...improvements).toFixed(2)}%~${Math.max(...improvements).toFixed(2)}%`
  })()
  const features = locale === 'ko' ? [
    { title: '뉴스·공시 감성·중요도 분류', model: 'TF-IDF + One-vs-Rest Logistic Regression', description: '금융 특화 NLP로 이벤트, 감성, 중요도와 종목 연관성을 분류합니다.', metrics: [{ label: '이벤트 macro F1', value: 92.21, display: '0.9221' }, { label: '감성 정확도', value: 97.5, display: '97.50%' }, { label: '중요도 정확도', value: 96.25, display: '96.25%' }] },
    { title: '뉴스·공시 번역과 요약', model: 'Qwen3-4B GGUF Q4 + Grounded Rules', description: 'Qwen3 로컬 LLM이 원문 문단을 보존해 번역하고, 근거 기반 규칙이 What·Why·Impact 구조를 생성합니다.' },
    { title: '한국 증시 고유어 해설', model: 'INTERNAL_CONTEXT_RAG · k-finance-term-dictionary-v3', description: '검증 사전과 뉴스·공시 문맥을 결합해 영문 표기, 해설, 근거를 제공합니다.' },
    { title: '글로벌 피어 기업 매칭', model: 'Business Profile ML + TF-IDF/SVD Hybrid Ranker', description: '섹터·산업·사업 모델·재무 특성을 결합해 한국 종목과 비교할 글로벌 상장사를 추천합니다.' },
    { title: '외국인 보유수량 예측', model: 'Stock-routed Panel Time-series ML Ensemble', description: '전날까지의 외국인 보유수량 시계열로 다음 거래일 보유수량을 예측하고 한도소진율 boundary로 변환합니다.', benchmarks: foreignBenchmarks },
    { title: '세무 문서 OCR 검증', model: 'Tesseract kor+eng OCR + Document-specific Reviewer', description: '문서별 OCR·parser·reviewer가 필수 필드, 국가·문서 간 일관성, 위변조 위험을 검증합니다.' },
  ] : [
    { title: 'News and disclosure classification', model: 'TF-IDF + One-vs-Rest Logistic Regression', description: 'Financial NLP classifies events, sentiment, materiality, and stock relevance.', metrics: [{ label: 'Event macro F1', value: 92.21, display: '0.9221' }, { label: 'Sentiment accuracy', value: 97.5, display: '97.50%' }, { label: 'Materiality accuracy', value: 96.25, display: '96.25%' }] },
    { title: 'Translation and structured summaries', model: 'Qwen3-4B GGUF Q4 + Grounded Rules', description: 'Qwen3 preserves source paragraphs in translation, while grounded rules produce the What, Why, and Impact structure.' },
    { title: 'Korean market terminology', model: 'INTERNAL_CONTEXT_RAG · k-finance-term-dictionary-v3', description: 'A validated glossary and article context return English labels, explanations, and evidence.' },
    { title: 'Global peer matching', model: 'Business Profile ML + TF-IDF/SVD Hybrid Ranker', description: 'Sector, industry, business-model, and financial signals identify comparable global listed companies.' },
    { title: 'Foreign ownership forecast', model: 'Stock-routed Panel Time-series ML Ensemble', description: 'History through the prior trading day predicts next-day foreign-owned quantity and converts it into a foreign-limit exhaustion boundary.', benchmarks: foreignBenchmarks },
    { title: 'Tax-document OCR', model: 'Tesseract kor+eng OCR + Document-specific Reviewer', description: 'Document-specific OCR, parsers, and reviewers validate fields, consistency, and fraud risk.' },
  ]
  return <section className="performance-section"><div className="performance-head"><p className="eyebrow">HANA MONTANA AI</p><h2>{locale === 'ko' ? 'Hana Montana AI 세부 모델' : 'Hana Montana AI models'}</h2></div><div className="feature-grid">{(features as Feature[]).map((feature) => <article className={`feature-card${feature.benchmarks ? ' benchmark-card' : ''}`} key={feature.title}><h3>{feature.title}</h3><div className="model-name"><span>AI MODEL</span><strong>{feature.model}</strong></div><p>{feature.description}</p>{feature.metrics && <div className="metric-chart">{feature.metrics.map((metric) => <div className="metric-item" key={metric.label}><div><span>{metric.label}</span><b>{metric.display}</b></div><div className="metric-track" aria-label={`${metric.label} ${metric.display}`}><i style={{ width: `${Math.min(100, metric.value / (metric.scale ?? 100) * 100)}%` }}/></div></div>)}</div>}{feature.benchmarks && <div className="benchmark"><div className="benchmark-head"><div><b>{locale === 'ko' ? '동일 평가 범위 SOTA 계열 비교' : 'Same-scope SOTA-family comparison'}</b><span>{locale === 'ko' ? 'MAPE · 낮을수록 우수' : 'MAPE · lower is better'}</span></div><div className="benchmark-columns"><span>MAE</span><span>RMSE</span></div></div>{feature.benchmarks.map((item) => <div className={`benchmark-row${item.hana ? ' hana' : ''}`} key={item.name}><div className="benchmark-label"><strong>{item.name}</strong>{item.hana && <b>{locale === 'ko' ? '기준 모델' : 'Reference model'}</b>}</div><div className="benchmark-track" aria-label={`${item.name} MAPE comparison`}><i style={{ width: `${item.mape / 5.2 * 100}%` }}/></div><div className="benchmark-values"><span>{item.mae}</span><span>{item.rmse}</span></div></div>)}<p>{locale === 'ko' ? `Hana Montana은 MAPE 기준 비교 모델 대비 ${foreignOwnershipImprovement} 개선됐습니다. 외국인 보유 제한 32개 종목 중 0% 한도 3종목은 규칙 처리하며, ML 대상 29종목·동일 21,895개 walk-forward 표본으로 N-HiTS/PatchTST를 비교했습니다 (max_steps=20).` : `Hana Montana improves MAPE by ${foreignOwnershipImprovement} versus the compared models. Three zero-limit stocks are handled by rules; N-HiTS and PatchTST use the same 21,895 walk-forward samples across 29 ML-eligible stocks (max_steps=20).`}</p></div>}</article>)}</div></section>
}

function endpointUrl(endpoint: Endpoint): string {
  const samplePath = endpoint.path
    .replace('{stockCode}', '005930')
    .replace('{indexCode}', '0001')
    .replace('{partnerId}', 'demo-partner')
    .replace('{newsId}', 'NEWS-EXAMPLE')
    .replace('{alertId}', 'ALERT-EXAMPLE')
    .replace('{currency}', 'USD')
  if (endpoint.path.endsWith('/quotes')) return `${apiBaseUrl}${samplePath}?stockCodes=005930&currency=USD&limit=20`
  if (endpoint.path.endsWith('/stocks/search')) return `${apiBaseUrl}${samplePath}?query=삼성`
  if (endpoint.path.endsWith('/quote') || endpoint.path.endsWith('/detail')) return `${apiBaseUrl}${samplePath}?currency=USD`
  if (endpoint.path.endsWith('/orderability')) return `${apiBaseUrl}${samplePath}?side=BUY&quantity=10`
  if (endpoint.path.endsWith('/history')) return `${apiBaseUrl}${samplePath}?limit=365`
  if (endpoint.path.endsWith('/intraday')) return `${apiBaseUrl}${samplePath}?limit=390`
  if (endpoint.path.endsWith('/realtime-subscription')) return `${apiBaseUrl}${samplePath}?session=REGULAR`
  if (endpoint.path === '/api/v1/market/news') return `${apiBaseUrl}${samplePath}?limit=20`
  if (endpoint.path.endsWith('/news/trending')) return `${apiBaseUrl}${samplePath}?windowHours=24&limit=10`
  if (endpoint.path.endsWith('/stocks/{stockCode}/events')) return `${apiBaseUrl}${samplePath}?limit=20`
  return `${apiBaseUrl}${samplePath}`
}

function transportOf(endpoint: Endpoint): 'REST' | 'WS' {
  return endpoint.method === 'WS' ? 'WS' : 'REST'
}

function methodLabel(endpoint: Endpoint): string {
  if (endpoint.method !== 'WS') return endpoint.method
  return endpoint.protocol === 'STOMP' ? 'STOMP' : 'JSON'
}

function curlExample(endpoint: Endpoint): string {
  const url = endpointUrl(endpoint)
  if (endpoint.method === 'WS') {
    const wsUrl = url.replace(/^http/, 'ws')
    return [
      '# 인증된 WebSocket Upgrade 확인; 프레임 송수신은 Java 예시를 사용합니다.',
      'curl --http1.1 --include --no-buffer \\',
      `  --url '${wsUrl}' \\`,
      "  --header 'Connection: Upgrade' \\",
      "  --header 'Upgrade: websocket' \\",
      "  --header 'Sec-WebSocket-Version: 13' \\",
      "  --header 'Sec-WebSocket-Key: <RANDOM_BASE64_KEY>' \\",
      "  --header 'X-HANA-OMNILENS-API-KEY: <SERVER_API_KEY>'",
    ].join('\n')
  }
  const lines = [
    `curl --request ${endpoint.method} \\`,
    `  --url '${url}' \\`,
    "  --header 'Accept: application/json' \\",
    `  --header 'X-HANA-OMNILENS-API-KEY: <SERVER_API_KEY>'${endpoint.requestBody ? ' \\' : ''}`,
  ]
  if (endpoint.requestBody) lines.push("  --header 'Content-Type: application/json' \\", `  --data '${endpoint.requestBody}'`)
  return lines.join('\n')
}

function javaExample(endpoint: Endpoint): string {
  const url = endpointUrl(endpoint)
  if (endpoint.method === 'WS') {
    const sendFrame = endpoint.protocol === 'STOMP'
      ? `var connectFrame = "CONNECT\\naccept-version:1.2\\nhost:api.hana-omnilens.example.com\\n\\n\\0";
socket.sendText(connectFrame, true).join();
var subscribeFrame = "SUBSCRIBE\\nid:alerts-0\\ndestination:/topic/partners/demo-partner/alerts\\nack:auto\\n\\n\\0";
socket.sendText(subscribeFrame, true).join();`
      : endpoint.requestBody ? `socket.sendText("""
        ${endpoint.requestBody}
        """, true).join();` : ''
    return `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.WebSocket;
import java.util.concurrent.CompletionStage;

var client = HttpClient.newHttpClient();
var socket = client.newWebSocketBuilder()
    .header("X-HANA-OMNILENS-API-KEY", System.getenv("OMNILENS_API_KEY"))
    .buildAsync(URI.create("${url.replace(/^http/, 'ws')}"), new WebSocket.Listener() {
        @Override
        public CompletionStage<?> onText(WebSocket webSocket, CharSequence data, boolean last) {
            System.out.println(data);
            return WebSocket.Listener.super.onText(webSocket, data, last);
        }
    })
    .join();

${sendFrame}`
  }
  const body = endpoint.requestBody ? `HttpRequest.BodyPublishers.ofString("""
        ${endpoint.requestBody}
        """)` : 'HttpRequest.BodyPublishers.noBody()'
  return `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

var request = HttpRequest.newBuilder(URI.create("${url}"))
    .header("Accept", "application/json")
    .header("Content-Type", "application/json")
    .header("X-HANA-OMNILENS-API-KEY", System.getenv("OMNILENS_API_KEY"))
    .method("${endpoint.method}", ${body})
    .build();

var response = HttpClient.newHttpClient()
    .send(request, HttpResponse.BodyHandlers.ofString());

if (response.statusCode() / 100 != 2) {
    throw new IllegalStateException("OmniLens API error: " + response.statusCode());
}
System.out.println(response.body());`
}

function DocsPage({ locale, onLocale, onHome }: { locale: Locale; onLocale: (locale: Locale) => void; onHome: () => void }) {
  const [selected, setSelected] = useState(endpoints[0])
  const [query, setQuery] = useState('')
  const [codeTab, setCodeTab] = useState<'curl' | 'java'>('curl')
  const groups = [...new Set(endpoints.map((endpoint) => endpoint.group))]
  const normalizedQuery = query.trim().toLocaleLowerCase(locale === 'ko' ? 'ko-KR' : 'en-US')
  const filtered = endpoints.filter((endpoint) => !normalizedQuery || [endpoint.path, endpoint.group, endpoint.title, endpoint.titleEn, endpoint.description, endpoint.descriptionEn].some((value) => value.toLocaleLowerCase().includes(normalizedQuery)))

  return <div className="docs-shell">
    <header className="docs-header">
      <Wordmark onClick={onHome}/>
      <div className="docs-header-actions">
        <button className="docs-home" onClick={onHome}>{locale === 'ko' ? '홈' : 'Home'}</button>
        <span className="version">Partner API · REST + WS</span>
        <div className="language-switch">
          <button className={locale === 'ko' ? 'active' : ''} onClick={() => onLocale('ko')}>KO</button>
          <button className={locale === 'en' ? 'active' : ''} onClick={() => onLocale('en')}>EN</button>
        </div>
      </div>
    </header>
    <div className="docs-layout">
      <aside className="docs-sidebar">
        <label className="docs-search">
          <span aria-hidden="true">⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={locale === 'ko' ? 'API 검색' : 'Search APIs'} aria-label={locale === 'ko' ? 'API 검색' : 'Search APIs'}/>
        </label>
        {groups.map((group) => {
          const items = filtered.filter((endpoint) => endpoint.group === group)
          return items.length > 0 && <div className="docs-group" key={group}>
            <b>{group}</b>
            {items.map((endpoint) => <button className={selected.path === endpoint.path && selected.method === endpoint.method ? 'active' : ''} key={`${endpoint.method}-${endpoint.path}`} onClick={() => setSelected(endpoint)}>
              <span className={`transport-badge ${transportOf(endpoint).toLowerCase()}`}>{transportOf(endpoint)}</span>
              <span className={`method-badge ${endpoint.method.toLowerCase()}`}>{methodLabel(endpoint)}</span>
              <span className="endpoint-title">{locale === 'ko' ? endpoint.title : endpoint.titleEn}</span>
            </button>)}
          </div>
        })}
        {filtered.length === 0 && <p className="docs-empty">{locale === 'ko' ? '검색 결과가 없습니다.' : 'No APIs found.'}</p>}
      </aside>
      <main className="docs-content">
        <p className="breadcrumb">Hana OmniLens API / {selected.group}</p>
        <div className="docs-scope">{locale === 'ko' ? '현지 증권사 서버 연동용 계약 · 운영자 수집·발행·재처리·재학습 및 포털 내부 API 제외' : 'Contract for partner brokerage servers · excludes operator collection, publishing, reprocessing, training, and portal-internal APIs'}</div>
        <h1>{locale === 'ko' ? selected.title : selected.titleEn}</h1>
        <p className="docs-description">{locale === 'ko' ? selected.description : selected.descriptionEn}</p>
        <div className="endpoint-bar">
          <span className={`transport-badge ${transportOf(selected).toLowerCase()}`}>{transportOf(selected)}</span>
          <span className={`method-badge ${selected.method.toLowerCase()}`}>{methodLabel(selected)}</span>
          <code>{selected.path}</code>
        </div>
        <section className="docs-section">
          <h2>Authentication</h2>
          <p>{locale === 'ko'
            ? '발급받은 API 키를 현지 증권사 서버에만 보관하고 모든 REST 요청과 WebSocket Upgrade 요청의 인증 헤더로 전송합니다. 브라우저나 모바일 앱에 키를 내장하지 마세요.'
            : 'Store the issued API key only on the partner brokerage server and send it in the authentication header for every REST request and WebSocket Upgrade request. Never embed the key in a browser or mobile app.'}</p>
          <div className="parameter">
            <code>X-HANA-OMNILENS-API-KEY</code>
            <span>header · required</span>
          </div>
        </section>
        <section className="docs-section">
          <h2>Request</h2>
          {selected.fields.length === 0
            ? <p>{locale === 'ko' ? '추가 요청 파라미터가 없습니다.' : 'No additional request parameters.'}</p>
            : selected.fields.map((field, index) => <div className="parameter" key={`${field.location}-${field.name}-${index}`}>
              <code>{field.name}</code>
              <span>{field.location} · {field.type} · {field.required ? 'required' : 'optional'}</span>
              <p>{locale === 'ko' ? field.description : field.descriptionEn}</p>
            </div>)}
        </section>
      </main>
      <aside className="code-panel">
        <div className="code-tabs" role="tablist" aria-label="Code examples">
          <button className={codeTab === 'curl' ? 'active' : ''} onClick={() => setCodeTab('curl')} role="tab" aria-selected={codeTab === 'curl'}>cURL</button>
          <button className={codeTab === 'java' ? 'active' : ''} onClick={() => setCodeTab('java')} role="tab" aria-selected={codeTab === 'java'}>Java 17+</button>
        </div>
        <pre tabIndex={0}><code>{codeTab === 'curl' ? curlExample(selected) : javaExample(selected)}</code></pre>
        <h3>{selected.method === 'WS' ? 'Message' : 'Response'}</h3>
        <pre tabIndex={0}><code>{JSON.stringify(JSON.parse(selected.response), null, 2)}</code></pre>
      </aside>
    </div>
  </div>
}

function AuthPage({ locale, onLocale, onAuthenticated, onHome }: { locale: Locale; onLocale: (locale: Locale) => void; onAuthenticated: (session: Session) => void; onHome: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login'); const [message, setMessage] = useState(''); const [loading, setLoading] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setLoading(true); const form = new FormData(event.currentTarget); try { const body = mode === 'login' ? { username: form.get('username'), password: form.get('password') } : { username: form.get('username'), password: form.get('password'), name: form.get('name'), phoneNumber: form.get('phoneNumber') }; const next = await api<Session>(`/api/v1/portal/auth/${mode === 'login' ? 'login' : 'sign-up'}`, { method: 'POST', body: JSON.stringify(body) }); sessionStorage.setItem('hana-omnilens-session', JSON.stringify(next)); onAuthenticated(next) } catch (error) { setMessage(error instanceof Error ? error.message : 'Authentication failed') } finally { setLoading(false) } }
  return <div className="auth-page"><div className="auth-brand"><Wordmark onClick={onHome} inverse/><div className="auth-orbit"><img src="/brand/hana-montana.png" alt="Hana Montana"/></div><h1>{locale === 'ko' ? '파트너와 함께 만드는\n금융 인텔리전스' : 'Financial intelligence,\nbuilt with partners'}</h1></div><main className="auth-panel"><div className="auth-top"><button onClick={onHome}>← {locale === 'ko' ? '홈으로' : 'Home'}</button><div className="language-switch"><button className={locale === 'ko' ? 'active' : ''} onClick={() => onLocale('ko')}>KO</button><button className={locale === 'en' ? 'active' : ''} onClick={() => onLocale('en')}>EN</button></div></div><form onSubmit={submit}><p className="eyebrow">PARTNER PORTAL</p><h2>{mode === 'login' ? (locale === 'ko' ? '로그인' : 'Sign in') : (locale === 'ko' ? '회원가입' : 'Create account')}</h2><p>{locale === 'ko' ? 'API 키를 신청하고 파트너 서비스를 관리하세요.' : 'Request API keys and manage your partner service.'}</p><label>{locale === 'ko' ? '아이디' : 'Username'}<input name="username" minLength={4} autoComplete="username" required/></label><label>{locale === 'ko' ? '비밀번호' : 'Password'}<input name="password" type="password" minLength={10} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required/></label>{mode === 'signup' && <><label>{locale === 'ko' ? '이름' : 'Name'}<input name="name" required/></label><label>{locale === 'ko' ? '전화번호' : 'Phone number'}<input name="phoneNumber" required/></label></>}{message && <p className="form-error">{message}</p>}<button className="primary full" disabled={loading}>{loading ? '...' : mode === 'login' ? (locale === 'ko' ? '로그인' : 'Sign in') : (locale === 'ko' ? '회원가입' : 'Create account')}</button><button type="button" className="switch-auth" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage('') }}>{mode === 'login' ? (locale === 'ko' ? '처음이신가요? 회원가입' : 'New partner? Create account') : (locale === 'ko' ? '이미 계정이 있나요? 로그인' : 'Already registered? Sign in')}</button></form></main></div>
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

function ConsoleShell({ title, user, onHome, onSignOut, adminAction, children }: { title: string; user: User; onHome: () => void; onSignOut: () => void; adminAction?: () => void; children: React.ReactNode }) { return <div className="console-shell"><aside className="console-sidebar"><Wordmark onClick={onHome}/><p>{title}</p><nav><button className="active">대시보드</button><button>API 키 관리</button><button>사용량 분석</button>{adminAction && <button onClick={adminAction}>관리자 백오피스 →</button>}</nav><div className="sidebar-user"><b>{user.name}</b><span>{user.role}</span><button onClick={onSignOut}>로그아웃</button></div></aside><main className="console-main">{children}</main></div> }
function AccessGate({ title, body, onSignIn, onHome }: { title: string; body?: string; onSignIn: () => void; onHome: () => void }) { return <div className="access-gate"><Wordmark onClick={onHome}/><h1>{title}</h1><p>{body ?? '파트너 계정으로 로그인해 주세요.'}</p><div><button className="secondary" onClick={onHome}>홈으로</button><button className="primary" onClick={onSignIn}>로그인</button></div></div> }
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
function Footer({ locale }: { locale: Locale }) { return <footer><div className="footer-brands"><img src="/brand/hana-financial-group-ko-en.svg" alt="하나금융그룹 Hana Financial Group"/><img src="/brand/hana-securities-ko-en.svg" alt="하나증권 Hana Securities"/></div><p>{locale === 'ko' ? '해외 파트너를 위한 한국 금융 인텔리전스 API' : 'Korean financial intelligence for global partners'}</p><span>© 2026 하나 청년 금융인재 양성 프로젝트<br/>하모니팀</span></footer> }

createRoot(document.getElementById('root')!).render(<App />)
