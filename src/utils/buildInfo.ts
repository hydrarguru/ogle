export interface CommitInfo {
  /** Abbreviated hash for display. */
  short: string
  full: string
  /** Link to the commit on GitHub, or null when the repository is unknown. */
  url: string | null
}

/** Turns `git+https://github.com/o/r.git` style URLs into `https://github.com/o/r`; null for anything else. */
export function githubRepoUrl(repo: string | null | undefined): string | null {
  const match = repo?.trim().match(/^(?:git\+)?https:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/)
  return match ? `https://github.com/${match[1]}/${match[2]}` : null
}

export function commitInfo(hash: string | null | undefined, repo: string | null | undefined): CommitInfo | null {
  if (!hash || !/^[0-9a-f]{40}$/.test(hash)) return null
  const base = githubRepoUrl(repo)
  return { short: hash.slice(0, 7), full: hash, url: base ? `${base}/commit/${hash}` : null }
}

/** The commit this build was made from, or null when it could not be determined. */
export const buildCommit = commitInfo(__COMMIT_HASH__, __REPO_URL__)
