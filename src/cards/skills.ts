// Every skill in one picture instead of a badge each: a row per group, its
// name on the left and its chips flowing to the right

import type { Icon } from '../icons';
import type { Font } from '../fonts';
import type { Style } from '../style';
import { doc, text } from '../svg';
import { readable } from '../theme';

export interface SkillGroup {
  name: string;
  skills: { label: string; icon?: Icon }[];
}

const W = 880;
const PAD = 28;
/** Less above and below than at the sides: next to the 11px between groups, 28 looked empty */
const PAD_Y = 20;
const LABEL_W = 150;
const CHIP_H = 32;
const GAP = 8;
const SIZE = 12.5;

function chip(x: number, y: number, label: string, icon: Icon | undefined, { theme, font }: Style) {
  const width = chipWidth(label, icon, font);
  let out = `<rect x="${x + 0.5}" y="${y + 0.5}" width="${width - 1}" height="${CHIP_H - 1}" rx="8" fill="${theme.line}" fill-opacity="0.55" stroke="${theme.border}"/>`;
  let tx = x + 11;
  if (icon) {
    out += `<g transform="translate(${tx} ${y + (CHIP_H - 15) / 2}) scale(${15 / 24})">${icon.draw(readable(`#${icon.hex}`, theme), theme)}</g>`;
    tx += 15 + 8;
  }
  out += text(tx, y + 20.5, label, { size: SIZE, weight: 500, fill: theme.fg });
  return out;
}

function chipWidth(label: string, icon: Icon | undefined, font: Font) {
  return Math.ceil(11 + (icon ? 15 + 8 : 0) + font.width(label, SIZE, 500) + 12);
}

export function skillsCard(groups: SkillGroup[], style: Style, title?: string) {
  const { theme, font } = style;
  const area = W - PAD * 2 - LABEL_W;
  let y = PAD_Y;
  let body = '';
  if (title) {
    body += text(PAD, y + 16, title, { size: 15, weight: 800, fill: theme.fg });
    y += 42;
  }

  // The divider between two groups sits exactly halfway between their chips
  const between = 11;
  groups.forEach((group, gi) => {
    if (gi > 0) {
      y += between;
      body += `<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="${theme.line}"/>`;
      y += between;
    }
    body += text(PAD, y + 20.5, group.name.toUpperCase(), { size: 11, weight: 700, fill: theme.muted, spacing: 1.2 });
    let x = 0;
    let rowY = y;
    for (const skill of group.skills) {
      const width = chipWidth(skill.label, skill.icon, font);
      if (x > 0 && x + width > area) {
        x = 0;
        rowY += CHIP_H + GAP;
      }
      body += chip(PAD + LABEL_W + x, rowY, skill.label, skill.icon, style);
      x += width + GAP;
    }
    y = rowY + CHIP_H;
  });

  return doc({ width: W, height: y + PAD_Y, style, weights: [500, 700, 800], title: title ?? 'Skills', body });
}
