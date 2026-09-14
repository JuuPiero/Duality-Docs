import type { DocPage } from '../data/docs'
import { BlockView } from '../components/BlockView'
import { useLocale } from '../i18n/LocaleContext'

export function GuidePage({ page }: { page: DocPage }) {
  const { t } = useLocale()
  return <article className="article"><div className="eyebrow">{t(page.group)}</div><h1>{t(page.title)}</h1><p className="lede">{t(page.summary)}</p><div className="tags">{page.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><div className="article-body">{page.blocks.map((block, index) => <BlockView key={index} block={block} />)}</div></article>
}
