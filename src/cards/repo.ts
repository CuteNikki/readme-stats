// A project card for the README's own showcase, as many as wanted, past
// GitHub's six pins

import type { Repo } from '../github';
import { octicon } from '../octicons';
import { scales, type Style } from '../style';
import { compact, doc, round, text } from '../svg';

export interface RepoOptions {
  style: Style;
  /** The small line above the name; the first topic otherwise */
  label?: string;
  /** Instead of the repo's own description */
  description?: string;
}

const W = 420;

export function repoCard(repo: Repo, { style, label, description }: RepoOptions) {
  const { theme, font } = style;
  const { t, l, x: s, p, tc, cap } = scales(style);
  const pad = p(24);
  const inner = W - pad * 2;
  let body = '';

  // Each baseline from the one above it; the description always has room for two lines
  const labelY = p(29.97) + l(8.03) * cap;
  const nameY = labelY + l(13.86) + tc(13.14);
  const descY = nameY + t(19.51) + s(9.49) * cap;
  const y = descY + s(20) + s(26);
  const H = y + p(24);

  const small = (label ?? repo.topics[0] ?? 'repository').toUpperCase();
  body += text(pad, labelY, font.fit(small, l(11), inner - l(60), 700, 1.2), { size: l(11), weight: 700, fill: theme.accent, spacing: 1.2 });
  if (repo.archived) body += text(W - pad, labelY, 'ARCHIVED', { size: l(10), weight: 700, fill: theme.muted, anchor: 'end', spacing: 1 });
  else if (repo.homepage) {
    body += octicon('link', W - pad - font.width('live', l(11), 700) - l(18), labelY - l(10), l(12), theme.muted);
    body += text(W - pad, labelY, 'live', { size: l(11), weight: 700, fill: theme.muted, anchor: 'end' });
  }

  body += octicon('repo', pad, nameY - t(14), t(16), theme.muted);
  body += text(pad + t(24), nameY, font.fit(repo.name, t(18), inner - t(24), 800), { size: t(18), weight: 800, fill: theme.fg });

  const lines = font.wrap(description ?? repo.description ?? 'No description yet.', s(13), inner, 2);
  lines.forEach((line, i) => {
    body += text(pad, descY + i * s(20), line, { size: s(13), fill: theme.muted });
  });

  // Language, stars, forks along the bottom
  let x = pad;
  if (repo.language) {
    body += `<circle cx="${round(x + s(5))}" cy="${round(y - s(4))}" r="${round(s(5))}" fill="${repo.language.color}"/>`;
    body += text(x + s(16), y, repo.language.name, { size: s(12), fill: theme.fg });
    x += s(16) + font.width(repo.language.name, s(12)) + s(20);
  }
  body += octicon('star', x, y - s(12), s(14), theme.muted);
  body += text(x + s(20), y, compact(repo.stars), { size: s(12), fill: theme.fg });
  x += s(20) + font.width(compact(repo.stars), s(12)) + s(20);
  body += octicon('fork', x, y - s(12), s(14), theme.muted);
  body += text(x + s(20), y, compact(repo.forks), { size: s(12), fill: theme.fg });

  return doc({ width: W, height: H, style, weights: [400, 700, 800], title: `${repo.owner}/${repo.name}`, body });
}
