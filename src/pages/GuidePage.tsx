import type { DocPage } from '../data/docs'
import { BlockView } from '../components/BlockView'

export function GuidePage({ page }: { page: DocPage }) {
  return <article className="article"><div className="eyebrow">{page.group}</div><h1>{page.title}</h1><p className="lede">{page.summary}</p><div className="tags">{page.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><div className="article-body">{page.blocks.map((block, index) => <BlockView key={index} block={block} />)}</div></article>
}
