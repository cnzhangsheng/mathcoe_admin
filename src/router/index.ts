import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue')
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/Users.vue')
      },
      {
        path: 'topics',
        name: 'Topics',
        component: () => import('@/views/Topics.vue')
      },
      {
        path: 'exam-papers',
        name: 'ExamPapers',
        component: () => import('@/views/ExamPapers.vue')
      },
      {
        path: 'exam-papers/:id',
        name: 'ExamPaperDetail',
        component: () => import('@/views/ExamPaperDetail.vue')
      },
      {
        path: 'questions',
        name: 'Questions',
        component: () => import('@/views/Questions.vue')
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('@/views/Reports.vue')
      },
      {
        path: 'contents',
        name: 'Contents',
        component: () => import('@/views/Contents.vue')
      },
      {
        path: 'banners',
        name: 'Banners',
        component: () => import('@/views/Banners.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const token = localStorage.getItem('admin_token')
  const isLoggedIn = !!token

  if (to.meta.requiresAuth && !isLoggedIn) {
    return '/login'
  }
  if (to.path === '/login' && isLoggedIn) {
    return '/'
  }
})

export default router