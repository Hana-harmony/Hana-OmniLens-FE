import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import test from 'node:test'

const figmaScreens = [
  'core-01-alerts.png',
  'core-01-classification.png',
  'core-01-explanation.png',
  'core-01-global-peers.png',
  'core-02-ownership.png',
  'core-02-restrictions.png',
  'core-03-intake.png',
  'core-03-validation.png',
]

test('Omni-Connect 브랜드와 피그마 핵심 기능 화면을 사용한다', async () => {
  const source = await readFile('src/main.tsx', 'utf8')

  assert.match(source, /<b>Omni-Connect<\/b>/)
  assert.match(source, /\/brand\/hana-omni-connect-api\.png/)
  assert.doesNotMatch(source, /omni[ _-]?lens/i)

  await access('public/brand/hana-omni-connect-api.png')
  await Promise.all(
    figmaScreens.map((screen) => access(`public/showcase/omni-connect/${screen}`)),
  )
})
