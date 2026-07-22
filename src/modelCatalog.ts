export type ModelLocale = 'ko' | 'en'

export type ModelSource = 'NEWS' | 'DISCLOSURE' | 'NEWS_AND_DISCLOSURE' | 'NOT_APPLICABLE'

export type ModelTask =
  | 'DATASET_SCALE'
  | 'EVENT_AND_STOCK_RELEVANCE'
  | 'SENTIMENT'
  | 'SEMANTIC_IMPORTANCE'
  | 'MARKET_IMPACT'
  | 'TRANSLATION_AND_SUMMARY'
  | 'FINANCIAL_TERMINOLOGY'
  | 'GLOBAL_PEER_MATCHING'
  | 'FOREIGN_OWNERSHIP_FORECAST'
  | 'TAX_DOCUMENT_OCR'

export type EvidenceState =
  | 'CONFIRMED_DATASET_SCALE'
  | 'CONFIRMED_COMPARATIVE_BENCHMARK'
  | 'CONFIRMATORY_NOT_PROMOTED'
  | 'DIAGNOSTIC_BENCHMARK'
  | 'LOCKED_RESULT_PENDING'

export type LocalizedText = Readonly<Record<ModelLocale, string>>

export type CatalogMetric = Readonly<{
  id: string
  label: LocalizedText
  value: number
  display: LocalizedText
  scale: number
}>

export type ModelCatalogEntry = Readonly<{
  id: string
  task: ModelTask
  source: ModelSource
  productName: string
  implementation: string
  title: LocalizedText
  description: LocalizedText
  evidence: Readonly<{
    state: EvidenceState
    label: LocalizedText
    note: LocalizedText
  }>
  metrics?: readonly CatalogMetric[]
}>

export const HANA_MONTANA_AI_DISPLAY_NAME = 'Hana Montana AI(KF-DeBERTa + K-FNSPID)'

export const K_FNSPID_V4_SCALE = Object.freeze({
  newsDocuments: 524_696,
  disclosureDocuments: 722_989,
  totalDocuments: 1_247_685,
  dailyPriceRows: 10_691_998,
  disclosureOriginalTexts: 8_972,
  daptEligibleDocuments: 1_118_291,
  daptNonPaddingTokens: 62_468_526,
  sentimentTrainingGold: 1_794,
  sentimentDevelopmentGold: 895,
})

export const MODEL_OVERVIEW = Object.freeze({
  title: HANA_MONTANA_AI_DISPLAY_NAME,
  body: {
    ko: 'K-FNSPID v4로 domain-adaptive pretraining한 KF-DeBERTa와 공유·출처 residual 계층형 head를 사용하는 뉴스·공시 감성, 의미 중요도와 시장영향 파이프라인입니다. 뉴스와 공시 성능은 각각 측정해 표시합니다.',
    en: 'A news and disclosure pipeline using KF-DeBERTa domain-adapted on K-FNSPID v4 with shared and source-residual hierarchical heads, semantic materiality, and market impact. News and disclosure performance is measured and reported separately.',
  },
  pills: ['KF-DeBERTa DAPT', 'K-FNSPID v4', 'Receipt-bound Gold', 'Fail-closed validation'],
})

export const MODEL_SOURCE_LABELS: Readonly<Record<ModelSource, LocalizedText>> = Object.freeze({
  NEWS: { ko: '뉴스', en: 'News' },
  DISCLOSURE: { ko: '공시', en: 'Disclosure' },
  NEWS_AND_DISCLOSURE: { ko: '뉴스·공시 분리', en: 'News / disclosure isolated' },
  NOT_APPLICABLE: { ko: '출처 비적용', en: 'Source not applicable' },
})

const pendingEvidence = Object.freeze({
  state: 'LOCKED_RESULT_PENDING' as const,
  label: {
    ko: '성능 측정 중',
    en: 'Performance measurement in progress',
  },
  note: {
    ko: '동일한 평가 세트에서 비교 모델과 함께 측정한 확정 수치만 표시합니다.',
    en: 'Only confirmed scores measured alongside comparison models on the same evaluation set are displayed.',
  },
})

