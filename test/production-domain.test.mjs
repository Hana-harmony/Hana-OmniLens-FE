import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('production API domain matches the deployed OmniLens origin', async () => {
  const productionEnv = await readFile('.env.production', 'utf8')

  assert.match(
    productionEnv,
    /^VITE_OMNILENS_API_BASE_URL=https:\/\/api\.hanaomni\.cloud$/m,
  )
  assert.doesNotMatch(productionEnv, /hanaom(?:i|ni)lens\.cloud/)
})
