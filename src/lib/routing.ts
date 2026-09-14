import type { DocsMode, DocsRoute } from '../types/navigation'

export function routeFromHash(hash = location.hash): DocsRoute {
  const [mode, id] = hash.replace(/^#\/?/, '').split('/')
  return { mode: mode === 'api' ? 'api' : 'guide', id: id || 'welcome' }
}

export function navigateTo(mode: DocsMode, id: string) {
  location.hash = `/${mode}/${id}`
}
