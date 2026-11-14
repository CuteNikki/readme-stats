// Any family on Google Fonts, by name: ?font=Inter. Each weight's Latin file
// is fetched once and kept in DATA_DIR/fonts, so a restart doesn't fetch it
// again, and it's measured and embedded like the bundled font.

import { mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { config } from './config';
import { face, Font, WEIGHTS, type Face, type Weight } from './fonts';
import { Problem } from './problem';

/** Google picks the file format by browser: this gets woff2, split by script */
const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
/** Latin files are 15 to 40 KB; anything far bigger isn't what was asked for */
const MAX_FILE = 1024 * 1024;
/** How long a name Google doesn't know is answered from memory */
const MISSING_FOR = 60 * 60_000;

const loading = new Map<string, Promise<Font>>();
const missing = new Map<string, number>();

/** Spaces as Google writes them: "space   mono" > "space mono" */
function clean(name: string) {
  return name.trim().replace(/\s+/g, ' ');
}

/** Google's names are case-sensitive and mostly title case: "space mono" > "Space Mono" */
function titleCase(name: string) {
  return name.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

function generic(name: string): Font['generic'] {
  if (/mono|code/i.test(name)) return 'monospace';
  if (/serif/i.test(name) && !/sans/i.test(name)) return 'serif';
  return 'sans-serif';
}

async function get(url: string) {
  return fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(8000) });
}

/**
 * The Latin file for one weight, or undefined if the family doesn't come in it.
 * axis false asks without a weight, for families that only have one.
 */
async function download(name: string, weight: Weight, axis = true) {
  const family = `${name.replaceAll(' ', '+')}${axis ? `:wght@${weight}` : ''}`;
  const css = await get(`https://fonts.googleapis.com/css2?family=${family}`);
  // 400 is Google's answer for a name or a weight it doesn't have
  if (css.status === 400) return undefined;
  if (!css.ok) throw new Problem('Google Fonts is not answering, try again soon', 502);
  const body = await css.text();
  const block = body.match(/\/\* latin \*\/\s*@font-face\s*{[^}]*}/)?.[0] ?? body;
  const url = block.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/)?.[1];
  if (!url) return undefined;
  const file = await get(url);
  if (!file.ok) throw new Problem('Google Fonts is not answering, try again soon', 502);
  const data = Buffer.from(await file.arrayBuffer());
  if (data.length > MAX_FILE) throw new Problem(`${name} is too big to carry in a card`, 400);
  return data;
}

/** A family kept from an earlier fetch: its name as Google spells it, and <weight>.woff2 for each weight */
async function fromDisk(dir: string) {
  const files = await readdir(dir).catch(() => [] as string[]);
  if (!files.includes('name')) return undefined;
  const faces: Partial<Record<Weight, Face>> = {};
  for (const weight of WEIGHTS) if (files.includes(`${weight}.woff2`)) faces[weight] = face(Buffer.from(await Bun.file(join(dir, `${weight}.woff2`)).arrayBuffer()));
  if (Object.keys(faces).length === 0) return undefined;
  const name = (await Bun.file(join(dir, 'name')).text()).trim();
  return new Font(name, faces, generic(name));
}

async function fromGoogle(name: string, dir: string) {
  const files: Partial<Record<Weight, Buffer>> = {};
  for (const weight of WEIGHTS) {
    const data = await download(name, weight);
    if (data) files[weight] = data;
  }
  // Families with a single style don't take a weight at all
  if (Object.keys(files).length === 0) {
    const data = await download(name, 400, false);
    if (data) files[400] = data;
  }
  if (Object.keys(files).length === 0) return undefined;
  await mkdir(dir, { recursive: true });
  const faces: Partial<Record<Weight, Face>> = {};
  for (const [weight, data] of Object.entries(files) as [string, Buffer][]) {
    await Bun.write(join(dir, `${weight}.woff2`), data);
    faces[Number(weight) as Weight] = face(data);
  }
  return faces;
}

async function load(name: string) {
  // One folder per family whatever case it's asked for in, so a restart finds it
  const dir = join(config.dataDir, 'fonts', name.toLowerCase().replaceAll(' ', '-'));
  const saved = await fromDisk(dir);
  if (saved) return saved;
  for (const tried of new Set([name, titleCase(name)])) {
    const faces = await fromGoogle(tried, dir);
    if (!faces) continue;
    await Bun.write(join(dir, 'name'), tried);
    return new Font(tried, faces, generic(tried));
  }
  return undefined;
}

/** The family on Google Fonts called name, fetched the first time it's asked for */
export function googleFont(requested: string): Promise<Font> {
  const name = clean(requested);
  if (!/^[A-Za-z0-9 ]{1,60}$/.test(name)) return Promise.reject(new Problem('font names are letters, digits and spaces', 400));
  if (!config.googleFonts) return Promise.reject(new Problem('only the default font is turned on here', 400));
  const key = name.toLowerCase();
  const gone = missing.get(key);
  if (gone && Date.now() - gone < MISSING_FOR) return Promise.reject(new Problem(`no font called ${name} on Google Fonts`, 404));

  let pending = loading.get(key);
  if (!pending) {
    pending = load(name).then((font) => {
      if (!font) {
        missing.set(key, Date.now());
        throw new Problem(`no font called ${name} on Google Fonts`, 404);
      }
      return font;
    });
    // A failure is asked about again next time, not kept
    pending.catch(() => loading.delete(key));
    loading.set(key, pending);
  }
  return pending;
}
