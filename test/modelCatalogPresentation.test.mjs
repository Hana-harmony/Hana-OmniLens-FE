import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const mainSource = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8')
const styles = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8')

test('기존 성능 그래프와 확정 수치를 유지한다', () => {
  assert.match(mainSource, /<ModelPerformance locale=\{locale\}\/\>/)
  assert.doesNotMatch(mainSource, /function ModelCatalogPerformance/)
  for (const value of ['0.9221', '0.8355', '0.9470', '0.9962', '4.4908', '4.6955', '4.6983', '4.9739']) {
    assert.match(mainSource, new RegExp(value.replace('.', '\\.')))
  }
  assert.match(mainSource, /aria-label=\{`\$\{metric\.label\} \$\{metric\.display\}`\}/)
})

test('감성 비교 그래프만 확증 수치와 미승격 판정으로 갱신한다', () => {
  for (const value of ['0.5530', '0.4937', '0.6024', '0.6146', '+12.02% (+5.94점)', '-2.00% (-1.23점)']) {
    assert.ok(mainSource.includes(value), `확증 수치가 없습니다: ${value}`)
  }
  assert.match(mainSource, /확증 완료 · 후보 미승격/)
  assert.doesNotMatch(mainSource, /신규 v6 확증 Test 결과 대기/)
})

test('모델 카드가 데스크톱·태블릿·모바일 그리드로 축소된다', () => {
  assert.match(styles, /\.feature-grid \{[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/)
  assert.match(styles, /@media \(max-width: 900px\)[\s\S]*\.feature-grid \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); \}/)
  assert.match(styles, /@media \(max-width: 600px\)[\s\S]*\.capability-grid, \.feature-grid \{ grid-template-columns: 1fr; \}/)
  assert.match(styles, /@media \(max-width: 600px\)[\s\S]*\.metric-card \{ grid-column: auto; \}/)
})
