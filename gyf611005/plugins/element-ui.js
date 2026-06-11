import Vue from 'vue'
import ElementUI from 'element-ui'

Vue.use(ElementUI, {
  size: 'large',
  zIndex: 3000
})

Vue.prototype.$ELEMENT = { size: 'large', zIndex: 3000 }
