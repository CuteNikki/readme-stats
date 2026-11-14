// Everything about how a card looks that its link can change, passed to every card

import { jetbrainsMono, type Font } from './fonts';
import type { Theme } from './theme';

export interface Style {
  theme: Theme;
  font: Font;
}

export function defaultStyle(theme: Theme): Style {
  return { theme, font: jetbrainsMono };
}
