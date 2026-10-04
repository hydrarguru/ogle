import { describe, expect, it } from 'vitest'
import { parseSteamProfile } from './steamProfile'

describe('parseSteamProfile', () => {
  it.each([
    ['https://steamcommunity.com/id/gabelogannewell', { kind: 'vanity', vanity: 'gabelogannewell' }],
    ['https://steamcommunity.com/id/gabe/games/?tab=all', { kind: 'vanity', vanity: 'gabe' }],
    ['steamcommunity.com/id/gabe/', { kind: 'vanity', vanity: 'gabe' }],
    ['  http://www.steamcommunity.com/id/gabe  ', { kind: 'vanity', vanity: 'gabe' }],
    ['https://steamcommunity.com/profiles/76561197960287930', { kind: 'id', id: '76561197960287930' }],
    ['76561197960287930', { kind: 'id', id: '76561197960287930' }],
    ['gabe_n-1', { kind: 'vanity', vanity: 'gabe_n-1' }],
  ])('accepts %s', (input, expected) => {
    expect(parseSteamProfile(input)).toEqual(expected)
  })

  it.each([
    '',
    'a',
    'https://evil.example/id/gabe',
    'https://steamcommunity.com.evil.example/id/gabe',
    'https://steamcommunity.com/profiles/123',
    'https://steamcommunity.com/id/',
    'https://steamcommunity.com/app/220',
    'ftp://steamcommunity.com/id/gabe',
    'javascript:alert(1)',
    'has space',
    'x'.repeat(400),
  ])('rejects %j', (input) => {
    expect(parseSteamProfile(input)).toBeNull()
  })
})
