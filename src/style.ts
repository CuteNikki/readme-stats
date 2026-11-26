// Everything about how a card looks that its link can change, passed to every card

import { jetbrainsMono, type Font } from './fonts';
import { googleFont } from './google-fonts';
import { Problem } from './problem';
import { customTheme, hexColor, pickTheme, type Colors, type Theme } from './theme';

/** Named sizes, as multiples of each card's own: md is the card as designed */
export const SCALE = { xs: 0.8, sm: 0.9, md: 1, lg: 1.15, xl: 1.3 } as const;

export interface Style {
  theme: Theme;
  font: Font;
  /** Corner rounding in px; each card's own when not set */
  radius?: number;
  /** The outline around the card, and around the chips on it */
  border: boolean;
  /** The lines inside a card, between its parts */
  dividers: boolean;
  /** The space inside the card's edges, as a multiple of the card's own */
  padding: number;
  /** Text sizes as multiples: titles (names, the banner, the streak), labels (the small capitals), and the rest */
  sizes: { title: number; label: number; text: number };
}

/** The query keys a colour is read from, and the theme colour each one sets */
const COLOR_KEYS = { bg: 'bg', text: 'fg', muted: 'muted', accent: 'accent', border: 'border' } as const satisfies Record<string, keyof Colors>;
const SIZE_KEYS = ['title-size', 'label-size', 'text-size'] as const;
const MAX_RADIUS = 40;

/** The query keys a style reads, which /skills mustn't take for groups */
export const STYLE_KEYS = ['theme', 'font', 'radius', 'padding', 'dividers', ...Object.keys(COLOR_KEYS), ...SIZE_KEYS] as const;

export function defaultStyle(theme: Theme): Style {
  return { theme, font: jetbrainsMono, border: true, dividers: true, padding: 1, sizes: { title: 1, label: 1, text: 1 } };
}

/**
 * The style's sizes as functions of a card's own numbers: t(46) is the banner
 * title's size, p(28) a card's padding. tc(n) is for the room title text takes
 * up, which also follows how tall the font's capitals are next to JetBrains
 * Mono's, so a tall font doesn't run into what's above it.
 */
export function scales({ sizes, padding, font }: Style) {
  const cap = Math.min(Math.max(font.metrics.capHeight / jetbrainsMono.metrics.capHeight, 0.8), 1.5);
  return {
    t: (n: number) => n * sizes.title,
    l: (n: number) => n * sizes.label,
    x: (n: number) => n * sizes.text,
    p: (n: number) => n * padding,
    tc: (n: number) => n * sizes.title * cap,
    /** How tall the font's capitals are next to JetBrains Mono's */
    cap,
  };
}

function fontFrom(name: string | null) {
  if (!name?.trim() || name.trim().toLowerCase() === jetbrainsMono.name.toLowerCase()) return jetbrainsMono;
  return googleFont(name);
}

const NO = new Set(['false', 'none', 'no', '0']);

function colorsFrom(q: URLSearchParams) {
  const colors: Colors = {};
  for (const [key, color] of Object.entries(COLOR_KEYS)) {
    const value = q.get(key);
    // border=false is the outline, not a colour
    if (value === null || (key === 'border' && NO.has(value))) continue;
    const hex = hexColor(value);
    if (!hex) throw new Problem(key === 'border' ? 'border= takes a hex colour or false' : `${key}= takes a hex colour, like ${key}=a78bfa, or a78bfa80 to see through it`, 400);
    colors[color] = hex;
  }
  return colors;
}

function scaleFrom(q: URLSearchParams, key: string) {
  const value = q.get(key);
  if (value === null) return 1;
  if (!(value in SCALE)) throw new Problem(`${key}= takes ${Object.keys(SCALE).join(', ')}`, 400);
  return SCALE[value as keyof typeof SCALE];
}

function radiusFrom(value: string | null) {
  if (value === null) return undefined;
  const radius = Number(value);
  if (value.trim() === '' || !Number.isFinite(radius) || radius < 0 || radius > MAX_RADIUS) throw new Problem(`radius= takes a number from 0 to ${MAX_RADIUS}`, 400);
  return radius;
}

/** The style a card's link asks for; throws a Problem for an option that can't be drawn */
export async function styleFrom(q: URLSearchParams): Promise<Style> {
  const border = q.get('border');
  return {
    theme: customTheme(pickTheme(q.get('theme')), colorsFrom(q)),
    font: await fontFrom(q.get('font')),
    radius: radiusFrom(q.get('radius')),
    border: border === null || !NO.has(border),
    dividers: !NO.has(q.get('dividers') ?? ''),
    padding: scaleFrom(q, 'padding'),
    sizes: { title: scaleFrom(q, 'title-size'), label: scaleFrom(q, 'label-size'), text: scaleFrom(q, 'text-size') },
  };
}
