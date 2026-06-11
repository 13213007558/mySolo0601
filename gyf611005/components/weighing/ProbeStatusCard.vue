<template>
  <div class="probe-status-card" :class="cardClass">
    <div class="card-header">
      <div class="header-left">
        <div class="status-indicator" :class="statusClass">
          <span class="status-dot"></span>
          <span class="status-text">{{ statusText }}</span>
        </div>
        <span class="probe-location" v-if="location">
          <i class="el-icon-location"></i>
          {{ location }}
        </span>
      </div>
      <el-button 
        size="mini" 
        icon="el-icon-refresh" 
        @click="handleRefresh"
        :loading="loading"
        :disabled="!online"
      >
        刷新
      </el-button>
    </div>

    <div class="readings-grid">
      <div class="reading-item temperature">
        <div class="reading-icon">
          <i class="el-icon-thermometer"></i>
        </div>
        <div class="reading-content">
          <span class="reading-label">温度</span>
          <span class="reading-value mono-number" :class="tempClass">
            {{ temperature !== null ? temperature.toFixed(1) : '--' }}
            <span class="reading-unit">°C</span>
          </span>
        </div>
      </div>

      <div class="reading-item humidity">
        <div class="reading-icon">
          <i class="el-icon-water-cup"></i>
        </div>
        <div class="reading-content">
          <span class="reading-label">湿度</span>
          <span class="reading-value mono-number" :class="humidityClass">
            {{ humidity !== null ? humidity.toFixed(1) : '--' }}
            <span class="reading-unit">%RH</span>
          </span>
        </div>
      </div>
    </div>

    <div class="bind-section" v-if="showBindButton">
      <el-button 
        type="primary" 
        size="large" 
        icon="el-icon-link"
        @click="handleBind"
        :disabled="!online || binding"
        :loading="binding"
        class="bind-btn"
      >
        {{ binding ? '绑定中...' : '绑定温湿度数据' }}
      </el-button>
      <p class="bind-hint" v-if="bindHint">{{ bindHint }}</p>
    </div>

    <div class="bind-time" v-if="boundTime">
      <i class="el-icon-check-circle"></i>
      已绑定于 {{ formatTime(boundTime) }}
    </div>

    <div class="probe-info" v-if="probeId">
      探针编号: {{ probeId }}
    </div>
  </div>
</template>

<script>
import { formatWeighingTime } from '~/utils/dayjs'

export default {
  name: 'ProbeStatusCard',
  props: {
    temperature: {
      type: Number,
      default: null
    },
    humidity: {
      type: Number,
      default: null
    },
    online: {
      type: Boolean,
      default: false
    },
    location: {
      type: String,
      default: ''
    },
    probeId: {
      type: String,
      default: ''
    },
    showBindButton: {
      type: Boolean,
      default: false
    },
    boundTime: {
      type: String,
      default: null
    },
    bindHint: {
      type: String,
      default: ''
    }
  },
  data: function() {
    return {
      loading: false,
      binding: false
    }
  },
  computed: {
    statusClass: function() {
      return {
        'is-online': this.online,
        'is-offline': !this.online
      }
    },
    statusText: function() {
      return this.online ? '探针在线' : '探针离线'
    },
    cardClass: function() {
      return {
        'is-online': this.online,
        'is-offline': !this.online,
        'is-bound': !!this.boundTime
      }
    },
    tempClass: function() {
      if (this.temperature === null) return ''
      if (this.temperature < 15) return 'cold'
      if (this.temperature > 28) return 'hot'
      return 'normal'
    },
    humidityClass: function() {
      if (this.humidity === null) return ''
      if (this.humidity < 40) return 'dry'
      if (this.humidity <= 60) return 'normal'
      if (this.humidity <= 70) return 'warning'
      return 'danger'
    }
  },
  methods: {
    formatTime: formatWeighingTime,
    handleRefresh: function() {
      var self = this
      this.loading = true
      this.$emit('refresh')
      setTimeout(function() {
        self.loading = false
      }, 1000)
    },
    handleBind: function() {
      var self = this
      this.binding = true
      this.$emit('bind')
      setTimeout(function() {
        self.binding = false
      }, 1500)
    }
  }
}
</script>

