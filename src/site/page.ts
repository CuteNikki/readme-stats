// What / shows: what the cards are, a builder that makes a card's link and the
// README snippet for it, and a few looks to start from

import { siGithub } from 'simple-icons';
import { config } from '../config';

const REPO = 'https://github.com/CuteNikki/readme-stats';

function escape(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

/** Lucide's icons, drawn with the text colour */
const lucide = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  pencil: '<path d="M21.17 6.81a2.83 2.83 0 0 0-4-4L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"/>',
  arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
};

function svgIcon(name: keyof typeof lucide, className = 'icon') {
  return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${lucide[name]}</svg>`;
}

const github = `<svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${siGithub.path}"/></svg>`;

/** A card that follows the page's theme: the script sets src from data-card */
function card(path: string, alt: string, width: number, height: number, className = '') {
  return `<img class="card-img ${className}" data-card="${escape(path)}" alt="${escape(alt)}" width="${width}" height="${height}">`;
}

/** what is snippet or link: the README snippet, or the builder's own address */
function copyButton(what: 'snippet' | 'link', label: string, icon: keyof typeof lucide = 'copy') {
  return `<button type="button" class="btn btn-ghost btn-sm copy" data-copy="${what}">${svgIcon(icon, 'icon when-idle')}${svgIcon('check', 'icon when-done')}<span>${label}</span></button>`;
}

export function page() {
  const user = config.defaultUser;
  const u = encodeURIComponent(user);

  const cards = [
    {
      name: 'Profile card',
      path: `/card?user=${u}`,
      text: 'Commits, pull requests, stars, the current streak, top languages and a year of contributions, in one card.',
      size: [880, 462],
    },
    {
      name: 'Project card',
      path: `/repo/${u}/readme-stats`,
      text: 'A repo with its description, language, stars and forks. Show more than six pins.',
      size: [420, 164],
    },
    {
      name: 'Skills',
      path: '/skills?languages=typescript%2Cjavascript%2Cjava&frontend=react%2Cnextdotjs%2Ctailwindcss&design=figma%2Cai%2Cps',
      text: 'Every tool you use in one picture, a row per group, with logos from Simple Icons.',
      size: [880, 234],
    },
    {
      name: 'Banner',
      path: `/banner?label=developer%20%26%20designer&title=Hey%2C%20I'm%20${u}&subtitle=Full-stack%20work%2C%20mostly%20TypeScript`,
      text: 'A header for the top of the README, with an optional grid and glow.',
      size: [880, 220],
    },
    {
      name: 'Badges',
      path: '/badge/discord?label=Discord',
      text: 'Small chips for links, with any Simple Icons logo or one of GitHub\'s own icons.',
      size: [107, 34],
    },
    {
      name: 'View counter',
      path: `/views?user=${u}`,
      text: 'Counts every visit to the profile, never cached.',
      size: [290, 34],
    },
  ];

  const looks = [
    {
      name: 'Retro terminal',
      text: 'VT323, green on black, square corners.',
      path: `/card?user=${u}&font=VT323&bg=050a05&text=b6ffc4&muted=4fbf6a&accent=39ff6a&border=1f5c2c&radius=0&text-size=xl&label-size=xl&title-size=xl`,
      size: [880, 524],
    },
    {
      name: 'Synthwave',
      text: 'Orbitron, magenta on deep purple, over the grid.',
      path: `/banner?font=Orbitron&bg=140a2e&text=f5e9ff&muted=b69ad8&accent=ff2bd6&border=3d1f73&radius=12&label=player%20one&title=Hey%2C%20I'm%20${u}&subtitle=Building%20things%20after%20midnight`,
      size: [880, 220],
    },
    {
      name: 'Pastel',
      text: 'Fredoka in pink, with round corners and chips to match.',
      path: '/skills?font=Fredoka&bg=fff0f6&text=6b2c4a&accent=ff5fa2&border=ffc2dc&radius=28&padding=lg&text-size=lg&title=Things%20I%20love%20using&title-size=lg&languages=typescript%2Cjavascript%2Cpython&frontend=react%2Cnextdotjs%2Ctailwindcss&design=figma%2Cblender',
      size: [880, 256],
    },
    {
      name: 'Swiss',
      text: 'Space Grotesk in black, white and one red.',
      path: `/card?user=${u}&font=Space+Grotesk&bg=ffffff&text=0a0a0a&muted=5a5a5a&accent=ff3b00&border=0a0a0a&radius=0&title-size=xl&graph=false&padding=lg`,
      size: [880, 284],
    },
    {
      name: 'Editorial',
      text: 'Playfair Display on warm paper.',
      path: `/repo/${u}/readme-stats?font=Playfair+Display&bg=f7f1e6&text=2a2118&muted=6e5f4c&accent=a0522d&border=d9ccb6&radius=4&title-size=xl&label=open%20source&padding=lg`,
      size: [420, 181],
    },
    {
      name: 'Minimal',
      text: 'DM Serif Display with no grid, glow or border.',
      path: `/banner?font=DM+Serif+Display&theme=light&accent=111111&grid=false&glow=false&border=false&title-size=xl&label-size=sm&label=designer%20%26%20developer&title=${u}&subtitle=I%20make%20small%2C%20careful%20things%20for%20the%20web`,
      size: [880, 231],
    },
  ];

  const data = { users: config.users.length ? [user, ...config.users.filter((x) => x !== user.toLowerCase())] : [user] };

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>readme-stats</title>
<meta name="description" content="Stats, badges, skills and project cards for a GitHub profile README, in one matching style.">
<meta name="color-scheme" content="light dark">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0b0b0f" media="(prefers-color-scheme: dark)">
<link rel="preload" href="/fonts/JetBrainsMono-Bold.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/site.css">
<script>try{const t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}catch{}</script>
</head>
<body>
<header class="top">
  <div class="wrap top-inner">
    <a class="brand" href="/"><img class="brand-mark" src="/favicon.svg" alt="" width="18" height="18">readme-stats</a>
    <nav class="nav" aria-label="Sections">
      <a href="#builder">Builder</a>
      <a href="#cards">Cards</a>
      <a href="#gallery">Gallery</a>
    </nav>
    <div class="top-actions">
      <a class="btn btn-ghost btn-icon" href="${REPO}" aria-label="Source on GitHub">${github}</a>
      <button type="button" class="btn btn-ghost btn-icon" id="theme-toggle" aria-label="Switch theme">${svgIcon('sun', 'icon when-dark')}${svgIcon('moon', 'icon when-light')}</button>
    </div>
  </div>
</header>

<main>
  <section class="wrap hero">
    <div class="hero-copy">
      <p class="eyebrow">For GitHub profile READMEs</p>
      <h1>Your GitHub stats, in one matching style.</h1>
      <p class="lead">Profile, project, skills, badges, a banner and a view counter. Every card comes in dark and light, in any Google font and colour, and loads in milliseconds.</p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="#builder">Build a card ${svgIcon('arrow')}</a>
        <a class="btn btn-outline" href="${REPO}">${github} Host your own</a>
      </div>
    </div>
    <figure class="readme" aria-label="A README made from these cards">
      <figcaption class="readme-bar"><span>README.md</span></figcaption>
      <div class="readme-body surface">
        ${card(cards[3]!.path, 'A banner', 880, 220)}
        <div class="badges">
          ${card('/badge/discord?label=Discord', 'Discord', 107, 34, 'badge')}
          ${card('/badge/link?label=Website&value=example.com', 'Website: example.com', 213, 34, 'badge')}
          ${card(`/views?user=${u}`, 'Profile views', 290, 34, 'badge')}
        </div>
        ${card(cards[0]!.path, `${user}'s GitHub stats`, 880, 462)}
      </div>
    </figure>
  </section>

  <section class="wrap section" id="builder">
    <div class="section-head">
      <h2>Builder</h2>
      <p>Pick a card, change how it looks, and copy the snippet into your README. It shows the dark or light version to match the reader's theme.</p>
    </div>
    <div class="builder">
      <form class="panel controls" id="controls" autocomplete="off">
        <div class="tabs" role="tablist" id="type-tabs"></div>
        <fieldset class="fields" id="type-fields"></fieldset>
        <details class="style-group" open>
          <summary>Style</summary>
          <fieldset class="fields" id="style-fields"></fieldset>
        </details>
      </form>
      <div class="output">
        <div class="panel preview-panel">
          <div class="panel-bar">
            <span class="panel-title">Preview</span>
            <div class="panel-actions">
              ${copyButton('link', 'Share', 'link')}
              <div class="segmented" role="radiogroup" aria-label="Preview theme" id="preview-theme">
                <button type="button" role="radio" data-value="dark">Dark</button>
                <button type="button" role="radio" data-value="light">Light</button>
              </div>
            </div>
          </div>
          <div class="preview surface" id="preview"><img id="preview-img" alt="Preview of the card"></div>
        </div>
        <div class="panel code-panel">
          <div class="panel-bar">
            <div class="segmented" role="radiogroup" aria-label="Snippet" id="snippet-kind">
              <button type="button" role="radio" data-value="html">README</button>
              <button type="button" role="radio" data-value="url">Link</button>
            </div>
            ${copyButton('snippet', 'Copy')}
          </div>
          <pre class="code" id="snippet" tabindex="0"></pre>
        </div>
      </div>
    </div>
  </section>

  <section class="wrap section" id="cards">
    <div class="section-head">
      <h2>Cards</h2>
      <p>Six kinds, all drawn from the same theme. Every one takes the same style options.</p>
    </div>
    <div class="card-grid">
      ${cards
        .map(
          (c) => `<article class="panel kind">
        <div class="kind-text">
          <h3>${c.name}</h3>
          <p>${c.text}</p>
        </div>
        <div class="kind-image surface">${card(c.path, c.name, c.size[0]!, c.size[1]!, c.size[1]! < 40 ? 'badge' : '')}</div>
        <div class="kind-foot"><code>${escape(decodeURIComponent(c.path.split('?')[0]!))}</code><button type="button" class="btn btn-ghost btn-sm" data-edit="${escape(c.path)}">${svgIcon('pencil')}<span>Edit</span></button></div>
      </article>`,
        )
        .join('\n')}
    </div>
  </section>

  <section class="wrap section" id="gallery">
    <div class="section-head">
      <h2>Gallery</h2>
      <p>Looks made only from the style options. They bring their own background, so one picture works in both themes.</p>
    </div>
    <div class="gallery">
      ${looks
        .map(
          (l) => `<article class="panel look${l.size[0] === 420 ? ' look-narrow' : ''}">
        <div class="look-image"><img class="card-img" src="${escape(l.path)}" alt="${escape(l.name)}" width="${l.size[0]}" height="${l.size[1]}" loading="lazy"></div>
        <div class="look-foot">
          <div><h3>${l.name}</h3><p>${l.text}</p></div>
          <button type="button" class="btn btn-outline btn-sm" data-edit="${escape(l.path)}">${svgIcon('pencil')}<span>Edit</span></button>
        </div>
      </article>`,
        )
        .join('\n')}
    </div>
  </section>

  <section class="wrap section" id="host">
    <div class="panel host">
      <div>
        <h2>Host your own</h2>
        <p>One small Bun server with a GitHub token. GitHub's answers are kept in memory and refreshed in the background, so cards come back in milliseconds.</p>
      </div>
      <pre class="code">cp .env.example .env
docker compose up -d --build</pre>
    </div>
  </section>
</main>

<footer class="wrap foot">
  <span>readme-stats, MIT licensed</span>
  <a href="${REPO}#readme">Documentation</a>
</footer>

<script>window.STATS=${JSON.stringify(data).replaceAll('<', '\\u003c')}</script>
<script src="/site.js" defer></script>
</body>
</html>`;
}
