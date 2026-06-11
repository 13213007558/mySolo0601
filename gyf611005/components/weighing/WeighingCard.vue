<template>
  <div class="weighing-card" :class="cardClass">
    <div class="card-header">
      <div class="card-title">
        <span class="badge">{{ index + 1 }}</span>
        <span class="title-text">第{{ index + 1 }}次称重</span>
        <el-tag v-if="status" :type="statusTagType" size="small">{{ statusText }}</el-tag>
      </div>
      <div class="card-time" v-if="time">
        {{ formatTime(time) }}
      </div>
    </div>
    
    <div class="weights-grid">
      <div class="weight-item" v-for="(w, i) in displayWeights" :key="i">
        <div class="weight-label">读数{{ i + 1 }}</div>
        <div class="weight-value mono-number" :class="{ 'is-empty': w === null || w === '' }">
          {{ w !== null && w !== '' ? formatWeight(w) : '--' }}
          <span class="weight-unit">g</span>
        </div>
      </div>
    </div>
    
    <div class="card-footer">
      <div class="result-item">
        <span class="result-label">中值</span>
        <span class="result-value median mono-number">
          {{ median !== null ? formatWeight(median) : '--' }} g
        </span>
      </div>
      <div class="result-item">
        <span class="result-label">偏差</span>
        <span class="result-value deviation mono-number" :class="deviationClass">
          {{ deviation !== null ? formatWeight(deviation) : '--' }} g
        </span>
      </div>
    </div>
    
    <div class="photo-indicator" v-if="hasPhoto">
      <i class="el-icon-camera"></i>
      <span>已拍照留档</span>
    </div>
  </div>
</template>

<script>
import { formatWeight } from '~/utils/weighing'
import { formatWeighingTime } from '~/utils/dayjs'

export default {
  name: 'WeighingCard',
  props: {
    index: {
      type: Number,
      default: 0
    },
    weights: {
      type: Array,
      default: function() { return [null, null, null] }
    },
    median: {
      type: Number,
      default: null
    },
    deviation: {
      type: Number,
      default: null
    },
    status: {
      type: String,
      default: null
    },
    time: {
      type: String,
      default: null
    },
    hasPhoto: {
      type: Boolean,
      default: false
    },
    threshold: {
      type: Number,
      default: 0.3
    }
  },
  computed: {
    displayWeights: function() {
      return this.weights
    },
    statusTagType: function() {
      var typeMap = {
        valid: 'success',
        reweigh: 'warning',
        invalid: 'danger',
        current: 'info'
      }
      return typeMap[this.status] || 'info'
    },
    statusText: function() {
      var textMap = {
        valid: '有效',
        reweigh: '需复称',
        invalid: '无效',
        current: '当前'
      }
      return textMap[this.status] || ''
    },
    cardClass: function() {
      return {
        'is-valid': this.status === 'valid',
        'is-reweigh': this.status === 'reweigh',
        'is-invalid': this.status === 'invalid',
        'is-current': this.status === 'current'
      }
    },
    deviationClass: function() {
      if (this.deviation === null || this.deviation === undefined) return ''
      if (this.deviation <= this.threshold * 0.6) return 'safe'
      if (this.deviation <= this.threshold) return 'warning'
      return 'danger'
    }
  },
  methods: {
    formatWeight: formatWeight,
    formatTime: formatWeighingTime
  }
}
</script>

<style lang="scss" scoped>
.weighing-card {
  @include card;
  padding: $space-lg;
  border: 2px solid transparent;
  transition: all $transition-normal;
  
  &.is-current {
    border-color: $color-primary;
    background: linear-gradient(135deg, $color-surface 0%, rgba(74, 55, 40, 0.03) 100%);
  }
  
  &.is-valid {
    border-color: rgba(61, 107, 79, 0.3);
  }
  
  &.is-reweigh {
    border-color: rgba(199, 139, 42, 0.5);
    animation: pulse-warning 2s infinite;
  }
  
  &.is-invalid {
    border-color: rgba(179, 58, 58, 0.5);
  }
}

.card-header {
  @include flex-between;
  margin-bottom: $space-md;
  
  .card-title {
    display: flex;
    align-items: center;
    gap: $space-sm;
    
    .badge {
      @include flex-center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: $color-primary;
      color: #fff;
      font-weight: 700;
      font-size: $font-size-sm;
    }
    
    .title-text {
      font-family: $font-family-display;
      font-size: $font-size-md;
      font-weight: 600;
      color: $color-text-primary;
    }
  }
  
  .card-time {
    font-size: $font-size-xs;
    color: $color-text-muted;
    font-family: $font-family-mono;
  }
}

.weights-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-sm;
  margin-bottom: $space-md;
  padding-bottom: $space-md;
  border-bottom: 1px solid $color-bg-dark;
}

.weight-item {
  text-align: center;
  padding: $space-sm;
  background: $color-bg;
  border-radius: $radius-md;
  
  .weight-label {
    font-size: $font-size-xs;
    color: $color-text-secondary;
    margin-bottom: $space-xs;
  }
  
  .weight-value {
    font-family: $font-family-mono;
    font-size: $font-size-xl;
    font-weight: 700;
    color: $color-primary;
    font-variant-numeric: tabular-nums;
    
    &.is-empty {
      color: $color-text-muted;
    }
    
    .weight-unit {
      font-size: $font-size-sm;
      color: $color-text-secondary;
      margin-left: 2px;
    }
  }
}

.card-footer {
  display: flex;
  justify-content: space-around;
}

.result-item {
  text-align: center;
  
  .result-label {
    display: block;
    font-size: $font-size-xs;
    color: $color-text-secondary;
    margin-bottom: $space-xs;
  }
  
  .result-value {
    font-family: $font-family-mono;
    font-size: $font-size-lg;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    
    &.median {
      color: $color-primary;
    }
    
    &.deviation {
      &.safe { color: $deviation-safe; }
      &.warning { color: $deviation-warning; }
      &.danger { color: $deviation-danger; }
    }
  }
}

.photo-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-xs;
  margin-top: $space-sm;
  padding-top: $space-sm;
  border-top: 1px dashed $color-bg-dark;
  font-size: $font-size-xs;
  color: $color-success;
  
  i {
    font-size: $font-size-sm;
  }
}

@keyframes pulse-warning {
  0%, 100% { box-shadow: 0 0 0 0 rgba(199, 139, 42, 0.2); }
  50% { box-shadow: 0 0 0 8px rgba(199, 139, 42, 0); }
}

@include mobile {
  .weights-grid {
    gap: $space-xs;
  }
  
  .weight-value {
    font-size: $font-size-lg !important;
  }
}
</style>
