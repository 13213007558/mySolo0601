/**
 * CSV 导出工具
 * 对接典藏管理系统的标准格式
 */
import Papa from 'papaparse'
import dayjs from './dayjs'

/**
 * 典藏管理系统 CSV 列定义
 */
export const CSV_COLUMNS = [
  { key: 'record_id', label: '记录编号', required: true },
  { key: 'rare_book_no', label: '善本编号', required: true },
  { key: 'page_no', label: '页码', required: true },
  { key: 'weight_1', label: '称重1(g)', required: true },
  { key: 'weight_2', label: '称重2(g)', required: true },
  { key: 'weight_3', label: '称重3(g)', required: true },
  { key: 'median_value', label: '中值(g)', required: true },
  { key: 'max_deviation', label: '最大偏差(g)', required: true },
  { key: 'reweigh_count', label: '复称次数', required: true },
  { key: 'temperature', label: '温度(°C)', required: true },
  { key: 'humidity', label: '湿度(%RH)', required: true },
  { key: 'probe_id', label: '探针编号', required: false },
  { key: 'operator_id', label: '操作员ID', required: true },
  { key: 'operator_name', label: '操作员姓名', required: true },
  { key: 'reviewer_id', label: '复核员ID', required: false },
  { key: 'reviewer_name', label: '复核员姓名', required: false },
  { key: 'review_value', label: '复核值(g)', required: false },
  { key: 'status', label: '状态', required: true },
  { key: 'has_workorder', label: '是否生成工单', required: true },
  { key: 'is_sealed', label: '是否封存', required: true },
  { key: 'weighing_time', label: '称重时间', required: true },
  { key: 'archive_time', label: '归档时间', required: false },
  { key: 'data_hash', label: '数据校验码', required: true },
  { key: 'notes', label: '备注', required: false }
]

/**
 * 将称重记录转换为 CSV 行数据
 * @param {Object} record - 称重记录
 * @returns {Object} CSV 行对象
 */
export function transformRecordToCsvRow(record) {
  var primaryAttempt = record.attempts && record.attempts.length > 0
    ? record.attempts[record.attempts.length - 1]
    : null
  
  var row = {
    record_id: record.id || '',
    rare_book_no: record.rare_book_no || '',
    page_no: record.page_no || '',
    weight_1: primaryAttempt ? primaryAttempt.weight_1 : '',
    weight_2: primaryAttempt ? primaryAttempt.weight_2 : '',
    weight_3: primaryAttempt ? primaryAttempt.weight_3 : '',
    median_value: record.median_value || '',
    max_deviation: record.max_deviation || '',
    reweigh_count: record.reweigh_count || 0,
    temperature: record.humidity_data ? record.humidity_data.temperature : '',
    humidity: record.humidity_data ? record.humidity_data.humidity : '',
    probe_id: record.humidity_data ? record.humidity_data.probe_id : '',
    operator_id: record.operator_id || '',
    operator_name: record.operator_name || '',
    reviewer_id: record.review_record ? record.review_record.reviewer_id : '',
    reviewer_name: record.review_record ? record.review_record.reviewer_name : '',
    review_value: record.review_record ? record.review_record.review_value : '',
    status: getStatusText(record.status),
    has_workorder: record.work_order ? '是' : '否',
    is_sealed: record.seal_process ? '是' : '否',
    weighing_time: formatDateTime(record.created_at),
    archive_time: record.archived_at ? formatDateTime(record.archived_at) : '',
    data_hash: record.data_hash || '',
    notes: record.notes || ''
  }
  
  return row
}

/**
 * 获取状态文本
 * @param {string} status 
 * @returns {string}
 */
function getStatusText(status) {
  var statusMap = {
    'normal': '正常',
    'reweighed': '已复称',
    'reviewed': '已复核',
    'sealed': '已封存',
    'pending': '待处理'
  }
  return statusMap[status] || status
}

/**
 * 格式化日期时间
 * @param {string|number} date 
 * @returns {string}
 */
function formatDateTime(date) {
  if (!date) return ''
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

/**
 * 导出称重记录为 CSV 文件
 * @param {Array} records - 称重记录数组
 * @param {string} filename - 文件名（不含扩展名）
 * @returns {void}
 */
export function exportWeighingRecordsToCsv(records, filename) {
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error('没有可导出的记录')
  }
  
  var rows = records.map(transformRecordToCsvRow)
  var headers = CSV_COLUMNS.map(function(col) { return col.label })
  
  var csvContent = Papa.unparse({
    fields: headers,
    data: rows.map(function(row) {
      return CSV_COLUMNS.map(function(col) { return row[col.key] })
    })
  }, {
    encoding: 'UTF-8',
    quotes: true,
    quoteChar: '"',
    delimiter: ','
  })
  
  var BOM = '\uFEFF'
  var blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  var link = document.createElement('a')
  var url = URL.createObjectURL(blob)
  
  var exportName = filename || ('称重记录_' + dayjs().format('YYYYMMDD_HHmmss'))
  
  link.setAttribute('href', url)
  link.setAttribute('download', exportName + '.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 解析 CSV 文件为称重记录（用于导入）
 * @param {File} file - CSV 文件
 * @returns {Promise<Array>}
 */
export function parseCsvToRecords(file) {
  return new Promise(function(resolve, reject) {
    Papa.parse(file, {
      header: true,
      encoding: 'UTF-8',
      complete: function(results) {
        var records = results.data.map(function(row) {
          return {
            id: row['记录编号'] || row.record_id,
            rare_book_no: row['善本编号'] || row.rare_book_no,
            page_no: row['页码'] || row.page_no,
            median_value: parseFloat(row['中值(g)'] || row.median_value),
            max_deviation: parseFloat(row['最大偏差(g)'] || row.max_deviation),
            status: row['状态'] || row.status,
            created_at: row['称重时间'] || row.weighing_time
          }
        }).filter(function(r) { return r.rare_book_no })
        
        resolve(records)
      },
      error: function(error) {
        reject(error)
      }
    })
  })
}

/**
 * 生成 CSV 格式说明文档
 * @returns {string}
 */
export function generateCsvFormatDoc() {
  var doc = [
    '善本毛毡称重台 - CSV 数据格式说明',
    '===================================',
    '',
    '版本: v1.0',
    '生成时间: ' + dayjs().format('YYYY-MM-DD HH:mm:ss'),
    '',
    '字段说明:',
    '------------'
  ]
  
  CSV_COLUMNS.forEach(function(col) {
    doc.push('- ' + col.label + ' (' + col.key + '): ' + (col.required ? '必填' : '可选'))
  })
  
  doc.push('')
  doc.push('注意事项:')
  doc.push('1. 文件编码必须为 UTF-8 with BOM')
  doc.push('2. 字段分隔符为英文逗号(,)')
  doc.push('3. 文本字段使用双引号(")包裹')
  doc.push('4. 日期时间格式: YYYY-MM-DD HH:mm:ss')
  doc.push('5. 数值字段保留3位小数')
  doc.push('6. 数据校验码用于验证数据完整性，不可修改')
  
  return doc.join('\n')
}

/**
 * 导出格式说明文档
 * @param {string} filename 
 */
export function exportFormatDoc(filename) {
  var content = generateCsvFormatDoc()
  var blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
  var link = document.createElement('a')
  var url = URL.createObjectURL(blob)
  var name = filename || ('CSV格式说明_' + dayjs().format('YYYYMMDD'))
  
  link.setAttribute('href', url)
  link.setAttribute('download', name + '.txt')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
