// The page's theme, the cards that follow it, and the builder

const root = document.documentElement;
const dark = matchMedia('(prefers-color-scheme: dark)');
const users = window.STATS.users;

function theme() {
  return root.dataset.theme ?? (dark.matches ? 'dark' : 'light');
}

function withTheme(path, name) {
  return `${path}${path.includes('?') ? '&' : '?'}theme=${name}`;
}

function paintCards() {
  for (const img of document.querySelectorAll('img[data-card]')) img.src = withTheme(img.dataset.card, theme());
}

document.getElementById('theme-toggle').addEventListener('click', () => {
  const next = theme() === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  try {
    localStorage.setItem('theme', next);
  } catch {}
  paintCards();
  setPreviewTheme(next);
});
dark.addEventListener('change', () => {
  if (root.dataset.theme) return;
  paintCards();
  setPreviewTheme(theme());
});

// Builder

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'];
const FONTS = ['JetBrains Mono', 'Inter', 'Geist', 'Outfit', 'Sora', 'Manrope', 'Lexend', 'Space Grotesk', 'Space Mono', 'IBM Plex Mono', 'Fira Code', 'Fredoka', 'Nunito', 'Lora', 'Source Serif 4', 'Playfair Display', 'DM Serif Display', 'Orbitron', 'VT323'];

const userField = { key: 'user', label: 'Account', type: 'select', options: users, default: users[0] };

/**
 * Each card's fields. A field's value goes in the query under its key, unless
 * it's part of the path. default is what the server draws without it, so it's
 * left out; initial only fills the field in to start with.
 */
const TYPES = {
  card: {
    label: 'Profile',
    alt: 'GitHub stats',
    width: '100%',
    path: () => '/card',
    fields: [
      userField,
      { key: 'graph', label: 'Contribution graph', type: 'switch', default: true },
      { key: 'langs', label: 'Languages', type: 'number', min: 1, max: 8, default: '5', half: true },
      { key: 'by', label: 'Rank by', type: 'select', options: ['mixed', 'bytes', 'repos'], default: 'mixed', half: true },
      { key: 'hide', label: 'Hide languages', type: 'text', placeholder: 'html, css', list: true },
    ],
  },
  repo: {
    label: 'Project',
    alt: 'A project card',
    width: '49%',
    path: (v) => `/repo/${encodeURIComponent(v.owner)}/${encodeURIComponent(v.repo || 'readme-stats')}`,
    fields: [
      { ...userField, key: 'owner', label: 'Owner', path: true, half: true },
      { key: 'repo', label: 'Repo', type: 'text', default: 'readme-stats', placeholder: 'readme-stats', path: true, half: true },
      { key: 'label', label: 'Label', type: 'text', placeholder: 'The first topic' },
      { key: 'desc', label: 'Description', type: 'text', placeholder: "The repo's own" },
    ],
  },
  skills: {
    label: 'Skills',
    alt: 'Skills',
    width: '100%',
    path: () => '/skills',
    fields: [
      { key: 'title', label: 'Title', type: 'text', placeholder: 'None' },
      {
        key: 'groups',
        label: 'Groups',
        type: 'textarea',
        groups: true,
        initial: 'languages: typescript, javascript, java\nfrontend: react, nextdotjs, tailwindcss\ndesign: figma, ai, ps',
        hint: 'A line per group. Icons are Simple Icons slugs; give one a label as react:React Native.',
      },
    ],
  },
  badge: {
    label: 'Badge',
    alt: 'Badge',
    path: (v) => (v.icon ? `/badge/${encodeURIComponent(v.icon)}` : '/badge'),
    fields: [
      { key: 'icon', label: 'Icon', type: 'text', default: 'discord', placeholder: 'discord', path: true, half: true },
      { key: 'color', label: 'Icon colour', type: 'color', placeholder: 'Brand', half: true },
      { key: 'label', label: 'Label', type: 'text', placeholder: "The icon's name", half: true },
      { key: 'value', label: 'Value', type: 'text', placeholder: 'None', half: true },
    ],
  },
  banner: {
    label: 'Banner',
    alt: 'Banner',
    width: '100%',
    path: () => '/banner',
    fields: [
      { key: 'label', label: 'Label', type: 'text', initial: 'developer & designer', placeholder: 'None' },
      { key: 'title', label: 'Title', type: 'text', initial: `Hey, I'm ${users[0]}`, placeholder: `Hey, I'm ${users[0]}` },
      { key: 'subtitle', label: 'Subtitle', type: 'text', initial: 'Full-stack work, mostly TypeScript', placeholder: 'None' },
      { key: 'grid', label: 'Grid', type: 'switch', default: true, half: true },
      { key: 'glow', label: 'Glow', type: 'switch', default: true, half: true },
    ],
  },
  views: {
    label: 'Views',
    alt: 'Profile views',
    path: () => '/views',
    fields: [
      userField,
      { key: 'label', label: 'Label', type: 'text', placeholder: 'profile views', half: true },
      { key: 'since', label: 'Since', type: 'text', placeholder: '2026-07', half: true },
    ],
  },
};

