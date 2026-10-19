import { beforeEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { LocalStorageLibraryRepository, setLibraryRepository } from '@/services/libraryRepository'
import { useLibraryStore } from '@/stores/library'
import StatusHistoryEditor from './StatusHistoryEditor.vue'

async function setup() {
  const store = useLibraryStore()
  await store.add({ id: 1, name: 'Portal 2', image: null, released: null, genres: [] }, 'playing')
  const wrapper = mount(StatusHistoryEditor, { props: { entry: store.get(1)! } })
  store.$subscribe(() => wrapper.setProps({ entry: store.get(1)! }))
  return { store, wrapper }
}

describe('StatusHistoryEditor', () => {
  beforeEach(() => {
    localStorage.clear()
    setLibraryRepository(new LocalStorageLibraryRepository(localStorage, 'test'))
    setActivePinia(createPinia())
  })

  it('changes the date of an event', async () => {
    const { store, wrapper } = await setup()
    await wrapper.find('li input[type="date"]').setValue('2024-03-05')
    await flushPromises()
    const at = new Date(store.get(1)!.history[0].at)
    expect([at.getFullYear(), at.getMonth() + 1, at.getDate()]).toEqual([2024, 3, 5])
  })

  it('adds a past event in date order, and can remove it', async () => {
    const { store, wrapper } = await setup()
    await wrapper.find('form select').setValue('backlog')
    await wrapper.find('form input[type="date"]').setValue('2020-01-01')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(store.get(1)!.history.map((e) => e.status)).toEqual(['backlog', 'playing'])

    await wrapper.find('li button').trigger('click')
    await flushPromises()
    expect(store.get(1)!.history.map((e) => e.status)).toEqual(['playing'])
    expect(wrapper.find('li button').attributes('disabled')).toBeDefined()
  })
})
