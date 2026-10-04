/// <reference types="vite/client" />

/** Full SHA of the commit the app was built from, or null when unknown. Injected by vite.config.ts. */
declare const __COMMIT_HASH__: string | null
/** The `repository.url` from package.json, or null. Injected by vite.config.ts. */
declare const __REPO_URL__: string | null
