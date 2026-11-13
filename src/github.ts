import { cached } from './cache';
import { config } from './config';

export class NotFound extends Error {}

async function graphql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${config.token}`, 'Content-Type': 'application/json', 'User-Agent': 'readme-stats' },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) throw new Error(`GitHub answered ${response.status}: ${await response.text()}`);
  const body = (await response.json()) as { data?: T; errors?: { type?: string; message: string }[] };
  if (body.errors?.some((e) => e.type === 'NOT_FOUND')) throw new NotFound(body.errors[0]!.message);
  if (body.errors?.length || !body.data) throw new Error(`GitHub: ${body.errors?.map((e) => e.message).join('; ')}`);
  return body.data;
}

export interface Day {
  date: string;
  count: number;
}

export interface Language {
  name: string;
  color: string;
  /** Bytes, over every repo */
  size: number;
  /** How many repos have any */
  repos: number;
}

export interface Profile {
  login: string;
  name: string;
  createdAt: string;
  followers: number;
  stars: number;
  commits: number;
  pullRequests: number;
  issues: number;
  contributedTo: number;
  repos: number;
  /** Every day since the account was made, oldest first */
  days: Day[];
  /** Bytes of code per language over the account's own repos, forks left out */
  languages: Language[];
}

const OVERVIEW = `query ($login: String!, $after: String) {
  user(login: $login) {
    login name createdAt
    followers { totalCount }
    pullRequests { totalCount }
    issues { totalCount }
    repositoriesContributedTo(contributionTypes: [COMMIT, PULL_REQUEST, ISSUE, REPOSITORY]) { totalCount }
    contributionsCollection { contributionYears }
    repositories(ownerAffiliations: OWNER, isFork: false, first: 100, after: $after) {
      totalCount
      pageInfo { hasNextPage endCursor }
      nodes {
        stargazerCount
        languages(first: 10, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name color } } }
      }
    }
  }
}`;

interface OverviewData {
  user: {
    login: string;
    name: string | null;
    createdAt: string;
    followers: { totalCount: number };
    pullRequests: { totalCount: number };
    issues: { totalCount: number };
    repositoriesContributedTo: { totalCount: number };
    contributionsCollection: { contributionYears: number[] };
    repositories: {
      totalCount: number;
      pageInfo: { hasNextPage: boolean; endCursor: string };
      nodes: { stargazerCount: number; languages: { edges: { size: number; node: { name: string; color: string | null } }[] } }[];
    };
  } | null;
}

interface YearData {
  totalCommitContributions: number;
  restrictedContributionsCount: number;
  contributionCalendar: { weeks: { contributionDays: { date: string; contributionCount: number }[] }[] };
}

async function loadProfile(login: string): Promise<Profile> {
  let after: string | null = null;
  let user: NonNullable<OverviewData['user']> | undefined;
  const repos: NonNullable<OverviewData['user']>['repositories']['nodes'] = [];
  do {
    const data: OverviewData = await graphql<OverviewData>(OVERVIEW, { login, after });
    if (!data.user) throw new NotFound(`No GitHub user ${login}`);
    user ??= data.user;
    repos.push(...data.user.repositories.nodes);
    after = data.user.repositories.pageInfo.hasNextPage ? data.user.repositories.pageInfo.endCursor : null;
  } while (after);

  // Every year at once, as one alias each: a contributions collection spans a year at most
  const years = [...user.contributionsCollection.contributionYears].sort();
  const fields = years
    .map((y) => `y${y}: contributionsCollection(from: "${y}-01-01T00:00:00Z", to: "${y}-12-31T23:59:59Z") {
      totalCommitContributions restrictedContributionsCount
      contributionCalendar { weeks { contributionDays { date contributionCount } } }
    }`)
    .join('\n');
  const calendar = await graphql<{ user: Record<string, YearData> }>(`query ($login: String!) { user(login: $login) { ${fields} } }`, { login });

  const today = new Date().toISOString().slice(0, 10);
  const days: Day[] = [];
  let commits = 0;
  for (const year of years) {
    const data = calendar.user[`y${year}`]!;
    // Private contributions only show up as a number, which is counted as commits, as most are
    commits += data.totalCommitContributions + data.restrictedContributionsCount;
    for (const week of data.contributionCalendar.weeks)
      for (const day of week.contributionDays) if (day.date <= today) days.push({ date: day.date, count: day.contributionCount });
  }

  const languages = new Map<string, Language>();
  for (const repo of repos)
    for (const { size, node } of repo.languages.edges) {
      const language = languages.get(node.name) ?? { name: node.name, color: node.color ?? '#8b8b96', size: 0, repos: 0 };
      language.size += size;
      language.repos += 1;
      languages.set(node.name, language);
    }

  return {
    login: user.login,
    name: user.name ?? user.login,
    createdAt: user.createdAt,
    followers: user.followers.totalCount,
    stars: repos.reduce((sum, r) => sum + r.stargazerCount, 0),
    commits,
    pullRequests: user.pullRequests.totalCount,
    issues: user.issues.totalCount,
    contributedTo: user.repositoriesContributedTo.totalCount,
    repos: user.repositories.totalCount,
    days,
    languages: [...languages.values()].sort((a, b) => b.size - a.size),
  };
}

export function profile(login: string) {
  return cached(`profile:${login}`, () => loadProfile(login));
}

export interface Repo {
  owner: string;
  name: string;
  description: string | null;
  stars: number;
  forks: number;
  language: { name: string; color: string } | null;
  topics: string[];
  homepage: string | null;
  archived: boolean;
}

async function loadRepo(owner: string, name: string): Promise<Repo> {
  const data = await graphql<{
    repository: {
      owner: { login: string };
      name: string;
      description: string | null;
      isPrivate: boolean;
      isArchived: boolean;
      stargazerCount: number;
      forkCount: number;
      homepageUrl: string | null;
      primaryLanguage: { name: string; color: string | null } | null;
      repositoryTopics: { nodes: { topic: { name: string } }[] };
    } | null;
  }>(
    `query ($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        owner { login } name description isPrivate isArchived stargazerCount forkCount homepageUrl
        primaryLanguage { name color }
        repositoryTopics(first: 6) { nodes { topic { name } } }
      }
    }`,
    { owner, name },
  );
  const repo = data.repository;
  // The token can see private repos; a card would show what's in them
  if (!repo || repo.isPrivate) throw new NotFound(`No public repo ${owner}/${name}`);
  return {
    owner: repo.owner.login,
    name: repo.name,
    description: repo.description,
    stars: repo.stargazerCount,
    forks: repo.forkCount,
    language: repo.primaryLanguage && { name: repo.primaryLanguage.name, color: repo.primaryLanguage.color ?? '#8b8b96' },
    topics: repo.repositoryTopics.nodes.map((n) => n.topic.name),
    homepage: repo.homepageUrl || null,
    archived: repo.isArchived,
  };
}

export function repo(owner: string, name: string) {
  return cached(`repo:${owner}/${name}`.toLowerCase(), () => loadRepo(owner, name));
}
