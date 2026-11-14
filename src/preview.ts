// What / shows: every kind of card, dark and light side by side, to check
// a change by eye

import { config } from './config';

const examples = (user: string) => [
  ['Banner', `/banner?label=developer%20%26%20designer&title=Hey%2C%20I'm%20${user}&subtitle=Full-stack%20work%2C%20mostly%20TypeScript`],
  ['Profile card', `/card?user=${user}`],
  ['Profile card, no graph', `/card?user=${user}&graph=false&by=bytes`],
  ['Profile card, styled', `/card?user=${user}&font=Inter&accent=ec4899&radius=20&title-size=lg&graph=false`],
  ['Skills', '/skills?languages=typescript,javascript,java,html5,css&runtimes=nodedotjs,bun&frontend=react,nextdotjs,tailwindcss&design=figma,ai,ps'],
  ['Badges', '/badge/discord?label=discord'],
  ['Views', `/views?user=${user}`],
];

export function preview() {
  const rows = examples(config.defaultUser)
    .map(
      ([name, path]) => `<section><h2>${name} <code>${path}</code></h2><div class="pair">
  <div class="dark"><img src="${path}&theme=dark"></div><div class="light"><img src="${path}&theme=light"></div></div></section>`,
    )
    .join('\n');
  return `<!doctype html><meta charset="utf-8"><title>readme-stats</title>
<style>
body{margin:0;padding:24px;font:14px ui-monospace,monospace;background:#0b0b0f;color:#ededf2}
h2{font-size:13px;font-weight:600}code{color:#a78bfa;font-weight:400;word-break:break-all}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}.pair>div{padding:20px;border-radius:12px;overflow:auto}
.dark{background:#0d1117}.light{background:#fff}img{max-width:100%}
</style>
<h1>readme-stats</h1>${rows}`;
}
