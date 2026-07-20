import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import test from 'node:test'

const figmaPhoneScreens = [
  'alerts-search.png', 'alerts-market.png', 'alerts-notifications.png',
  'sentiment-detail.png', 'sentiment-list.png', 'explanation-detail.png',
  'peers-stock.png', 'peers-compare.png', 'ownership-order.png', 'ownership-chart.png',
  'restrictions-order.png', 'restrictions-limit.png',
  'tax-intake-1.png', 'tax-intake-2.png', 'tax-intake-3.png', 'tax-intake-4.png',
  'tax-validation-1.png', 'tax-validation-2.png', 'tax-validation-3.png',
]

test('Omni-Connect 브랜드와 Figma 원본 아이폰 화면을 사용한다', async () => {
  const source = await readFile('src/main.tsx', 'utf8')
  const story = await readFile('src/product-story.tsx', 'utf8')

  assert.match(source, /<b>Omni-Connect<\/b>/)
  assert.match(source, /\/brand\/hana-omni-connect-api\.png/)
  assert.doesNotMatch(source, /omni[ _-]?lens/i)
  assert.match(story, /\/showcase\/omni-connect-phones\//)
  assert.doesNotMatch(story, /\/showcase\/omni-connect\/core-/)
  assert.match(story, /data-story-step/)
  assert.match(story, /story-stage/)
  assert.match(story, /관심 종목을 등록하면 실시간으로 연결됩니다/)
  assert.match(story, /OCR이 문서를 읽고 서로 맞는지 검증합니다/)

  await access('public/brand/hana-omni-connect-api.png')
  await Promise.all(figmaPhoneScreens.map((screen) => access(`public/showcase/omni-connect-phones/${screen}`)))
})
