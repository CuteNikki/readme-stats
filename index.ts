import { badge } from './src/cards/badge';
import { bannerCard } from './src/cards/banner';
import { lastYear, percent, profileCard, topLanguages, type ProfileOptions } from './src/cards/profile';
import { repoCard } from './src/cards/repo';
import { skillsCard, type SkillGroup } from './src/cards/skills';
import { allowedUser, config } from './src/config';
import { NotFound, profile, repo } from './src/github';
import { icon } from './src/icons';
import { octicon, octicons } from './src/octicons';
import { group } from './src/svg';
import { Problem } from './src/problem';
import { defaultStyle, STYLE_KEYS, styleFrom, type Style } from './src/style';
import { hexColor, pickTheme } from './src/theme';
import { streaks, type Run } from './src/streak';
import { countView, viewCount } from './src/views';
import { preview } from './src/preview';

/**
 * Query keys every route takes, so /skills doesn't read them as a group. v does
 * nothing: bumping it gives a card a new link, which GitHub's image proxy
 * hasn't cached yet
 */
const RESERVED = new Set<string>(['title', 'user', 'v', ...STYLE_KEYS]);

/**
 * No stale-while-revalidate: GitHub's image proxy passes these headers on to
 * the browser, which then kept showing a card up to a day old. The ETag lets
 * a cache ask whether a card changed and get a 304 back if it didn't.
 */
function svg(body: string, maxAge: number, status = 200, req?: Request) {
  const etag = `"${Bun.hash(body).toString(36)}"`;
  const headers = {
    'Content-Type': 'image/svg+xml; charset=utf-8',
    'Cache-Control': maxAge > 0 ? `public, max-age=${maxAge}` : 'no-cache, no-store, must-revalidate, max-age=0',
    ETag: etag,
  };
  if (status === 200 && maxAge > 0 && req?.headers.get('If-None-Match') === etag) return new Response(null, { status: 304, headers });
  return new Response(body, { status, headers });
}

/** Errors are pictures too, or a README would show a broken image */
function problem(message: string, style: Style, status: number) {
  return svg(badge({ style, label: message, drawIcon: (x, y, _, size) => octicon('eye', x, y, size, style.theme.muted) }), 60, status);
}

/** Cards from GitHub's numbers: they change all day */
const DATA_AGE = 600;
/** Cards that only change with their link or a new version of this */
const STATIC_AGE = 3600;

