import Vue from 'vue'
import Router from 'vue-router'
import { normalizeURL, decode } from 'ufo'
import { interopDefault } from './utils'
import scrollBehavior from './router.scrollBehavior.js'

const _55daf297 = () => interopDefault(import('../pages/history/index.vue' /* webpackChunkName: "pages/history/index" */))
const _663efd69 = () => interopDefault(import('../pages/login.vue' /* webpackChunkName: "pages/login" */))
const _5fd7238b = () => interopDefault(import('../pages/review/index.vue' /* webpackChunkName: "pages/review/index" */))
const _0768d420 = () => interopDefault(import('../pages/seal/index.vue' /* webpackChunkName: "pages/seal/index" */))
const _74bc1599 = () => interopDefault(import('../pages/weighing/index.vue' /* webpackChunkName: "pages/weighing/index" */))
const _ad5ea0c0 = () => interopDefault(import('../pages/workorder/index.vue' /* webpackChunkName: "pages/workorder/index" */))
const _c6d14b5c = () => interopDefault(import('../pages/index.vue' /* webpackChunkName: "pages/index" */))

const emptyFn = () => {}

Vue.use(Router)

export const routerOptions = {
  mode: 'history',
  base: '/',
  linkActiveClass: 'nuxt-link-active',
  linkExactActiveClass: 'nuxt-link-exact-active',
  scrollBehavior,

  routes: [{
    path: "/history",
    component: _55daf297,
    name: "history"
  }, {
    path: "/login",
    component: _663efd69,
    name: "login"
  }, {
    path: "/review",
    component: _5fd7238b,
    name: "review"
  }, {
    path: "/seal",
    component: _0768d420,
    name: "seal"
  }, {
    path: "/weighing",
    component: _74bc1599,
    name: "weighing"
  }, {
    path: "/workorder",
    component: _ad5ea0c0,
    name: "workorder"
  }, {
    path: "/",
    component: _c6d14b5c,
    name: "index"
  }],

  fallback: false
}

export function createRouter (ssrContext, config) {
  const base = (config._app && config._app.basePath) || routerOptions.base
  const router = new Router({ ...routerOptions, base  })

  // TODO: remove in Nuxt 3
  const originalPush = router.push
  router.push = function push (location, onComplete = emptyFn, onAbort) {
    return originalPush.call(this, location, onComplete, onAbort)
  }

  const resolve = router.resolve.bind(router)
  router.resolve = (to, current, append) => {
    if (typeof to === 'string') {
      to = normalizeURL(to)
    }
    return resolve(to, current, append)
  }

  return router
}
