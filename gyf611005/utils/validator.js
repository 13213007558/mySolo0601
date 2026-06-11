/**
 * 业务规则校验工具
 * 实现合规约束：复称两次仍超阈须启动「封存阅览」流程等
 */
import { needsReweigh, countReweighAttempts } from './weighing'

/**
 * 业务规则常量
 */
export const BUSINESS_RULES = {
  MAX_DEVIATION_THRESHOLD: 0.3,
  MAX_REWEIGH_COUNT: 2,
  REVIEW_DIFF_THRESHOLD: 0.1,
  HUMIDITY_THRESHOLD: 15,
  ARCHIVE_YEARS: 30,
  MAX_PAGE_WEIGHT: 100,
  MIN_PAGE_WEIGHT: 0.001
}

/**
 * 验证称重值是否在合理范围内
 * @param {number} weight 
 * @returns {Object} { valid: boolean, message: string }
 */
export function validateWeightRange(weight) {
  var w = parseFloat(weight)
  if (isNaN(w)) {
    return { valid: false, message: '称重值必须为数字' }
  }
  if (w < BUSINESS_RULES.MIN_PAGE_WEIGHT) {
    return { valid: false, message: '称重值过轻，低于最小允许值 ' + BUSINESS_RULES.MIN_PAGE_WEIGHT + 'g' }
  }
  if (w > BUSINESS_RULES.MAX_PAGE_WEIGHT) {
    return { valid: false, message: '称重值过重，超过最大允许值 ' + BUSINESS_RULES.MAX_PAGE_WEIGHT + 'g' }
  }
  return { valid: true, message: '' }
}

/**
 * 验证是否需要封存（复称两次仍超阈）
 * @param {Array} attempts - 称重尝试数组
 * @param {number} threshold - 偏差阈值
 * @returns {Object} { needsSeal: boolean, message: string, reweighCount: number }
 */
export function validateSealRequirement(attempts, threshold) {
  if (threshold === undefined) threshold = BUSINESS_RULES.MAX_DEVIATION_THRESHOLD
  
  var reweighCount = countReweighAttempts(attempts)
  
  if (attempts.length === 0) {
    return { needsSeal: false, message: '无称重记录', reweighCount: 0 }
  }
  
  var lastAttempt = attempts[attempts.length - 1]
  var isOverThreshold = needsReweigh(lastAttempt.deviation, threshold)
  
  if (reweighCount >= BUSINESS_RULES.MAX_REWEIGH_COUNT && isOverThreshold) {
    return {
      needsSeal: true,
      message: '已复称 ' + reweighCount + ' 次，偏差仍超过 ' + threshold + 'g，必须启动封存阅览流程',
      reweighCount: reweighCount
    }
  }
  
  return {
    needsSeal: false,
    message: '',
    reweighCount: reweighCount
  }
}

/**
 * 验证是否可以继续复称
 * @param {Array} attempts 
 * @returns {Object} { canReweigh: boolean, message: string }
 */
export function validateCanReweigh(attempts) {
  var reweighCount = countReweighAttempts(attempts)
  
  if (reweighCount >= BUSINESS_RULES.MAX_REWEIGH_COUNT) {
    return {
      canReweigh: false,
      message: '已达到最大复称次数（' + BUSINESS_RULES.MAX_REWEIGH_COUNT + '次），必须启动封存流程'
    }
  }
  
  return {
    canReweigh: true,
    message: '还可复称 ' + (BUSINESS_RULES.MAX_REWEIGH_COUNT - reweighCount) + ' 次'
  }
}

/**
 * 验证双人复核输入
 * @param {number} originalValue 
 * @param {number} reviewValue 
 * @returns {Object} { valid: boolean, difference: number, message: string }
 */
export function validateReviewInput(originalValue, reviewValue) {
  var original = parseFloat(originalValue)
  var review = parseFloat(reviewValue)
  
  if (isNaN(original) || isNaN(review)) {
    return { valid: false, difference: NaN, message: '数值无效' }
  }
  
  var difference = Math.abs(original - review)
  var threshold = BUSINESS_RULES.REVIEW_DIFF_THRESHOLD
  
  if (difference > threshold) {
    return {
      valid: false,
      difference: difference,
      message: '复核值与原值差异 ' + difference.toFixed(3) + 'g，超过允许阈值 ' + threshold + 'g，请重新复核'
    }
  }
  
  return {
    valid: true,
    difference: difference,
    message: '复核通过，差异 ' + difference.toFixed(3) + 'g'
  }
}

