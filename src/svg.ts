import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Theme } from './theme';

export type Weight = 400 | 500 | 700 | 800;

const files: Record<Weight, string> = {
  400: 'JetBrainsMono-Regular.woff2',
  500: 'JetBrainsMono-Medium.woff2',
  700: 'JetBrainsMono-Bold.woff2',
  800: 'JetBrainsMono-ExtraBold.woff2',
};

// Read once: GitHub shows the cards as <img>, which can't load fonts from
// anywhere, so each card carries the few it uses, cut down to Latin (~13 KB)
const fonts = Object.fromEntries(
  Object.entries(files).map(([weight, file]) => [weight, readFileSync(join(import.meta.dir, '..', 'fonts', file)).toString('base64')]),
) as Record<Weight, string>;

export const FONT = "'JBM', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

/** JetBrains Mono is monospaced: every character is 0.6em wide */
export function textWidth(text: string, size: number) {
  return [...text].length * size * 0.6;
}

/** Shortens text to fit a width, ending it with an ellipsis */
export function fit(text: string, size: number, width: number) {
  const max = Math.floor(width / (size * 0.6));
  const chars = [...text];
  return chars.length <= max ? text : `${chars.slice(0, Math.max(0, max - 1)).join('').trimEnd()}…`;
}

/** Breaks text into lines that fit a width, the last one ellipsised */
export function wrap(text: string, size: number, width: number, maxLines: number) {
  const max = Math.floor(width / (size * 0.6));
  const lines: string[] = [];
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const last = lines.at(-1);
    if (last !== undefined && [...`${last} ${word}`].length <= max) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  if (lines.length <= maxLines) return lines.map((line) => fit(line, size, width));
  // Too long: the last line that's shown takes the rest, cut off
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = fit(lines.slice(maxLines - 1).join(' '), size, width);
  return kept;
}

export function esc(value: string | number) {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/** 2569 > 2.6k, 38 > 38 */
export function compact(n: number) {
  if (n < 1000) return String(n);
  if (n < 10_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  if (n < 1_000_000) return `${Math.round(n / 1000)}k`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`;
}

export function group(n: number) {
  return n.toLocaleString('en-US');
}

interface DocOptions {
  width: number;
  height: number;
  theme: Theme;
  weights: Weight[];
  title: string;
  body: string;
  /** Draws the card's rounded background and border; off for badges that draw their own */
  frame?: boolean;
  radius?: number;
}

export function doc({ width, height, theme, weights, title, body, frame = true, radius = 14 }: DocOptions) {
  const faces = [...new Set(weights)]
    .map((w) => `@font-face{font-family:'JBM';font-weight:${w};src:url(data:font/woff2;base64,${fonts[w]}) format('woff2')}`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
<style>${faces}text{font-family:${FONT}}</style>
${frame ? `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${radius}" fill="${theme.bg}" stroke="${theme.border}"/>` : ''}
${body}
</svg>`;
}

interface TextOptions {
  size: number;
  weight?: Weight;
  fill: string;
  anchor?: 'start' | 'middle' | 'end';
  spacing?: number;
  opacity?: number;
}

export function text(x: number, y: number, content: string | number, { size, weight = 400, fill, anchor = 'start', spacing, opacity }: TextOptions) {
  return `<text x="${round(x)}" y="${round(y)}" font-size="${size}" font-weight="${weight}" fill="${fill}"${anchor === 'start' ? '' : ` text-anchor="${anchor}"`}${spacing ? ` letter-spacing="${spacing}"` : ''}${opacity === undefined ? '' : ` opacity="${opacity}"`}>${esc(content)}</text>`;
}

export function round(n: number) {
  return Math.round(n * 100) / 100;
}
