// A small chip: an icon and a label, and a value after it if there is one.
// Socials, the view counter, anything that wants to sit in a row of links.

import type { Icon } from '../icons';
import type { Style } from '../style';
import { doc, text } from '../svg';
import { readable } from '../theme';

export interface BadgeOptions {
  style: Style;
  label: string;
  value?: string;
  /** Quieter text after the value, like when a count started */
  note?: string;
  icon?: Icon;
  /** Draws its own icon instead, in a 16x16 box at (x, y) */
  drawIcon?: (x: number, y: number, color: string) => string;
  /** The icon's colour instead of the brand's, as hex without # */
  color?: string;
}

const H = 34;
const SIZE = 13;

export function badge({ style, label, value, note, icon, drawIcon, color }: BadgeOptions) {
  const { theme, font } = style;
  const iconColor = color ? readable(`#${color}`, theme) : icon ? readable(`#${icon.hex}`, theme) : theme.accent;
  let x = 13;
  let body = '';
  if (icon) {
    body += `<g transform="translate(${x} ${(H - 16) / 2}) scale(${16 / 24})">${icon.draw(iconColor, theme)}</g>`;
    x += 16 + 9;
  } else if (drawIcon) {
    body += drawIcon(x, (H - 16) / 2, iconColor);
    x += 16 + 9;
  }
  body += text(x, 22, label, { size: SIZE, weight: 500, fill: theme.fg });
  x += font.width(label, SIZE, 500);
  if (value) {
    x += 10;
    body += `<line x1="${x}" y1="9" x2="${x}" y2="${H - 9}" stroke="${theme.border}"/>`;
    x += 10;
    body += text(x, 22, value, { size: SIZE, weight: 700, fill: theme.accent });
    x += font.width(value, SIZE, 700);
    if (note) {
      x += 8;
      body += text(x, 22, note, { size: 12, fill: theme.muted });
      x += font.width(note, 12);
    }
  }
  const width = Math.ceil(x + 14);
  return doc({
    width,
    height: H,
    style,
    // 700 for the value, and for the letters on Adobe's tiles
    weights: [500, ...(value || icon?.ownColors ? [700 as const] : []), ...(value && note ? [400 as const] : [])],
    title: value ? `${label}: ${value}${note ? ` ${note}` : ''}` : label,
    body,
    radius: 10,
  });
}
