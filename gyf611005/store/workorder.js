/**
 * 工单模块 Store
 * 管理脱酸工单预约与处理
 */
export const state = function() {
  return {
    orders: [],
    loading: false
  }
}

export const mutations = {
  SET_ORDERS: function(state, orders) {
    state.orders = orders
  },
  
  ADD_ORDER: function(state, order) {
    state.orders.unshift(order)
  },
  
  UPDATE_ORDER: function(state, order) {
    var index = state.orders.findIndex(function(o) { return o.id === order.id })
    if (index > -1) {
      state.orders.splice(index, 1, order)
    }
  },
  
  SET_LOADING: function(state, loading) {
    state.loading = loading
  }
}

export const actions = {
  async init({ commit }) {
    if (this.$db) {
      try {
        var orders = await this.$db.workOrders.list()
        commit('SET_ORDERS', orders)
      } catch (e) {
        console.error('加载工单失败:', e)
      }
    }
  },
  
  async createOrder({ commit, dispatch, rootGetters }, formData) {
    var order = {
      id: 'WO-' + Date.now(),
      record_id: null,
      rare_book_no: formData.rare_book_no,
      page_no: formData.page_no,
      type: formData.type,
      priority: formData.priority,
      status: 'pending',
      assignee: formData.assignee || '',
      notes: formData.notes || '',
      timeline: [
        {
          type: 'primary',
          content: '工单创建',
          time: new Date().toISOString()
        }
      ],
      created_at: new Date().toISOString()
    }
    
    commit('ADD_ORDER', order)
    
    if (this.$db) {
      await this.$db.workOrders.save(order)
    }
    
    if (rootGetters['user/currentUser']) {
      dispatch('user/logAction', {
        action: 'create_workorder',
        details: { order_id: order.id, type: formData.type }
      }, { root: true })
    }
    
    return { success: true, order: order }
  },
  
  async updateStatus({ commit, state, dispatch, rootGetters }, { orderId, status }) {
    var order = state.orders.find(function(o) { return o.id === orderId })
    if (!order) {
      return { success: false, message: '工单不存在' }
    }
    
    var timelineEntry = {
      type: status === 'completed' ? 'success' : 'primary',
      content: status === 'processing' ? '开始处理' : '处理完成',
      time: new Date().toISOString()
    }
    
    var updated = Object.assign({}, order, {
      status: status,
      timeline: (order.timeline || []).concat([timelineEntry])
    })
    
    if (status === 'completed') {
      updated.completed_at = new Date().toISOString()
    }
    
    commit('UPDATE_ORDER', updated)
    
    if (this.$db) {
      await this.$db.workOrders.save(updated)
    }
    
    if (rootGetters['user/currentUser']) {
      dispatch('user/logAction', {
        action: 'update_workorder_status',
        details: { order_id: orderId, status: status }
      }, { root: true })
    }
    
    return { success: true, order: updated }
  },
  
  async createDeacidificationOrder({ commit, dispatch, rootGetters }, { recordId, scheduledDate, handler, notes }) {
    var order = {
      id: 'WO-' + Date.now(),
      record_id: recordId,
      type: 'deacidification',
      priority: 'normal',
      status: 'pending',
      scheduled_date: scheduledDate || null,
      handler: handler || null,
      notes: notes || '',
      timeline: [
        {
          type: 'primary',
          content: '脱酸工单自动创建',
          time: new Date().toISOString()
        }
      ],
      created_at: new Date().toISOString()
    }
    
    commit('ADD_ORDER', order)
    
    if (this.$db) {
      await this.$db.workOrders.save(order)
    }
    
    if (rootGetters['user/currentUser']) {
      dispatch('user/logAction', {
        action: 'create_workorder',
        details: { order_id: order.id, record_id: recordId, type: 'deacidification' }
      }, { root: true })
    }
    
    return { success: true, order: order }
  },
  
  async updateOrderStatus({ commit, state, dispatch, rootGetters }, { orderId, status, notes }) {
    var order = state.orders.find(function(o) { return o.id === orderId })
    if (!order) {
      return { success: false, message: '工单不存在' }
    }
    
    var updated = Object.assign({}, order, {
      status: status,
      notes: notes ? order.notes + '\n' + notes : order.notes
    })
    
    commit('UPDATE_ORDER', updated)
    
    if (this.$db) {
      await this.$db.workOrders.save(updated)
    }
    
    if (rootGetters['user/currentUser']) {
      dispatch('user/logAction', {
        action: 'update_workorder_status',
        details: { order_id: orderId, status: status }
      }, { root: true })
    }
    
    return { success: true, order: updated }
  },
  
  async scheduleOrder({ commit, state, dispatch, rootGetters }, { orderId, scheduledDate, handler }) {
    var order = state.orders.find(function(o) { return o.id === orderId })
    if (!order) {
      return { success: false, message: '工单不存在' }
    }
    
    var updated = Object.assign({}, order, {
      status: 'scheduled',
      scheduled_date: scheduledDate,
      handler: handler
    })
    
    commit('UPDATE_ORDER', updated)
    
    if (this.$db) {
      await this.$db.workOrders.save(updated)
    }
    
    if (rootGetters['user/currentUser']) {
      dispatch('user/logAction', {
        action: 'schedule_workorder',
        details: { order_id: orderId, scheduled_date: scheduledDate, handler: handler }
      }, { root: true })
    }
    
    return { success: true, order: updated }
  },
  
  async completeOrder({ commit, state, dispatch, rootGetters }, { orderId, completionNotes }) {
    var order = state.orders.find(function(o) { return o.id === orderId })
    if (!order) {
      return { success: false, message: '工单不存在' }
    }
    
    var updated = Object.assign({}, order, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      notes: order.notes + '\n完成备注：' + (completionNotes || '')
    })
    
    commit('UPDATE_ORDER', updated)
    
    if (this.$db) {
      await this.$db.workOrders.save(updated)
    }
    
    if (rootGetters['user/currentUser']) {
      dispatch('user/logAction', {
        action: 'complete_workorder',
        details: { order_id: orderId }
      }, { root: true })
    }
    
    return { success: true, order: updated }
  }
}

export const getters = {
  orders: function(state) { return state.orders },
  allOrders: function(state) { return state.orders },
  loading: function(state) { return state.loading },
  
  pendingOrders: function(state) {
    return state.orders.filter(function(o) { return o.status === 'pending' || o.status === 'scheduled' })
  },
  
  completedOrders: function(state) {
    return state.orders.filter(function(o) { return o.status === 'completed' })
  },
  
  urgentOrders: function(state) {
    return state.orders.filter(function(o) { return o.priority === 'urgent' && o.status !== 'completed' })
  },
  
  deacidificationOrders: function(state) {
    return state.orders.filter(function(o) { return o.type === 'deacidification' })
  },
  
  getOrderById: function(state) {
    return function(id) {
      return state.orders.find(function(o) { return o.id === id })
    }
  },
  
  getOrdersByRecordId: function(state) {
    return function(recordId) {
      return state.orders.filter(function(o) { return o.record_id === recordId })
    }
  }
}
