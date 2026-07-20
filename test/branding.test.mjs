import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import test from 'node:test'

test('Omni-Connect 브랜드와 실제 UI 기반 핵심 기능 화면을 사용한다', async () => {
  const source = await readFile('src/main.tsx', 'utf8')
  const story = await readFile('src/product-story.tsx', 'utf8')

  assert.match(source, /<b>Omni-Connect<\/b>/)
  assert.match(source, /\/brand\/hana-omni-connect-api\.png/)
  assert.doesNotMatch(source, /omni[ _-]?lens/i)
  assert.doesNotMatch(story, /showcase\/omni-connect|\.png|figma/i)
  assert.match(story, /data-story-step/)
  assert.match(story, /story-stage/)
  assert.match(story, /관심 종목을 등록하면 실시간으로 연결됩니다/)
  assert.match(story, /OCR이 문서를 읽고 서로 맞는지 검증합니다/)

  await access('public/brand/hana-omni-connect-api.png')
})
