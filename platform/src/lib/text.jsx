// Plain text with line breaks preserved (via CSS white-space) and URLs turned into links. Never renders HTML.
const URL_RE = /\bhttps?:\/\/[^\s<>"')\]]+[^\s<>"')\].,;:!?]/gi;

export function Linkified({ text }) {
  const s = String(text ?? '');
  const out = [];
  let last = 0;
  for (const m of s.matchAll(URL_RE)) {
    if (m.index > last) out.push(s.slice(last, m.index));
    out.push(<a key={m.index} href={m[0]} target="_blank" rel="noopener noreferrer nofollow ugc">{m[0]}</a>);
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push(s.slice(last));
  return <>{out}</>;
}
