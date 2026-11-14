import type { Weight } from './fonts';
import type { Style } from './style';

export type { Weight } from './fonts';

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
  style: Style;
  /** The font weights the card uses, so it carries only those */
  weights: Weight[];
  title: string;
  body: string;
  radius?: number;
}

export function doc({ width, height, style, weights, title, body, radius = 14 }: DocOptions) {
  const { theme, font } = style;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
<style>${font.css(weights)}text{font-family:${font.family}}</style>
<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${radius}" fill="${theme.bg}" stroke="${theme.border}"/>
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
