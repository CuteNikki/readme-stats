// The one card that replaces three: what's been done overall, the streak, the
// languages, and the last year of contributions underneath

import type { Day, Language, Profile } from '../github';
import { doc, fit, group, round, text, textWidth, type Weight } from '../svg';
import { streaks } from '../streak';
import type { Theme } from '../theme';

export interface ProfileOptions {
  theme: Theme;
  /** The contribution graph underneath */
  graph: boolean;
  langs: number;
  /** Languages left out, lowercased */
  hide: string[];
  /** bytes: by how much code; repos: by how many repos have it; mixed: both */
  by: 'bytes' | 'repos' | 'mixed';
}

const W = 880;
const PAD = 28;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function shortDate(iso: string, withYear = false) {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return `${MONTHS[m - 1]} ${d}${withYear ? `, ${y}` : ''}`;
}

function heading(x: number, y: number, label: string, theme: Theme) {
  return text(x, y, label.toUpperCase(), { size: 11, weight: 700, fill: theme.muted, spacing: 1.2 });
}

function overview(p: Profile, x: number, width: number, theme: Theme) {
  const rows: [string, number][] = [
    ['Commits', p.commits],
    ['Pull requests', p.pullRequests],
    ['Issues', p.issues],
    ['Stars earned', p.stars],
    ['Repositories', p.repos],
  ];
  let out = heading(x, 84, 'Overview', theme);
  rows.forEach(([label, value], i) => {
    const y = 116 + i * 25;
    out += text(x, y, label, { size: 13, fill: theme.muted });
    out += text(x + width, y, group(value), { size: 13, weight: 700, fill: theme.fg, anchor: 'end' });
  });
  return out;
}

function streak(p: Profile, x: number, width: number, theme: Theme) {
  const { current, longest, total } = streaks(p.days);
  let out = heading(x, 84, 'Current streak', theme);
  const number = String(current.length);
  out += text(x - 2, 146, number, { size: 52, weight: 800, fill: theme.accent, spacing: -1.5 });
  out += text(x + number.length * 52 * 0.6 - number.length * 1.5 + 6, 146, current.length === 1 ? 'day' : 'days', { size: 14, weight: 500, fill: theme.muted });

  const lastActive = [...p.days].reverse().find((d) => d.count > 0);
  const since =
    current.length > 0 && current.start
      ? `since ${shortDate(current.start)}`
      : lastActive
        ? `last active ${shortDate(lastActive.date)}`
        : 'no contributions yet';
  out += text(x, 170, since, { size: 12, fill: theme.muted });

  const half = width / 2;
  out += text(x, 202, 'LONGEST', { size: 10, weight: 700, fill: theme.muted, spacing: 1 });
  out += text(x, 222, `${longest.length} days`, { size: 14, weight: 700, fill: theme.fg });
  out += text(x + half, 202, 'CONTRIBUTIONS', { size: 10, weight: 700, fill: theme.muted, spacing: 1 });
  out += text(x + half, 222, group(total), { size: 14, weight: 700, fill: theme.fg });
  return out;
}

function score(l: Language, by: ProfileOptions['by']) {
  if (by === 'repos') return l.repos;
  if (by === 'mixed') return Math.sqrt(l.size) * Math.sqrt(l.repos);
  return l.size;
}

