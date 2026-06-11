/**
 * 称重模块 Store
 * 核心业务逻辑：三次称重取中值、复称流程、双人复核、封存流程
 */
import {
  calculateMedian,
  calculateDeviation,
  needsReweigh,
  generateRecordId,
  formatWeight,
  countReweighAttempts,
  estimateHumidity,
  needsDeacidification
} from '~/utils/weighing'

import {
  validateSealRequirement,
  validateCanReweigh,
  validateReviewInput,
  validateHumidityData,
  validatePhotoArchive,
  validateRareBookNo,
  BUSINESS_RULES
} from '~/utils/validator'

import { generateHashedRecord } from '~/utils/crypto'

export const state = function() {
  return {
    currentSession: null,
    records: [],
    currentAttempt: null,
    pendingReview: null,
    activeSealProcess: null,
    loading: false,
    error: null
  }
}

export const mutations = {
  SET_LOADING: function(state, loading) {
    state.loading = loading
  },
  
  SET_ERROR: function(state, error) {
    state.error = error
  },
  
  START_NEW_SESSION: function(state, { rareBookNo, pageNo, user }) {
    state.currentSession = {
      rare_book_no: rareBookNo,
      page_no: pageNo,
      operator_id: user.id,
      operator_name: user.name,
      started_at: new Date().toISOString(),
      attempts: [],
      photos: []
    }
    state.currentAttempt = null
    state.pendingReview = null
    state.error = null
  },
  
  SET_WEIGHT_VALUE: function(state, { index, value }) {
    if (!state.currentAttempt) {
      state.currentAttempt = {
        weights: [null, null, null],
        humidity_data: null
      }
    }
    state.currentAttempt.weights.splice(index, 1, value)
  },
  
  SET_HUMIDITY_DATA: function(state, data) {
    if (!state.currentAttempt) {
      state.currentAttempt = {
        weights: [null, null, null],
        humidity_data: data
      }
    } else {
      state.currentAttempt.humidity_data = data
    }
  },
  
  SUBMIT_ATTEMPT: function(state, attempt) {
    if (state.currentSession) {
      state.currentSession.attempts.push(attempt)
    }
  },
  
  RESET_ATTEMPT: function(state) {
    state.currentAttempt = {
      weights: [null, null, null],
      humidity_data: null
    }
  },
  
  ADD_PHOTO: function(state, photo) {
    if (state.currentSession) {
      state.currentSession.photos.push(photo)
    }
  },
  
  SET_PENDING_REVIEW: function(state, record) {
    state.pendingReview = record
  },
  
  CLEAR_SESSION: function(state) {
    state.currentSession = null
    state.currentAttempt = null
    state.pendingReview = null
    state.activeSealProcess = null
  },
  
  ADD_RECORD: function(state, record) {
    state.records.unshift(record)
  },
  
  SET_RECORDS: function(state, records) {
    state.records = records
  },
  
  UPDATE_RECORD: function(state, record) {
    var index = state.records.findIndex(function(r) { return r.id === record.id })
    if (index > -1) {
      state.records.splice(index, 1, record)
    }
  },
  
  START_SEAL_PROCESS: function(state, process) {
    state.activeSealProcess = process
  },
  
  COMPLETE_SEAL_PROCESS: function(state, process) {
    state.activeSealProcess = null
    var index = state.records.findIndex(function(r) { return r.id === process.record_id })
    if (index > -1) {
      var record = Object.assign({}, state.records[index], {
        seal_process: process,
        status: 'sealed'
      })
      state.records.splice(index, 1, record)
    }
  }
}

