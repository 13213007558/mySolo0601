/**
 * Day.js 日期处理工具
 * 轻量级日期库，替代 Moment.js
 */
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

/**
 * 格式化称重时间
 * @param {string|number|Date} date 
 * @returns {string}
 */
export function formatWeighingTime(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

/**
 * 格式化日期（仅日期）
 * @param {string|number|Date} date 
 * @returns {string}
 */
export function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD')
}

/**
 * 获取相对时间描述
 * @param {string|number|Date} date 
 * @returns {string}
 */
export function fromNow(date) {
  return dayjs(date).fromNow()
}

/**
 * 获取 7 日日期范围数组
 * @returns {Array<string>}
 */
export function getLast7Days() {
  var days = []
  for (var i = 6; i >= 0; i--) {
    days.push(dayjs().subtract(i, 'day').format('YYYY-MM-DD'))
  }
  return days
}

/**
 * 获取 30 年归档到期日
 * @param {string|number|Date} createDate 
 * @returns {string}
 */
export function getArchiveExpiryDate(createDate) {
  return dayjs(createDate).add(30, 'year').format('YYYY-MM-DD')
}

/**
 * 判断记录是否需要归档（超过 1 年）
 * @param {string|number|Date} createDate 
 * @returns {boolean}
 */
export function needsArchiving(createDate) {
  return dayjs().diff(dayjs(createDate), 'year') >= 1
}

/**
 * 计算两个日期之间的天数差
 * @param {string|number|Date} start 
 * @param {string|number|Date} end 
 * @returns {number}
 */
export function daysBetween(start, end) {
  return dayjs(end).diff(dayjs(start), 'day')
}

/**
 * 生成日期范围内的所有日期
 * @param {string|number|Date} startDate 
 * @param {string|number|Date} endDate 
 * @returns {Array<string>}
 */
export function getDateRange(startDate, endDate) {
  var dates = []
  var start = dayjs(startDate).startOf('day')
  var end = dayjs(endDate).startOf('day')
  var current = start
  
  while (current.isBefore(end) || current.isSame(end, 'day')) {
    dates.push(current.format('YYYY-MM-DD'))
    current = current.add(1, 'day')
  }
  
  return dates
}

Vue.prototype.$dayjs = dayjs
Vue.prototype.$formatTime = formatWeighingTime
Vue.prototype.$formatDate = formatDate
Vue.prototype.$fromNow = fromNow

export default dayjs
