import { ExternalLink, FileCode2 } from 'lucide-react'
import { apiCategories, apiEntries } from '../data/api'
import { docPages, groups } from '../data/docs'
import { headerCatalogue } from '../data/generatedHeaders'
import { navigateTo } from '../lib/routing'
import type { DocsRoute } from '../types/navigation'

const officialLinks = [
  ['libctru API', 'https://libctru.devkitpro.org/'],
  ['Citro3D API', 'https://citro3d.devkitpro.org/'],
  ['devkitPro 3DS examples', 'https://github.com/devkitPro/3ds-examples'],
]

type DocsSidebarProps = {
  route: DocsRoute
  apiFilter: string
  mobileOpen: boolean
  onApiFilterChange: (value: string) => void
}

export function DocsSidebar({ route, apiFilter, mobileOpen, onApiFilterChange }: DocsSidebarProps) {
  const activeGuide = docPages.find((page) => page.id === route.id) ?? docPages[0]
  const activeApi = apiEntries.find((entry) => entry.id === route.id) ?? apiEntries[0]
  const filteredApi = apiEntries.filter((entry) => { const text = apiFilter.toLowerCase(); return !text || `${entry.name} ${entry.category} ${entry.header} ${entry.tags.join(' ')}`.toLowerCase().includes(text) })
  return <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>{route.mode === 'guide' ? <>{groups.map((group) => <section key={group}><h2>{group}</h2>{docPages.filter((page) => page.group === group).map((page) => <button className={activeGuide.id === page.id ? 'active' : ''} key={page.id} onClick={() => navigateTo('guide', page.id)}>{page.title}</button>)}</section>)}</> : <><label className="api-filter">Filter API<input value={apiFilter} onChange={(event) => onApiFilterChange(event.target.value)} placeholder="Class or header" /></label><section><h2>Generated index</h2><button className={route.id === 'header-catalogue' ? 'active' : ''} onClick={() => navigateTo('api', 'header-catalogue')}><FileCode2 size={14} /> Header catalogue ({headerCatalogue.length})</button></section>{apiCategories.map((category) => { const items = filteredApi.filter((entry) => entry.category === category); return items.length ? <section key={category}><h2>{category}</h2>{items.map((entry) => <button className={activeApi.id === entry.id && route.id !== 'header-catalogue' ? 'active' : ''} key={entry.id} onClick={() => navigateTo('api', entry.id)}>{entry.name}</button>)}</section> : null })}</>}<section className="references"><h2>Official references</h2>{officialLinks.map(([label, href]) => <a key={href} href={href} target="_blank" rel="noreferrer">{label}<ExternalLink size={13} /></a>)}</section></aside>
}