function languages(p: Profile, x: number, width: number, { theme, langs, hide, by }: ProfileOptions) {
  const shown = p.languages
    .filter((l) => !hide.includes(l.name.toLowerCase()))
    .map((l) => ({ ...l, score: score(l, by) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, langs);
  const sum = shown.reduce((s, l) => s + l.score, 0) || 1;

  let out = heading(x, 84, 'Top languages', theme);
  // One bar, a segment each, with a hairline gap between them
  const barY = 98;
  out += `<clipPath id="bar"><rect x="${x}" y="${barY}" width="${width}" height="8" rx="4"/></clipPath><g clip-path="url(#bar)"><rect x="${x}" y="${barY}" width="${width}" height="8" fill="${theme.line}"/>`;
  let at = x;
  for (const l of shown) {
    const w = (l.score / sum) * width;
    out += `<rect x="${round(at)}" y="${barY}" width="${round(Math.max(w - 2, 0.5))}" height="8" fill="${l.color}"/>`;
    at += w;
  }
  out += '</g>';

  const rowStep = shown.length > 5 ? 20 : 23;
  shown.forEach((l, i) => {
    const y = 130 + i * rowStep;
    const pct = (l.score / sum) * 100;
    out += `<circle cx="${x + 4}" cy="${y - 4}" r="4" fill="${l.color}"/>`;
    out += text(x + 16, y, fit(l.name, 13, width - 70), { size: 13, fill: theme.fg });
    out += text(x + width, y, `${pct < 10 ? pct.toFixed(1) : Math.round(pct)}%`, { size: 13, fill: theme.muted, anchor: 'end' });
  });
  return out;
}

/** Five steps, the way GitHub's graph does it: by quarters of the busiest day */
function levelOf(count: number, max: number) {
  if (count <= 0) return 0;
  return Math.min(4, Math.ceil((count / max) * 4)) as 1 | 2 | 3 | 4;
}

function graph(days: Day[], y: number, theme: Theme) {
  // The last 53 weeks, starting on a Sunday, the way GitHub draws it
  const last = days.at(-1);
  if (!last) return { body: '', height: 0 };
  const end = new Date(`${last.date}T00:00:00Z`);
  const start = new Date(end);
  start.setUTCDate(end.getUTCDate() - end.getUTCDay() - 52 * 7);
  const startIso = start.toISOString().slice(0, 10);
  const shown = days.filter((d) => d.date >= startIso);
  const year = shown.reduce((s, d) => s + d.count, 0);
  // A day far busier than the rest would otherwise leave every other day pale
  const sorted = shown.map((d) => d.count).filter((c) => c > 0).sort((a, b) => a - b);
  const max = sorted[Math.floor(sorted.length * 0.95)] ?? 1;

  const gap = 3;
  const cell = (W - PAD * 2 - 52 * gap) / 53;
  // As much room under the divider as the columns get under theirs, and a bit more before the graph
  const top = y + 62;
  let out = heading(PAD, y + 30, 'Last year', theme);
  out += text(W - PAD, y + 30, `${group(year)} contributions`, { size: 12, fill: theme.muted, anchor: 'end' });

  let lastMonth = -1;
  shown.forEach((d, i) => {
    const date = new Date(`${d.date}T00:00:00Z`);
    const week = Math.floor(i / 7);
    const weekday = date.getUTCDay();
    const cx = PAD + week * (cell + gap);
    const cy = top + weekday * (cell + gap);
    // A month's name over the first week it starts in, unless there's no room left for it
    if (weekday === 0 && date.getUTCMonth() !== lastMonth && date.getUTCDate() <= 7) {
      lastMonth = date.getUTCMonth();
      if (week < 52) out += text(cx, top - 8, MONTHS[lastMonth]!, { size: 10, fill: theme.muted });
    }
    out += `<rect x="${round(cx)}" y="${round(cy)}" width="${round(cell)}" height="${round(cell)}" rx="2.5" fill="${theme.levels[levelOf(d.count, max)]}"><title>${d.count} on ${shortDate(d.date, true)}</title></rect>`;
  });

  // Less ... more
  const legendY = top + 7 * (cell + gap) + 16;
  const moreX = W - PAD - textWidth('more', 10);
  const lx = moreX - 8 - 5 * 13 + 3;
  out += text(lx - 8, legendY + 9, 'less', { size: 10, fill: theme.muted, anchor: 'end' });
  theme.levels.forEach((color, i) => {
    out += `<rect x="${round(lx + i * 13)}" y="${legendY}" width="10" height="10" rx="2" fill="${color}"/>`;
  });
  out += text(moreX, legendY + 9, 'more', { size: 10, fill: theme.muted });
  return { body: out, height: legendY + 10 - y + PAD - 6 };
}

export function profileCard(p: Profile, options: ProfileOptions) {
  const { theme } = options;
  const inner = W - PAD * 2;
  // Three columns with a divider between each
  const cols = [
    { x: PAD, w: 240 },
    { x: PAD + 240 + 56, w: 210 },
    { x: PAD + 240 + 56 + 210 + 56, w: inner - 240 - 210 - 112 },
  ] as const;

  let body = '';
  body += text(PAD, 44, `@${p.login}`, { size: 15, weight: 800, fill: theme.fg });
  body += text(PAD + p.login.length * 9 + 9 + 12, 44, 'on GitHub', { size: 12, fill: theme.muted });
  body += text(W - PAD, 44, `since ${new Date(p.createdAt).getUTCFullYear()}`, { size: 11, weight: 700, fill: theme.accent, anchor: 'end', spacing: 1 });
  body += `<line x1="${PAD}" y1="60" x2="${W - PAD}" y2="60" stroke="${theme.line}"/>`;

  body += overview(p, cols[0].x, cols[0].w, theme);
  body += `<line x1="${cols[1].x - 28}" y1="76" x2="${cols[1].x - 28}" y2="226" stroke="${theme.line}"/>`;
  body += streak(p, cols[1].x, cols[1].w, theme);
  body += `<line x1="${cols[2].x - 28}" y1="76" x2="${cols[2].x - 28}" y2="226" stroke="${theme.line}"/>`;
  body += languages(p, cols[2].x, cols[2].w, options);

  let height = 252;
  if (options.graph) {
    body += `<line x1="${PAD}" y1="${height}" x2="${W - PAD}" y2="${height}" stroke="${theme.line}"/>`;
    const g = graph(p.days, height, theme);
    body += g.body;
    height += g.height;
  }

  const weights: Weight[] = [400, 500, 700, 800];
  return doc({ width: W, height: Math.round(height), theme, weights, title: `${p.name}'s GitHub stats`, body });
}