function list(value: string | null) {
  return (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Reads the style a card's link asks for, then draws the card. An option that
 * can't be drawn, like a font Google doesn't have, is said on a card in the
 * default style instead, and so is GitHub not answering.
 */
async function draw(req: Request, run: (style: Style, q: URLSearchParams) => Promise<Response> | Response) {
  const q = new URL(req.url).searchParams;
  let style = defaultStyle(pickTheme(q.get('theme')));
  try {
    style = await styleFrom(q);
    return await run(style, q);
  } catch (error) {
    if (error instanceof Problem) return problem(error.message, style, error.status);
    if (error instanceof NotFound) return problem('not found', style, 404);
    console.error(error);
    return problem('GitHub is not answering, try again soon', style, 502);
  }
}

const server = Bun.serve({
  port: config.port,
  routes: {
    '/': () => new Response(preview(), { headers: { 'Content-Type': 'text/html; charset=utf-8' } }),
    '/health': () => new Response('ok'),

    '/card': (req) =>
      draw(req, async (style, q) => {
        const user = allowedUser(q.get('user'));
        if (!user) return problem('not an account this draws cards for', style, 403);
        const by = q.get('by');
        const options: ProfileOptions = {
          style,
          graph: q.get('graph') !== 'false',
          langs: Math.min(Math.max(Number(q.get('langs') ?? 5) || 5, 1), 8),
          hide: list(q.get('hide')).map((s) => s.toLowerCase()),
          by: by === 'bytes' || by === 'repos' ? by : 'mixed',
        };
        return svg(profileCard(await profile(user), options), DATA_AGE, 200, req);
      }),

    // The card's numbers as text: for alt text that says what the card shows,
    // which a README can only get by being rewritten, e.g. by a daily Action
    '/stats.json': (req) => {
      const q = new URL(req.url).searchParams;
      const user = allowedUser(q.get('user'));
      if (!user) return Response.json({ error: 'not an account this draws cards for' }, { status: 403 });
      const by = q.get('by');
      return profile(user)
        .then((p) => {
          const { current, longest, total } = streaks(p.days);
          const languages = topLanguages(p, {
            langs: Math.min(Math.max(Number(q.get('langs') ?? 5) || 5, 1), 8),
            hide: list(q.get('hide')).map((s) => s.toLowerCase()),
            by: by === 'bytes' || by === 'repos' ? by : 'mixed',
          });
          return Response.json(
            {
              login: p.login,
              name: p.name,
              createdAt: p.createdAt,
              followers: p.followers,
              commits: p.commits,
              pullRequests: p.pullRequests,
              issues: p.issues,
              stars: p.stars,
              repos: p.repos,
              contributedTo: p.contributedTo,
              streak: { current: run(current), longest: run(longest) },
              contributions: total,
              lastYear: lastYear(p.days).reduce((sum, d) => sum + d.count, 0),
              // share is a number for whoever does their own maths; label is
              // the card's own text, rounded the same way
              languages: languages.map((l) => ({
                name: l.name,
                color: l.color,
                share: Math.round(l.share * 100) / 100,
                label: percent(l.share),
                bytes: l.size,
                repos: l.repos,
              })),
              views: viewCount(user),
            },
            { headers: { 'Cache-Control': `public, max-age=${DATA_AGE}` } },
          );
        })
        .catch((error) => {
          console.error(error);
          return Response.json({ error: 'GitHub is not answering' }, { status: error instanceof NotFound ? 404 : 502 });
        });
    },

    '/repo/:owner/:name': (req) =>
      draw(req, async (style, q) => {
        const owner = allowedUser(req.params.owner);
        if (!owner) return problem('not an account this draws cards for', style, 403);
        return svg(repoCard(await repo(owner, req.params.name), { style, label: q.get('label') ?? undefined, description: q.get('desc') ?? undefined }), DATA_AGE, 200, req);
      }),
    '/repo/:name': (req) => Response.redirect(new URL(`/repo/${config.defaultUser}/${req.params.name}${new URL(req.url).search}`, req.url).href, 301),

    '/badge': (req) => badgeRoute(req, undefined),
    '/badge/:icon': (req) => badgeRoute(req, req.params.icon),

    '/skills': (req) =>
      draw(req, async (style, q) => {
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
        if (groups.length === 0) return problem('add groups, as ?languages=typescript,java', style, 400);
        return svg(skillsCard(groups, style, q.get('title') ?? undefined), STATIC_AGE, 200, req);
      }),

    '/banner': (req) =>
      draw(req, async (style, q) => {
        return svg(
          bannerCard({
            style,
            title: q.get('title') ?? `Hey, I'm ${config.defaultUser}`,
            subtitle: q.get('subtitle') ?? undefined,
            label: q.get('label') ?? undefined,
            grid: q.get('grid') !== 'false',
            glow: q.get('glow') !== 'false',
          }),
          STATIC_AGE,
          200,
          req,
        );
      }),

    '/views': (req) =>
      draw(req, async (style, q) => {
        const user = allowedUser(q.get('user'));
        if (!user) return problem('not an account this draws cards for', style, 403);
        const count = countView(user);
        return svg(
          badge({
            style,
            label: q.get('label') ?? 'profile views',
            value: group(count),
            note: since(q.get('since')),
            drawIcon: (x, y, color, size) => octicon('eye', x, y, size, color),
          }),
          0,
        );
      }),
  },
  fetch: () => new Response('Not found', { status: 404 }),
});

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** ?since=2026-07-28 or 2026-07 > "since Jul 2026": the counter can't know when counting started, least of all a count carried over */
function since(value: string | null) {
  const match = value?.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
  const month = match ? MONTHS[Number(match[2]) - 1] : undefined;
  return month ? `since ${month} ${match![1]}` : undefined;
}

/** A streak for /stats.json: null dates rather than none, so every key is always there */
function run({ length, start, end }: Run) {
  return { days: length, start: start ?? null, end: end ?? null };
}

function badgeRoute(req: Request, iconName: string | undefined) {
  return draw(req, (style, q) => {
    const found = iconName ? icon(iconName) : undefined;
    // GitHub's own icons too, for what has no brand: /badge/link for a website
    const own = iconName && !found && iconName in octicons ? (iconName as keyof typeof octicons) : undefined;
    if (iconName && !found && !own) return problem(`no icon called ${iconName}`, style, 404);
    const color = q.get('color');
    return svg(
      badge({
        style,
        icon: found,
        drawIcon: own && ((x, y, c, size) => octicon(own, x, y, size, c)),
        label: q.get('label') ?? found?.title ?? 'badge',
        value: q.get('value') ?? undefined,
        color: color ? hexColor(color) : undefined,
      }),
      STATIC_AGE,
      200,
      req,
    );
  });
}

// Fetched once now, so the first visitor doesn't wait on GitHub either
profile(config.defaultUser.toLowerCase()).catch((error) => console.error('Loading the profile failed:', error));

console.log(`readme-stats on http://localhost:${server.port}`);
