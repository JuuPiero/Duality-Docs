import { useMemo } from 'react'
import { apiEntries } from '../data/api'
import { docPages } from '../data/docs'
import { headerCatalogue } from '../data/generatedHeaders'
import { navigateTo } from '../lib/routing'
import { useLocale } from '../i18n/LocaleContext'

export function SearchResults({ query, close }: { query: string; close: () => void }) {
  const { t } = useLocale()
  const normalized = query.trim().toLowerCase()
  const results = useMemo(() => {
    if (!normalized) return []
    const guides = docPages.filter((page) => `${JSON.stringify(page)} ${t(page.title)} ${t(page.summary)} ${t(page.group)}`.toLowerCase().includes(normalized)).map((page) => ({ mode: 'guide' as const, id: page.id, title: t(page.title), text: t(page.summary), group: t(page.group) }))
    const api = apiEntries.filter((entry) => `${JSON.stringify(entry)} ${t(entry.summary)} ${t(entry.category)}`.toLowerCase().includes(normalized)).map((entry) => ({ mode: 'api' as const, id: entry.id, title: entry.name, text: t(entry.summary), group: t(entry.category) }))
    const headers = headerCatalogue.filter((header) => `${header.path} ${header.symbols.join(' ')}`.toLowerCase().includes(normalized)).map((header) => ({ mode: 'api' as const, id: 'header-catalogue', title: header.path, text: header.symbols.join(' · '), group: 'Header catalogue' }))
    return [...guides, ...api, ...headers].slice(0, 30)
  }, [normalized, t])
  if (!normalized) return null
  return <div className="search-results" role="dialog" aria-label="Search results"><div className="search-caption">{results.length} result{results.length === 1 ? '' : 's'} for “{query}”</div>{results.length === 0 && <p className="empty">No guide or API entry matches this text.</p>}{results.map((result) => <button key={`${result.mode}/${result.id}`} onClick={() => { navigateTo(result.mode, result.id); close() }}><small>{result.mode === 'api' ? 'API · ' : ''}{result.group}</small><strong>{result.title}</strong><span>{result.text}</span></button>)}</div>
}