export const actions = {
  async init({ dispatch }) {
    try {
      if (this.$db) {
        var records = await this.$db.weighingRecords.list({ limit: 100 })
        dispatch('loadRecords', records)
      }
    } catch (e) {
      console.error('初始化称重记录失败:', e)
    }
  },
  
  loadRecords({ commit }, records) {
    commit('SET_RECORDS', records)
  },
  
  async startSession({ commit, dispatch }, { rareBookNo, pageNo }) {
    var bookValidation = validateRareBookNo(rareBookNo)
    if (!bookValidation.valid) {
      commit('SET_ERROR', bookValidation.message)
      return { success: false, message: bookValidation.message }
    }
    
    if (!this.getters['user/currentUser']) {
      return { success: false, message: '请先登录' }
    }
    
    commit('START_NEW_SESSION', {
      rareBookNo: rareBookNo,
      pageNo: pageNo,
      user: this.getters['user/currentUser']
    })
    
    dispatch('user/logAction', {
      action: 'start_weighing_session',
      details: { rare_book_no: rareBookNo, page_no: pageNo }
    }, { root: true })
    
    return { success: true }
  },
  
  setWeightValue({ commit }, { index, value }) {
    commit('SET_WEIGHT_VALUE', { index: index, value: value })
  },
  
  async bindHumidityData({ commit, dispatch, rootGetters }) {
    var humidityData = null
    
    if (this.$humidityProbe) {
      humidityData = this.$humidityProbe.bindWeighingHumidity()
    } else {
      var reading = rootGetters['humidity/currentReading']
      if (reading) {
        humidityData = {
          id: 'HUM-' + Date.now(),
          temperature: reading.temperature,
          humidity: reading.humidity,
          probe_id: reading.probe_id,
          probe_online: reading.probe_online,
          measured_at: reading.measured_at,
          location: reading.location || '善本库房A区'
        }
      }
    }
    
    if (!humidityData) {
      return { success: false, message: '温湿度探针服务未就绪' }
    }
    
    var validation = validateHumidityData(humidityData)
    
    if (!validation.valid) {
      return { success: false, message: validation.message }
    }
    
    commit('SET_HUMIDITY_DATA', humidityData)
    
    if (this.$db) {
      await this.$db.humidityHistory.save(Object.assign({}, humidityData, {
        record_id: 'pending'
      }))
    }
    
    if (validation.message) {
      dispatch('user/logAction', {
        action: 'humidity_warning',
        details: { humidity: humidityData.humidity, message: validation.message }
      }, { root: true })
    }
    
    return { success: true, data: humidityData, warning: validation.message }
  },
  
  async submitCurrentAttempt({ commit, state, dispatch, rootState, rootGetters }) {
    var attempt = state.currentAttempt
    var session = state.currentSession
    
    if (!session || !attempt) {
      return { success: false, message: '无有效称重会话' }
    }
    
    if (!attempt.weights || attempt.weights.some(function(w) { return w === null || w === undefined || w === '' })) {
      return { success: false, message: '请完成三次称重' }
    }
    
    if (!attempt.humidity_data) {
      return { success: false, message: '请先绑定温湿度数据' }
    }
    
    var weights = attempt.weights.map(function(w) { return parseFloat(w) })
    var median = calculateMedian(weights)
    var deviation = calculateDeviation(weights, median)
    
    var attemptRecord = {
      id: 'ATT-' + Date.now(),
      attempt_no: session.attempts.length + 1,
      weight_1: weights[0],
      weight_2: weights[1],
      weight_3: weights[2],
      calculated_median: median,
      deviation: deviation,
      humidity_data: attempt.humidity_data,
      is_valid: true,
      created_at: new Date().toISOString()
    }
    
    commit('SUBMIT_ATTEMPT', attemptRecord)
    
    if (this.$db) {
      await this.$db.operationLogs.log(
        rootGetters['user/currentUser'].id,
        'submit_weighing_attempt',
        {
          rare_book_no: session.rare_book_no,
          attempt_no: attemptRecord.attempt_no,
          weights: weights,
          median: median,
          deviation: deviation
        }
      )
    }
    
    var needsRe = needsReweigh(deviation, BUSINESS_RULES.MAX_DEVIATION_THRESHOLD)
    var sealCheck = validateSealRequirement(session.attempts, BUSINESS_RULES.MAX_DEVIATION_THRESHOLD)
    var canReweigh = validateCanReweigh(session.attempts)
    
    if (sealCheck.needsSeal) {
      return {
        success: true,
        action: 'seal',
        median: median,
        deviation: deviation,
        message: sealCheck.message,
        attempt: attemptRecord
      }
    }
    
    if (needsRe && canReweigh.canReweigh) {
      return {
        success: true,
        action: 'reweigh',
        median: median,
        deviation: deviation,
        message: '偏差 ' + deviation.toFixed(3) + 'g 超过阈值 ' + BUSINESS_RULES.MAX_DEVIATION_THRESHOLD + 'g，' + canReweigh.message,
        attempt: attemptRecord
      }
    }
    
    if (needsRe && !canReweigh.canReweigh) {
      return {
        success: true,
        action: 'seal',
        median: median,
        deviation: deviation,
        message: canReweigh.message,
        attempt: attemptRecord
      }
    }
    
    return {
      success: true,
      action: 'review',
      median: median,
      deviation: deviation,
      message: '称重完成，偏差 ' + deviation.toFixed(3) + 'g，进入复核流程',
      attempt: attemptRecord
    }
  },
  
  async saveCompleteRecord({ commit, state, dispatch, rootState, rootGetters }, { reviewData }) {
    var session = state.currentSession
    if (!session || session.attempts.length === 0) {
      return { success: false, message: '无有效称重数据' }
    }
    
    var lastAttempt = session.attempts[session.attempts.length - 1]
    var reweighCount = countReweighAttempts(session.attempts)
    
    var recordData = {
      id: generateRecordId(session.rare_book_no),
      rare_book_no: session.rare_book_no,
      page_no: session.page_no,
      attempts: session.attempts,
      median_value: lastAttempt.calculated_median,
      max_deviation: Math.max.apply(null, session.attempts.map(function(a) { return a.deviation })),
      reweigh_count: reweighCount,
      humidity_data: lastAttempt.humidity_data,
      operator_id: session.operator_id,
      operator_name: session.operator_name,
      review_record: reviewData || null,
      work_order: null,
      seal_process: null,
      status: reviewData ? (reviewData.is_match ? 'reviewed' : 'pending') : 'normal',
      photos: session.photos,
      notes: '',
      created_at: new Date().toISOString(),
      is_archived: false,
      archived_at: null
    }
    
    var estimatedHumidity = estimateHumidity(
      session.page_no % 2 === 0 ? 0.8 : 0.75,
      recordData.median_value
    )
    if (needsDeacidification(estimatedHumidity)) {
      recordData.work_order = {
        id: 'WO-' + Date.now(),
        type: 'deacidification',
        priority: estimatedHumidity > 20 ? 'urgent' : 'normal',
        status: 'pending',
        estimated_humidity: estimatedHumidity,
        scheduled_date: null,
        handler: null,
        notes: '自动生成：纸张湿度估算 ' + estimatedHumidity + '%',
        created_at: new Date().toISOString()
      }
      recordData.notes = '纸张湿度估算 ' + estimatedHumidity + '%，已自动生成脱酸工单'
    }
    
    var hashedRecord = generateHashedRecord(recordData, rootState.lastHash)
    commit('ADD_RECORD', hashedRecord)
    dispatch('setLastHash', hashedRecord.data_hash, { root: true })
    
    if (this.$db) {
      await this.$db.weighingRecords.save(hashedRecord)
      
      if (hashedRecord.work_order) {
        await this.$db.workOrders.save(Object.assign({}, hashedRecord.work_order, {
          record_id: hashedRecord.id
        }))
      }
      
      for (var i = 0; i < session.photos.length; i++) {
        var photo = session.photos[i]
        await this.$db.photoArchives.save(Object.assign({}, photo, {
          record_id: hashedRecord.id
        }))
      }
    }
    
    dispatch('user/logAction', {
      action: 'save_weighing_record',
      details: {
        record_id: hashedRecord.id,
        rare_book_no: hashedRecord.rare_book_no,
        median_value: hashedRecord.median_value,
        reweigh_count: reweighCount,
        has_work_order: !!hashedRecord.work_order
      }
    }, { root: true })
    
    commit('CLEAR_SESSION')
    
    return { success: true, record: hashedRecord }
  },
  
  async submitReview({ commit, state, dispatch, rootGetters }, { recordId, reviewValue, notes }) {
    var record = state.records.find(function(r) { return r.id === recordId })
    if (!record) {
      return { success: false, message: '称重记录不存在' }
    }
    
    var validation = validateReviewInput(record.median_value, reviewValue)
    
    var reviewer = rootGetters['user/currentUser']
    var reviewData = {
      id: 'REV-' + Date.now(),
      record_id: recordId,
      reviewer_id: reviewer.id,
      reviewer_name: reviewer.name,
      review_value: parseFloat(reviewValue),
      difference: validation.difference,
      is_match: validation.valid,
      review_note: notes || '',
      reviewed_at: new Date().toISOString()
    }
    
    if (!validation.valid) {
      return {
        success: false,
        message: validation.message,
        difference: validation.difference
      }
    }
    
    var updatedRecord = Object.assign({}, record, {
      review_record: reviewData,
      status: 'reviewed'
    })
    
    commit('UPDATE_RECORD', updatedRecord)
    
    if (this.$db) {
      await this.$db.weighingRecords.save(updatedRecord)
    }
    
    dispatch('user/logAction', {
      action: 'submit_review',
      details: {
        record_id: recordId,
        review_value: reviewValue,
        difference: validation.difference,
        is_match: true
      }
    }, { root: true })
    
    return {
      success: true,
      message: validation.message,
      review: reviewData
    }
  },
  
  async startSealProcess({ commit, state, dispatch, rootGetters }, { recordId, reason }) {
    var record = state.records.find(function(r) { return r.id === recordId }) || state.currentSession
    
    var initiator = rootGetters['user/currentUser']
    var process = {
      id: 'SEAL-' + Date.now(),
      record_id: recordId,
      initiator_id: initiator.id,
      initiator_name: initiator.name,
      reason: reason || '复称两次仍超阈值',
      status: 'pending',
      approver_id: null,
      approver_name: null,
      approval_opinion: '',
      initiated_at: new Date().toISOString(),
      approved_at: null
    }
    
    commit('START_SEAL_PROCESS', process)
    
    dispatch('user/logAction', {
      action: 'start_seal_process',
      details: { record_id: recordId, reason: reason }
    }, { root: true })
    
    return { success: true, process: process }
  },
  
  async approveSeal({ commit, state, dispatch, rootGetters }, { processId, opinion }) {
    var process = state.activeSealProcess
    if (!process || process.id !== processId) {
      return { success: false, message: '封存流程不存在' }
    }
    
    var approver = rootGetters['user/currentUser']
    var approvedProcess = Object.assign({}, process, {
      status: 'approved',
      approver_id: approver.id,
      approver_name: approver.name,
      approval_opinion: opinion || '',
      approved_at: new Date().toISOString()
    })
    
    commit('COMPLETE_SEAL_PROCESS', approvedProcess)
    
    dispatch('user/logAction', {
      action: 'approve_seal',
      details: { process_id: processId, opinion: opinion }
    }, { root: true })
    
    return { success: true, process: approvedProcess }
  },
  
  async rejectSeal({ commit, state, dispatch, rootGetters }, { processId, opinion }) {
    var process = state.activeSealProcess
    if (!process || process.id !== processId) {
      return { success: false, message: '封存流程不存在' }
    }
    
    var approver = rootGetters['user/currentUser']
    var rejectedProcess = Object.assign({}, process, {
      status: 'rejected',
      approver_id: approver.id,
      approver_name: approver.name,
      approval_opinion: opinion || '',
      approved_at: new Date().toISOString()
    })
    
    commit('START_SEAL_PROCESS', rejectedProcess)
    
    dispatch('user/logAction', {
      action: 'reject_seal',
      details: { process_id: processId, opinion: opinion }
    }, { root: true })
    
    return { success: true, process: rejectedProcess }
  },
  
  async addPhoto({ commit, dispatch, rootGetters }, { photoData, photoType }) {
    var photo = {
      id: 'PHOTO-' + Date.now(),
      attempt_id: null,
      file_path: photoData,
      photo_type: photoType || 'reweigh',
      taken_at: new Date().toISOString(),
      taken_by: rootGetters['user/currentUser'] ? rootGetters['user/currentUser'].name : '未知'
    }
    
    commit('ADD_PHOTO', photo)
    
    dispatch('user/logAction', {
      action: 'take_photo',
      details: { photo_type: photoType }
    }, { root: true })
    
    return { success: true, photo: photo }
  },
  
  resetAttempt({ commit }) {
    commit('RESET_ATTEMPT')
  },
  
  clearSession({ commit }) {
    commit('CLEAR_SESSION')
  },
  
  async loadRecordsByDate({ commit }, { startDate, endDate }) {
    if (this.$db) {
      var records = await this.$db.weighingRecords.list({
        start_date: startDate,
        end_date: endDate
      })
      commit('SET_RECORDS', records)
      return records
    }
    return []
  },
  
  async getRecordById({ state }, id) {
    var local = state.records.find(function(r) { return r.id === id })
    if (local) return local
    
    if (this.$db) {
      return this.$db.weighingRecords.getById(id)
    }
    
    return null
  }
}

