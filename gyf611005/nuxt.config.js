module.exports = {
  ssr: false,
  telemetry: false,
  head: {
    title: '善本毛毡称重台',
    htmlAttrs: {
      lang: 'zh-CN'
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
      { name: 'renderer', content: 'webkit' },
      { 'http-equiv': 'X-UA-Compatible', content: 'IE=edge' },
      { name: 'description', content: '省图书馆善本库房高精度纸张湿度测量系统' },
      { name: 'author', content: '省图书馆数字化部' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },

  loading: {
    color: '#4A3728',
    height: '4px'
  },

  css: [
    'element-ui/lib/theme-chalk/index.css',
    '~/assets/scss/main.scss'
  ],

  styleResources: {
    scss: [
      '~/assets/scss/_variables.scss',
      '~/assets/scss/_mixins.scss'
    ]
  },

  plugins: [
    { src: '~/plugins/element-ui.js', ssr: false },
    '~/plugins/dayjs.js',
    { src: '~/plugins/indexed-db.js', ssr: false },
    { src: '~/plugins/humidity-probe.js', ssr: false }
  ],

  components: true,

  buildModules: [],

  modules: [
    '@nuxtjs/style-resources'
  ],

  build: {
    babel: {
      sourceType: 'unambiguous',
      presets: [
        ['@babel/preset-env', {
          targets: {
            ie: '11',
            chrome: '80',
            safari: '13'
          },
          useBuiltIns: 'entry',
          corejs: 3,
          modules: 'auto'
        }]
      ]
    },
    transpile: [
      'idb'
    ],
    postcss: {
      preset: {
        autoprefixer: {
          grid: true
        }
      }
    },
    extend(config, { isDev, isClient }) {
      if (isClient) {
        config.node = {
          fs: 'empty',
          child_process: 'empty'
        }
      }
      config.resolve.mainFields = ['browser', 'main']
    }
  },

  router: {
    middleware: ['auth']
  },

  server: {
    port: 3000,
    host: '0.0.0.0'
  },

  target: 'static',

  generate: {
    fallback: true
  }
}