const confirmedDatasetEvidence = Object.freeze({
  state: 'CONFIRMED_DATASET_SCALE' as const,
  label: {
    ko: '확정 데이터 규모',
    en: 'Confirmed dataset scale',
  },
  note: {
    ko: '성능 지표가 아닌 K-FNSPID v4 파일 산출물의 확정 건수입니다.',
    en: 'These are confirmed K-FNSPID v4 file-artifact counts, not model-performance metrics.',
  },
})

const confirmatoryNotPromotedEvidence = Object.freeze({
  state: 'CONFIRMATORY_NOT_PROMOTED' as const,
  label: {
    ko: '확증 완료 · 후보 미승격',
    en: 'Confirmatory evaluation complete · candidate not promoted',
  },
  note: {
    ko: '잠금 뒤 NEWS·DISCLOSURE 각 600건을 단 1회 평가했습니다. 표본설계 가중 지표와 Holm gate를 통과하지 못해 운영 모델은 유지합니다.',
    en: 'Each source was evaluated once on 600 post-lock samples. The candidate did not pass the sampling-weighted and Holm gates, so the production model remains unchanged.',
  },
})

const confirmedNewsImpactEvidence = Object.freeze({
  state: 'CONFIRMED_COMPARATIVE_BENCHMARK' as const,
  label: {
    ko: '동일 조건 비교 우위',
    en: 'Confirmed same-condition superiority',
  },
  note: {
    ko: '동일 K-FNSPID 시간 Test의 거래일 군집 검정에서 KR-FinBERT-SC 대비 Macro-F1 우위를 확인했습니다.',
    en: 'Trading-day-clustered testing confirms a Macro-F1 advantage over KR-FinBERT-SC on the same K-FNSPID temporal test.',
  },
})

const unconfirmedDisclosureImpactEvidence = Object.freeze({
  state: 'CONFIRMED_COMPARATIVE_BENCHMARK' as const,
  label: {
    ko: '동일 조건 점수 비교 · 우위 미확정',
    en: 'Same-condition score comparison · superiority unconfirmed',
  },
  note: {
    ko: 'Macro-F1 점수는 KR-FinBERT-SC보다 높지만 거래일 군집 95% 신뢰구간이 0을 포함해 통계적 우위로 주장하지 않습니다.',
    en: 'Macro-F1 is higher than KR-FinBERT-SC, but the trading-day-clustered 95% confidence interval includes zero, so superiority is not claimed.',
  },
})

const newsImpactMetrics: readonly CatalogMetric[] = [
  {
    id: 'news-impact-hana-macro-f1',
    label: { ko: 'Hana Montana AI Macro-F1', en: 'Hana Montana AI Macro-F1' },
    value: 0.3745194720,
    display: { ko: '0.3745', en: '0.3745' },
    scale: 1,
  },
  {
    id: 'news-impact-kr-finbert-macro-f1',
    label: { ko: 'KR-FinBERT-SC Macro-F1', en: 'KR-FinBERT-SC Macro-F1' },
    value: 0.3506201461,
    display: { ko: '0.3506', en: '0.3506' },
    scale: 1,
  },
  {
    id: 'news-impact-relative-gain',
    label: { ko: '상대 향상률(점수 차이)', en: 'Relative gain (score difference)' },
    value: 6.8163014004,
    display: { ko: '+6.82% (+0.0239점)', en: '+6.82% (+0.0239)' },
    scale: 100,
  },
]

const disclosureImpactMetrics: readonly CatalogMetric[] = [
  {
    id: 'disclosure-impact-hana-macro-f1',
    label: { ko: 'Hana Montana AI Macro-F1', en: 'Hana Montana AI Macro-F1' },
    value: 0.3216394909,
    display: { ko: '0.3216', en: '0.3216' },
    scale: 1,
  },
  {
    id: 'disclosure-impact-kr-finbert-macro-f1',
    label: { ko: 'KR-FinBERT-SC Macro-F1', en: 'KR-FinBERT-SC Macro-F1' },
    value: 0.3131137368,
    display: { ko: '0.3131', en: '0.3131' },
    scale: 1,
  },
  {
    id: 'disclosure-impact-relative-gain',
    label: { ko: '상대 향상률(점수 차이)', en: 'Relative gain (score difference)' },
    value: 2.7228936495,
    display: { ko: '+2.72% (+0.0085점)', en: '+2.72% (+0.0085)' },
    scale: 100,
  },
]

