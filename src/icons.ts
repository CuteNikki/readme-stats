import * as simpleIcons from 'simple-icons';

export interface Icon {
  title: string;
  hex: string;
  /** Draws the icon in a 24x24 box, in the given colour */
  draw: (color: string, theme: { bg: string }) => string;
  /** Tiles that bring their own colours, like Adobe's, aren't recoloured */
  ownColors?: boolean;
}

const bySlug = new Map<string, { title: string; hex: string; path: string }>();
for (const icon of Object.values(simpleIcons) as { slug?: string; title: string; hex: string; path: string }[])
  if (icon.slug) bySlug.set(icon.slug, icon);

/** Adobe had its logos taken out of Simple Icons: these are just its two letters on a tile */
function letterTile(title: string, letters: string, color: string, tile: string): Icon {
  return {
    title,
    hex: color.slice(1),
    ownColors: true,
    draw: () =>
      `<rect x="1" y="2" width="22" height="20" rx="4.5" fill="${tile}"/><text x="12" y="16.2" text-anchor="middle" font-size="11" font-weight="700" fill="${color}" letter-spacing="-0.3">${letters}</text>`,
  };
}

const extra: Record<string, Icon> = {
  adobeillustrator: letterTile('Adobe Illustrator', 'Ai', '#FF9A00', '#330000'),
  adobephotoshop: letterTile('Adobe Photoshop', 'Ps', '#31A8FF', '#001E36'),
  adobeaftereffects: letterTile('Adobe After Effects', 'Ae', '#D291FF', '#00005B'),
  adobepremierepro: letterTile('Adobe Premiere Pro', 'Pr', '#9999FF', '#00005B'),
};

/** Names people reach for that Simple Icons spells another way */
const aliases: Record<string, string> = {
  java: 'openjdk',
  node: 'nodedotjs',
  nodejs: 'nodedotjs',
  next: 'nextdotjs',
  nextjs: 'nextdotjs',
  ts: 'typescript',
  js: 'javascript',
  html: 'html5',
  css3: 'css',
  postgres: 'postgresql',
  tailwind: 'tailwindcss',
  twitter: 'x',
  ai: 'adobeillustrator',
  illustrator: 'adobeillustrator',
  ps: 'adobephotoshop',
  photoshop: 'adobephotoshop',
  shadcn: 'shadcnui',
  vue: 'vuedotjs',
};

/** What an alias is called on its chip, where that's not the icon's own name: java is Java, not OpenJDK */
const titles: Record<string, string> = {
  java: 'Java',
  ai: 'Illustrator',
  illustrator: 'Illustrator',
  ps: 'Photoshop',
  photoshop: 'Photoshop',
  twitter: 'Twitter',
};

export function icon(name: string): Icon | undefined {
  const key = name.toLowerCase();
  const slug = aliases[key] ?? key;
  const found = extra[slug] ?? lookup(slug);
  return found && { ...found, title: titles[key] ?? found.title };
}

function lookup(slug: string): Icon | undefined {
  const found = bySlug.get(slug);
  if (!found) return undefined;
  return { title: found.title, hex: found.hex, draw: (color) => `<path d="${found.path}" fill="${color}"/>` };
}
