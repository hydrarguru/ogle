import './style.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useLibraryStore } from './stores/library'
import { getLibraryRepository } from './services/libraryRepository'

const app = createApp(App)
app.use(createPinia())
app.use(router)

const library = useLibraryStore()
library.load()
// Keep multiple tabs (or a future synced backend) consistent.
getLibraryRepository().subscribe?.(() => library.load())

app.mount('#app')
