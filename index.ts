import { badge } from './src/cards/badge';
import { bannerCard } from './src/cards/banner';
import { profileCard, type ProfileOptions } from './src/cards/profile';
import { repoCard } from './src/cards/repo';
import { skillsCard, type SkillGroup } from './src/cards/skills';
import { allowedUser, config } from './src/config';
import { NotFound, profile, repo } from './src/github';
import { icon } from './src/icons';
import { octicon, octicons } from './src/octicons';
import { group } from './src/svg';
import { pickTheme, type Theme } from './src/theme';
import { countView } from './src/views';
import { preview } from './src/preview';

/** Query keys every route takes, so /skills doesn't read them as a group */
const RESERVED = new Set(['theme', 'title', 'user']);

function svg(body: string, maxAge: number, status = 200) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': maxAge > 0 ? `public, max-age=${maxAge}, stale-while-revalidate=86400` : 'no-cache, no-store, must-revalidate, max-age=0',
    },
  });
}

/** Errors are pictures too, or a README would show a broken image */
function problem(message: string, theme: Theme, status: number) {
  return svg(badge({ theme, label: message, drawIcon: (x, y) => octicon('eye', x, y, 16, theme.muted) }), 60, status);
}

const dataAge = () => config.cacheMinutes * 60;
const DAY = 86_400;

function list(value: string | null) {
  return (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function guard(theme: Theme, run: () => Promise<Response> | Response) {
  try {
    return await run();
  } catch (error) {
    if (error instanceof NotFound) return problem('not found', theme, 404);
    console.error(error);
    return problem('GitHub is not answering, try again soon', theme, 502);
  }
}

const server = Bun.serve({
  port: config.port,
  routes: {
    '/': () => new Response(preview(), { headers: { 'Content-Type': 'text/html; charset=utf-8' } }),
    '/health': () => new Response('ok'),

    '/card': (req) => {
      const q = new URL(req.url).searchParams;
      const theme = pickTheme(q.get('theme'));
      const user = allowedUser(q.get('user'));
      if (!user) return problem('not an account this draws cards for', theme, 403);
      const by = q.get('by');
      const options: ProfileOptions = {
        theme,
        graph: q.get('graph') !== 'false',
        langs: Math.min(Math.max(Number(q.get('langs') ?? 5) || 5, 1), 8),
        hide: list(q.get('hide')).map((s) => s.toLowerCase()),
        by: by === 'bytes' || by === 'repos' ? by : 'mixed',
      };
      return guard(theme, async () => svg(profileCard(await profile(user), options), dataAge()));
    },

    '/repo/:owner/:name': (req) => {
      const q = new URL(req.url).searchParams;
      const theme = pickTheme(q.get('theme'));
      const owner = allowedUser(req.params.owner);
      if (!owner) return problem('not an account this draws cards for', theme, 403);
      return guard(theme, async () =>
        svg(repoCard(await repo(owner, req.params.name), { theme, label: q.get('label') ?? undefined, description: q.get('desc') ?? undefined }), dataAge()),
      );
    },
    '/repo/:name': (req) => Response.redirect(new URL(`/repo/${config.defaultUser}/${req.params.name}${new URL(req.url).search}`, req.url).href, 301),

    '/badge': (req) => badgeRoute(req, undefined),
    '/badge/:icon': (req) => badgeRoute(req, req.params.icon),

    '/skills': (req) => {
      const q = new URL(req.url).searchParams;
      const theme = pickTheme(q.get('theme'));
      const groups: SkillGroup[] = [];
      for (const [key, value] of q) {
        if (RESERVED.has(key)) continue;
        groups.push({
          name: key.replaceAll('_', ' '),
          // node or node:Node.js, the label being the icon's own name otherwise
          skills: list(value).map((entry) => {
            const [name, label] = entry.split(':') as [string, string | undefined];
            const found = icon(name);
            return { icon: found, label: label ?? found?.title ?? name };
          }),
        });
      }
      if (groups.length === 0) return problem('add groups, as ?languages=typescript,java', theme, 400);
      return svg(skillsCard(groups, theme, q.get('title') ?? undefined), DAY);
    },

    '/banner': (req) => {
      const q = new URL(req.url).searchParams;
      const theme = pickTheme(q.get('theme'));
      return svg(
        bannerCard({ theme, title: q.get('title') ?? `Hey, I'm ${config.defaultUser}`, subtitle: q.get('subtitle') ?? undefined, label: q.get('label') ?? undefined }),
        DAY,
      );
    },

    '/views': (req) => {
      const q = new URL(req.url).searchParams;
      const theme = pickTheme(q.get('theme'));
      const user = allowedUser(q.get('user'));
      if (!user) return problem('not an account this draws cards for', theme, 403);
      const count = countView(user);
      return svg(
        badge({ theme, label: q.get('label') ?? 'profile views', value: group(count), drawIcon: (x, y, color) => octicon('eye', x, y, 16, color) }),
        0,
      );
    },
  },
  fetch: () => new Response('Not found', { status: 404 }),
});

function badgeRoute(req: Request, iconName: string | undefined) {
  const q = new URL(req.url).searchParams;
  const theme = pickTheme(q.get('theme'));
  const found = iconName ? icon(iconName) : undefined;
  // GitHub's own icons too, for what has no brand: /badge/link for a website
  const own = iconName && !found && iconName in octicons ? (iconName as keyof typeof octicons) : undefined;
  if (iconName && !found && !own) return problem(`no icon called ${iconName}`, theme, 404);
  const color = q.get('color')?.replace('#', '');
  return svg(
    badge({
      theme,
      icon: found,
      drawIcon: own && ((x, y, c) => octicon(own, x, y, 16, c)),
      label: q.get('label') ?? found?.title ?? 'badge',
      value: q.get('value') ?? undefined,
      color: color && /^[0-9a-f]{3,6}$/i.test(color) ? color : undefined,
    }),
    DAY,
  );
}

// Fetched once now, so the first visitor doesn't wait on GitHub either
profile(config.defaultUser.toLowerCase()).catch((error) => console.error('Loading the profile failed:', error));

console.log(`Cards on http://localhost:${server.port}`);
