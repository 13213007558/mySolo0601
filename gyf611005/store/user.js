/**
 * 用户模块 Store
 * 处理登录、权限、操作日志
 */
import { hashPassword, verifyPassword } from '~/utils/crypto'

const MOCK_USERS = [
  { id: 'OP001', name: '张管理员', role: 'operator', password_hash: 'cfe9dd4d3cadaaffce477aa90ad0c25a702315a65dc874440444c868f7cc794d', password_salt: 'test' },
  { id: 'OP002', name: '李馆员', role: 'operator', password_hash: 'cfe9dd4d3cadaaffce477aa90ad0c25a702315a65dc874440444c868f7cc794d', password_salt: 'test' },
  { id: 'RV001', name: '王复核', role: 'reviewer', password_hash: 'cfe9dd4d3cadaaffce477aa90ad0c25a702315a65dc874440444c868f7cc794d', password_salt: 'test' },
  { id: 'AD001', name: '赵主任', role: 'admin', password_hash: 'cfe9dd4d3cadaaffce477aa90ad0c25a702315a65dc874440444c868f7cc794d', password_salt: 'test' }
]

export const state = function() {
  return {
    currentUser: null,
    users: MOCK_USERS,
    loginError: null,
    operationLogs: []
  }
}

export const mutations = {
  SET_CURRENT_USER: function(state, user) {
    state.currentUser = user
    state.loginError = null
  },
  
  SET_LOGIN_ERROR: function(state, error) {
    state.loginError = error
  },
  
  CLEAR_CURRENT_USER: function(state) {
    state.currentUser = null
  },
  
  ADD_LOG: function(state, log) {
    state.operationLogs.unshift(log)
    if (state.operationLogs.length > 500) {
      state.operationLogs = state.operationLogs.slice(0, 500)
    }
  }
}

export const actions = {
  async init({ dispatch, commit, state }) {
    if (process.client) {
      var savedUser = localStorage.getItem('current_user')
      if (savedUser) {
        try {
          var user = JSON.parse(savedUser)
          commit('SET_CURRENT_USER', user)
          dispatch('logAction', { action: 'auto_login', details: { from: 'localStorage' } })
        } catch (e) {
          console.error('恢复用户会话失败:', e)
        }
      }
    }
  },
  
  async login({ commit, dispatch, state }, { userId, password }) {
    var user = state.users.find(function(u) { return u.id === userId })
    
    if (!user) {
      commit('SET_LOGIN_ERROR', '用户工号不存在')
      return { success: false, message: '用户工号不存在' }
    }
    
    var isValid = verifyPassword(password, user.password_hash, user.password_salt)
    
    if (!isValid) {
      commit('SET_LOGIN_ERROR', '密码错误')
      dispatch('logAction', { action: 'login_failed', details: { user_id: userId, reason: 'wrong_password' } })
      return { success: false, message: '密码错误' }
    }
    
    var userInfo = {
      id: user.id,
      name: user.name,
      role: user.role,
      login_time: new Date().toISOString()
    }
    
    commit('SET_CURRENT_USER', userInfo)
    
    if (process.client) {
      localStorage.setItem('current_user', JSON.stringify(userInfo))
    }
    
    dispatch('logAction', { action: 'login', details: { user_id: userId } })
    
    return { success: true, user: userInfo }
  },
  
  async logout({ commit, dispatch, state }) {
    if (state.currentUser) {
      dispatch('logAction', { action: 'logout', details: { user_id: state.currentUser.id } })
    }
    
    commit('CLEAR_CURRENT_USER')
    
    if (process.client) {
      localStorage.removeItem('current_user')
    }
    
    return { success: true }
  },
  
  async logAction({ commit, state }, { action, details }) {
    var log = {
      id: 'LOG-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
      user_id: state.currentUser ? state.currentUser.id : 'SYSTEM',
      user_name: state.currentUser ? state.currentUser.name : '系统',
      action: action,
      details: details || {},
      timestamp: new Date().toISOString()
    }
    
    commit('ADD_LOG', log)
    
    try {
      if (this.$db) {
        await this.$db.operationLogs.log(log.user_id, action, details)
      }
    } catch (e) {
      console.error('记录操作日志失败:', e)
    }
    
    return log
  },
  
  async changePassword({ state }, { oldPassword, newPassword }) {
    if (!state.currentUser) {
      return { success: false, message: '未登录' }
    }
    
    var user = state.users.find(function(u) { return u.id === state.currentUser.id })
    if (!user) {
      return { success: false, message: '用户不存在' }
    }
    
    var isOldValid = verifyPassword(oldPassword, user.password_hash, user.password_salt)
    if (!isOldValid) {
      return { success: false, message: '原密码错误' }
    }
    
    var result = hashPassword(newPassword)
    user.password_hash = result.hash
    user.password_salt = result.salt
    
    return { success: true, message: '密码修改成功' }
  }
}

export const getters = {
  currentUser: function(state) { return state.currentUser },
  isLoggedIn: function(state) { return !!state.currentUser },
  userRole: function(state) { return state.currentUser ? state.currentUser.role : null },
  loginError: function(state) { return state.loginError },
  
  hasPermission: function(state) {
    return function(permission) {
      if (!state.currentUser) return false
      
      var rolePermissions = {
        operator: ['weighing', 'view_records'],
        reviewer: ['review', 'view_records'],
        admin: ['weighing', 'review', 'view_records', 'export', 'seal', 'settings']
      }
      
      var permissions = rolePermissions[state.currentUser.role] || []
      return permissions.includes(permission)
    }
  },
  
  isOperator: function(state) { return state.currentUser && state.currentUser.role === 'operator' },
  isReviewer: function(state) { return state.currentUser && state.currentUser.role === 'reviewer' },
  isAdmin: function(state) { return state.currentUser && state.currentUser.role === 'admin' }
}
