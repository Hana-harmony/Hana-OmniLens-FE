import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('production API domain matches the deployed OmniConnect origin', async () => {
  const productionEnv = await readFile('.env.production', 'utf8')

  assert.match(
    productionEnv,
    /^VITE_OMNI_CONNECT_API_BASE_URL=https:\/\/api\.hanaomni\.cloud$/m,
  )
  assert.doesNotMatch(productionEnv, /hanaom(?:i|ni)lens\.cloud/)
})
