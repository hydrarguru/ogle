import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

const FULL_SHA = /^[0-9a-f]{40}$/

/** The commit this build is made from: Netlify's COMMIT_REF in CI, otherwise the local checkout. */
function resolveCommit(): string | null {
  const candidates = [process.env.COMMIT_REF, process.env.GITHUB_SHA]
  try {
    candidates.push(execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim())
  } catch {
    /* not a git checkout (e.g. a source tarball) */
  }
  return candidates.find((c) => c && FULL_SHA.test(c)) ?? null
}

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as {
  repository?: { url?: string }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  define: {
    __COMMIT_HASH__: JSON.stringify(resolveCommit()),
    __REPO_URL__: JSON.stringify(pkg.repository?.url ?? null),
  },
  test: {
    environment: 'jsdom',
  },
})
