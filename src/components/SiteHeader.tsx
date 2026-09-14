import { BookOpen, Code2, Menu, Search, X } from 'lucide-react'
import { SearchResults } from './SearchResults'
import { navigateTo } from '../lib/routing'
import type { DocsMode } from '../types/navigation'
import { useLocale } from '../i18n/LocaleContext'

type SiteHeaderProps = {
  mode: DocsMode
  query: string
  mobileOpen: boolean
  onQueryChange: (value: string) => void
  onToggleMenu: () => void
}

export function SiteHeader({ mode, query, mobileOpen, onQueryChange, onToggleMenu }: SiteHeaderProps) {
  const { locale, setLocale, t } = useLocale()
  return <header className="topbar"><button className="brand" onClick={() => navigateTo('guide', 'welcome')} aria-label="Go to introduction"><span className="brand-mark">D</span><span>Duality<span>Docs</span></span></button><nav aria-label="Documentation sections"><button className={mode === 'guide' ? 'selected' : ''} onClick={() => navigateTo('guide', 'welcome')}><BookOpen size={15} /> {t('Guides')}</button><button className={mode === 'api' ? 'selected' : ''} onClick={() => navigateTo('api', 'behaviour')}><Code2 size={15} /> {t('API Reference')}</button></nav><div className="search"><Search size={16} /><input value={query} onChange={(event) => onQueryChange(event.target.value)} onKeyDown={(event) => event.key === 'Escape' && onQueryChange('')} placeholder={t('Search guides and APIs…')} aria-label={t('Search guides and APIs…')} />{query ? <button className="clear-search" onClick={() => onQueryChange('')} aria-label={t('Clear search')}><X size={14} /></button> : <kbd>Esc</kbd>}<SearchResults query={query} close={() => onQueryChange('')} /></div><div className="locale-switch" aria-label="Documentation language"><button className={locale === 'en' ? 'selected' : ''} onClick={() => setLocale('en')}>EN</button><button className={locale === 'vi' ? 'selected' : ''} onClick={() => setLocale('vi')}>VI</button></div><button className="menu-button" onClick={onToggleMenu} aria-expanded={mobileOpen} aria-label={t('Toggle navigation')}><Menu size={21} /></button></header>
}
