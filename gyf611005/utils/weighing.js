/**
 * 称重核心算法工具
 * 实现毛毡垫称重法的三次取中值、偏差计算、复称判断等核心逻辑
 */

/**
 * 计算三个数值的中值
 * @param {number[]} values - 三个称重值组成的数组
 * @returns {number} 中值
 */
export function calculateMedian(values) {
  if (!Array.isArray(values) || values.length !== 3) {
    throw new Error('必须提供三个称重值')
  }
  const validValues = values.map(v => parseFloat(v))
  if (validValues.some(v => isNaN(v) || v < 0)) {
    throw new Error('称重值必须为非负数字')
  }
  const sorted = [...validValues].sort(function(a, b) { return a - b })
  return Math.round(sorted[1] * 1000) / 1000
}

/**
 * 计算最大偏差（与中值比较）
 * @param {number[]} values - 三个称重值
 * @param {number} median - 中值
 * @returns {number} 最大偏差
 */
export function calculateDeviation(values, median) {
  const validValues = values.map(function(v) { return parseFloat(v) })
  const m = median !== undefined ? parseFloat(median) : calculateMedian(validValues)
  const deviations = validValues.map(function(v) { return Math.abs(v - m) })
  return Math.round(Math.max.apply(null, deviations) * 1000) / 1000
}

/**
 * 判断是否需要复称
 * @param {number} deviation - 偏差值
 * @param {number} threshold - 偏差阈值，默认 0.3g
 * @returns {boolean}
 */
export function needsReweigh(deviation, threshold) {
  if (threshold === undefined) threshold = 0.3
  return parseFloat(deviation) > parseFloat(threshold)
}

/**
 * 复核比对判断
 * @param {number} original - 原始中值
 * @param {number} review - 复核输入值
 * @param {number} threshold - 允许差异阈值，默认 0.1g
 * @returns {boolean}
 */
export function reviewMatch(original, review, threshold) {
  if (threshold === undefined) threshold = 0.1
  return Math.abs(parseFloat(original) - parseFloat(review)) <= parseFloat(threshold)
}

/**
 * 计算三个值的平均值
 * @param {number[]} values
 * @returns {number}
 */
export function calculateAverage(values) {
  const validValues = values.map(function(v) { return parseFloat(v) })
  var sum = validValues.reduce(function(acc, v) { return acc + v }, 0)
  return Math.round((sum / validValues.length) * 1000) / 1000
}

/**
 * 格式化称重值显示（保留三位小数）
 * @param {number} value
 * @returns {string}
 */
export function formatWeight(value) {
  var num = parseFloat(value)
  if (isNaN(num)) return '--'
  return num.toFixed(3)
}

/**
 * 格式化偏差显示，附带颜色级别
 * @param {number} deviation 
 * @param {number} threshold 
 * @returns {Object} { text, level }
 */
export function formatDeviation(deviation, threshold) {
  if (threshold === undefined) threshold = 0.3
  var d = parseFloat(deviation)
  var t = parseFloat(threshold)
  var level = 'safe'
  
  if (d > t) {
    level = 'danger'
  } else if (d > t * 0.6) {
    level = 'warning'
  }
  
  return {
    text: d.toFixed(3) + ' g',
    level: level
  }
}

/**
 * 生成称重记录唯一ID
 * @param {string} rareBookNo - 善本编号
 * @returns {string}
 */
export function generateRecordId(rareBookNo) {
  var timestamp = Date.now()
  var random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return 'WR-' + (rareBookNo || 'UNKNOWN') + '-' + timestamp + '-' + random
}

/**
 * 验证称重数据完整性
 * @param {Object} record - 称重记录
 * @returns {boolean}
 */
export function validateWeighingRecord(record) {
  if (!record) return false
  if (!record.rare_book_no) return false
  if (!Array.isArray(record.weights) || record.weights.length !== 3) return false
  if (!record.humidity_data) return false
  if (record.median_value === undefined || record.median_value === null) return false
  return true
}

/**
 * 估算纸张湿度（基于毛毡垫法经验公式）
 * @param {number} dryWeight - 干重
 * @param {number} wetWeight - 湿重
 * @returns {number} 湿度百分比
 */
export function estimateHumidity(dryWeight, wetWeight) {
  var d = parseFloat(dryWeight)
  var w = parseFloat(wetWeight)
  if (d <= 0) return 0
  return Math.round(((w - d) / d * 100) * 10) / 10
}

/**
 * 判断是否需要脱酸处理
 * @param {number} humidity - 纸张湿度百分比
 * @param {number} threshold - 阈值，默认 15%
 * @returns {boolean}
 */
export function needsDeacidification(humidity, threshold) {
  if (threshold === undefined) threshold = 15
  return parseFloat(humidity) > parseFloat(threshold)
}

/**
 * 计算复称次数（从称重尝试数组中统计）
 * @param {Array} attempts - 称重尝试数组
 * @returns {number}
 */
export function countReweighAttempts(attempts) {
  if (!Array.isArray(attempts)) return 0
  return Math.max(0, attempts.length - 1)
}