const STYLE = [
  { key: 'font', label: 'Font', type: 'text', placeholder: 'JetBrains Mono', datalist: FONTS, hint: 'Any family on Google Fonts.' },
  { key: 'accent', label: 'Accent', type: 'color', placeholder: 'Theme', half: true },
  { key: 'bg', label: 'Background', type: 'color', placeholder: 'Theme', half: true },
  { key: 'text', label: 'Text', type: 'color', placeholder: 'Theme', half: true },
  { key: 'muted', label: 'Muted', type: 'color', placeholder: 'Theme', half: true },
  { key: 'borderColor', param: 'border', label: 'Border', type: 'color', placeholder: 'Theme', half: true },
  { key: 'radius', label: 'Corners', type: 'number', min: 0, max: 40, placeholder: 'Card\'s own', half: true },
  { key: 'padding', label: 'Padding', type: 'select', options: SIZES, default: 'md', half: true },
  { key: 'title-size', label: 'Title size', type: 'select', options: SIZES, default: 'md', third: true },
  { key: 'label-size', label: 'Label size', type: 'select', options: SIZES, default: 'md', third: true },
  { key: 'text-size', label: 'Text size', type: 'select', options: SIZES, default: 'md', third: true },
  { key: 'border', label: 'Outline', type: 'switch', default: true, half: true },
  { key: 'dividers', label: 'Dividers', type: 'switch', default: true, half: true },
];

function defaults(fields) {
  return Object.fromEntries(fields.map((f) => [f.key, f.initial ?? f.default ?? (f.type === 'switch' ? true : '')]));
}

const COLORS = STYLE.filter((f) => f.type === 'color');

/**
 * Looks to start from. style is everything but colours, plus colours for both
 * themes; dark and light give each theme its own.
 */
