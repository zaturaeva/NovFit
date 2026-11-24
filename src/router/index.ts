import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { getToken } from '../lib/api'

// Расширяем интерфейс метаданных
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
  }
}

// src/router/index.ts
const routes: Array<RouteRecordRaw> = [
  { path: '/auth', name: 'auth', component: () => import('../pages/Auth.vue'), meta: { title: 'NovFit — Авторизация' } },
  { path: '/friends', name: 'friends', component: () => import('../pages/Friends.vue'), meta: { title: 'NovFit — Друзья' } },
  { path: '/friends/requests', name: 'friend-requests', component: () => import('../pages/FriendRequests.vue'), meta: { title: 'NovFit — Заявки в друзья' } },
  {
    path: '/',
    name: 'home',
    // Проверьте: './pages/Home.vue' (маленькая p в pages)
    component: () => import('../pages/Home.vue'),
    meta: { title: 'NovFit — Главная' }
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../pages/Profile.vue'),
    meta: { title: 'NovFit — Профиль' }
  },
  {
    path: '/progress',
    name: 'progress',
    component: () => import('../pages/Progress.vue'),
    meta: { title: 'NovFit — Прогресс' }
  },
  {
    path: '/rating',
    name: 'rating',
    component: () => import('../pages/Rating.vue'),
    meta: { title: 'NovFit — Рейтинг' }
  },
  {
    path: '/diary',
    name: 'diary',
    component: () => import('../pages/Diary.vue'),
    meta: { title: 'NovFit — Дневник' }
  },
  {
    path: '/articles/:slug',
    name: 'article-detail',
    component: () => import('../pages/ArticleDetail.vue'),
    meta: { title: 'NovFit — Статья' }
  },
  {
    path: '/articles',
    name: 'articles',
    component: () => import('../pages/Articles.vue'),
    meta: { title: 'NovFit — Статьи' }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach((to) => {
  document.title = to.meta.title || 'NovFit'
  if (to.path !== '/auth' && !getToken()) return '/auth'
  if (to.path === '/auth' && getToken()) return '/'
})

export default router