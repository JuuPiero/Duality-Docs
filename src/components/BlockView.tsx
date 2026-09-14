import { Fragment } from 'react'
import type { Block } from '../data/docs'
import { useLocale } from '../i18n/LocaleContext'

function renderInline(value: string) {
  return value.split(/(`[^`]+`)/g).map((part, index) => part.startsWith('`')
    ? <code key={index}>{part.slice(1, -1)}</code>
    : <Fragment key={index}>{part}</Fragment>)
}

export function BlockView({ block }: { block: Block }) {
  const { t } = useLocale()
  if (block.type === 'heading') return <h2>{t(block.text)}</h2>
  if (block.type === 'paragraph') return <p>{renderInline(t(block.text))}</p>
  if (block.type === 'code') return <pre className={`language-${block.language}`}><code>{block.code}</code></pre>
  if (block.type === 'list') return <ul>{block.items.map((item) => <li key={item}>{renderInline(t(item))}</li>)}</ul>
  if (block.type === 'callout') return <aside className={`callout ${block.tone}`}><strong>{t(block.title)}</strong><span>{renderInline(t(block.text))}</span></aside>
  return <div className="table-wrap"><table><thead><tr>{block.headers.map((header) => <th key={header}>{t(header)}</th>)}</tr></thead><tbody>{block.rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{renderInline(t(cell))}</td>)}</tr>)}</tbody></table></div>
}
