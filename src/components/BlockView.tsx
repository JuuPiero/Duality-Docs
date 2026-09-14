import { Fragment } from 'react'
import type { Block } from '../data/docs'

function renderInline(value: string) {
  return value.split(/(`[^`]+`)/g).map((part, index) => part.startsWith('`')
    ? <code key={index}>{part.slice(1, -1)}</code>
    : <Fragment key={index}>{part}</Fragment>)
}

export function BlockView({ block }: { block: Block }) {
  if (block.type === 'paragraph') return <p>{renderInline(block.text)}</p>
  if (block.type === 'code') return <pre className={`language-${block.language}`}><code>{block.code}</code></pre>
  if (block.type === 'list') return <ul>{block.items.map((item) => <li key={item}>{renderInline(item)}</li>)}</ul>
  if (block.type === 'callout') return <aside className={`callout ${block.tone}`}><strong>{block.title}</strong><span>{renderInline(block.text)}</span></aside>
  return <div className="table-wrap"><table><thead><tr>{block.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{block.rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{renderInline(cell)}</td>)}</tr>)}</tbody></table></div>
}
