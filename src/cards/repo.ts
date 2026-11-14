// A project card for the README's own showcase, as many as wanted, past
// GitHub's six pins

import type { Repo } from '../github';
import { octicon } from '../octicons';
import type { Style } from '../style';
import { compact, doc, text } from '../svg';

export interface RepoOptions {
  style: Style;
  /** The small line above the name; the first topic otherwise */
  label?: string;
  /** Instead of the repo's own description */
  description?: string;
}

const W = 420;
const H = 164;
const PAD = 24;

export function repoCard(repo: Repo, { style, label, description }: RepoOptions) {
  const { theme, font } = style;
  const inner = W - PAD * 2;
  let body = '';

  const small = (label ?? repo.topics[0] ?? 'repository').toUpperCase();
  body += text(PAD, 38, font.fit(small, 11, inner - 60, 700, 1.2), { size: 11, weight: 700, fill: theme.accent, spacing: 1.2 });
  if (repo.archived) body += text(W - PAD, 38, 'ARCHIVED', { size: 10, weight: 700, fill: theme.muted, anchor: 'end', spacing: 1 });
  else if (repo.homepage) {
    body += octicon('link', W - PAD - font.width('live', 11, 700) - 18, 28, 12, theme.muted);
    body += text(W - PAD, 38, 'live', { size: 11, weight: 700, fill: theme.muted, anchor: 'end' });
  }

  body += octicon('repo', PAD, 51, 16, theme.muted);
  body += text(PAD + 24, 65, font.fit(repo.name, 18, inner - 24, 800), { size: 18, weight: 800, fill: theme.fg });

  const lines = font.wrap(description ?? repo.description ?? 'No description yet.', 13, inner, 2);
  lines.forEach((line, i) => {
    body += text(PAD, 94 + i * 20, line, { size: 13, fill: theme.muted });
  });

  // Language, stars, forks along the bottom
  const y = H - 24;
  let x = PAD;
  if (repo.language) {
    body += `<circle cx="${x + 5}" cy="${y - 4}" r="5" fill="${repo.language.color}"/>`;
    body += text(x + 16, y, repo.language.name, { size: 12, fill: theme.fg });
    x += 16 + font.width(repo.language.name, 12) + 20;
  }
  body += octicon('star', x, y - 12, 14, theme.muted);
  body += text(x + 20, y, compact(repo.stars), { size: 12, fill: theme.fg });
  x += 20 + font.width(compact(repo.stars), 12) + 20;
  body += octicon('fork', x, y - 12, 14, theme.muted);
  body += text(x + 20, y, compact(repo.forks), { size: 12, fill: theme.fg });

  return doc({ width: W, height: H, style, weights: [400, 700, 800], title: `${repo.owner}/${repo.name}`, body });
}
