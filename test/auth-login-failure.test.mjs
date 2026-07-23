import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(new URL('../src/main.tsx', import.meta.url), 'utf8')

test('로그인 실패 401은 세션 만료 이벤트를 발생시키지 않고 사유를 표시한다', () => {
  assert.match(source, /if \(token\) signalUnauthorized\(response\)/)
  assert.match(source, /아이디 또는 비밀번호가 올바르지 않습니다\./)
  assert.match(source, /Invalid username or password\./)
})

