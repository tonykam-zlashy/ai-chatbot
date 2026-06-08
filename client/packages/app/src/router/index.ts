import {
  createRouter,
  createWebHashHistory
} from 'vue-router'


const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/:conversationId?',
      name: 'home',
      component: () => import('@/pages/Home.vue'),
    },
    {
      path: '/app/:applicationId?',
      name: 'app',
      component: () => import('@/pages/Home.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/Login.vue'),
    },
    {
      path: '/share/:shareId?',
      name: 'share',
      meta:{
        unauthorized: true
      },
      component: () => import('@/pages/Share.vue'),
    },
  ],
})

export default router