export const getters = {
  currentSession: function(state) { return state.currentSession },
  currentAttempt: function(state) { return state.currentAttempt },
  pendingReview: function(state) { return state.pendingReview },
  activeSealProcess: function(state) { return state.activeSealProcess },
  records: function(state) { return state.records },
  loading: function(state) { return state.loading },
  error: function(state) { return state.error },
  
  currentMedian: function(state) {
    if (!state.currentAttempt || !state.currentAttempt.weights) return null
    var weights = state.currentAttempt.weights.filter(function(w) { return w !== null && w !== undefined && w !== '' })
    if (weights.length < 3) return null
    return calculateMedian(weights.map(function(w) { return parseFloat(w) }))
  },
  
  currentDeviation: function(state) {
    if (!state.currentAttempt || !state.currentAttempt.weights) return null
    var weights = state.currentAttempt.weights.filter(function(w) { return w !== null && w !== undefined && w !== '' })
    if (weights.length < 3) return null
    var nums = weights.map(function(w) { return parseFloat(w) })
    var median = calculateMedian(nums)
    return calculateDeviation(nums, median)
  },
  
  deviationLevel: function(state, getters) {
    var deviation = getters.currentDeviation
    if (deviation === null || deviation === undefined) return 'unknown'
    if (deviation <= BUSINESS_RULES.MAX_DEVIATION_THRESHOLD * 0.6) return 'safe'
    if (deviation <= BUSINESS_RULES.MAX_DEVIATION_THRESHOLD) return 'warning'
    return 'danger'
  },
  
  reweighCount: function(state) {
    if (!state.currentSession) return 0
    return countReweighAttempts(state.currentSession.attempts)
  },
  
  canReweigh: function(state) {
    if (!state.currentSession) return { canReweigh: false, message: '无称重会话' }
    return validateCanReweigh(state.currentSession.attempts)
  },
  
  needsSeal: function(state) {
    if (!state.currentSession) return { needsSeal: false }
    return validateSealRequirement(state.currentSession.attempts)
  },
  
  recordsForReview: function(state) {
    return state.records.filter(function(r) {
      return r.status !== 'reviewed' && !r.review_record
    })
  },
  
  sealedRecords: function(state) {
    return state.records.filter(function(r) { return r.status === 'sealed' })
  },
  
  recordsWithWorkOrders: function(state) {
    return state.records.filter(function(r) { return r.work_order })
  },
  
  recentRecords: function(state) {
    return state.records.slice(0, 10)
  }
}
