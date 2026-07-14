export type Route = 'home' | 'docs' | 'auth' | 'portal' | 'admin' | 'password'
export type MemberTab = 'dashboard' | 'api-keys'
export type AdminTab = MemberTab | 'analytics' | 'tax'
export type AppLocation = { route: Route; tab?: MemberTab | AdminTab }

const routes = new Set<Route>(['home', 'docs', 'auth', 'portal', 'admin', 'password'])
const memberTabs = new Set<MemberTab>(['dashboard', 'api-keys'])
const adminTabs = new Set<AdminTab>(['dashboard', 'api-keys', 'analytics', 'tax'])

export function parseAppLocation(hash: string): AppLocation {
  const value = hash.replace(/^#\/?/, '')
  const [rawRoute = 'home', rawQuery = ''] = value.split('?', 2)
  const route = routes.has(rawRoute as Route) ? rawRoute as Route : 'home'
  const rawTab = new URLSearchParams(rawQuery).get('tab')

  if (route === 'admin' && adminTabs.has(rawTab as AdminTab)) {
    return { route, tab: rawTab as AdminTab }
  }
  if (route === 'portal' && memberTabs.has(rawTab as MemberTab)) {
    return { route, tab: rawTab as MemberTab }
  }
  return { route }
}

export function buildAppHash(route: Route, tab?: MemberTab | AdminTab): string {
  const validTab = route === 'admin'
    ? adminTabs.has(tab as AdminTab)
    : route === 'portal' && memberTabs.has(tab as MemberTab)
  return `#/${route}${validTab ? `?tab=${encodeURIComponent(tab!)}` : ''}`
}

export function resolveMemberTab(tab: AppLocation['tab']): MemberTab {
  return memberTabs.has(tab as MemberTab) ? tab as MemberTab : 'dashboard'
}

export function resolveAdminTab(tab: AppLocation['tab']): AdminTab {
  return adminTabs.has(tab as AdminTab) ? tab as AdminTab : 'dashboard'
}
