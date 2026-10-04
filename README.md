# OGLe (Online Game Library)

Browse games from the [RAWG](https://rawg.io/apidocs) database and track your own library: what you're playing,
what's in your backlog or wishlist, what you've finished, and your rating, hours and notes for each game.

Built with Vue 3, TypeScript, Vite, Pinia, Vue Router and Tailwind CSS.

## Getting started

```sh
pnpm install
cp .env.example .env   # then add your RAWG API key (VITE_API_KEY)
pnpm dev
```

| Command      | What it does                         |
| ------------ | ------------------------------------ |
| `pnpm dev`   | Dev server with hot reload           |
| `pnpm build` | Type-check and build for production  |
| `pnpm test`  | Run unit tests (Vitest)              |
| `pnpm lint`  | Lint with ESLint                     |

## Features

- **Browse & search** with genre filter, sorting and pagination. State lives in the URL, so views are shareable.
- **Game details** with description, screenshots, platforms, developers and ratings.
- **Personal library** with status (playing / backlog / wishlist / completed / dropped), 1-5 star rating,
  hours played and notes. Add from any card or the detail page.
- **Library page** with stats, status tabs, filtering and sorting.
- **Export / import** the library as JSON (backup, or move between browsers). Importing merges: for games you
  already have, the most recently updated copy wins, so it never overwrites newer local edits. Invalid records
  in a file are skipped and counted.
  The import dialog accepts a file or pasted JSON, shows the expected format with a copyable example, and previews
  how many games are new, already in your library, or invalid before anything is changed.
- **Steam import**: paste a Steam profile link (`steamcommunity.com/id/…` or `/profiles/…`, or a SteamID64) to import
  your games and playtime. The profile's *Game details* must be public. Games are matched to RAWG by exact title,
  so some will be skipped (and are counted). New games become *playing* if you played them in the last two weeks,
  otherwise *backlog*, with hours set from Steam. Games you already have keep their status, rating and notes and only
  get their hours raised, never lowered.

### Steam import setup

Browsers cannot call the Steam Web API (no CORS, and it needs a secret key), so a Netlify function
(`netlify/functions/steam-library.ts`) does it server side.

1. Get a key at <https://steamcommunity.com/dev/apikey>.
2. Set `STEAM_API_KEY` in the Netlify site's environment variables (do not prefix it with `VITE_`).
3. Locally, put it in `.env` and run `pnpm dlx netlify-cli dev` instead of `pnpm dev`. Plain `pnpm dev` has no
   function, and the dialog says so.

## Architecture

```
src/
  api/          Typed RAWG client (with a short-lived response cache)
  services/     libraryRepository: persistence boundary for the library
  stores/       Pinia store for the library (optimistic updates, stats)
  composables/  useAsyncData (cancellable fetching), usePageTitle
  components/   Reusable UI (GameCard, StatusMenu, LibraryPanel, ...)
  views/        Route-level pages (lazy loaded)
```

### API caching

RAWG's free tier is rate limited, so responses are cached (`src/api/cache.ts`, used by `src/api/rawg.ts`):

- **Two tiers**: an in-memory map in front of the browser Cache API, so the cache survives page reloads. The Cache
  API is used instead of localStorage so it can never use up the quota the personal library depends on.
- **Per-endpoint lifetimes**: game lists 15 minutes, game details and screenshots 1 day, genres 7 days.
- **Shared requests**: identical concurrent requests are sent once.
- **Stale-if-error**: if RAWG is unreachable, rate limited (429) or failing (5xx), an expired copy is served
  instead of an error. A 404 is never masked.
- **Housekeeping**: entries older than 7 days are deleted, and the store is capped at 300 entries.
- The API key is never part of a cache key or stored value.

Images are not API calls: they load from RAWG's CDN and are cached by the browser's normal HTTP cache. The app
requests resized versions to keep them small.

### Build commit in the footer

The footer shows the commit the running build was made from, linked to that commit on GitHub. `vite.config.ts`
injects the full SHA at build time from Netlify's `COMMIT_REF` (falling back to `git rev-parse HEAD` locally) and
the repository URL from `package.json`. Values are validated before use; if the commit cannot be determined (for
example a build from a source tarball) the footer simply omits it.

### Moving the library to a backend

Your library is stored in `localStorage` (key `ogle:library`). All access goes through the `LibraryRepository`
interface in `src/services/libraryRepository.ts`. To sync via a real backend with accounts, implement that
interface (`list`, `save`, `remove`, optionally `subscribe`) and register it with `setLibraryRepository()`
before the app mounts. The store and views don't need to change.
