import { onScopeDispose, ref, shallowRef, watch, type WatchSource } from 'vue'

interface Options {
  /** Keep showing the previous result while a new one loads. */
  keepPrevious?: boolean
}

/**
 * Runs `fetcher` immediately and again whenever `source` changes, cancelling
 * the in-flight request and ignoring stale responses.
 */
export function useAsyncData<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  source: WatchSource | WatchSource[],
  { keepPrevious = false }: Options = {},
) {
  const data = shallowRef<T>()
  const error = ref<Error | null>(null)
  const loading = ref(true)
  let controller: AbortController | undefined

  async function run() {
    controller?.abort()
    const current = (controller = new AbortController())
    loading.value = true
    error.value = null
    if (!keepPrevious) data.value = undefined
    try {
      const result = await fetcher(current.signal)
      if (current.signal.aborted) return
      data.value = result
    } catch (e) {
      if (current.signal.aborted) return
      error.value = e instanceof Error ? e : new Error(String(e))
    } finally {
      if (controller === current) loading.value = false
    }
  }

  watch(source, run, { immediate: true })
  onScopeDispose(() => controller?.abort())

  return { data, error, loading, reload: run }
}
