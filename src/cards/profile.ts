// The one card that replaces three: what's been done overall, the streak, the
// languages, and the last year of contributions underneath

import type { Day, Language, Profile } from '../github';
import { streaks } from '../streak';
import { scales, type Style } from '../style';
import { doc, group, round, text, type Weight } from '../svg';

export interface ProfileOptions {
  style: Style;
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

/** The room around the columns, and where their headings sit, at the style's sizes */
interface Layout {
  style: Style;
  sc: ReturnType<typeof scales>;
  /** Baseline of the column headings */
  headingY: number;
}

function heading(x: number, y: number, label: string, { style, sc }: Layout, width?: number) {
  const size = sc.l(11);
  const upper = label.toUpperCase();
  return text(x, y, width === undefined ? upper : style.font.fit(upper, size, width, 700, 1.2), { size, weight: 700, fill: style.theme.muted, spacing: 1.2 });
}

/** Where a column's content ends, for the dividers and what comes under the columns */
interface Column {
  body: string;
  bottom: number;
}

function overview(p: Profile, x: number, width: number, layout: Layout): Column {
  const { theme, font } = layout.style;
  const { x: s } = layout.sc;
  const rows: [string, number][] = [
    ['Commits', p.commits],
    ['Pull requests', p.pullRequests],
    ['Issues', p.issues],
    ['Stars earned', p.stars],
    ['Repositories', p.repos],
  ];
  let out = heading(x, layout.headingY, 'Overview', layout, width);
  let y = layout.headingY + s(32);
  rows.forEach(([label, value], i) => {
    if (i > 0) y += s(25);
    const number = group(value);
    const room = width - font.width(number, s(13), 700) - s(8);
    out += text(x, y, font.fit(label, s(13), room), { size: s(13), fill: theme.muted });
    out += text(x + width, y, number, { size: s(13), weight: 700, fill: theme.fg, anchor: 'end' });
  });
  return { body: out, bottom: y };
}

function streak(p: Profile, x: number, width: number, layout: Layout): Column {
  const { theme, font } = layout.style;
  const { t, l, x: s, tc, cap } = layout.sc;
  const { current, longest, total } = streaks(p.days);
  let out = heading(x, layout.headingY, 'Current streak', layout, width);
  const number = String(current.length);
  const numberY = layout.headingY + l(24) + tc(38);
  out += text(x - t(2), numberY, number, { size: t(52), weight: 800, fill: theme.accent, spacing: -1.5 });
  out += text(x - t(2) + font.width(number, t(52), 800, -1.5) + s(8), numberY, current.length === 1 ? 'day' : 'days', { size: s(14), weight: 500, fill: theme.muted });

  const lastActive = [...p.days].reverse().find((d) => d.count > 0);
  const since =
    current.length > 0 && current.start
      ? `since ${shortDate(current.start)}`
      : lastActive
        ? `last active ${shortDate(lastActive.date)}`
        : 'no contributions yet';
  const sinceY = numberY + t(15) + s(9) * cap;
  out += text(x, sinceY, font.fit(since, s(12), width), { size: s(12), fill: theme.muted });

  // Two halves, each cut off at the other rather than running into it
  const half = width / 2;
  const room = half - s(8);
  const labelY = sinceY + s(24) + l(8) * cap;
  const valueY = labelY + l(10) + s(10) * cap;
  const small = { size: l(10), weight: 700 as const, fill: theme.muted, spacing: 1 };
  out += text(x, labelY, font.fit('LONGEST', l(10), room, 700, 1), small);
  out += text(x, valueY, font.fit(`${longest.length} days`, s(14), room, 700), { size: s(14), weight: 700, fill: theme.fg });
  const totalLabel = font.width('CONTRIBUTIONS', l(10), 700, 1) <= room ? 'CONTRIBUTIONS' : 'TOTAL';
  out += text(x + half, labelY, font.fit(totalLabel, l(10), room, 700, 1), small);
  out += text(x + half, valueY, font.fit(group(total), s(14), room, 700), { size: s(14), weight: 700, fill: theme.fg });
  return { body: out, bottom: valueY };
}

function score(l: Language, by: ProfileOptions['by']) {
  if (by === 'repos') return l.repos;
  if (by === 'mixed') return Math.sqrt(l.size) * Math.sqrt(l.repos);
  return l.size;
}

/** The languages the card shows, each with its share of them in percent */
export function topLanguages(p: Profile, { langs, hide, by }: Pick<ProfileOptions, 'langs' | 'hide' | 'by'>) {
  const shown = p.languages
    .filter((l) => !hide.includes(l.name.toLowerCase()))
    .map((l) => ({ ...l, score: score(l, by) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, langs);
  const sum = shown.reduce((s, l) => s + l.score, 0) || 1;
  return shown.map((l) => ({ ...l, share: (l.score / sum) * 100 }));
}

/** 75% but 6.7%: a decimal only where it says something */
export function percent(share: number) {
  return `${share < 10 ? share.toFixed(1) : Math.round(share)}%`;
}

/** The last 53 weeks, starting on a Sunday, the way GitHub draws it */
export function lastYear(days: Day[]) {
  const last = days.at(-1);
  if (!last) return [];
  const end = new Date(`${last.date}T00:00:00Z`);
  const start = new Date(end);
  start.setUTCDate(end.getUTCDate() - end.getUTCDay() - 52 * 7);
  const startIso = start.toISOString().slice(0, 10);
  return days.filter((d) => d.date >= startIso);
}

function languages(p: Profile, x: number, width: number, options: ProfileOptions, layout: Layout): Column {
  const { theme, font } = options.style;
  const { l, x: s } = layout.sc;
  const shown = topLanguages(p, options);

  let out = heading(x, layout.headingY, 'Top languages', layout, width);
  // One bar, a segment each, with a hairline gap between them
  const barY = layout.headingY + l(14);
  const barH = s(8);
  out += `<clipPath id="bar"><rect x="${round(x)}" y="${round(barY)}" width="${round(width)}" height="${round(barH)}" rx="${round(barH / 2)}"/></clipPath><g clip-path="url(#bar)"><rect x="${round(x)}" y="${round(barY)}" width="${round(width)}" height="${round(barH)}" fill="${theme.line}"/>`;
  let at = x;
  for (const lang of shown) {
    const w = (lang.share / 100) * width;
    out += `<rect x="${round(at)}" y="${round(barY)}" width="${round(Math.max(w - 2, 0.5))}" height="${round(barH)}" fill="${lang.color}"/>`;
    at += w;
  }
  out += '</g>';

  const rowStep = shown.length > 5 ? s(20) : s(23);
  const firstY = barY + barH + s(24);
  shown.forEach((lang, i) => {
    const y = firstY + i * rowStep;
    out += `<circle cx="${round(x + s(4))}" cy="${round(y - s(4))}" r="${round(s(4))}" fill="${lang.color}"/>`;
    out += text(x + s(16), y, font.fit(lang.name, s(13), width - s(70)), { size: s(13), fill: theme.fg });
    out += text(x + width, y, percent(lang.share), { size: s(13), fill: theme.muted, anchor: 'end' });
  });
  return { body: out, bottom: firstY + Math.max(shown.length - 1, 0) * rowStep };
}

/** Five steps, the way GitHub's graph does it: by quarters of the busiest day */
function levelOf(count: number, max: number) {
  if (count <= 0) return 0;
  return Math.min(4, Math.ceil((count / max) * 4)) as 1 | 2 | 3 | 4;
}

function graph(days: Day[], y: number, layout: Layout) {
  const { theme, font } = layout.style;
  const { l, x: s, p, cap } = layout.sc;
  const pad = p(PAD);
  const shown = lastYear(days);
  if (shown.length === 0) return { body: '', height: 0 };
  const year = shown.reduce((sum, d) => sum + d.count, 0);
  // A day far busier than the rest would otherwise leave every other day pale
  const sorted = shown.map((d) => d.count).filter((c) => c > 0).sort((a, b) => a - b);
  const max = sorted[Math.floor(sorted.length * 0.95)] ?? 1;

  const gap = 3;
  const cell = (W - pad * 2 - 52 * gap) / 53;
  // As much room under the divider as the columns get under theirs, and a bit more before the graph
  const headingY = y + p(22) + l(8) * cap;
  const top = headingY + l(32);
  let out = heading(pad, headingY, 'Last year', layout);
  out += text(W - pad, headingY, `${group(year)} contributions`, { size: s(12), fill: theme.muted, anchor: 'end' });

  let lastMonth = -1;
  shown.forEach((d, i) => {
    const date = new Date(`${d.date}T00:00:00Z`);
    const week = Math.floor(i / 7);
    const weekday = date.getUTCDay();
    const cx = pad + week * (cell + gap);
    const cy = top + weekday * (cell + gap);
    // A month's name over the first week it starts in, unless there's no room left for it
    if (weekday === 0 && date.getUTCMonth() !== lastMonth && date.getUTCDate() <= 7) {
      lastMonth = date.getUTCMonth();
      if (week < 52) out += text(cx, top - l(8), MONTHS[lastMonth]!, { size: l(10), fill: theme.muted });
    }
    out += `<rect x="${round(cx)}" y="${round(cy)}" width="${round(cell)}" height="${round(cell)}" rx="2.5" fill="${theme.levels[levelOf(d.count, max)]}"><title>${d.count} on ${shortDate(d.date, true)}</title></rect>`;
  });

  // Less ... more
  // Close under the graph, as GitHub has it
  const legendY = top + 7 * (cell + gap) + l(7);
  const square = l(10);
  const step = l(13);
  const moreX = W - pad - font.width('more', l(10));
  const lx = moreX - l(8) - 5 * step + l(3);
  out += text(lx - l(8), legendY + l(9), 'less', { size: l(10), fill: theme.muted, anchor: 'end' });
  theme.levels.forEach((color, i) => {
    out += `<rect x="${round(lx + i * step)}" y="${round(legendY)}" width="${round(square)}" height="${round(square)}" rx="2" fill="${color}"/>`;
  });
  out += text(moreX, legendY + l(9), 'more', { size: l(10), fill: theme.muted });
  return { body: out, height: legendY + square - y + p(22) };
}

export function profileCard(p: Profile, options: ProfileOptions) {
  const { style } = options;
  const { theme, font } = style;
  const sc = scales(style);
  const { t, l, x: s, tc } = sc;
  const pad = sc.p(PAD);
  const inner = W - pad * 2;
  // Three columns with a divider between each, in the proportions of the card as designed
  const part = (n: number) => (inner * n) / 824;
  const gap = part(56);
  const cols = [
    { x: pad, w: part(240) },
    { x: pad + part(240) + gap, w: part(210) },
    { x: pad + part(240 + 210) + gap * 2, w: inner - part(240 + 210) - gap * 2 },
  ] as const;

  const headY = sc.p(28) + tc(16);
  const dividerY = headY + t(16);
  const columnsTop = dividerY + sc.p(16);
  const layout: Layout = { style, sc, headingY: columnsTop + l(8) * sc.cap };

  let body = '';
  const login = `@${p.login}`;
  body += text(pad, headY, login, { size: t(15), weight: 800, fill: theme.fg });
  body += text(pad + font.width(login, t(15), 800) + s(12), headY, 'on GitHub', { size: s(12), fill: theme.muted });
  body += text(W - pad, headY, `since ${new Date(p.createdAt).getUTCFullYear()}`, { size: l(11), weight: 700, fill: theme.accent, anchor: 'end', spacing: 1 });
  body += `<line x1="${round(pad)}" y1="${round(dividerY)}" x2="${round(W - pad)}" y2="${round(dividerY)}" stroke="${theme.line}"/>`;

  const columns = [overview(p, cols[0].x, cols[0].w, layout), streak(p, cols[1].x, cols[1].w, layout), languages(p, cols[2].x, cols[2].w, options, layout)];
  const bottom = Math.max(...columns.map((c) => c.bottom));
  for (const c of columns) body += c.body;
  for (const col of cols.slice(1)) {
    const dx = round(col.x - gap / 2);
    body += `<line x1="${dx}" y1="${round(columnsTop)}" x2="${dx}" y2="${round(bottom + s(4))}" stroke="${theme.line}"/>`;
  }

  let height = bottom + sc.p(30);
  if (options.graph) {
    body += `<line x1="${round(pad)}" y1="${round(height)}" x2="${round(W - pad)}" y2="${round(height)}" stroke="${theme.line}"/>`;
    const g = graph(p.days, height, layout);
    body += g.body;
    height += g.height;
  }

  const weights: Weight[] = [400, 500, 700, 800];
  return doc({ width: W, height: Math.round(height), style, weights, title: `${p.name}'s GitHub stats`, body });
}
