/**
 * IndexedDB 初始化插件
 * 用于长期存储称重记录（≥30年归档）
 */
import Vue from 'vue'
import { openDB } from 'idb'

const DB_NAME = 'shanben-weighing-db'
const DB_VERSION = 1

const STORES = {
  WEIGHING_RECORDS: 'weighing_records',
  HUMIDITY_HISTORY: 'humidity_history',
  OPERATION_LOGS: 'operation_logs',
  WORK_ORDERS: 'work_orders',
  PHOTO_ARCHIVES: 'photo_archives',
  USER_SESSIONS: 'user_sessions'
}

let dbInstance = null

async function initDB() {
  if (dbInstance) return dbInstance
  
  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade: function(db) {
      if (!db.objectStoreNames.contains(STORES.WEIGHING_RECORDS)) {
        var recordStore = db.createObjectStore(STORES.WEIGHING_RECORDS, { keyPath: 'id' })
        recordStore.createIndex('rare_book_no', 'rare_book_no', { unique: false })
        recordStore.createIndex('created_at', 'created_at', { unique: false })
        recordStore.createIndex('operator_id', 'operator_id', { unique: false })
        recordStore.createIndex('status', 'status', { unique: false })
        recordStore.createIndex('is_archived', 'is_archived', { unique: false })
      }
      
      if (!db.objectStoreNames.contains(STORES.HUMIDITY_HISTORY)) {
        var humidityStore = db.createObjectStore(STORES.HUMIDITY_HISTORY, { keyPath: 'id' })
        humidityStore.createIndex('record_id', 'record_id', { unique: false })
        humidityStore.createIndex('measured_at', 'measured_at', { unique: false })
        humidityStore.createIndex('probe_id', 'probe_id', { unique: false })
      }
      
      if (!db.objectStoreNames.contains(STORES.OPERATION_LOGS)) {
        var logStore = db.createObjectStore(STORES.OPERATION_LOGS, { keyPath: 'id' })
        logStore.createIndex('user_id', 'user_id', { unique: false })
        logStore.createIndex('action', 'action', { unique: false })
        logStore.createIndex('timestamp', 'timestamp', { unique: false })
      }
      
      if (!db.objectStoreNames.contains(STORES.WORK_ORDERS)) {
        var orderStore = db.createObjectStore(STORES.WORK_ORDERS, { keyPath: 'id' })
        orderStore.createIndex('record_id', 'record_id', { unique: false })
        orderStore.createIndex('status', 'status', { unique: false })
        orderStore.createIndex('type', 'type', { unique: false })
      }
      
      if (!db.objectStoreNames.contains(STORES.PHOTO_ARCHIVES)) {
        var photoStore = db.createObjectStore(STORES.PHOTO_ARCHIVES, { keyPath: 'id' })
        photoStore.createIndex('attempt_id', 'attempt_id', { unique: false })
        photoStore.createIndex('record_id', 'record_id', { unique: false })
        photoStore.createIndex('photo_type', 'photo_type', { unique: false })
      }
      
      if (!db.objectStoreNames.contains(STORES.USER_SESSIONS)) {
        db.createObjectStore(STORES.USER_SESSIONS, { keyPath: 'id' })
      }
    }
  })
  
  return dbInstance
}

/**
 * 称重记录数据访问对象
 */
