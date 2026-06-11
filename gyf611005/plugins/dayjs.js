import Vue from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import relativeTime from 'dayjs/plugin/relativeTime'
import duration from 'dayjs/plugin/duration'
import isBetween from 'dayjs/plugin/isBetween'

dayjs.locale('zh-cn')
dayjs.extend(relativeTime)
dayjs.extend(duration)
dayjs.extend(isBetween)

Vue.prototype.$dayjs = dayjs

export default dayjs
