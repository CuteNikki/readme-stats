// The README's header: a small label, a big title and a line under it, on a
// faint grid that fades out towards the edges

import { scales, type Style } from '../style';
import { cornerRadius, doc, round, text } from '../svg';

export interface BannerOptions {
  style: Style;
  title: string;
  subtitle?: string;
  label?: string;
}

const W = 880;

export function bannerCard({ style, title, subtitle, label }: BannerOptions) {
  const { theme, font } = style;
  const { t, l, x, p, tc, cap } = scales(style);
  const pad = p(44);
  const inner = W - pad * 2;

  // From the top of the label's capitals to the subtitle's baseline, a step at a time
  const toLabel = l(8.76) * cap;
  const toTitle = l(12.42) + tc(33.58);
  const toSubtitle = t(27.05) + x(10.95) * cap;
  // The banner is as tall as it is with all three, and what's there sits in its middle
  const full = toLabel + toTitle + toSubtitle;
  const shown = (label ? toLabel + toTitle : tc(33.58)) + (subtitle ? toSubtitle : 0);
  const top = p(63.24);
  const H = top + full + p(64);

  const step = 24;
  let grid = '';
  for (let gx = step; gx < W; gx += step) grid += `M${gx} 0V${round(H)}`;
  for (let gy = step; gy < H; gy += step) grid += `M0 ${gy}H${W}`;

  let body = `<defs>
  <radialGradient id="fade" cx="0.72" cy="0.5" r="0.75"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <mask id="m"><rect width="${W}" height="${round(H)}" fill="url(#fade)"/></mask>
  <clipPath id="c"><rect x="1" y="1" width="${W - 2}" height="${round(H - 2)}" rx="${Math.max(cornerRadius(style) - 1, 0)}"/></clipPath>
  <radialGradient id="glow" cx="0.85" cy="0.15" r="0.6"><stop offset="0" stop-color="${theme.accent}" stop-opacity="0.16"/><stop offset="1" stop-color="${theme.accent}" stop-opacity="0"/></radialGradient>
</defs>
<g clip-path="url(#c)">
  <rect width="${W}" height="${round(H)}" fill="url(#glow)"/>
  <path d="${grid}" stroke="${theme.grid}" stroke-width="1" mask="url(#m)"/>
</g>`;

  let y = top + (full - shown) / 2;
  if (label) {
    y += toLabel;
    body += text(pad, y, font.fit(label.toUpperCase(), l(12), inner, 700, 2), { size: l(12), weight: 700, fill: theme.accent, spacing: 2 });
    y += toTitle;
  } else y += tc(33.58);
  body += text(pad - t(2), y, font.fit(title, t(46), inner, 800, -1), { size: t(46), weight: 800, fill: theme.fg, spacing: -1 });
  if (subtitle) body += text(pad, y + toSubtitle, font.fit(subtitle, x(15), inner), { size: x(15), fill: theme.muted });

  return doc({ width: W, height: H, style, weights: [400, 700, 800], title, body });
}