<style lang="scss" scoped>
.probe-status-card {
  @include card;
  padding: $space-lg;
  border: 2px solid transparent;
  transition: all $transition-normal;

  &.is-online {
    border-color: rgba(61, 107, 79, 0.3);
  }

  &.is-offline {
    border-color: rgba(179, 58, 58, 0.3);
    background: rgba(179, 58, 58, 0.02);
  }

  &.is-bound {
    border-color: $color-primary;
    background: linear-gradient(135deg, $color-surface 0%, rgba(74, 55, 40, 0.03) 100%);
  }
}

.card-header {
  @include flex-between;
  margin-bottom: $space-lg;
  padding-bottom: $space-md;
  border-bottom: 1px solid $color-bg-dark;
}

.header-left {
  display: flex;
  align-items: center;
  gap: $space-md;
  flex-wrap: wrap;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: $space-xs;

  .status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: $color-text-muted;
  }

  .status-text {
    font-size: $font-size-sm;
    font-weight: 500;
    color: $color-text-secondary;
  }

  &.is-online {
    .status-dot {
      background: $color-success;
      animation: pulse-online 2s infinite;
    }
    .status-text {
      color: $color-success;
    }
  }

  &.is-offline {
    .status-dot {
      background: $color-danger;
    }
    .status-text {
      color: $color-danger;
    }
  }
}

.probe-location {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: $font-size-sm;
  color: $color-text-secondary;

  i {
    font-size: $font-size-xs;
  }
}

.readings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-md;
  margin-bottom: $space-lg;
}

.reading-item {
  display: flex;
  align-items: center;
  gap: $space-md;
  padding: $space-md;
  background: $color-bg;
  border-radius: $radius-md;

  .reading-icon {
    @include flex-center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    font-size: $font-size-xl;

    i {
      font-weight: bold;
    }
  }

  &.temperature .reading-icon {
    background: rgba(199, 139, 42, 0.1);
    color: $color-warning;
  }

  &.humidity .reading-icon {
    background: rgba(64, 158, 255, 0.1);
    color: $color-info;
  }
}

.reading-content {
  display: flex;
  flex-direction: column;

  .reading-label {
    font-size: $font-size-xs;
    color: $color-text-secondary;
    margin-bottom: 2px;
  }

  .reading-value {
    font-family: $font-family-mono;
    font-size: $font-size-2xl;
    font-weight: 700;
    font-variant-numeric: tabular-nums;

    &.normal { color: $color-success; }
    &.cold { color: $color-info; }
    &.hot { color: $color-warning; }
    &.dry { color: $color-warning; }
    &.warning { color: $color-warning; }
    &.danger { color: $color-danger; }

    .reading-unit {
      font-size: $font-size-sm;
      color: $color-text-secondary;
      font-weight: 400;
      margin-left: 2px;
    }
  }
}

.bind-section {
  margin-bottom: $space-md;

  .bind-btn {
    width: 100%;
    height: 48px;
    font-size: $font-size-md;
  }

  .bind-hint {
    margin-top: $space-sm;
    font-size: $font-size-xs;
    color: $color-text-muted;
    text-align: center;
  }
}

.bind-time {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-xs;
  padding: $space-sm;
  background: rgba(61, 107, 79, 0.05);
  border-radius: $radius-sm;
  color: $color-success;
  font-size: $font-size-sm;
  margin-bottom: $space-sm;

  i {
    font-size: $font-size-md;
  }
}

.probe-info {
  text-align: center;
  font-size: $font-size-xs;
  color: $color-text-muted;
  padding-top: $space-sm;
  border-top: 1px solid $color-bg-dark;
}

@keyframes pulse-online {
  0%, 100% { box-shadow: 0 0 0 0 rgba(61, 107, 79, 0.4); }
  50% { box-shadow: 0 0 0 6px rgba(61, 107, 79, 0); }
}

@include mobile {
  .readings-grid {
    grid-template-columns: 1fr;
  }

  .reading-value {
    font-size: $font-size-xl !important;
  }
}
</style>