const newsSentimentConfirmatoryMetrics: readonly CatalogMetric[] = [
  {
    id: 'news-sentiment-candidate-weighted-macro-f1',
    label: { ko: '후보 가중 Macro-F1', en: 'Candidate weighted Macro-F1' },
    value: 0.5530330480216619,
    display: { ko: '0.5530', en: '0.5530' },
    scale: 1,
  },
  {
    id: 'news-sentiment-raw-kr-finbert-weighted-macro-f1',
    label: { ko: '원본 금융 특화 기준모델', en: 'Raw finance-specialized reference' },
    value: 0.4936772419839708,
    display: { ko: '0.4937', en: '0.4937' },
    scale: 1,
  },
  {
    id: 'news-sentiment-relative-difference',
    label: { ko: '상대 차이(100점 환산)', en: 'Relative difference (100-point scale)' },
    value: 12.023200785832113,
    display: { ko: '+12.02% (+5.94점)', en: '+12.02% (+5.94 pts)' },
    scale: 100,
  },
]

const disclosureSentimentConfirmatoryMetrics: readonly CatalogMetric[] = [
  {
    id: 'disclosure-sentiment-candidate-weighted-macro-f1',
    label: { ko: '후보 가중 Macro-F1', en: 'Candidate weighted Macro-F1' },
    value: 0.6023636438636694,
    display: { ko: '0.6024', en: '0.6024' },
    scale: 1,
  },
  {
    id: 'disclosure-sentiment-raw-kr-finbert-weighted-macro-f1',
    label: { ko: '원본 금융 특화 기준모델', en: 'Raw finance-specialized reference' },
    value: 0.6146393032642109,
    display: { ko: '0.6146', en: '0.6146' },
    scale: 1,
  },
  {
    id: 'disclosure-sentiment-relative-difference',
    label: { ko: '상대 차이(100점 환산)', en: 'Relative difference (100-point scale)' },
    value: -1.9972135422105741,
    display: { ko: '-2.00% (-1.23점)', en: '-2.00% (-1.23 pts)' },
    scale: 100,
  },
]

const datasetMetrics: readonly CatalogMetric[] = [
  {
    id: 'news-documents',
    label: { ko: '뉴스 문서', en: 'News documents' },
    value: K_FNSPID_V4_SCALE.newsDocuments,
    display: { ko: '524,696건', en: '524,696 documents' },
    scale: K_FNSPID_V4_SCALE.totalDocuments,
  },
  {
    id: 'disclosure-documents',
    label: { ko: '공시 문서', en: 'Disclosure documents' },
    value: K_FNSPID_V4_SCALE.disclosureDocuments,
    display: { ko: '722,989건', en: '722,989 documents' },
    scale: K_FNSPID_V4_SCALE.totalDocuments,
  },
  {
    id: 'total-documents',
    label: { ko: '총 문서', en: 'Total documents' },
    value: K_FNSPID_V4_SCALE.totalDocuments,
    display: { ko: '1,247,685건', en: '1,247,685 documents' },
    scale: K_FNSPID_V4_SCALE.totalDocuments,
  },
  {
    id: 'daily-price-rows',
    label: { ko: '파일 기반 일별 시세', en: 'File-based daily-price rows' },
    value: K_FNSPID_V4_SCALE.dailyPriceRows,
    display: { ko: '10,691,998행', en: '10,691,998 rows' },
    scale: K_FNSPID_V4_SCALE.dailyPriceRows,
  },
  {
    id: 'disclosure-original-texts',
    label: { ko: '연결된 공시 실제 원문', en: 'Linked disclosure original texts' },
    value: K_FNSPID_V4_SCALE.disclosureOriginalTexts,
    display: { ko: '8,972건', en: '8,972 documents' },
    scale: K_FNSPID_V4_SCALE.disclosureDocuments,
  },
  {
    id: 'dapt-eligible-documents',
    label: { ko: 'DAPT 누수 제거 문서', en: 'Leakage-purged DAPT documents' },
    value: K_FNSPID_V4_SCALE.daptEligibleDocuments,
    display: { ko: '1,118,291건', en: '1,118,291 documents' },
    scale: K_FNSPID_V4_SCALE.totalDocuments,
  },
  {
    id: 'dapt-non-padding-tokens',
    label: { ko: 'DAPT non-padding 토큰', en: 'DAPT non-padding tokens' },
    value: K_FNSPID_V4_SCALE.daptNonPaddingTokens,
    display: { ko: '62,468,526개', en: '62,468,526 tokens' },
    scale: K_FNSPID_V4_SCALE.daptNonPaddingTokens,
  },
  {
    id: 'sentiment-training-gold',
    label: { ko: '감성 학습 Gold', en: 'Sentiment training Gold' },
    value: K_FNSPID_V4_SCALE.sentimentTrainingGold,
    display: { ko: '1,794건', en: '1,794 labels' },
    scale: K_FNSPID_V4_SCALE.sentimentTrainingGold,
  },
  {
    id: 'sentiment-development-gold',
    label: { ko: '감성 개발 Gold', en: 'Sentiment development Gold' },
    value: K_FNSPID_V4_SCALE.sentimentDevelopmentGold,
    display: { ko: '895건', en: '895 labels' },
    scale: K_FNSPID_V4_SCALE.sentimentTrainingGold,
  },
]

