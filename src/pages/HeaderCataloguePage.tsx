import { FileCode2 } from 'lucide-react'
import { headerCatalogue } from '../data/generatedHeaders'

export function HeaderCataloguePage({ filter }: { filter: string }) {
  const needle = filter.toLowerCase()
  const headers = headerCatalogue.filter((header) => !needle || `${header.path} ${header.symbols.join(' ')}`.toLowerCase().includes(needle))
  return <article className="article api-article"><div className="eyebrow">Generated public API index</div><h1>Header catalogue</h1><p className="lede">Every public header under <code>DualityEngine/Include/DualityEngine</code>, generated at docs build time. Symbols are a compact navigation index; the header remains the exact C++ declaration.</p><div className="source-file"><FileCode2 size={14} /> {headers.length} / {headerCatalogue.length} headers shown</div><div className="member-list catalogue">{headers.map((header) => <section className="member" key={header.path}><code>{header.path}</code><p>{header.symbols.length ? header.symbols.join(' · ') : 'No public class/function declaration detected by the lightweight indexer.'}</p></section>)}</div></article>
}
