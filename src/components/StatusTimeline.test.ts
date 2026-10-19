import { describe, expect, it } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import StatusTimeline from './StatusTimeline.vue'
import type { LibraryEntry, StatusChange } from '@/types/library'

const entry = (id: number, name: string, history: StatusChange[]): LibraryEntry => ({
  id,
  name,
  image: null,
  released: null,
  genres: [],
  status: history.at(-1)!.status,
  history,
  rating: null,
  hoursPlayed: 0,
  notes: '',
  addedAt: history[0].at,
  updatedAt: history.at(-1)!.at,
})

const entries = [
  entry(1, 'Hades', [
    { status: 'playing', at: '2024-01-10T12:00:00.000Z' },
    { status: 'completed', at: '2024-03-20T12:00:00.000Z' },
  ]),
  entry(2, 'Anthem', [
    { status: 'playing', at: '2024-02-01T12:00:00.000Z' },
    { status: 'dropped', at: '2024-02-15T12:00:00.000Z' },
  ]),
]

const render = (props: Partial<InstanceType<typeof StatusTimeline>['$props']> = {}) =>
  mount(StatusTimeline, {
    props: { entries, now: Date.parse('2024-06-01T00:00:00.000Z'), ...props },
    global: { stubs: { RouterLink: RouterLinkStub } },
  })

const leftOf = (el: Element) => parseFloat((el as HTMLElement).style.left)

describe('StatusTimeline', () => {
  it('draws a mark for every status change, labelled with what happened', () => {
    const marks = render().findAll('[data-testid="timeline-mark"]')
    const labels = marks.map((m) => m.attributes('aria-label'))
    expect(labels).toHaveLength(4)
    expect(labels[0]).toMatch(/^Hades: Started /)
    expect(labels[1]).toMatch(/^Hades: Finished /)
    expect(labels[3]).toMatch(/^Anthem: Dropped /)
  })

  it('places marks left to right by date', () => {
    const marks = render().findAll('[data-testid="timeline-mark"]').map((m) => leftOf(m.element))
    const [hadesStart, hadesEnd, anthemStart, anthemDrop] = marks
    expect(hadesStart).toBeLessThan(anthemStart)
    expect(anthemStart).toBeLessThan(anthemDrop)
    expect(anthemDrop).toBeLessThan(hadesEnd)
    for (const left of marks) expect(left).toBeGreaterThan(0)
    for (const left of marks) expect(left).toBeLessThan(100)
  })

  it('links each row to its game, earliest first', () => {
    expect(render().findAllComponents(RouterLinkStub).map((l) => [l.text(), l.props('to')])).toEqual([
      ['Hades', { name: 'game', params: { id: 1 } }],
      ['Anthem', { name: 'game', params: { id: 2 } }],
    ])
  })

  it('hides marks for filtered statuses and widens when zoomed', () => {
    const wrapper = render({ hidden: ['playing'], zoom: 4 })
    expect(wrapper.findAll('[data-testid="timeline-mark"]')).toHaveLength(2)
    expect((wrapper.get('[data-testid="timeline-scroll"] > div').element as HTMLElement).style.width).toBe('400%')
  })
})
