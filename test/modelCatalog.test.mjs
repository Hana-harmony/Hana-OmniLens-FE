import assert from 'node:assert/strict'
import test from 'node:test'
import {
  HANA_MONTANA_AI_DISPLAY_NAME,
  K_FNSPID_V4_SCALE,
  metricFillPercent,
  MODEL_CATALOG,
  MODEL_OVERVIEW,
} from '../src/modelCatalog.ts'

const officialName = 'Hana Montana AI(KF-DeBERTa + K-FNSPID)'

function displayNumber(display) {
  const match = display.match(/[\d,]+/)
  assert.ok(match, `숫자 표시를 찾을 수 없습니다: ${display}`)
  return Number(match[0].replaceAll(',', ''))
}

function sourcesFor(task) {
  return MODEL_CATALOG
    .filter((entry) => entry.task === task)
    .map((entry) => entry.source)
    .sort()
}

test('공식 모델명을 모든 카드의 단일 정본으로 사용한다', () => {
  assert.equal(HANA_MONTANA_AI_DISPLAY_NAME, officialName)
  assert.equal(MODEL_OVERVIEW.title, officialName)
  assert.ok(MODEL_CATALOG.length > 0)
  for (const entry of MODEL_CATALOG) assert.equal(entry.productName, officialName)
})

test('뉴스와 공시 감성·중요도·시장영향을 출처별 카드로 분리한다', () => {
  assert.deepEqual(sourcesFor('SENTIMENT'), ['DISCLOSURE', 'NEWS'])
  assert.deepEqual(sourcesFor('SEMANTIC_IMPORTANCE'), ['DISCLOSURE', 'NEWS'])
  assert.deepEqual(sourcesFor('MARKET_IMPACT'), ['DISCLOSURE', 'NEWS'])
})

test('확정 전 성능을 수치로 재사용하지 않고 측정 중으로 표시한다', () => {
  const pendingEntries = MODEL_CATALOG.filter((entry) => entry.evidence.state === 'LOCKED_RESULT_PENDING')
  assert.ok(pendingEntries.length > 0)
  for (const entry of pendingEntries) {
    assert.equal(entry.evidence.state, 'LOCKED_RESULT_PENDING')
    assert.equal(entry.metrics, undefined)
    assert.match(entry.evidence.label.ko, /성능 측정 중/)
    assert.match(entry.evidence.label.en, /Performance measurement in progress/)
  }
})

test('감성 확증 결과와 미승격 판정을 출처별로 표시한다', () => {
  const news = MODEL_CATALOG.find((entry) => entry.id === 'news-sentiment')
  const disclosure = MODEL_CATALOG.find((entry) => entry.id === 'disclosure-sentiment')
  assert.ok(news)
  assert.ok(disclosure)
  assert.equal(news.evidence.state, 'CONFIRMATORY_NOT_PROMOTED')
  assert.equal(disclosure.evidence.state, 'CONFIRMATORY_NOT_PROMOTED')
  assert.deepEqual(news.metrics?.map((metric) => metric.display.ko), ['0.5530', '0.4937', '+12.02% (+5.94점)'])
  assert.deepEqual(disclosure.metrics?.map((metric) => metric.display.ko), ['0.6024', '0.6146', '-2.00% (-1.23점)'])
  assert.match(news.evidence.note.ko, /각 600건/)
  assert.match(disclosure.evidence.note.ko, /운영 모델은 유지/)
})

