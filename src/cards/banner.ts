// The README's header: a small label, a big title and a line under it, on a
// faint grid that fades out towards the edges

import type { Style } from '../style';
import { doc, text } from '../svg';

export interface BannerOptions {
  style: Style;
  title: string;
  subtitle?: string;
  label?: string;
}

const W = 880;
const H = 220;
const PAD = 44;

export function bannerCard({ style, title, subtitle, label }: BannerOptions) {
  const { theme, font } = style;
  const step = 24;
  let grid = '';
  for (let x = step; x < W; x += step) grid += `M${x} 0V${H}`;
  for (let y = step; y < H; y += step) grid += `M0 ${y}H${W}`;

  let body = `<defs>
  <radialGradient id="fade" cx="0.72" cy="0.5" r="0.75"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <mask id="m"><rect width="${W}" height="${H}" fill="url(#fade)"/></mask>
  <clipPath id="c"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="13"/></clipPath>
  <radialGradient id="glow" cx="0.85" cy="0.15" r="0.6"><stop offset="0" stop-color="${theme.accent}" stop-opacity="0.16"/><stop offset="1" stop-color="${theme.accent}" stop-opacity="0"/></radialGradient>
</defs>
<g clip-path="url(#c)">
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <path d="${grid}" stroke="${theme.grid}" stroke-width="1" mask="url(#m)"/>
</g>`;

  const hasLabel = Boolean(label);
  const titleY = hasLabel ? 118 : 104;
  if (label) body += text(PAD, 72, font.fit(label.toUpperCase(), 12, W - PAD * 2, 700, 2), { size: 12, weight: 700, fill: theme.accent, spacing: 2 });
  body += text(PAD - 2, titleY, font.fit(title, 46, W - PAD * 2, 800, -1), { size: 46, weight: 800, fill: theme.fg, spacing: -1 });
  if (subtitle) body += text(PAD, titleY + 38, font.fit(subtitle, 15, W - PAD * 2), { size: 15, fill: theme.muted });

  return doc({ width: W, height: H, style, weights: [400, 700, 800], title, body });
}
