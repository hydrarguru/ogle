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

### Moving the library to a backend

Your library is stored in `localStorage` (key `ogle:library`). All access goes through the `LibraryRepository`
interface in `src/services/libraryRepository.ts`. To sync via a real backend with accounts, implement that
interface (`list`, `save`, `remove`, optionally `subscribe`) and register it with `setLibraryRepository()`
before the app mounts. The store and views don't need to change.