var WeighingRecordDAO = {
  async save(record) {
    var db = await initDB()
    return db.put(STORES.WEIGHING_RECORDS, record)
  },
  
  async getById(id) {
    var db = await initDB()
    return db.get(STORES.WEIGHING_RECORDS, id)
  },
  
  async list(params) {
    if (params === undefined) params = {}
    var db = await initDB()
    var records = await db.getAll(STORES.WEIGHING_RECORDS)
    
    if (params.rare_book_no) {
      records = records.filter(function(r) { return r.rare_book_no === params.rare_book_no })
    }
    if (params.status) {
      records = records.filter(function(r) { return r.status === params.status })
    }
    if (params.start_date && params.end_date) {
      records = records.filter(function(r) {
        return r.created_at >= params.start_date && r.created_at <= params.end_date
      })
    }
    
    records.sort(function(a, b) { return new Date(b.created_at) - new Date(a.created_at) })
    
    if (params.limit) {
      records = records.slice(0, params.limit)
    }
    
    return records
  },
  
  async getLast7Days() {
    var db = await initDB()
    var all = await db.getAll(STORES.WEIGHING_RECORDS)
    var sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    
    return all
      .filter(function(r) { return new Date(r.created_at).getTime() >= sevenDaysAgo })
      .sort(function(a, b) { return new Date(a.created_at) - new Date(b.created_at) })
  },
  
  async count() {
    var db = await initDB()
    return db.count(STORES.WEIGHING_RECORDS)
  },
  
  async archive(id) {
    var db = await initDB()
    var record = await db.get(STORES.WEIGHING_RECORDS, id)
    if (record) {
      record.is_archived = true
      record.archived_at = new Date().toISOString()
      return db.put(STORES.WEIGHING_RECORDS, record)
    }
    return null
  }
}

/**
 * 操作日志 DAO
 */
var OperationLogDAO = {
  async log(userId, action, details) {
    var db = await initDB()
    var log = {
      id: 'LOG-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
      user_id: userId,
      action: action,
      details: details || {},
      timestamp: new Date().toISOString(),
      hash: ''
    }
    return db.put(STORES.OPERATION_LOGS, log)
  },
  
  async list(userId, limit) {
    if (limit === undefined) limit = 100
    var db = await initDB()
    var logs = await db.getAll(STORES.OPERATION_LOGS)
    
    if (userId) {
      logs = logs.filter(function(l) { return l.user_id === userId })
    }
    
    logs.sort(function(a, b) { return new Date(b.timestamp) - new Date(a.timestamp) })
    
    return logs.slice(0, limit)
  }
}

/**
 * 照片归档 DAO
 */
var PhotoArchiveDAO = {
  async save(photo) {
    var db = await initDB()
    return db.put(STORES.PHOTO_ARCHIVES, photo)
  },
  
  async getByAttemptId(attemptId) {
    var db = await initDB()
    var all = await db.getAll(STORES.PHOTO_ARCHIVES)
    return all.filter(function(p) { return p.attempt_id === attemptId })
  },
  
  async getByRecordId(recordId) {
    var db = await initDB()
    var all = await db.getAll(STORES.PHOTO_ARCHIVES)
    return all.filter(function(p) { return p.record_id === recordId })
  }
}

/**
 * 工单 DAO
 */
var WorkOrderDAO = {
  async save(order) {
    var db = await initDB()
    return db.put(STORES.WORK_ORDERS, order)
  },
  
  async getById(id) {
    var db = await initDB()
    return db.get(STORES.WORK_ORDERS, id)
  },
  
  async list(status) {
    var db = await initDB()
    var orders = await db.getAll(STORES.WORK_ORDERS)
    
    if (status) {
      orders = orders.filter(function(o) { return o.status === status })
    }
    
    orders.sort(function(a, b) { return new Date(b.created_at) - new Date(a.created_at) })
    return orders
  }
}

/**
 * 温湿度历史 DAO
 */
var HumidityHistoryDAO = {
  async save(data) {
    var db = await initDB()
    return db.put(STORES.HUMIDITY_HISTORY, data)
  },
  
  async getLast7Days(probeId) {
    var db = await initDB()
    var all = await db.getAll(STORES.HUMIDITY_HISTORY)
    var sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    
    return all
      .filter(function(h) {
        var inRange = new Date(h.measured_at).getTime() >= sevenDaysAgo
        var matchProbe = probeId ? h.probe_id === probeId : true
        return inRange && matchProbe
      })
      .sort(function(a, b) { return new Date(a.measured_at) - new Date(b.measured_at) })
  }
}

const database = {
  init: initDB,
  STORES: STORES,
  weighingRecords: WeighingRecordDAO,
  operationLogs: OperationLogDAO,
  photoArchives: PhotoArchiveDAO,
  workOrders: WorkOrderDAO,
  humidityHistory: HumidityHistoryDAO
}

Vue.prototype.$db = database

export default database
export { initDB, STORES, WeighingRecordDAO, OperationLogDAO, PhotoArchiveDAO, WorkOrderDAO, HumidityHistoryDAO }
