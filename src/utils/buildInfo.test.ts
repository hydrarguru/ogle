import { describe, expect, it } from 'vitest'
import { commitInfo, githubRepoUrl } from './buildInfo'

const SHA = '8b34503a371367e8621a9eca2710d273418f528e'

describe('githubRepoUrl', () => {
  it('normalizes the usual spellings', () => {
    for (const url of [
      'https://github.com/hydrarguru/ogle.git',
      'git+https://github.com/hydrarguru/ogle.git',
      'https://github.com/hydrarguru/ogle',
      'https://github.com/hydrarguru/ogle/',
    ]) {
      expect(githubRepoUrl(url)).toBe('https://github.com/hydrarguru/ogle')
    }
  })

  it('rejects anything that is not a plain GitHub https repo url', () => {
    for (const url of [null, undefined, '', 'git@github.com:o/r.git', 'https://evil.test/o/r', 'javascript:alert(1)', 'https://github.com/o/r/../x']) {
      expect(githubRepoUrl(url)).toBeNull()
    }
  })
})

describe('commitInfo', () => {
  it('builds a short hash and a commit link', () => {
    expect(commitInfo(SHA, 'https://github.com/hydrarguru/ogle.git')).toEqual({
      short: '8b34503',
      full: SHA,
      url: `https://github.com/hydrarguru/ogle/commit/${SHA}`,
    })
  })

  it('still shows the hash when the repository is unknown', () => {
    expect(commitInfo(SHA, null)).toMatchObject({ short: '8b34503', url: null })
  })

  it('returns null for a missing or malformed hash', () => {
    expect(commitInfo(null, 'https://github.com/o/r')).toBeNull()
    expect(commitInfo('abc123', 'https://github.com/o/r')).toBeNull()
    expect(commitInfo(`${SHA}"><script>`, 'https://github.com/o/r')).toBeNull()
  })
})
