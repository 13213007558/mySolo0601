import { createRouter, createWebHashHistory } from 'vue-router'
import ReconPage from '@/pages/ReconPage.vue'

const routes = [
  {
    path: '/',
    name: 'recon',
    component: ReconPage,
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
