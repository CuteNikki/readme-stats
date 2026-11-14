// A small chip: an icon and a label, and a value after it if there is one.
// Socials, the view counter, anything that wants to sit in a row of links.

import type { Icon } from '../icons';
import { scales, type Style } from '../style';
import { doc, round, text } from '../svg';
import { readable } from '../theme';

export interface BadgeOptions {
  style: Style;
  label: string;
  value?: string;
  /** Quieter text after the value, like when a count started */
  note?: string;
  icon?: Icon;
  /** Draws its own icon instead, in a size px square at (x, y) */
  drawIcon?: (x: number, y: number, color: string, size: number) => string;
  /** The icon's colour instead of the brand's, as #rrggbb */
  color?: string;
}

export function badge({ style, label, value, note, icon, drawIcon, color }: BadgeOptions) {
  const { theme, font } = style;
  const { x: s, p, cap } = scales(style);
  const iconColor = color ? readable(color, theme) : icon ? readable(`#${icon.hex}`, theme) : theme.accent;
  const size = s(13);
  const iconSize = s(16);
  const height = iconSize + p(18);
  // The middle of the capitals on the middle of the badge
  const baseline = height / 2 + s(5) * cap;
  const iconY = (height - iconSize) / 2;

  let x = p(13);
  let body = '';
  if (icon) {
    body += `<g transform="translate(${round(x)} ${round(iconY)}) scale(${iconSize / 24})">${icon.draw(iconColor, theme)}</g>`;
    x += iconSize + s(9);
  } else if (drawIcon) {
    body += drawIcon(x, iconY, iconColor, iconSize);
    x += iconSize + s(9);
  }
  body += text(x, baseline, label, { size, weight: 500, fill: theme.fg });
  x += font.width(label, size, 500);
  if (value) {
    x += s(10);
    body += `<line x1="${round(x)}" y1="${round(iconY)}" x2="${round(x)}" y2="${round(height - iconY)}" stroke="${theme.border}"/>`;
    x += s(10);
    body += text(x, baseline, value, { size, weight: 700, fill: theme.accent });
    x += font.width(value, size, 700);
    if (note) {
      x += s(8);
      body += text(x, baseline, note, { size: s(12), fill: theme.muted });
      x += font.width(note, s(12));
    }
  }
  return doc({
    width: x + p(14),
    height,
    style,
    // 700 for the value, and for the letters on Adobe's tiles
    weights: [500, ...(value || icon?.ownColors ? [700 as const] : []), ...(value && note ? [400 as const] : [])],
    title: value ? `${label}: ${value}${note ? ` ${note}` : ''}` : label,
    body,
    radius: 10,
  });
}
