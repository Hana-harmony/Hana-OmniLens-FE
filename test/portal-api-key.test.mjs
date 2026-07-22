import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(new URL('../src/main.tsx', import.meta.url), 'utf8')

test('소유 회원은 현재 비밀번호 확인 후 API 키를 반복 조회할 수 있다', () => {
  assert.match(source, /api-key-applications\/\$\{id\}\/reveal/)
  assert.match(source, /JSON\.stringify\(\{ currentPassword \}\)/)
  assert.match(source, /횟수 제한 없이 다시 볼 수 있습니다/)
  assert.match(source, /API 키 확인/)
})

test('관리자 신청자 정보와 회원 파트너 ID를 구분한다', () => {
  assert.match(source, /admin \? '신청자' : '파트너 ID'/)
  assert.match(source, /item\.applicantName/)
  assert.match(source, /item\.applicantUsername/)
  assert.match(source, /파트너 ID · \{item\.partnerId\}/)
})

test('포털은 현재 세션만 로그아웃하고 만료·401 응답을 즉시 정리한다', () => {
  assert.match(source, /\/api\/v1\/portal\/logout/)
  assert.match(source, /keepalive: true/)
  assert.match(source, /Math\.min\(remaining, 2_147_483_647\)/)
  assert.match(source, /sessionExpiredEvent/)
  assert.match(source, /signalUnauthorized\(response\)/)
})
