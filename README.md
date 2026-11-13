# readme-stats

Stats, badges, a skills grid and project cards for a GitHub profile README, all in one matching style and in a dark and a light version.

It replaces separate stats, streak and top-language services with one small Bun server. GitHub's answers are kept in memory and fetched again in the background, so after the first request every card comes back in milliseconds.

## Cards

| Path | What it draws |
| --- | --- |
| `/card?user=you` | Overview, current streak, top languages and the last year of contributions in one card |
| `/repo/:owner/:name` | A project card, for showcasing more repos than GitHub's six pins |
| `/skills?languages=typescript,java&frontend=react` | Every skill in one picture, a row per group |
| `/badge/:icon?label=Discord` | A small chip with a [Simple Icons](https://simpleicons.org) logo, for links |
| `/banner?label=&title=&subtitle=` | A header for the top of the README |
| `/stats.json?user=you` | The profile card's numbers as JSON, for alt text a scheduled Action writes into the README |
| `/views?user=you` | A profile view counter; `since=2026-07` adds when it started counting |

Every card takes `?theme=dark` or `?theme=light`. `v=` does nothing, so changing it gives a card a new link: GitHub's image proxy keeps a card up to the time it says, so after changing the look, bump `v` to show it straight away. Open `/` for a preview of everything in both.

### Options

- **`/card`**: `graph=false` leaves out the contribution graph. `langs=5` sets how many languages are shown, up to 8, and `hide=html,css` leaves some out. `by=` ranks languages by `bytes` of code, by how many `repos` use them, or by a `mixed` of both (the default, so one big language doesn't fill the whole bar).
- **`/repo`**: `label=` sets the small line above the name (the first topic otherwise) and `desc=` replaces the repo's description. Only public repos of the accounts in `GITHUB_USERS` get a card.
- **`/skills`**: every query key is a group, in the order given, with `_` for spaces. An entry can carry its own label as `react:React Native`. Besides Simple Icons slugs it knows `java`, `node`, `next`, `postgres` and the like, and `ai`/`ps` for Illustrator and Photoshop, which Simple Icons no longer has. `title=` adds a heading.
- **`/badge`**: `label=`, `value=` for a second part, and `color=` to recolour the icon. Octicons such as `link` work as icons too. A brand colour that wouldn't show on the card, such as black on dark, falls back to the text colour.

## Using it in a README

Show the version that matches the reader's theme with `<picture>`:

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://stats.example.com/card?user=you&theme=dark">
  <img src="https://stats.example.com/card?user=you&theme=light" alt="GitHub stats" width="100%">
</picture>
```

Put two project cards side by side with `width="49%"` on each.

Write commas in the links as `%2C` (`languages=typescript%2Cjava`), at least in `srcset`: GitHub splits `srcset` at commas, so the dark version would get a link that's cut off there.

## Running it

Copy `.env.example` to `.env` and fill in a GitHub token and the accounts it may draw cards for. Then:

```sh
docker compose up -d --build
```

or, without Docker, `bun install` and `bun run dev`.

Put it behind a reverse proxy with HTTPS: GitHub only loads images over HTTPS. The view counter keeps its count in `data/`.

## Fonts

The cards carry [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono), cut down to Latin, because an image in a README can't load fonts from anywhere else. It's under the SIL Open Font License, in `fonts/OFL.txt`.
