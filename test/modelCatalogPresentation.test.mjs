import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const mainSource = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8')
const styles = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8')

test('선택한 비교 성능 그래프와 외국인 지분율 벤치마크를 유지한다', () => {
  assert.match(mainSource, /<ModelPerformance locale=\{locale\}\/\>/)
  assert.doesNotMatch(mainSource, /function ModelCatalogPerformance/)
  for (const value of ['0.6183', '0.5707', '0.9252', '0.9135', '4.4908', '4.6955', '4.6983', '4.9739']) {
    assert.match(mainSource, new RegExp(value.replace('.', '\\.')))
  }
})

test('감성 비교 그래프는 seed 17 개발셋 수치와 KR-FinBERT-SC 기준선을 표시한다', () => {
  for (const value of ['0.6183', '0.5707', '0.9252', '0.9135', '+8.34% (+4.76점)', '+1.27% (+1.17점)']) {
    assert.ok(mainSource.includes(value), `seed 17 수치가 없습니다: ${value}`)
  }
  assert.match(mainSource, /Macro-F1 · 동일 개발셋 · seed 17/)
  assert.doesNotMatch(mainSource, /확증 완료 · 후보 미승격|뉴스 우위 확인 · 공시 우위 미확정/)
  assert.doesNotMatch(mainSource, /뉴스·공시 이벤트·종목 분류|공시 의미 중요도/)
  assert.match(mainSource, /title: '시장영향 중요도'/)
})

test('K-FNSPID 연구 설명은 하모니팀의 직접 구축과 논문 작성 상태를 밝힌다', () => {
  assert.match(mainSource, /하모니팀이 만든 한국 금융 빅데이터와 금융 특화 AI/)
  assert.match(mainSource, /하모니팀이 .*직접 연결하고/)
  assert.match(mainSource, /논문을 작성 중이며/)
})

test('CTA 본문은 세로 중앙 정렬하고 Omni-Connect를 한 줄로 유지한다', () => {
  assert.match(mainSource, /className="cta-copy"/)
  assert.match(styles, /\.cta-copy \{[^}]*align-self: stretch;[^}]*justify-content: center;/)
  assert.match(styles, /\.cta > \.wordmark \{[^}]*white-space: nowrap;/)
  assert.match(styles, /grid-template-columns: max-content minmax\(0, 1fr\) auto/)
})

test('모델 카드가 데스크톱·태블릿·모바일 그리드로 축소된다', () => {
  assert.match(styles, /\.feature-grid \{[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/)
  assert.match(styles, /@media \(max-width: 900px\)[\s\S]*\.feature-grid \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); \}/)
  assert.match(styles, /@media \(max-width: 600px\)[\s\S]*\.capability-grid, \.feature-grid \{ grid-template-columns: 1fr; \}/)
  assert.match(styles, /@media \(max-width: 600px\)[\s\S]*\.metric-card \{ grid-column: auto; \}/)
})
