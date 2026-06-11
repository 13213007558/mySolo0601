/**
 * 温湿度模块 Store
 * 管理探针数据、历史数据、图表数据
 */
import { getLast7Days } from '~/utils/dayjs'

export const state = function() {
  return {
    currentReading: null,
    history7Days: [],
    probeStatus: 'checking',
    unsubscribe: null
  }
}

export const mutations = {
  SET_CURRENT_READING: function(state, reading) {
    state.currentReading = reading
  },
  
  SET_HISTORY: function(state, history) {
    state.history7Days = history
  },
  
  SET_PROBE_STATUS: function(state, status) {
    state.probeStatus = status
  },
  
  SET_UNSUBSCRIBE: function(state, fn) {
    state.unsubscribe = fn
  },
  
  ADD_HISTORY_POINT: function(state, reading) {
    state.history7Days.push(reading)
    if (state.history7Days.length > 200) {
      state.history7Days = state.history7Days.slice(-200)
    }
  }
}

export const actions = {
  async init({ dispatch, commit, state }) {
    if (process.client) {
      if (this.$humidityProbe) {
        this.$humidityProbe.start()
        
        var unsubscribe = this.$humidityProbe.subscribe(function(reading) {
          commit('SET_CURRENT_READING', reading)
          commit('ADD_HISTORY_POINT', Object.assign({}, reading, { time: new Date() }))
        })
        
        commit('SET_UNSUBSCRIBE', unsubscribe)
        
        commit('SET_PROBE_STATUS', 'online')
      } else {
        var mockReading = {
          temperature: 22.5,
          humidity: 45,
          probe_id: 'PROBE-001',
          probe_online: true,
          measured_at: new Date().toISOString(),
          location: '善本库房A区'
        }
        commit('SET_CURRENT_READING', mockReading)
        commit('ADD_HISTORY_POINT', Object.assign({}, mockReading, { time: new Date() }))
        commit('SET_PROBE_STATUS', 'online')
      }
      
      dispatch('loadHistory7Days')
    }
  },
  
  async loadHistory7Days({ commit, state }) {
    if (this.$db) {
      try {
        var history = await this.$db.humidityHistory.getLast7Days()
        commit('SET_HISTORY', history)
      } catch (e) {
        console.error('加载温湿度历史失败:', e)
      }
    }
    
    if (state.history7Days.length === 0) {
      var mockHistory = generateMockHistory()
      commit('SET_HISTORY', mockHistory)
    }
  },
  
  async refreshReading({ commit }) {
    if (this.$humidityProbe) {
      commit('SET_PROBE_STATUS', 'checking')
      try {
        var reading = await this.$humidityProbe.refresh()
        commit('SET_CURRENT_READING', reading)
        commit('SET_PROBE_STATUS', 'online')
        return reading
      } catch (e) {
        commit('SET_PROBE_STATUS', 'offline')
        throw e
      }
    } else {
      var mockReading = {
        temperature: 22 + Math.round(Math.random() * 10) / 10,
        humidity: 45 + Math.round(Math.random() * 10),
        probe_id: 'PROBE-001',
        probe_online: true,
        measured_at: new Date().toISOString(),
        location: '善本库房A区'
      }
      commit('SET_CURRENT_READING', mockReading)
      commit('ADD_HISTORY_POINT', Object.assign({}, mockReading, { time: new Date() }))
      commit('SET_PROBE_STATUS', 'online')
      return mockReading
    }
    return null
  },
  
  async checkProbeStatus({ commit }) {
    if (this.$humidityProbe) {
      var status = await this.$humidityProbe.checkStatus()
      commit('SET_PROBE_STATUS', status.online ? 'online' : 'offline')
      return status
    }
    return { online: false }
  },
  
  cleanup({ commit, state }) {
    if (state.unsubscribe) {
      state.unsubscribe()
      commit('SET_UNSUBSCRIBE', null)
    }
    if (this.$humidityProbe) {
      this.$humidityProbe.stop()
    }
  }
}

export const getters = {
  currentReading: function(state) { return state.currentReading },
  history7Days: function(state) { return state.history7Days },
  probeStatus: function(state) { return state.probeStatus },
  
  temperature: function(state) {
    return state.currentReading ? state.currentReading.temperature : null
  },
  
  humidity: function(state) {
    return state.currentReading ? state.currentReading.humidity : null
  },
  
  probeLocation: function(state) {
    return state.currentReading ? state.currentReading.location : ''
  },
  
  isProbeOnline: function(state) { return state.probeStatus === 'online' },
  
  recentReadings: function(state) { return state.history7Days },
  
  humidityLevel: function(state) {
    var hum = state.currentReading ? state.currentReading.humidity : null
    if (hum === null) return 'unknown'
    if (hum < 40) return 'low'
    if (hum <= 60) return 'normal'
    if (hum <= 70) return 'warning'
    return 'danger'
  },
  
  chartData7Days: function(state) {
    var labels = getLast7Days()
    var temperatureData = []
    var humidityData = []
    
    var dailyData = {}
    state.history7Days.forEach(function(item) {
      var date = new Date(item.measured_at || item.time).toISOString().split('T')[0]
      if (!dailyData[date]) {
        dailyData[date] = { temps: [], hums: [] }
      }
      dailyData[date].temps.push(item.temperature)
      dailyData[date].hums.push(item.humidity)
    })
    
    labels.forEach(function(date) {
      var data = dailyData[date]
      if (data && data.temps.length > 0) {
        var avgTemp = data.temps.reduce(function(a, b) { return a + b }, 0) / data.temps.length
        var avgHum = data.hums.reduce(function(a, b) { return a + b }, 0) / data.hums.length
        temperatureData.push(Math.round(avgTemp * 10) / 10)
        humidityData.push(Math.round(avgHum * 10) / 10)
      } else {
        temperatureData.push(null)
        humidityData.push(null)
      }
    })
    
    return {
      labels: labels,
      temperature: temperatureData,
      humidity: humidityData
    }
  },
  
  currentWeighingChartData: function(state, getters, rootState, rootGetters) {
    var records = rootGetters['weighing/records']
    var days = getLast7Days()
    
    var dailyWeights = {}
    records.forEach(function(record) {
      if (record.status === 'reviewed' || record.status === 'normal') {
        var date = new Date(record.created_at).toISOString().split('T')[0]
        if (!dailyWeights[date]) {
          dailyWeights[date] = []
        }
        dailyWeights[date].push(record.median_value)
      }
    })
    
    var data = days.map(function(date) {
      var weights = dailyWeights[date]
      if (weights && weights.length > 0) {
        return Math.round(weights.reduce(function(a, b) { return a + b }, 0) / weights.length * 1000) / 1000
      }
      return null
    })
    
    return {
      labels: days,
      data: data
    }
  }
}

function generateMockHistory() {
  var history = []
  var now = Date.now()
  
  for (var i = 7 * 24; i >= 0; i--) {
    var time = now - i * 60 * 60 * 1000
    var baseTemp = 22 + Math.sin(i / 6) * 2
    var baseHum = 45 + Math.sin(i / 8) * 10
    
    history.push({
      id: 'HUM-MOCK-' + i,
      temperature: Math.round((baseTemp + (Math.random() - 0.5)) * 10) / 10,
      humidity: Math.round((baseHum + (Math.random() - 0.5) * 3) * 10) / 10,
      probe_id: 'PROBE-001',
      probe_online: true,
      measured_at: new Date(time).toISOString(),
      location: '善本库房A区'
    })
  }
  
  return history
}
