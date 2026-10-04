import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { LocalStorageLibraryRepository, setLibraryRepository } from '@/services/libraryRepository'
import type { GameSummary } from '@/types/rawg'
import type { SteamGame } from '@/utils/steamImport'

vi.mock('@/api/steam', () => ({ fetchSteamLibrary: vi.fn(), matchSteamGames: vi.fn() }))
vi.mock('@/api/rawg', () => ({ listGames: vi.fn() }))
import { fetchSteamLibrary, matchSteamGames } from '@/api/steam'
import { listGames } from '@/api/rawg'
import SteamImportDialog from './SteamImportDialog.vue'

const steam = (appId: number, name: string, playtimeMinutes = 120): SteamGame => ({ appId, name, playtimeMinutes, recentMinutes: 0 })
const rawg = (id: number, name: string): GameSummary => ({
  id,
  slug: name,
  name,
  released: '2011-04-18',
  background_image: null,
  rating: 4,
  ratings_count: 1,
  metacritic: null,
  genres: [],
})

async function showPreview(unmatched: SteamGame[]) {
  vi.mocked(fetchSteamLibrary).mockResolvedValue([steam(1, 'Portal 2'), ...unmatched])
  vi.mocked(matchSteamGames).mockResolvedValue({
    matches: [{ game: steam(1, 'Portal 2'), rawg: rawg(4200, 'Portal 2') }],
    unmatched,
    failed: [],
  })
  const wrapper = mount(SteamImportDialog)
  await wrapper.get('#steam-profile').setValue('https://steamcommunity.com/id/gabe')
  await wrapper.get('form').trigger('submit')
  await flushPromises()
  return wrapper
}

describe('SteamImportDialog manual matching', () => {
  beforeEach(() => {
    localStorage.clear()
    setLibraryRepository(new LocalStorageLibraryRepository(localStorage, 'test'))
    setActivePinia(createPinia())
    vi.resetAllMocks()
    HTMLDialogElement.prototype.close = vi.fn() // jsdom has no <dialog> methods
  })

  it('offers manual matching only through the button, and only when games are unmatched', async () => {
    const none = await showPreview([])
    expect(none.find('[data-testid="steam-manual-open"]').exists()).toBe(false)

    const some = await showPreview([steam(2, 'Obscure Game')])
    expect(some.find('[data-testid="steam-manual-list"]').exists()).toBe(false)
    expect(some.get('[data-testid="steam-manual-open"]').text()).toBe('I would like to manually add games.')
  })

  it('searches RAWG on request and adds the picked game to the import', async () => {
    vi.mocked(listGames).mockResolvedValue({ count: 1, next: null, previous: null, results: [rawg(777, 'Obscure Game HD')] })
    const wrapper = await showPreview([steam(2, 'Obscure Game', 180)])
    expect(wrapper.get('[data-testid="steam-preview"]').text()).toContain('1 game new')
    expect(listGames).not.toHaveBeenCalled()

    await wrapper.get('[data-testid="steam-manual-open"]').trigger('click')
    expect(listGames).not.toHaveBeenCalled() // searching starts only when a row is opened

    await wrapper.get('[data-testid="steam-manual-row"] button[aria-expanded]').trigger('click')
    await flushPromises()
    expect(listGames).toHaveBeenCalledWith({ search: 'Obscure Game', pageSize: 6 }, expect.anything())

    await wrapper.get('[data-testid="steam-manual-option"]').trigger('click')
    expect(wrapper.get('[data-testid="steam-manual-picked"]').text()).toContain('Obscure Game HD')
    expect(wrapper.get('[data-testid="steam-preview"]').text()).toContain('2 games new')

    await wrapper.get('[data-testid="steam-submit"]').trigger('click')
    const [[payload]] = wrapper.emitted('submit') as [[{ plan: { entries: { id: number; hoursPlayed: number }[] }; unmatched: number }]]
    expect(payload.plan.entries.map((e) => e.id).sort((a, b) => a - b)).toEqual([777, 4200])
    expect(payload.plan.entries.find((e) => e.id === 777)?.hoursPlayed).toBe(3)
    expect(payload.unmatched).toBe(0)
  })

  it('removing a manual pick takes the game out again', async () => {
    vi.mocked(listGames).mockResolvedValue({ count: 1, next: null, previous: null, results: [rawg(777, 'Obscure Game HD')] })
    const wrapper = await showPreview([steam(2, 'Obscure Game')])
    await wrapper.get('[data-testid="steam-manual-open"]').trigger('click')
    await wrapper.get('[data-testid="steam-manual-row"] button[aria-expanded]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="steam-manual-option"]').trigger('click')
    const remove = wrapper.findAll('[data-testid="steam-manual-row"] button').find((b) => b.text() === 'Remove')
    await remove!.trigger('click')
    expect(wrapper.find('[data-testid="steam-manual-picked"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="steam-preview"]').text()).toContain('1 game new')
  })

  it('lets several Steam entries be combined into one picked game', async () => {
    const cod = rawg(5, 'Call of Duty: Black Ops')
    vi.mocked(listGames).mockResolvedValue({ count: 1, next: null, previous: null, results: [cod] })
    const wrapper = await showPreview([steam(2, 'Black Ops Weird MP', 600), steam(3, 'Black Ops Weird Zombies', 300)])

    await wrapper.get('[data-testid="steam-manual-open"]').trigger('click')
    const rows = () => wrapper.findAll('[data-testid="steam-manual-row"]')
    await rows()[0].get('button[aria-expanded]').trigger('click')
    await flushPromises()
    expect(rows()[0].find('[data-testid="steam-manual-combine"]').exists()).toBe(false) // nothing picked yet
    await rows()[0].get('[data-testid="steam-manual-option"]').trigger('click')

    await rows()[1].get('button[aria-expanded]').trigger('click')
    await flushPromises()
    await rows()[1].get('[data-testid="steam-manual-combine"]').trigger('click')

    expect(wrapper.get('[data-testid="steam-preview"]').text()).toContain('2 games new') // Portal 2 + one combined game
    expect(wrapper.get('[data-testid="steam-combined"]').text()).toContain('2 Steam entries combined into Call of Duty: Black Ops (15 h)')
  })
})
