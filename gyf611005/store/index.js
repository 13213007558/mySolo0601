/**
 * Vuex Store 根模块
 */
export const state = function() {
  return {
    appVersion: '1.0.0',
    lastHash: null
  }
}

export const mutations = {
  SET_LAST_HASH: function(state, hash) {
    state.lastHash = hash
  }
}

export const actions = {
  async nuxtClientInit({ dispatch }) {
    await dispatch('user/init')
    await dispatch('humidity/init')
    await dispatch('weighing/init')
  },
  
  setLastHash({ commit }, hash) {
    commit('SET_LAST_HASH', hash)
  }
}

export const getters = {
  lastHash: function(state) { return state.lastHash }
}
