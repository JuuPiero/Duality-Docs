import { useEffect, useState } from 'react'
import './App.css'
import { apiEntries } from './data/api'
import { docPages } from './data/docs'
import { DocsSidebar } from './components/DocsSidebar'
import { SiteHeader } from './components/SiteHeader'
import { routeFromHash } from './lib/routing'
import { ApiPage } from './pages/ApiPage'
import { GuidePage } from './pages/GuidePage'
import { HeaderCataloguePage } from './pages/HeaderCataloguePage'
import { LocaleContext, makeLocaleValue } from './i18n/LocaleContext'
import type { Locale } from './i18n/translations'
import { translate } from './i18n/translations'

function App() {
  const [route, setRoute] = useState(routeFromHash)
  const [query, setQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [apiFilter, setApiFilter] = useState('')
  const [locale, setLocale] = useState<Locale>(() => localStorage.getItem('duality-docs-locale') === 'vi' ? 'vi' : 'en')

  useEffect(() => {
    const onHashChange = () => {
      setRoute(routeFromHash())
      setMobileOpen(false)
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHashChange)
    if (!location.hash) location.hash = '/guide/welcome'
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const guide = docPages.find((page) => page.id === route.id) ?? docPages[0]
  const api = apiEntries.find((entry) => entry.id === route.id) ?? apiEntries[0]
  const content = route.mode === 'guide'
    ? <GuidePage page={guide} />
    : route.id === 'header-catalogue'
      ? <HeaderCataloguePage filter={apiFilter} />
      : <ApiPage entry={api} />

  useEffect(() => { localStorage.setItem('duality-docs-locale', locale) }, [locale])

  return <LocaleContext.Provider value={makeLocaleValue(locale, setLocale)}><div className="app-shell">
    <SiteHeader mode={route.mode} query={query} mobileOpen={mobileOpen} onQueryChange={setQuery} onToggleMenu={() => setMobileOpen((open) => !open)} />
    <DocsSidebar route={route} mobileOpen={mobileOpen} apiFilter={apiFilter} onApiFilterChange={setApiFilter} />
    <main>{content}</main>
    <footer><span>{translate('Duality Engine documentation', locale)}</span><span>{translate('Engine headers are the final authority · 3DS APIs are versioned with devkitPro', locale)}</span></footer>
  </div></LocaleContext.Provider>
}

export default App