const PRESETS = [
  { name: 'Default', style: {} },
  {
    name: 'Pastel',
    style: { font: 'Fredoka', radius: '28', padding: 'lg', 'text-size': 'lg', 'title-size': 'lg' },
    dark: { bg: '2a1520', text: 'ffe3f0', accent: 'ff7eb6', borderColor: '4a2537' },
    light: { bg: 'fff0f6', text: '6b2c4a', accent: 'ff5fa2', borderColor: 'ffc2dc' },
  },
  {
    name: 'Ocean',
    style: { font: 'Inter', radius: '16' },
    dark: { bg: '0b1622', text: 'e6f1ff', accent: '38bdf8', borderColor: '1e3a5f' },
    light: { bg: 'f0f9ff', text: '0c2a43', accent: '0369a1', borderColor: 'bae6fd' },
  },
  {
    name: 'Forest',
    style: { font: 'IBM Plex Mono', radius: '10' },
    dark: { bg: '0f1a14', text: 'e3f2e8', accent: '4ade80', borderColor: '1f3a2a' },
    light: { bg: 'f2fbf5', text: '14301f', accent: '15803d', borderColor: 'bbf7d0' },
  },
  {
    name: 'Editorial',
    style: { font: 'Playfair Display', radius: '4', padding: 'lg', 'title-size': 'xl' },
    dark: { bg: '1f1a14', text: 'efe6d6', muted: 'a89880', accent: 'd98a5b', borderColor: '3a3128' },
    light: { bg: 'f7f1e6', text: '2a2118', muted: '6e5f4c', accent: 'a0522d', borderColor: 'd9ccb6' },
  },
  {
    name: 'Swiss',
    style: { font: 'Space Grotesk', radius: '0', padding: 'lg', 'title-size': 'xl' },
    dark: { bg: '0a0a0a', text: 'f5f5f5', muted: 'a3a3a3', accent: 'ff4d1a', borderColor: 'f5f5f5' },
    light: { bg: 'ffffff', text: '0a0a0a', muted: '5a5a5a', accent: 'ff3b00', borderColor: '0a0a0a' },
  },
  {
    name: 'Glass',
    style: { font: 'Inter', radius: '20' },
    dark: { bg: 'ffffff0d', borderColor: 'ffffff24' },
    light: { bg: '0000000a', borderColor: '0000001f' },
  },
  {
    name: 'Terminal',
    style: { font: 'VT323', radius: '0', 'text-size': 'xl', 'label-size': 'xl', 'title-size': 'xl', bg: '050a05', text: 'b6ffc4', muted: '4fbf6a', accent: '39ff6a', borderColor: '1f5c2c' },
  },
  {
    name: 'Synthwave',
    style: { font: 'Orbitron', radius: '12', bg: '140a2e', text: 'f5e9ff', muted: 'b69ad8', accent: 'ff2bd6', borderColor: '3d1f73' },
  },
  {
    name: 'Minimal',
    // A serif made for text: DM Serif Display, the gallery's, is for headlines and smears at a card's small sizes
    style: { font: 'Lora', border: false, dividers: false },
    dark: { accent: 'f5f5f5' },
    light: { accent: '111111' },
  },
];

/** The cards' own colours, for a preset's swatch where it keeps them */
const THEME_COLORS = {
  dark: { bg: '121218', text: 'ededf2', accent: 'a78bfa' },
  light: { bg: 'ffffff', text: '17161a', accent: '6d28d9' },
};

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const between = (a, b) => a + Math.random() * (b - a);

