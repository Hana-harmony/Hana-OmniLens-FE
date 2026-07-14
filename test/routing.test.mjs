import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildAppHash,
  parseAppLocation,
  resolveAdminTab,
  resolveMemberTab,
} from '../src/routing.ts'

test('관리자와 회원 콘솔 탭을 URL에서 복원한다', () => {
  assert.deepEqual(parseAppLocation('#/admin?tab=tax'), { route: 'admin', tab: 'tax' })
  assert.deepEqual(parseAppLocation('#/portal?tab=api-keys'), { route: 'portal', tab: 'api-keys' })
  assert.equal(buildAppHash('admin', 'analytics'), '#/admin?tab=analytics')
})

test('잘못된 경로와 권한 밖 탭은 안전한 기본 화면으로 이동한다', () => {
  assert.deepEqual(parseAppLocation('#/unknown?tab=tax'), { route: 'home' })
  assert.deepEqual(parseAppLocation('#/portal?tab=tax'), { route: 'portal' })
  assert.equal(resolveAdminTab(undefined), 'dashboard')
  assert.equal(resolveMemberTab('tax'), 'dashboard')
})
