import type { ApiEntry } from '../data/api'

export function ApiPage({ entry }: { entry: ApiEntry }) {
  return <article className="article api-article"><div className="eyebrow">{entry.category}</div><h1>{entry.name}</h1><p className="lede">{entry.summary}</p><div className="source-file">Header <code>{entry.header}</code></div><div className="tags">{entry.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><h2>Members and operations</h2><div className="member-list">{entry.members.map((member) => <section className="member" key={member.signature}><code>{member.signature}</code><p>{member.note}</p></section>)}</div><aside className="callout info"><strong>Source of truth</strong><span>Signatures are indexed from the current engine header. Read the linked header in the engine workspace before relying on a default argument or ownership detail not shown here.</span></aside></article>
}
