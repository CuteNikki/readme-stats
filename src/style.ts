// Everything about how a card looks that its link can change, passed to every card

import { jetbrainsMono, type Font } from './fonts';
import { googleFont } from './google-fonts';
import { pickTheme, type Theme } from './theme';

export interface Style {
  theme: Theme;
  font: Font;
}

/** The query keys a style reads, which /skills mustn't take for groups */
export const STYLE_KEYS = ['theme', 'font'] as const;

export function defaultStyle(theme: Theme): Style {
  return { theme, font: jetbrainsMono };
}

function fontFrom(name: string | null) {
  if (!name?.trim() || name.trim().toLowerCase() === jetbrainsMono.name.toLowerCase()) return jetbrainsMono;
  return googleFont(name);
}

/** The style a card's link asks for; throws a Problem for a font that can't be had */
export async function styleFrom(q: URLSearchParams): Promise<Style> {
  return { theme: pickTheme(q.get('theme')), font: await fontFrom(q.get('font')) };
}