/** An HSL colour as hex without the # */
function hsl(h, s, l) {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    return l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [f(0), f(8), f(4)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
}

/** A look made up on the spot: a font, corners and a palette in one hue, light and dark */
function randomLook() {
  const h = Math.floor(Math.random() * 360);
  const h2 = (h + pick([0, 0, 30, 150, 180, 330])) % 360;
  const font = pick(FONTS);
  const style = {
    font: font === 'JetBrains Mono' ? '' : font,
    radius: pick(['0', '4', '8', '', '20', '28']),
    padding: pick(['sm', 'md', 'md', 'lg']),
    'title-size': pick(['md', 'lg', 'xl']),
    dividers: Math.random() < 0.7,
    border: Math.random() < 0.85,
  };
  const dark = { accent: hsl(h2, between(70, 95), between(65, 74)) };
  const light = { accent: hsl(h2, between(65, 85), between(38, 46)) };
  // Mostly a tinted background, sometimes the cards' own with only the accent changed
  if (Math.random() < 0.75) {
    Object.assign(dark, { bg: hsl(h, between(20, 45), between(6, 11)), text: hsl(h, 25, 93), borderColor: hsl(h, 25, 19) });
    Object.assign(light, { bg: hsl(h, between(40, 80), between(95, 98)), text: hsl(h, 35, 13), borderColor: hsl(h, 40, 86) });
  }
  return { name: 'Random', style, dark, light };
}

const state = {
  type: 'card',
  values: Object.fromEntries(Object.entries(TYPES).map(([k, t]) => [k, defaults(t.fields)])),
  style: defaults(STYLE),
  /** With split, the light version's colours; style's are the dark one's */
  split: false,
  light: defaults(COLORS),
  previewTheme: theme(),
  snippet: 'html',
};

const hex = (v) => v.trim().replace(/^#/, '').toLowerCase();
const isHex = (v) => /^([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(hex(v));
/** A hex colour with its digits doubled out: 6 digits, or 8 with see-through */
const expand = (v) => (hex(v).length <= 4 ? [...hex(v)].map((c) => c + c).join('') : hex(v));
const isOpaque = (v) => isHex(v) && (expand(v).length === 6 || expand(v).endsWith('ff'));

/** The fields' values as query parameters, in order, leaving out defaults */
function addParams(q, fields, values) {
  for (const f of fields) {
    const value = values[f.key];
    if (f.path) continue;
    if (f.groups) {
      for (const line of value.split('\n')) {
        const [name, list] = line.split(/:(.*)/s);
        if (!name?.trim() || !list?.trim()) continue;
        q.append(name.trim().replace(/\s+/g, '_'), list.split(',').map((s) => s.trim()).filter(Boolean).join(','));
      }
      continue;
    }
    if (f.type === 'switch') {
      if (value !== f.default) q.append(f.param ?? f.key, String(value));
      continue;
    }
    if (f.type === 'color') {
      if (!isHex(value)) continue;
      if (f.key === 'borderColor' && values.border === false) continue;
      q.append(f.param ?? f.key, hex(value));
      continue;
    }
    const text = f.list ? value.split(',').map((s) => s.trim()).filter(Boolean).join(',') : value.trim();
    if (text === '' || text === f.default) continue;
    q.append(f.param ?? f.key, text);
  }
}

/** The style for one theme's link: the light one takes its own colours when split */
function styleFor(name) {
  return state.split && name === 'light' ? { ...state.style, ...state.light } : state.style;
}

function cardPath(name) {
  const type = TYPES[state.type];
  const values = state.values[state.type];
  const q = new URLSearchParams();
  addParams(q, type.fields, values);
  addParams(q, STYLE, styleFor(name));
  const query = q.toString();
  return type.path(values) + (query ? `?${query}` : '');
}

function snippet() {
  const type = TYPES[state.type];
  const url = (name) => location.origin + cardPath(name);
  if (state.snippet === 'url') return withTheme(url(state.previewTheme), state.previewTheme);
  const values = state.values[state.type];
  const alt = (state.type === 'badge' && (values.label || values.icon)) || (state.type === 'banner' && values.title) || type.alt;
  const attrs = `alt="${alt.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}"${type.width ? ` width="${type.width}"` : ''}`;
  const amp = (s) => s.replaceAll('&', '&amp;');
  // A card with its own solid background looks the same in both themes
  if (!state.split && isOpaque(state.style.bg)) return `<img src="${amp(url('dark'))}" ${attrs}>`;
  return `<picture>
  <source media="(prefers-color-scheme: dark)" srcset="${amp(withTheme(url('dark'), 'dark'))}">
  <img src="${amp(withTheme(url('light'), 'light'))}" ${attrs}>
</picture>`;
}

function highlight(code) {
  const escaped = code.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  // Attributes first, so the second pass can't match the spans the first adds
  return escaped.replace(/ ([\w-]+)=/g, ' <span class="attr">$1</span>=').replace(/(&lt;\/?)(\w+)/g, '$1<span class="tag">$2</span>');
}

// Rendering the form

let uid = 0;

/**
 * A hex field with a swatch that opens the colour picker. The swatch shows
 * see-through colours over a checkerboard; the picker only knows solid ones,
 * so picking keeps the field's see-through digits.
 */
function colorBox(f, values, onChange, id, name) {
  const box = document.createElement('div');
  box.className = 'color';
  const picker = document.createElement('input');
  picker.type = 'color';
  picker.setAttribute('aria-label', `${name}, picker`);
  const swatch = document.createElement('span');
  swatch.className = 'swatch';
  const input = document.createElement('input');
  input.type = 'text';
  input.id = id;
  input.className = 'input';
  input.spellcheck = false;
  input.value = values[f.key];
  input.placeholder = f.placeholder ?? '';
  if (name !== f.label) input.setAttribute('aria-label', name);
  const sync = () => {
    if (!isHex(input.value)) return swatch.style.removeProperty('--swatch');
    picker.value = `#${expand(input.value).slice(0, 6)}`;
    swatch.style.setProperty('--swatch', `#${expand(input.value)}`);
  };
  picker.addEventListener('input', () => {
    input.value = picker.value.slice(1) + (isHex(input.value) ? expand(input.value).slice(6) : '');
    sync();
    onChange(f.key, input.value, true);
  });
  input.addEventListener('input', () => {
    sync();
    onChange(f.key, input.value);
  });
  sync();
  box.append(picker, swatch, input);
  return box;
}

function control(f, values, onChange) {
  const id = `f${uid++}`;
  const wrap = document.createElement(f.type === 'switch' ? 'label' : 'div');
  wrap.className = `field${f.half ? ' half' : ''}${f.third ? ' third' : ''}`;
  const value = values[f.key];

  if (f.type === 'switch') {
    wrap.className = `field switch${f.half ? ' half' : ''}`;
    wrap.innerHTML = `<span>${f.label}</span><input type="checkbox" role="switch"><span></span>`;
    const input = wrap.querySelector('input');
    input.checked = value;
    input.addEventListener('change', () => onChange(f.key, input.checked, true));
    return wrap;
  }

  const label = document.createElement('label');
  label.className = 'field-label';
  label.htmlFor = id;
  label.textContent = f.label;
  wrap.append(label);

  if (f.type === 'color') {
    wrap.append(colorBox(f, values, onChange, id, f.label));
  } else {
    let input;
    if (f.type === 'select') {
      input = document.createElement('select');
      for (const option of f.options) input.append(new Option(option, option));
    } else if (f.type === 'textarea') {
      input = document.createElement('textarea');
      input.rows = 4;
      input.spellcheck = false;
    } else {
      input = document.createElement('input');
      input.type = f.type === 'number' ? 'number' : 'text';
      if (f.min !== undefined) input.min = f.min;
      if (f.max !== undefined) input.max = f.max;
      if (f.type === 'number') input.inputMode = 'numeric';
    }
    input.id = id;
    input.className = 'input';
    input.value = value;
    if (f.placeholder) input.placeholder = f.placeholder;
    if (f.datalist) {
      const list = document.createElement('datalist');
      list.id = `${id}-list`;
      for (const name of f.datalist) list.append(new Option(name));
      input.setAttribute('list', list.id);
      wrap.append(list);
    }
    input.addEventListener(f.type === 'select' ? 'change' : 'input', () => onChange(f.key, input.value, f.type === 'select'));
    wrap.append(input);
  }

  if (f.hint) {
    const hint = document.createElement('span');
    hint.className = 'hint';
    hint.textContent = f.hint;
    wrap.append(hint);
  }
  return wrap;
}

const typeTabs = document.getElementById('type-tabs');
const typeFields = document.getElementById('type-fields');
const styleFields = document.getElementById('style-fields');

function renderTabs() {
  typeTabs.replaceChildren(
    ...Object.entries(TYPES).map(([key, t]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.role = 'tab';
      button.textContent = t.label;
      button.setAttribute('aria-selected', String(key === state.type));
      button.addEventListener('click', () => {
        state.type = key;
        renderTabs();
        renderFields();
        update(true);
      });
      return button;
    }),
  );
}

const SHUFFLE =
  '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m18 14 4 4-4 4"/><path d="m18 2 4 4-4 4"/><path d="M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-7.6a4 4 0 0 1 3.3-1.7H22"/><path d="M2 6h1.972a4 4 0 0 1 3.6 2.2"/><path d="M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45"/></svg>';

function applyLook(look) {
  state.style = { ...defaults(STYLE), ...look.style, ...look.dark };
  state.split = Boolean(look.light);
  state.light = { ...defaults(COLORS), ...look.light };
  renderFields();
  update(true);
}

let presetsEl;

/** The presets, with swatches in the preview's theme, and the randomizer */
function presets() {
  const box = document.createElement('div');
  box.className = 'field presets';
  box.innerHTML = `<div class="presets-head"><span class="field-label">Presets</span><button type="button" class="btn btn-outline btn-sm">${SHUFFLE}<span>Random</span></button></div><div class="preset-grid"></div>`;
  box.querySelector('button').addEventListener('click', () => applyLook(randomLook()));
  const grid = box.querySelector('.preset-grid');
  for (const look of PRESETS) {
    const colors = { ...THEME_COLORS[state.previewTheme], ...look.style, ...(state.previewTheme === 'light' && look.light ? look.light : look.dark) };
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'preset';
    button.innerHTML = `<span class="dots" aria-hidden="true">${['bg', 'text', 'accent'].map((k) => `<i style="--c:#${expand(colors[k])}"></i>`).join('')}</span><span>${look.name}</span>`;
    button.addEventListener('click', () => applyLook(look));
    grid.append(button);
  }
  presetsEl = box;
  return box;
}

function splitSwitch() {
  return control({ key: 'split', label: 'Separate dark and light colours', type: 'switch' }, state, (_, on) => {
    state.split = on;
    // The light version starts with the colours there are, so nothing changes until one does
    if (on) state.light = Object.fromEntries(COLORS.map((f) => [f.key, state.style[f.key]]));
    renderFields();
    update(true);
  });
}

/** Each colour twice, the dark version's and the light one's */
function splitColors(onStyle) {
  const grid = document.createElement('div');
  grid.className = 'field split-colors';
  grid.innerHTML = '<span class="split-spacer"></span><span class="hint">Dark</span><span class="hint">Light</span>';
  const onLight = (key, value, now) => {
    state.light[key] = value;
    update(now);
  };
  for (const f of COLORS) {
    const id = `f${uid++}`;
    const label = document.createElement('label');
    label.className = 'field-label';
    label.htmlFor = id;
    label.textContent = f.label;
    grid.append(label, colorBox(f, state.style, onStyle, id, `${f.label}, dark`), colorBox(f, state.light, onLight, `f${uid++}`, `${f.label}, light`));
  }
  return grid;
}

function colorHint() {
  const hint = document.createElement('p');
  hint.className = 'field hint';
  hint.textContent = 'Two more digits make a colour see-through: 12121880, or 00 for none.';
  return hint;
}

function renderFields() {
  const values = state.values[state.type];
  typeFields.replaceChildren(
    ...TYPES[state.type].fields.map((f) =>
      control(f, values, (key, value, now) => {
        values[key] = value;
        update(now);
      }),
    ),
  );
  const onStyle = (key, value, now) => {
    state.style[key] = value;
    update(now);
  };
  const nodes = [presets()];
  for (const f of STYLE) {
    if (f.type !== 'color') nodes.push(control(f, state.style, onStyle));
    else if (f === COLORS[0]) nodes.push(splitSwitch(), ...(state.split ? [splitColors(onStyle)] : COLORS.map((c) => control(c, state.style, onStyle))), colorHint());
  }
  styleFields.replaceChildren(...nodes);
}

// Segmented controls

function segmented(id, get, set) {
  const group = document.getElementById(id);
  const paint = () => {
    for (const b of group.querySelectorAll('button')) b.setAttribute('aria-checked', String(b.dataset.value === get()));
  };
  group.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    set(button.dataset.value);
    paint();
  });
  paint();
  return paint;
}

const paintPreviewTheme = segmented(
  'preview-theme',
  () => state.previewTheme,
  (value) => {
    state.previewTheme = value;
    presetsEl?.replaceWith(presets());
    update(true);
  },
);
segmented(
  'snippet-kind',
  () => state.snippet,
  (value) => {
    state.snippet = value;
    renderSnippet();
  },
);

function setPreviewTheme(value) {
  state.previewTheme = value;
  paintPreviewTheme();
  presetsEl?.replaceWith(presets());
  update(true, true);
}

// Preview and snippet

const preview = document.getElementById('preview');
const previewImg = document.getElementById('preview-img');
const snippetEl = document.getElementById('snippet');
let timer;
let wanted = '';

function renderSnippet() {
  snippetEl.innerHTML = highlight(snippet());
}

/** Shows the new card once it's loaded, so the preview doesn't flash empty */
function renderPreview() {
  const src = withTheme(cardPath(state.previewTheme), state.previewTheme);
  preview.dataset.theme = state.previewTheme;
  if (src === wanted) return;
  wanted = src;
  previewImg.classList.add('loading');
  const next = new Image();
  next.onload = next.onerror = () => {
    if (wanted !== src) return;
    previewImg.src = src;
    previewImg.classList.remove('loading');
  };
  next.src = src;
}

/** The builder's link, so a card being built can be shared or bookmarked */
function shareHash() {
  const path = cardPath('dark');
  const q = new URLSearchParams();
  if (state.split) {
    q.append('colors', 'per-theme');
    for (const f of COLORS) {
      if (!isHex(state.light[f.key]) || (f.key === 'borderColor' && state.style.border === false)) continue;
      q.append(`light-${f.param ?? f.key}`, hex(state.light[f.key]));
    }
  }
  q.append('theme', state.previewTheme);
  return `#${path}${path.includes('?') ? '&' : '?'}${q}`;
}

/** Whether the card was changed since the page opened: until then the address stays clean */
let touched = false;

function update(now, quiet = false) {
  renderSnippet();
  clearTimeout(timer);
  if (now) renderPreview();
  else timer = setTimeout(renderPreview, 350);
  if (!quiet) touched = true;
  if (touched && location.hash !== shareHash()) history.replaceState(null, '', shareHash());
}

// Copy buttons

document.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-copy]');
  if (!button) return;
  const link = button.dataset.copy === 'link';
  const label = button.querySelector('span');
  label.dataset.idle ??= label.textContent;
  try {
    if (link) history.replaceState(null, '', shareHash());
    await navigator.clipboard.writeText(link ? location.href : snippet());
    button.classList.add('done');
    label.textContent = 'Copied';
    setTimeout(() => {
      button.classList.remove('done');
      label.textContent = label.dataset.idle;
    }, 1500);
  } catch {
    if (!link) getSelection().selectAllChildren(snippetEl);
  }
});

