function list(value: string | undefined) {
  return (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error('Set GITHUB_TOKEN in .env: a classic token with read:user, plus repo to count private contributions');

const users = list(process.env.GITHUB_USERS);
if (users.length === 0) throw new Error('Set GITHUB_USERS in .env: the GitHub accounts this may draw cards for, the first being the default');

export const config = {
  port: Number(process.env.PORT ?? 3000),
  token,
  /** Only these accounts get cards, so nobody else spends the token's rate limit */
  users: users.map((u) => u.toLowerCase()),
  defaultUser: users[0]!,
  /** How long GitHub's answers are kept before they're fetched again, in the background */
  cacheMinutes: Number(process.env.CACHE_MINUTES ?? 30),
  /** Where the view counter keeps its count */
  dataDir: process.env.DATA_DIR ?? './data',
  /** The view counter starts here, e.g. to carry over the count from another counter */
  viewsStart: Number(process.env.VIEWS_START ?? 0),
};

export function allowedUser(login: string | null) {
  const user = (login ?? config.defaultUser).toLowerCase();
  return config.users.includes(user) ? user : undefined;
}
