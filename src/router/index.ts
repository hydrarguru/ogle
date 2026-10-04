import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
    { path: '/games', name: 'games', component: () => import('@/views/BrowseView.vue') },
    { path: '/games/:id(\\d+)', name: 'game', component: () => import('@/views/GameDetailView.vue'), props: true },
    { path: '/library', name: 'library', component: () => import('@/views/LibraryView.vue') },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue') },
  ],
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    // Filtering/paging a list shouldn't jump the page; navigating elsewhere should reset it.
    if (to.name === from.name) return false
    return { top: 0 }
  },
})

export default router