// Edit: opens a card's link in the builder

const NO = new Set(['false', 'none', 'no', '0']);

function load(path) {
  const url = new URL(path, location.origin);
  const parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  const type = { card: 'card', repo: 'repo', skills: 'skills', badge: 'badge', banner: 'banner', views: 'views' }[parts[0]];
  if (!type) return;
  const fields = TYPES[type].fields;
  const values = defaults(fields);
  const style = defaults(STYLE);
  const light = defaults(COLORS);
  let split = false;
  if (type === 'repo') [values.owner, values.repo] = parts.length > 2 ? [parts[1], parts[2]] : [users[0], parts[1]];
  if (type === 'badge') values.icon = parts[1] ?? '';
  if (type === 'skills') values.groups = '';
  if (type === 'banner') for (const key of ['label', 'title', 'subtitle']) values[key] = '';

  const groups = [];
  for (const [key, value] of url.searchParams) {
    if (key === 'theme') {
      state.previewTheme = value === 'light' ? 'light' : 'dark';
      continue;
    }
    // The share link's own keys: the light version's colours
    if (key === 'colors') {
      split = value === 'per-theme';
      continue;
    }
    if (key.startsWith('light-')) {
      const name = key.slice('light-'.length);
      const f = COLORS.find((c) => (c.param ?? c.key) === name);
      if (f) light[f.key] = value;
      split = true;
      continue;
    }
    if (key === 'border') {
      if (NO.has(value)) style.border = false;
      else style.borderColor = value;
      continue;
    }
    const sf = STYLE.find((f) => (f.param ?? f.key) === key);
    const tf = fields.find((f) => (f.param ?? f.key) === key && !f.path && !f.groups);
    const f = tf ?? sf;
    if (f) (tf ? values : style)[f.key] = f.type === 'switch' ? !NO.has(value) : f.list ? value.split(',').join(', ') : value;
    else if (type === 'skills' && key !== 'user' && key !== 'v') groups.push(`${key.replaceAll('_', ' ')}: ${value.split(',').join(', ')}`);
  }
  if (type === 'skills') values.groups = groups.join('\n');

  state.type = type;
  state.values[type] = values;
  state.style = style;
  state.split = split;
  state.light = light;
  paintPreviewTheme();
  renderTabs();
  renderFields();
  update(true);
  document.getElementById('builder').scrollIntoView();
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-edit]');
  if (button) load(button.dataset.edit);
});

// A shared link: #/card?user=...&theme=light
function fromHash() {
  if (location.hash.startsWith('#/') && location.hash !== shareHash()) load(location.hash.slice(1));
}
addEventListener('hashchange', fromHash);

paintCards();
renderTabs();
renderFields();
update(true, true);
fromHash();
