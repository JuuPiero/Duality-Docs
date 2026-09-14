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

function App() {
  const [route, setRoute] = useState(routeFromHash)
  const [query, setQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [apiFilter, setApiFilter] = useState('')

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

  return <div className="app-shell">
    <SiteHeader mode={route.mode} query={query} mobileOpen={mobileOpen} onQueryChange={setQuery} onToggleMenu={() => setMobileOpen((open) => !open)} />
    <DocsSidebar route={route} mobileOpen={mobileOpen} apiFilter={apiFilter} onApiFilterChange={setApiFilter} />
    <main>{content}</main>
    <footer><span>Duality Engine documentation</span><span>Engine headers are the final authority · 3DS APIs are versioned with devkitPro</span></footer>
  </div>
}

export default App
