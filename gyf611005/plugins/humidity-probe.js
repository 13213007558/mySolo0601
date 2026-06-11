/**
 * 温湿度探针对接插件
 * 模拟探针数据（实际项目中对接真实硬件 API）
 */
import Vue from 'vue'

var PROBE_CONFIG = {
  probeId: 'PROBE-001',
  location: '善本库房A区',
  updateInterval: 5000,
  mockData: true
}

var currentReading = {
  temperature: 22.5,
  humidity: 45,
  probe_id: PROBE_CONFIG.probeId,
  probe_online: true,
  measured_at: new Date().toISOString()
}

var listeners = []
var updateTimer = null

function generateMockReading() {
  var tempChange = (Math.random() - 0.5) * 0.5
  var humChange = (Math.random() - 0.5) * 2
  
  var newTemp = Math.max(15, Math.min(30, currentReading.temperature + tempChange))
  var newHum = Math.max(30, Math.min(70, currentReading.humidity + humChange))
  
  return {
    temperature: Math.round(newTemp * 10) / 10,
    humidity: Math.round(newHum * 10) / 10,
    probe_id: PROBE_CONFIG.probeId,
    probe_online: true,
    measured_at: new Date().toISOString(),
    location: PROBE_CONFIG.location
  }
}

function startReading() {
  if (updateTimer) return
  
  if (PROBE_CONFIG.mockData) {
    updateTimer = setInterval(function() {
      currentReading = generateMockReading()
      notifyListeners()
    }, PROBE_CONFIG.updateInterval)
  }
}

function stopReading() {
  if (updateTimer) {
    clearInterval(updateTimer)
    updateTimer = null
  }
}

function getCurrentReading() {
  return Object.assign({}, currentReading)
}

function subscribe(callback) {
  if (typeof callback === 'function') {
    listeners.push(callback)
    callback(currentReading)
  }
  return function() {
    var index = listeners.indexOf(callback)
    if (index > -1) {
      listeners.splice(index, 1)
    }
  }
}

function notifyListeners() {
  listeners.forEach(function(cb) {
    try {
      cb(currentReading)
    } catch (e) {
      console.error('温湿度探针回调错误:', e)
    }
  })
}

/**
 * 绑定称重记录与当前温湿度读数
 * @returns {Object} 温湿度数据快照
 */
function bindWeighingHumidity() {
  var reading = getCurrentReading()
  return {
    id: 'HUM-' + Date.now(),
    temperature: reading.temperature,
    humidity: reading.humidity,
    probe_id: reading.probe_id,
    probe_online: reading.probe_online,
    measured_at: reading.measured_at,
    location: PROBE_CONFIG.location
  }
}

/**
 * 检查探针连接状态
 * @returns {Promise<Object>}
 */
async function checkProbeStatus() {
  return new Promise(function(resolve) {
    setTimeout(function() {
      resolve({
        online: currentReading.probe_online,
        probe_id: PROBE_CONFIG.probeId,
        location: PROBE_CONFIG.location,
        last_reading: currentReading
      })
    }, 500)
  })
}

/**
 * 手动刷新读数
 * @returns {Promise<Object>}
 */
async function refreshReading() {
  return new Promise(function(resolve) {
    setTimeout(function() {
      if (PROBE_CONFIG.mockData) {
        currentReading = generateMockReading()
      }
      notifyListeners()
      resolve(currentReading)
    }, 200)
  })
}

var humidityProbe = {
  config: PROBE_CONFIG,
  start: startReading,
  stop: stopReading,
  getCurrent: getCurrentReading,
  subscribe: subscribe,
  bindWeighingHumidity: bindWeighingHumidity,
  checkStatus: checkProbeStatus,
  refresh: refreshReading
}

Vue.prototype.$humidityProbe = humidityProbe

export default humidityProbe
