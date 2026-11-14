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

/** "abc", "#abc" or "aabbcc" as "#aabbcc", or undefined if it isn't a hex colour */
export function hexColor(value: string) {
  const hex = value.trim().replace(/^#/, '').toLowerCase();
  if (/^[0-9a-f]{3}$/.test(hex)) return `#${[...hex].map((c) => c + c).join('')}`;
  if (/^[0-9a-f]{6}$/.test(hex)) return `#${hex}`;
  return undefined;
}

/** The colour t of the way from a to b */
function mix(a: string, b: string, t: number) {
  const [x, y] = [a, b].map((c) => Number.parseInt(c.slice(1), 16));
  const channel = (shift: number) => Math.round(((x! >> shift) & 255) * (1 - t) + ((y! >> shift) & 255) * t);
  return `#${((channel(16) << 16) | (channel(8) << 8) | channel(0)).toString(16).padStart(6, '0')}`;
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
  const fg = colors.fg ?? (contrast(base.fg, bg) >= 4.5 ? base.fg : [themes.dark.fg, themes.light.fg].sort((a, b) => contrast(b, bg) - contrast(a, bg))[0]!);
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
  const n = Number.parseInt(hex.replace('#', ''), 16);
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

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
  return contrast(color, theme.bg) >= min ? color : theme.fg;
}
