// Everything about how a card looks that its link can change, passed to every card

import { jetbrainsMono, type Font } from './fonts';
import { googleFont } from './google-fonts';
import { Problem } from './problem';
import { customTheme, hexColor, pickTheme, type Colors, type Theme } from './theme';

export interface Style {
  theme: Theme;
  font: Font;
}

/** The query keys a colour is read from, and the theme colour each one sets */
const COLOR_KEYS = { bg: 'bg', text: 'fg', muted: 'muted', accent: 'accent', border: 'border' } as const satisfies Record<string, keyof Colors>;

/** The query keys a style reads, which /skills mustn't take for groups */
export const STYLE_KEYS = ['theme', 'font', ...Object.keys(COLOR_KEYS)] as const;

export function defaultStyle(theme: Theme): Style {
  return { theme, font: jetbrainsMono };
}

function fontFrom(name: string | null) {
  if (!name?.trim() || name.trim().toLowerCase() === jetbrainsMono.name.toLowerCase()) return jetbrainsMono;
  return googleFont(name);
}

function colorsFrom(q: URLSearchParams) {
  const colors: Colors = {};
  for (const [key, color] of Object.entries(COLOR_KEYS)) {
    const value = q.get(key);
    if (value === null) continue;
    const hex = hexColor(value);
    if (!hex) throw new Problem(`${key}= takes a hex colour, like ${key}=a78bfa`, 400);
    colors[color] = hex;
  }
  return colors;
}

/** The style a card's link asks for; throws a Problem for an option that can't be drawn */
export async function styleFrom(q: URLSearchParams): Promise<Style> {
  const theme = customTheme(pickTheme(q.get('theme')), colorsFrom(q));
  return { theme, font: await fontFrom(q.get('font')) };
}
