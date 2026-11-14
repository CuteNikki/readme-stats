// Every skill in one picture instead of a badge each: a row per group, its
// name on the left and its chips flowing to the right

import type { Icon } from '../icons';
import type { Font } from '../fonts';
import { scales, type Style } from '../style';
import { cornerRadius, doc, line, round, text } from '../svg';
import { readable } from '../theme';

export interface SkillGroup {
  name: string;
  skills: { label: string; icon?: Icon }[];
}

const W = 880;
/** The widest the group names' column gets before a long name is cut off */
const MAX_LABEL_W = 300;

/** A chip's measurements at the style's text size */
function chipSizes(style: Style) {
  const { x: s, cap } = scales(style);
  // Rounded as much as the card is, relatively: 8 on the 14 cards have, at most a pill
  const radius = Math.min((8 * cornerRadius(style)) / 14, s(16));
  return { radius, size: s(12.5), height: s(32), icon: s(15), left: s(11), iconGap: s(8), right: s(12), gap: s(8), baseline: s(16) + s(4.5) * cap };
}

type Chip = ReturnType<typeof chipSizes>;

function chip(x: number, y: number, label: string, icon: Icon | undefined, { theme, font, border }: Style, c: Chip) {
  const width = chipWidth(label, icon, font, c);
  let out = `<rect x="${round(x + 0.5)}" y="${round(y + 0.5)}" width="${width - 1}" height="${round(c.height - 1)}" rx="${round(c.radius)}" fill="${theme.line}" fill-opacity="0.55"${border ? ` stroke="${theme.border}"` : ''}/>`;
  let tx = x + c.left;
  if (icon) {
    out += `<g transform="translate(${round(tx)} ${round(y + (c.height - c.icon) / 2)}) scale(${c.icon / 24})">${icon.draw(readable(`#${icon.hex}`, theme), theme)}</g>`;
    tx += c.icon + c.iconGap;
  }
  out += text(tx, y + c.baseline, label, { size: c.size, weight: 500, fill: theme.fg });
  return out;
}

function chipWidth(label: string, icon: Icon | undefined, font: Font, c: Chip) {
  return Math.ceil(c.left + (icon ? c.icon + c.iconGap : 0) + font.width(label, c.size, 500) + c.right);
}

export function skillsCard(groups: SkillGroup[], style: Style, title?: string) {
  const { theme, font } = style;
  const { t, l, x: s, p, tc, cap } = scales(style);
  const c = chipSizes(style);
  const pad = p(28);
  /** Less above and below than at the sides: next to the 11px between groups, 28 looked empty */
  const padY = p(20);
  const labelSize = l(11);
  // Room for the longest group name, and never less than the card was designed with
  const widest = Math.max(0, ...groups.map((g) => font.width(g.name.toUpperCase(), labelSize, 700, 1.2)));
  const labelW = Math.min(Math.max(l(150), widest + l(24)), MAX_LABEL_W);
  const area = W - pad * 2 - labelW;

  let y = padY;
  let body = '';
  if (title) {
    body += text(pad, y + tc(16), font.fit(title, t(15), W - pad * 2, 800), { size: t(15), weight: 800, fill: theme.fg });
    y += t(42);
  }

  // The divider between two groups sits exactly halfway between their chips
  const between = s(11);
  groups.forEach((group, gi) => {
    if (gi > 0) {
      y += between;
      body += line(style, pad, y, W - pad, y);
      y += between;
    }
    const name = font.fit(group.name.toUpperCase(), labelSize, labelW - l(16), 700, 1.2);
    body += text(pad, y + c.height / 2 + l(4.5) * cap, name, { size: labelSize, weight: 700, fill: theme.muted, spacing: 1.2 });
    let x = 0;
    let rowY = y;
    for (const skill of group.skills) {
      const width = chipWidth(skill.label, skill.icon, font, c);
      if (x > 0 && x + width > area) {
        x = 0;
        rowY += c.height + c.gap;
      }
      body += chip(pad + labelW + x, rowY, skill.label, skill.icon, style, c);
      x += width + c.gap;
    }
    y = rowY + c.height;
  });

  return doc({ width: W, height: y + padY, style, weights: [500, 700, 800], title: title ?? 'Skills', body });
}
