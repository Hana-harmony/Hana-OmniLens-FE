import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('백오피스 GIF는 애니메이션 프레임을 포함한다', async () => {
  const gif = await readFile('public/showcase/omni-connect-phones/tax-backoffice.gif')
  assert.equal(gif.subarray(0, 6).toString('ascii'), 'GIF89a')
  let frameCount = 0
  for (const byte of gif) if (byte === 0x2c) frameCount += 1
  assert.ok(frameCount > 1, `애니메이션 프레임이 부족합니다: ${frameCount}`)
})