test('시장영향은 KR-FinBERT-SC 동일 조건 결과와 검정 상태를 출처별로 표시한다', () => {
  const news = MODEL_CATALOG.find((entry) => entry.id === 'news-market-impact')
  const disclosure = MODEL_CATALOG.find((entry) => entry.id === 'disclosure-market-impact')
  assert.ok(news)
  assert.ok(disclosure)
  assert.equal(news.evidence.state, 'CONFIRMED_COMPARATIVE_BENCHMARK')
  assert.equal(disclosure.evidence.state, 'CONFIRMED_COMPARATIVE_BENCHMARK')
  assert.deepEqual(news.metrics?.map((metric) => metric.display.ko), ['0.3745', '0.3506', '+6.82% (+0.0239점)'])
  assert.deepEqual(disclosure.metrics?.map((metric) => metric.display.ko), ['0.3216', '0.3131', '+2.72% (+0.0085점)'])
  assert.match(news.evidence.label.ko, /우위/)
  assert.match(disclosure.evidence.label.ko, /미확정/)
})

test('K-FNSPID v4 확정 규모의 value와 한·영 display 숫자가 일치한다', () => {
  const dataset = MODEL_CATALOG.find((entry) => entry.task === 'DATASET_SCALE')
  assert.ok(dataset)
  assert.equal(dataset.evidence.state, 'CONFIRMED_DATASET_SCALE')
  assert.ok(dataset.metrics)

  for (const metric of dataset.metrics) {
    assert.equal(displayNumber(metric.display.ko), metric.value)
    assert.equal(displayNumber(metric.display.en), metric.value)
    assert.equal(displayNumber(metric.display.ko), displayNumber(metric.display.en))
    assert.ok(metricFillPercent(metric) >= 0)
    assert.ok(metricFillPercent(metric) <= 100)
  }
})

test('K-FNSPID v4 소스별 문서 합계와 파일 규모가 확정값과 일치한다', () => {
  assert.equal(K_FNSPID_V4_SCALE.newsDocuments, 524_696)
  assert.equal(K_FNSPID_V4_SCALE.disclosureDocuments, 722_989)
  assert.equal(K_FNSPID_V4_SCALE.newsDocuments + K_FNSPID_V4_SCALE.disclosureDocuments, 1_247_685)
  assert.equal(K_FNSPID_V4_SCALE.totalDocuments, 1_247_685)
  assert.equal(K_FNSPID_V4_SCALE.dailyPriceRows, 10_691_998)
  assert.equal(K_FNSPID_V4_SCALE.disclosureOriginalTexts, 8_972)
  assert.equal(K_FNSPID_V4_SCALE.daptEligibleDocuments, 1_118_291)
  assert.equal(K_FNSPID_V4_SCALE.daptNonPaddingTokens, 62_468_526)
  assert.equal(K_FNSPID_V4_SCALE.sentimentTrainingGold, 1_794)
  assert.equal(K_FNSPID_V4_SCALE.sentimentDevelopmentGold, 895)
})

test('감성 카드가 통합 Gold 학습과 출처별 residual·평가 구조를 설명한다', () => {
  const news = MODEL_CATALOG.find((entry) => entry.id === 'news-sentiment')
  const disclosure = MODEL_CATALOG.find((entry) => entry.id === 'disclosure-sentiment')
  assert.ok(news)
  assert.ok(disclosure)
  assert.match(news.implementation, /DAPT/)
  assert.match(news.implementation, /NEWS residual/)
  assert.match(news.description.ko, /NEWS·DISCLOSURE 검수 학습 Gold 1,794건을 통합 학습/)
  assert.match(news.description.ko, /뉴스 성능은 별도로 평가/)
  assert.match(disclosure.implementation, /DISCLOSURE residual/)
  assert.match(disclosure.description.ko, /NEWS·DISCLOSURE 검수 학습 Gold 1,794건을 통합 학습/)
  assert.match(disclosure.description.ko, /공시 성능은 별도로 평가/)
})

test('카탈로그의 한·영 표시 필드를 동일 항목에서 함께 제공한다', () => {
  for (const entry of MODEL_CATALOG) {
    for (const field of [entry.title, entry.description, entry.evidence.label, entry.evidence.note]) {
      assert.ok(field.ko.trim().length > 0)
      assert.ok(field.en.trim().length > 0)
    }
  }
})
