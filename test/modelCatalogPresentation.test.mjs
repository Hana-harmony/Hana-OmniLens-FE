import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const mainSource = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8')
const styles = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8')

test('모델 카탈로그 영역과 수치 표시에 접근성 의미를 제공한다', () => {
  assert.match(mainSource, /aria-labelledby="model-catalog-title"/)
  assert.match(mainSource, /role="list"/)
  assert.match(mainSource, /role="listitem"/)
  assert.match(mainSource, /role="meter"/)
  assert.match(mainSource, /aria-valuemin=\{0\}/)
  assert.match(mainSource, /aria-valuemax=\{metric\.scale\}/)
  assert.match(mainSource, /aria-valuenow=\{metric\.value\}/)
  assert.match(mainSource, /aria-valuetext=\{metric\.display\[locale\]\}/)
})

test('모델 카드가 데스크톱·태블릿·모바일 그리드로 축소된다', () => {
  assert.match(styles, /\.feature-grid \{[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/)
  assert.match(styles, /@media \(max-width: 900px\)[\s\S]*\.feature-grid \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); \}/)
  assert.match(styles, /@media \(max-width: 600px\)[\s\S]*\.capability-grid, \.feature-grid \{ grid-template-columns: 1fr; \}/)
  assert.match(styles, /@media \(max-width: 600px\)[\s\S]*\.metric-card \{ grid-column: auto; \}/)
})
