import { toValue, watchEffect, type MaybeRefOrGetter } from 'vue'

export function usePageTitle(title: MaybeRefOrGetter<string | undefined>) {
  watchEffect(() => {
    const value = toValue(title)
    document.title = value ? `${value} · OGLe` : 'OGLe'
  })
}
