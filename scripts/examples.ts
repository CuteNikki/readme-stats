// Saves the README's example cards, dark and light, into docs/examples, from a
// running server: `bun run examples` against localhost:3000, or another with
// BASE=http://localhost:3077. Run it again after changing how a card looks.

const base = process.env.BASE ?? 'http://localhost:3000';
const user = process.env.USER_LOGIN ?? 'CuteNikki';

const examples: Record<string, string> = {
  banner: `/banner?label=developer%20%26%20designer&title=Hey%2C%20I'm%20${user}&subtitle=Full-stack%20work%2C%20mostly%20TypeScript`,
  card: `/card?user=${user}`,
  'card-no-graph': `/card?user=${user}&graph=false&by=bytes`,
  repo: `/repo/${user}/discord-rpc-new`,
  skills: '/skills?languages=typescript,javascript,java&runtimes=nodedotjs,bun&frontend=react,nextdotjs,tailwindcss&design=figma,ai,ps',
  'badge-discord': '/badge/discord?label=Discord',
  'badge-website': '/badge/link?label=Website&value=example.com',
  views: `/views?user=${user}&since=2026-07`,
};

const dir = new URL('../docs/examples/', import.meta.url);

for (const [name, path] of Object.entries(examples)) {
  for (const theme of ['dark', 'light']) {
    const url = `${base}${path}${path.includes('?') ? '&' : '?'}theme=${theme}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} answered ${res.status}`);
    await Bun.write(new URL(`${name}-${theme}.svg`, dir), await res.text());
    console.log(`${name}-${theme}.svg`);
  }
}