/**
 * 验证温湿度数据有效性
 * @param {Object} humidityData 
 * @returns {Object} { valid: boolean, message: string }
 */
export function validateHumidityData(humidityData) {
  if (!humidityData) {
    return { valid: false, message: '温湿度数据缺失，必须绑定探针读数' }
  }
  
  if (!humidityData.probe_online) {
    return { valid: false, message: '温湿度探针离线，请检查连接后重试' }
  }
  
  var temp = parseFloat(humidityData.temperature)
  var hum = parseFloat(humidityData.humidity)
  
  if (isNaN(temp) || temp < 0 || temp > 50) {
    return { valid: false, message: '温度读数异常 (' + temp + '°C)' }
  }
  
  if (isNaN(hum) || hum < 0 || hum > 100) {
    return { valid: false, message: '湿度读数异常 (' + hum + '%)' }
  }
  
  if (hum > 60) {
    return { valid: true, message: '警告：库房湿度过高 (' + hum + '%)，请留意' }
  }
  
  return { valid: true, message: '' }
}

/**
 * 验证照片留档是否存在
 * @param {Array} photos 
 * @returns {Object} { valid: boolean, message: string }
 */
export function validatePhotoArchive(photos) {
  if (!Array.isArray(photos) || photos.length === 0) {
    return { valid: false, message: '复称流程必须拍照留档' }
  }
  
  var hasReweighPhoto = photos.some(function(p) { return p.photo_type === 'reweigh' })
  if (!hasReweighPhoto) {
    return { valid: false, message: '缺少复称现场照片' }
  }
  
  return { valid: true, message: '' }
}

/**
 * 验证善本编号格式
 * @param {string} rareBookNo 
 * @returns {Object} { valid: boolean, message: string }
 */
export function validateRareBookNo(rareBookNo) {
  if (!rareBookNo || rareBookNo.trim() === '') {
    return { valid: false, message: '善本编号不能为空' }
  }
  
  var pattern = /^[A-Za-z0-9\u4e00-\u9fa5\-_]{2,50}$/
  if (!pattern.test(rareBookNo)) {
    return { valid: false, message: '善本编号格式不正确，只能包含字母、数字、中文、下划线和横杠' }
  }
  
  return { valid: true, message: '' }
}

/**
 * 验证记录是否可以归档（30年保存要求）
 * @param {Object} record 
 * @returns {Object} { valid: boolean, message: string }
 */
export function validateArchiveEligibility(record) {
  if (!record) {
    return { valid: false, message: '记录不存在' }
  }
  
  if (!record.review_record || !record.review_record.is_match) {
    return { valid: false, message: '记录尚未完成双人复核，不能归档' }
  }
  
  if (record.status === 'sealed' && !record.seal_process) {
    return { valid: false, message: '封存记录缺少封存流程信息' }
  }
  
  if (!record.data_hash) {
    return { valid: false, message: '记录缺少完整性校验码' }
  }
  
  return { valid: true, message: '符合归档条件' }
}

/**
 * 批量验证称重记录
 * @param {Array} records 
 * @returns {Object} { allValid: boolean, results: Array }
 */
export function batchValidateRecords(records) {
  if (!Array.isArray(records)) {
    return { allValid: false, results: [] }
  }
  
  var results = records.map(function(record) {
    var weightValidation = validateWeightRange(record.median_value)
    var humidityValidation = validateHumidityData(record.humidity_data)
    var archiveValidation = validateArchiveEligibility(record)
    
    return {
      record_id: record.id,
      valid: weightValidation.valid && humidityValidation.valid,
      errors: [
        weightValidation.message,
        humidityValidation.message,
        archiveValidation.message
      ].filter(function(m) { return m })
    }
  })
  
  return {
    allValid: results.every(function(r) { return r.valid }),
    results: results
  }
}