export const MODEL_CATALOG: readonly ModelCatalogEntry[] = [
  {
    id: 'k-fnspid-v4-dataset',
    task: 'DATASET_SCALE',
    source: 'NEWS_AND_DISCLOSURE',
    productName: HANA_MONTANA_AI_DISPLAY_NAME,
    implementation: 'K-FNSPID v4',
    title: { ko: 'K-FNSPID v4 데이터 규모', en: 'K-FNSPID v4 dataset scale' },
    description: {
      ko: '뉴스와 공시 문서, 파일 기반 일별 시세를 소스별로 분리한 학습·평가 자산입니다. 공시 실제 원문 연결 건수는 성능 정답 건수와 구분합니다.',
      en: 'Training and evaluation assets keep news, disclosures, and file-based daily prices source-separated. Linked disclosure original-text count is distinct from performance-label count.',
    },
    evidence: confirmedDatasetEvidence,
    metrics: datasetMetrics,
  },
  {
    id: 'event-stock-relevance',
    task: 'EVENT_AND_STOCK_RELEVANCE',
    source: 'NEWS_AND_DISCLOSURE',
    productName: HANA_MONTANA_AI_DISPLAY_NAME,
    implementation: 'Event / Stock Relevance Pipeline',
    title: { ko: '이벤트·종목 연관성', en: 'Event and stock relevance' },
    description: {
      ko: '입력 출처를 보존한 채 이벤트 태그와 대상 종목 연관성을 산출하며, 제공자 응답의 출처 불일치를 거부합니다.',
      en: 'Produces event tags and stock relevance while preserving input source, rejecting provider responses whose source does not match the request.',
    },
    evidence: pendingEvidence,
  },
  {
    id: 'news-sentiment',
    task: 'SENTIMENT',
    source: 'NEWS',
    productName: HANA_MONTANA_AI_DISPLAY_NAME,
    implementation: 'K-FNSPID DAPT KF-DeBERTa · shared + NEWS residual head',
    title: { ko: '뉴스 금융 감성', en: 'News financial sentiment' },
    description: {
      ko: '대상 종목을 조건화한 뉴스 문맥을 POSITIVE·NEUTRAL·NEGATIVE로 분류합니다. NEWS·DISCLOSURE 검수 학습 Gold 1,794건을 통합 학습하고 공유 head와 NEWS residual을 사용하며, 뉴스 성능은 별도로 평가합니다.',
      en: 'Classifies target-conditioned news as POSITIVE, NEUTRAL, or NEGATIVE. It jointly trains on 1,794 receipt-verified NEWS and DISCLOSURE Gold labels, uses the shared plus NEWS residual heads, and evaluates news performance separately.',
    },
    evidence: confirmatoryNotPromotedEvidence,
    metrics: newsSentimentConfirmatoryMetrics,
  },
  {
    id: 'disclosure-sentiment',
    task: 'SENTIMENT',
    source: 'DISCLOSURE',
    productName: HANA_MONTANA_AI_DISPLAY_NAME,
    implementation: 'K-FNSPID DAPT KF-DeBERTa · shared + DISCLOSURE residual head',
    title: { ko: '공시 금융 감성', en: 'Disclosure financial sentiment' },
    description: {
      ko: '대상 종목을 조건화한 공시 제목·원문 문맥을 분류합니다. NEWS·DISCLOSURE 검수 학습 Gold 1,794건을 통합 학습하고 공유 head와 DISCLOSURE residual을 사용하며, 공시 성능은 별도로 평가합니다.',
      en: 'Classifies target-conditioned disclosure titles and original-text context. It jointly trains on 1,794 receipt-verified NEWS and DISCLOSURE Gold labels, uses the shared plus DISCLOSURE residual heads, and evaluates disclosure performance separately.',
    },
    evidence: confirmatoryNotPromotedEvidence,
    metrics: disclosureSentimentConfirmatoryMetrics,
  },
  {
    id: 'news-semantic-importance',
    task: 'SEMANTIC_IMPORTANCE',
    source: 'NEWS',
    productName: HANA_MONTANA_AI_DISPLAY_NAME,
    implementation: 'KF-DeBERTa · NEWS semantic importance',
    title: { ko: '뉴스 의미 중요도', en: 'News semantic importance' },
    description: {
      ko: '뉴스 사건의 의미적 중요도를 LOW·MEDIUM·HIGH·CRITICAL로 분류하며 사후 가격반응과 독립적으로 제공합니다.',
      en: 'Classifies semantic news importance as LOW, MEDIUM, HIGH, or CRITICAL independently from ex-post market reaction.',
    },
    evidence: pendingEvidence,
  },
  {
    id: 'disclosure-semantic-importance',
    task: 'SEMANTIC_IMPORTANCE',
    source: 'DISCLOSURE',
    productName: HANA_MONTANA_AI_DISPLAY_NAME,
    implementation: 'KF-DeBERTa · DISCLOSURE semantic materiality',
    title: { ko: '공시 의미 중요도', en: 'Disclosure semantic materiality' },
    description: {
      ko: '공시 문맥의 의미 중요도를 분류하며 사후 주가로 생성한 시장영향 등급과 구분합니다.',
      en: 'Classifies semantic disclosure materiality separately from market-impact grades generated from ex-post price reaction.',
    },
    evidence: pendingEvidence,
  },
  {
    id: 'news-market-impact',
    task: 'MARKET_IMPACT',
    source: 'NEWS',
    productName: HANA_MONTANA_AI_DISPLAY_NAME,
    implementation: 'K-FNSPID v4 · NEWS source expert',
    title: { ko: '뉴스 시장영향', en: 'News market impact' },
    description: {
      ko: '국내 뉴스가 대상 종목의 단기 시장반응에 미치는 등급을 예측합니다. 동일 K-FNSPID 시간 Test에서 Macro-F1 0.3745로 KR-FinBERT-SC 0.3506보다 6.82%(0.0239점) 높았으며, 거래일 군집 검정으로 우위를 확인했습니다.',
      en: 'A news-only expert joining news with daily prices on temporal boundaries. It is not used for disclosure requests, and its score is neither investment return nor causal effect.',
    },
    evidence: confirmedNewsImpactEvidence,
    metrics: newsImpactMetrics,
  },
  {
    id: 'disclosure-market-impact',
    task: 'MARKET_IMPACT',
    source: 'DISCLOSURE',
    productName: HANA_MONTANA_AI_DISPLAY_NAME,
    implementation: 'K-FNSPID v4 · DISCLOSURE source expert',
    title: { ko: '공시 시장영향', en: 'Disclosure market impact' },
    description: {
      ko: '국내 공시가 대상 종목의 단기 시장반응에 미치는 등급을 예측합니다. 동일 K-FNSPID 시간 Test에서 Macro-F1 0.3216으로 KR-FinBERT-SC 0.3131보다 2.72%(0.0085점) 높지만, 거래일 군집 검정의 우위는 확인되지 않았습니다.',
      en: 'A disclosure-only expert joining disclosures with daily prices on temporal boundaries. It is not used for news requests and does not overwrite semantic materiality.',
    },
    evidence: unconfirmedDisclosureImpactEvidence,
    metrics: disclosureImpactMetrics,
  },
  {
    id: 'translation-summary',
    task: 'TRANSLATION_AND_SUMMARY',
    source: 'NEWS_AND_DISCLOSURE',
    productName: HANA_MONTANA_AI_DISPLAY_NAME,
    implementation: 'Qwen3-4B GGUF Q4 + Grounded Rules',
    title: { ko: '번역·What/Why/Impact 요약', en: 'Translation and What/Why/Impact summaries' },
    description: {
      ko: '원문 문단을 보존해 번역하고 근거 기반 What·Why·Impact 구조를 제공합니다.',
      en: 'Preserves source paragraphs during translation and provides grounded What, Why, and Impact structure.',
    },
    evidence: pendingEvidence,
  },
  {
    id: 'financial-terminology',
    task: 'FINANCIAL_TERMINOLOGY',
    source: 'NEWS_AND_DISCLOSURE',
    productName: HANA_MONTANA_AI_DISPLAY_NAME,
    implementation: 'INTERNAL_CONTEXT_RAG · k-finance-term-dictionary-v3',
    title: { ko: '한국 증시 고유어 해설', en: 'Korean market terminology' },
    description: {
      ko: '검증 사전과 문맥을 결합해 영문 표기·해설·근거를 제공합니다.',
      en: 'Combines a validated dictionary with source context to return English labels, explanations, and evidence.',
    },
    evidence: pendingEvidence,
  },
  {
    id: 'global-peer-matching',
    task: 'GLOBAL_PEER_MATCHING',
    source: 'NOT_APPLICABLE',
    productName: HANA_MONTANA_AI_DISPLAY_NAME,
    implementation: 'Business Profile ML + TF-IDF/SVD Hybrid Ranker',
    title: { ko: '글로벌 피어 기업 매칭', en: 'Global peer matching' },
    description: {
      ko: '섹터·산업·사업 모델·재무 특성을 결합해 비교 가능한 글로벌 상장사를 반환합니다.',
      en: 'Combines sector, industry, business-model, and financial characteristics to return comparable global listings.',
    },
    evidence: pendingEvidence,
  },
  {
    id: 'foreign-ownership-forecast',
    task: 'FOREIGN_OWNERSHIP_FORECAST',
    source: 'NOT_APPLICABLE',
    productName: HANA_MONTANA_AI_DISPLAY_NAME,
    implementation: 'Stock-routed Panel Time-series ML Ensemble',
    title: { ko: '외국인 보유수량 예측', en: 'Foreign ownership forecast' },
    description: {
      ko: '전날까지의 시계열로 다음 거래일 외국인 보유수량을 예측하고 한도소진율 경계로 변환합니다.',
      en: 'Uses history through the prior trading day to forecast next-day foreign-owned quantity and derive a foreign-limit boundary.',
    },
    evidence: pendingEvidence,
  },
  {
    id: 'tax-document-ocr',
    task: 'TAX_DOCUMENT_OCR',
    source: 'NOT_APPLICABLE',
    productName: HANA_MONTANA_AI_DISPLAY_NAME,
    implementation: 'Tesseract kor+eng OCR + Document-specific Reviewer',
    title: { ko: '세무 문서 OCR 검증', en: 'Tax-document OCR validation' },
    description: {
      ko: '문서별 OCR·parser·reviewer가 필수 필드, 국가·문서 간 일관성, 위변조 위험을 검증합니다.',
      en: 'Document-specific OCR, parsers, and reviewers validate required fields, cross-document consistency, and fraud risk.',
    },
    evidence: pendingEvidence,
  },
]

export function metricFillPercent(metric: CatalogMetric): number {
  if (!Number.isFinite(metric.value) || !Number.isFinite(metric.scale) || metric.scale <= 0) return 0
  return Math.max(0, Math.min(100, metric.value / metric.scale * 100))
}
