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
const FONTS = ['JetBrains Mono', 'Inter', 'Geist', 'Space Grotesk', 'Space Mono', 'IBM Plex Mono', 'Fredoka', 'Nunito', 'Playfair Display', 'DM Serif Display', 'Orbitron', 'VT323'];

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
  { key: 'title-size', label: 'Title size', type: 'select', options: SIZES, default: 'md', half: true },
  { key: 'label-size', label: 'Label size', type: 'select', options: SIZES, default: 'md', half: true },
  { key: 'text-size', label: 'Text size', type: 'select', options: SIZES, default: 'md', half: true },
  { key: 'border', label: 'Outline', type: 'switch', default: true, half: true },
  { key: 'dividers', label: 'Dividers', type: 'switch', default: true, half: true },
];

function defaults(fields) {
  return Object.fromEntries(fields.map((f) => [f.key, f.initial ?? f.default ?? (f.type === 'switch' ? true : '')]));
}

const state = {
  type: 'card',
  values: Object.fromEntries(Object.entries(TYPES).map(([k, t]) => [k, defaults(t.fields)])),
  style: defaults(STYLE),
  previewTheme: theme(),
  snippet: 'html',
};

const hex = (v) => v.trim().replace(/^#/, '').toLowerCase();
const isHex = (v) => /^([0-9a-f]{3}|[0-9a-f]{6})$/.test(hex(v));

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

function cardPath() {
  const type = TYPES[state.type];
  const values = state.values[state.type];
  const q = new URLSearchParams();
  addParams(q, type.fields, values);
  addParams(q, STYLE, state.style);
  const query = q.toString();
  return type.path(values) + (query ? `?${query}` : '');
}

function snippet() {
  const type = TYPES[state.type];
  const url = location.origin + cardPath();
  if (state.snippet === 'url') return withTheme(url, state.previewTheme);
  const values = state.values[state.type];
  const alt = (state.type === 'badge' && (values.label || values.icon)) || (state.type === 'banner' && values.title) || type.alt;
  const attrs = `alt="${alt.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}"${type.width ? ` width="${type.width}"` : ''}`;
  // A card with its own background looks the same in both themes
  if (isHex(state.style.bg)) return `<img src="${url.replaceAll('&', '&amp;')}" ${attrs}>`;
  const amp = (s) => s.replaceAll('&', '&amp;');
  return `<picture>
  <source media="(prefers-color-scheme: dark)" srcset="${amp(withTheme(url, 'dark'))}">
  <img src="${amp(withTheme(url, 'light'))}" ${attrs}>
</picture>`;
}

function highlight(code) {
  const escaped = code.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  // Attributes first, so the second pass can't match the spans the first adds
  return escaped.replace(/ ([\w-]+)=/g, ' <span class="attr">$1</span>=').replace(/(&lt;\/?)(\w+)/g, '$1<span class="tag">$2</span>');
}

// Rendering the form

let uid = 0;

function control(f, values, onChange) {
  const id = `f${uid++}`;
  const wrap = document.createElement(f.type === 'switch' ? 'label' : 'div');
  wrap.className = `field${f.half ? ' half' : ''}`;
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

  if (f.type === 'color') {
    const box = document.createElement('div');
    box.className = 'color';
    const picker = document.createElement('input');
    picker.type = 'color';
    picker.setAttribute('aria-label', `${f.label}, picker`);
    input.spellcheck = false;
    const sync = () => {
      const ok = isHex(input.value);
      box.classList.toggle('unset', !ok);
      if (ok) {
        const h = hex(input.value);
        picker.value = `#${h.length === 3 ? [...h].map((c) => c + c).join('') : h}`;
      }
    };
    picker.addEventListener('input', () => {
      input.value = picker.value.slice(1);
      sync();
      onChange(f.key, input.value, true);
    });
    input.addEventListener('input', () => {
      sync();
      onChange(f.key, input.value);
    });
    sync();
    box.append(picker, input);
    wrap.append(box);
  } else {
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
  styleFields.replaceChildren(
    ...STYLE.map((f) =>
      control(f, state.style, (key, value, now) => {
        state.style[key] = value;
        update(now);
      }),
    ),
  );
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
  update(true);
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
  const src = withTheme(cardPath(), state.previewTheme);
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

function update(now) {
  renderSnippet();
  clearTimeout(timer);
  if (now) renderPreview();
  else timer = setTimeout(renderPreview, 350);
}

// Copy buttons

document.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-copy]');
  if (!button) return;
  try {
    await navigator.clipboard.writeText(snippet());
    button.classList.add('done');
    button.querySelector('span').textContent = 'Copied';
    setTimeout(() => {
      button.classList.remove('done');
      button.querySelector('span').textContent = 'Copy';
    }, 1500);
  } catch {
    getSelection().selectAllChildren(snippetEl);
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

paintCards();
renderTabs();
renderFields();
update(true);
