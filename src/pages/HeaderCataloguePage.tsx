import { FileCode2 } from 'lucide-react'
import { headerCatalogue } from '../data/generatedHeaders'
import { useLocale } from '../i18n/LocaleContext'

export function HeaderCataloguePage({ filter }: { filter: string }) {
  const { t } = useLocale()
  const needle = filter.toLowerCase()
  const headers = headerCatalogue.filter((header) => !needle || `${header.path} ${header.symbols.join(' ')}`.toLowerCase().includes(needle))
  return <article className="article api-article"><div className="eyebrow">{t('Generated public API index')}</div><h1>{t('Header catalogue')}</h1><p className="lede">{t('Every public header under')} <code>DualityEngine/Include/DualityEngine</code>{t(', generated at docs build time. Symbols are a compact navigation index; the header remains the exact C++ declaration.')}</p><div className="source-file"><FileCode2 size={14} /> {headers.length} / {headerCatalogue.length} {t('headers shown')}</div><div className="member-list catalogue">{headers.map((header) => <section className="member" key={header.path}><code>{header.path}</code><div className="catalogue-symbols">{header.symbols.length ? header.symbols.map((symbol) => <code key={symbol}>{symbol}</code>) : <p>{t('No public class/function declaration detected by the lightweight indexer.')}</p>}</div></section>)}</div></article>
}
