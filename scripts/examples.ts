// Saves the README's example cards, dark and light, into docs/examples, from a
// running server: `bun run examples` against localhost:3000, or another with
// BASE=http://localhost:3077. Run it again after changing how a card looks.

const base = process.env.BASE ?? 'http://localhost:3000';
const user = process.env.USER_LOGIN ?? 'CuteNikki';

const examples: Record<string, string> = {
  banner: `/banner?label=developer%20%26%20designer&title=Hey%2C%20I'm%20${user}&subtitle=Full-stack%20work%2C%20mostly%20TypeScript`,
  card: `/card?user=${user}`,
  'card-no-graph': `/card?user=${user}&graph=false&by=bytes`,
  repo: `/repo/${user}/readme-stats`,
  skills: '/skills?languages=typescript,javascript,java&runtimes=nodedotjs,bun&frontend=react,nextdotjs,tailwindcss&design=figma,ai,ps',
  'badge-discord': '/badge/discord?label=Discord',
  'badge-website': '/badge/link?label=Website&value=example.com',
  views: `/views?user=${user}&since=2026-07`,
  styled: `/card?user=${user}&font=Inter&accent=ec4899&radius=20&title-size=lg&graph=false`,
};

/** The README's gallery: looks that set their own colours, so each is drawn once, as gallery-<name>.svg */
const gallery: Record<string, string> = {
  terminal: `/card?user=${user}&font=VT323&bg=050a05&text=b6ffc4&muted=4fbf6a&accent=39ff6a&border=1f5c2c&radius=0&text-size=xl&label-size=xl&title-size=xl`,
  editorial: `/repo/${user}/readme-stats?font=Playfair+Display&bg=f7f1e6&text=2a2118&muted=6e5f4c&accent=a0522d&border=d9ccb6&radius=4&title-size=xl&label=open%20source&padding=lg`,
  pastel:
    '/skills?font=Fredoka&bg=fff0f6&text=6b2c4a&accent=ff5fa2&border=ffc2dc&radius=28&padding=lg&text-size=lg&title=Things%20I%20love%20using&title-size=lg&languages=typescript%2Cjavascript%2Cpython&frontend=react%2Cnextdotjs%2Ctailwindcss&design=figma%2Cblender',
  synthwave: `/banner?font=Orbitron&bg=140a2e&text=f5e9ff&muted=b69ad8&accent=ff2bd6&border=3d1f73&radius=12&label=player%20one&title=Hey%2C%20I'm%20${user}&subtitle=Building%20things%20after%20midnight`,
  swiss: `/card?user=${user}&font=Space+Grotesk&bg=ffffff&text=0a0a0a&muted=5a5a5a&accent=ff3b00&border=0a0a0a&radius=0&title-size=xl&graph=false&padding=lg`,
  minimal: `/banner?font=DM+Serif+Display&theme=light&accent=111111&grid=false&glow=false&border=false&title-size=xl&label-size=sm&label=designer%20%26%20developer&title=${user}&subtitle=I%20make%20small%2C%20careful%20things%20for%20the%20web`,
};

const dir = new URL('../docs/examples/', import.meta.url);

async function save(url: string, file: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} answered ${res.status}`);
  await Bun.write(new URL(file, dir), await res.text());
  console.log(file);
}

for (const [name, path] of Object.entries(examples)) {
  for (const theme of ['dark', 'light']) await save(`${base}${path}${path.includes('?') ? '&' : '?'}theme=${theme}`, `${name}-${theme}.svg`);
}
for (const [name, path] of Object.entries(gallery)) await save(`${base}${path}`, `gallery-${name}.svg`);
