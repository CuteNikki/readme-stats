// The two looks every card comes in. Pick one with ?theme=dark or ?theme=light;
// a README shows the right one through <picture> and prefers-color-scheme.

export interface Theme {
  name: 'dark' | 'light';
  /** The card itself */
  bg: string;
  border: string;
  /** Dividers and empty tracks inside a card */
  line: string;
  fg: string;
  muted: string;
  /** Labels, highlights */
  accent: string;
  /** A tint of the accent, behind chips */
  accentSoft: string;
  /** Contribution graph, from no contributions to the most */
  levels: [string, string, string, string, string];
  /** Faint grid behind the banner */
  grid: string;
}

export const themes: Record<Theme['name'], Theme> = {
  dark: {
    name: 'dark',
    bg: '#121218',
    border: '#24242c',
    line: '#1f1f27',
    fg: '#ededf2',
    muted: '#9b9aa6',
    accent: '#a78bfa',
    accentSoft: '#2a1f47',
    levels: ['#1c1c24', '#33265a', '#55409a', '#7f62d9', '#b49cfc'],
    grid: '#1c1c24',
  },
  light: {
    name: 'light',
    bg: '#ffffff',
    border: '#e4e4e9',
    line: '#ececf0',
    fg: '#17161a',
    muted: '#5e5b66',
    accent: '#6d28d9',
    accentSoft: '#eee8f7',
    levels: ['#efeff3', '#ddd0fa', '#bba3f5', '#8f6aee', '#6d28d9'],
    grid: '#efedf7',
  },
};

export function pickTheme(value: string | null): Theme {
  return value === 'light' ? themes.light : themes.dark;
}

/**
 * "abc", "abcd", "aabbcc" or "aabbccdd", with or without "#", as "#aabbcc", or
 * "#aabbccdd" when it's see-through, or undefined if it isn't a hex colour
 */
export function hexColor(value: string) {
  let hex = value.trim().replace(/^#/, '').toLowerCase();
  if (!/^([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(hex)) return undefined;
  if (hex.length <= 4) hex = [...hex].map((c) => c + c).join('');
  // Fully opaque is the plain colour, so the link that says ff draws the same card
  return `#${hex.length === 8 && hex.endsWith('ff') ? hex.slice(0, 6) : hex}`;
}

interface Rgba {
  r: number;
  g: number;
  b: number;
  /** From 0 to 1 */
  a: number;
}

function rgba(hex: string): Rgba {
  const n = Number.parseInt(hex.slice(1, 7), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: hex.length === 9 ? Number.parseInt(hex.slice(7), 16) / 255 : 1 };
}

function toHex({ r, g, b, a }: Rgba) {
  const byte = (v: number) => Math.round(v).toString(16).padStart(2, '0');
  return `#${byte(r)}${byte(g)}${byte(b)}${a < 1 ? byte(a * 255) : ''}`;
}

/** The colour on top as it looks over the one below, which is opaque */
function over(top: string, below: string) {
  const t = rgba(top);
  const u = rgba(below);
  return toHex({ r: t.r * t.a + u.r * (1 - t.a), g: t.g * t.a + u.g * (1 - t.a), b: t.b * t.a + u.b * (1 - t.a), a: 1 });
}

/**
 * The colour t of the way from a card's background a to b, for something drawn
 * on that background. On a see-through background it's b itself, see-through
 * by as much, so it looks the same over whatever page is behind the card.
 */
function mix(a: string, b: string, t: number) {
  const bg = rgba(a);
  const top = rgba(b);
  if (bg.a < 1) return toHex({ ...top, a: top.a * t });
  const y = rgba(over(b, a));
  return toHex({ r: bg.r * (1 - t) + y.r * t, g: bg.g * (1 - t) + y.g * t, b: bg.b * (1 - t) + y.b * t, a: 1 });
}

export interface Colors {
  bg?: string;
  fg?: string;
  muted?: string;
  accent?: string;
  border?: string;
}

/**
 * A theme with some of its colours swapped. The ones nobody names are mixed
 * from those that are, the way the two built-in themes are put together:
 * dividers a little towards the text, chips and the graph towards the accent.
 */
export function customTheme(base: Theme, colors: Colors): Theme {
  if (Object.values(colors).every((c) => c === undefined)) return base;
  const bg = colors.bg ?? base.bg;
  // A dark bg on the light theme keeps light text rather than its own dark text, and the other way round
  const solid = over(bg, themes[base.name].bg);
  const fg = colors.fg ?? (contrast(base.fg, solid) >= 4.5 ? base.fg : [themes.dark.fg, themes.light.fg].sort((a, b) => contrast(b, solid) - contrast(a, solid))[0]!);
  const accent = colors.accent ?? base.accent;
  const theme: Theme = { ...base, bg, fg, accent, levels: [...base.levels] };
  if (colors.bg || colors.fg) {
    theme.line = mix(bg, fg, 0.07);
    theme.border = mix(bg, fg, 0.11);
    theme.muted = mix(bg, fg, 0.65);
    theme.levels[0] = mix(bg, fg, 0.06);
  }
  if (colors.bg || colors.accent) {
    theme.accentSoft = mix(bg, accent, 0.18);
    theme.grid = mix(bg, accent, 0.07);
    theme.levels = [theme.levels[0], mix(bg, accent, 0.3), mix(bg, accent, 0.55), mix(bg, accent, 0.8), accent];
  }
  if (colors.muted) theme.muted = colors.muted;
  if (colors.border) theme.border = colors.border;
  return theme;
}

function luminance(hex: string) {
  const { r, g, b } = rgba(hex);
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Between two opaque colours */
export function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * A brand colour that still shows up on the card: Bun, Next.js and X are
 * black, which would vanish on the dark card, and some yellows vanish on the
 * light one. Those fall back to the text colour.
 */
export function readable(color: string, theme: Theme, min = 1.8) {
  // A see-through card is taken to be on its theme's own background
  const bg = over(theme.bg, themes[theme.name].bg);
  return contrast(over(color, bg), bg) >= min ? color : theme.fg;
}
