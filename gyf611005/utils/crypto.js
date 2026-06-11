/**
 * 加密与数据完整性工具
 * 确保称重记录 30 年不可篡改
 */
import sha256 from 'js-sha256'

/**
 * 生成数据哈希（SHA-256）
 * 用于验证称重记录的完整性
 * @param {Object} data - 待哈希的数据
 * @returns {string} SHA-256 哈希值
 */
export function generateDataHash(data) {
  if (!data) throw new Error('数据不能为空')
  
  var sortedKeys = Object.keys(data).sort()
  var hashInput = sortedKeys.map(function(key) {
    var value = data[key]
    if (typeof value === 'object' && value !== null) {
      return key + ':' + generateDataHash(value)
    }
    return key + ':' + String(value)
  }).join('|')
  
  return sha256(hashInput)
}

/**
 * 验证数据哈希
 * @param {Object} data - 待验证的数据
 * @param {string} expectedHash - 期望的哈希值
 * @returns {boolean}
 */
export function verifyDataHash(data, expectedHash) {
  try {
    var actualHash = generateDataHash(data)
    return actualHash === expectedHash
  } catch (e) {
    return false
  }
}

/**
 * 生成带哈希链的记录
 * 每条记录包含前一条记录的哈希，形成不可篡改的区块链式结构
 * @param {Object} record - 当前记录
 * @param {string|null} previousHash - 前一条记录的哈希
 * @returns {Object} 带哈希的完整记录
 */
export function generateHashedRecord(record, previousHash) {
  var recordToHash = Object.assign({}, record)
  
  if (previousHash) {
    recordToHash.previous_hash = previousHash
  }
  
  recordToHash.timestamp = Date.now()
  recordToHash.nonce = Math.floor(Math.random() * 1000000)
  
  var dataHash = generateDataHash(recordToHash)
  
  return Object.assign({}, record, {
    data_hash: dataHash,
    previous_hash: previousHash || null,
    hash_timestamp: recordToHash.timestamp
  })
}

/**
 * 验证哈希链
 * @param {Array} records - 按时间排序的记录数组
 * @returns {Object} { valid: boolean, invalidIndex: number|null }
 */
export function verifyHashChain(records) {
  if (!Array.isArray(records) || records.length === 0) {
    return { valid: true, invalidIndex: null }
  }
  
  var previousHash = null
  
  for (var i = 0; i < records.length; i++) {
    var record = records[i]
    var recordToVerify = Object.assign({}, record)
    
    delete recordToVerify.data_hash
    delete recordToVerify.previous_hash
    delete recordToVerify.hash_timestamp
    
    if (previousHash) {
      recordToVerify.previous_hash = previousHash
    }
    recordToVerify.timestamp = record.hash_timestamp
    
    if (!record.nonce) {
      recordToVerify.nonce = 0
    } else {
      recordToVerify.nonce = record.nonce
    }
    
    var calculatedHash = generateDataHash(recordToVerify)
    
    if (calculatedHash !== record.data_hash) {
      return { valid: false, invalidIndex: i }
    }
    
    if (previousHash && record.previous_hash !== previousHash) {
      return { valid: false, invalidIndex: i }
    }
    
    previousHash = record.data_hash
  }
  
  return { valid: true, invalidIndex: null }
}

/**
 * 简单密码哈希（用于用户密码存储）
 * @param {string} password - 明文密码
 * @param {string} salt - 盐值
 * @returns {string}
 */
export function hashPassword(password, salt) {
  if (!salt) {
    salt = generateSalt()
  }
  return {
    hash: sha256(salt + '::' + password),
    salt: salt
  }
}

/**
 * 验证密码
 * @param {string} password - 输入的密码
 * @param {string} hash - 存储的哈希
 * @param {string} salt - 存储的盐值
 * @returns {boolean}
 */
export function verifyPassword(password, hash, salt) {
  var calculated = sha256(salt + '::' + password)
  return calculated === hash
}

/**
 * 生成随机盐值
 * @returns {string}
 */
export function generateSalt() {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  var result = ''
  for (var i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 生成操作日志哈希
 * @param {Object} logEntry 
 * @returns {string}
 */
export function hashLogEntry(logEntry) {
  return generateDataHash(logEntry)
}

export function verifyRecordHash(record) {
  if (!record || !record.data_hash) return false
  try {
    var recordCopy = Object.assign({}, record)
    delete recordCopy.data_hash
    delete recordCopy.previous_hash
    delete recordCopy.hash_timestamp
    recordCopy.timestamp = record.hash_timestamp
    if (record.nonce) {
      recordCopy.nonce = record.nonce
    }
    var calculated = generateDataHash(recordCopy)
    return calculated === record.data_hash
  } catch (e) {
    return false
  }
}
