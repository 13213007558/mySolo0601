<template>
  <div class="wheel-picker-container">
    <div class="picker-header">
      <span class="picker-title">{{ title }}</span>
      <span class="picker-unit">{{ unit }}</span>
    </div>
    
    <div class="wheel-display">
      <div class="display-value" :class="{ 'has-value': displayValue !== null }">
        {{ displayValueFormatted }}
      </div>
      <div class="display-label">{{ label }}</div>
    </div>
    
    <div class="wheels-row">
      <div class="wheel-group">
        <div class="wheel-label">整数位</div>
        <div class="wheel-col">
          <button class="wheel-btn up" @click="adjustDigit(0, 1)" @mousedown="startAdjust(0, 1)" @mouseup="stopAdjust" @mouseleave="stopAdjust">
            <i class="el-icon-arrow-up"></i>
          </button>
          <div class="wheel-digit">{{ digits[0] }}</div>
          <button class="wheel-btn down" @click="adjustDigit(0, -1)" @mousedown="startAdjust(0, -1)" @mouseup="stopAdjust" @mouseleave="stopAdjust">
            <i class="el-icon-arrow-down"></i>
          </button>
        </div>
      </div>
      
      <div class="wheel-group">
        <div class="wheel-label">小数点</div>
        <div class="wheel-col decimal-point">
          <div class="decimal-dot">.</div>
        </div>
      </div>
      
      <div class="wheel-group" v-for="(digit, idx) in [1, 2, 3]" :key="'decimal-' + idx">
        <div class="wheel-label">第{{ idx }}位小数</div>
        <div class="wheel-col">
          <button class="wheel-btn up" @click="adjustDigit(idx, 1)" @mousedown="startAdjust(idx, 1)" @mouseup="stopAdjust" @mouseleave="stopAdjust">
            <i class="el-icon-arrow-up"></i>
          </button>
          <div class="wheel-digit">{{ digits[idx] }}</div>
          <button class="wheel-btn down" @click="adjustDigit(idx, -1)" @mousedown="startAdjust(idx, -1)" @mouseup="stopAdjust" @mouseleave="stopAdjust">
            <i class="el-icon-arrow-down"></i>
          </button>
        </div>
      </div>
    </div>
    
    <div class="quick-buttons">
      <div class="quick-section">
        <span class="quick-label">快速调整</span>
        <div class="quick-btn-row">
          <button class="quick-btn" @click="quickAdd(1)">+1g</button>
          <button class="quick-btn" @click="quickAdd(0.1)">+0.1g</button>
          <button class="quick-btn" @click="quickAdd(0.01)">+0.01g</button>
          <button class="quick-btn" @click="quickAdd(0.001)">+0.001g</button>
        </div>
        <div class="quick-btn-row">
          <button class="quick-btn" @click="quickAdd(-1)">-1g</button>
          <button class="quick-btn" @click="quickAdd(-0.1)">-0.1g</button>
          <button class="quick-btn" @click="quickAdd(-0.01)">-0.01g</button>
          <button class="quick-btn" @click="quickAdd(-0.001)">-0.001g</button>
        </div>
      </div>
    </div>
    
    <div class="picker-actions" v-if="showActions">
      <el-button size="large" @click="handleReset">清零</el-button>
      <el-button type="primary" size="large" @click="handleConfirm" :disabled="displayValue === null">确认</el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WheelNumberPicker',
  props: {
    title: {
      type: String,
      default: '毛毡称重'
    },
    label: {
      type: String,
      default: '请设置称重值'
    },
    unit: {
      type: String,
      default: 'g'
    },
    initialValue: {
      type: Number,
      default: null
    },
    min: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 100
    },
    showActions: {
      type: Boolean,
      default: true
    },
    step: {
      type: Number,
      default: 0.001
    }
  },
  data: function() {
    return {
      digits: [0, 0, 0, 0],
      adjustTimer: null,
      repeatInterval: 150
    }
  },
  computed: {
    displayValue: function() {
      var val = this.digits[0] +
        this.digits[1] * 0.1 +
        this.digits[2] * 0.01 +
        this.digits[3] * 0.001
      return Math.round(val * 1000) / 1000
    },
    displayValueFormatted: function() {
      if (this.displayValue === null) return '--'
      return this.displayValue.toFixed(3)
    }
  },
  watch: {
    initialValue: {
      immediate: true,
      handler: function(val) {
        if (val !== null && val !== undefined) {
          this.setValue(val)
        }
      }
    }
  },
  methods: {
    setValue: function(value) {
      var v = Math.max(this.min, Math.min(this.max, parseFloat(value)))
      v = Math.round(v * 1000) / 1000
      
      this.digits[0] = Math.floor(v)
      this.digits[1] = Math.floor((v * 10) % 10)
      this.digits[2] = Math.floor((v * 100) % 10)
      this.digits[3] = Math.floor((v * 1000) % 10)
      
      this.$emit('input', this.displayValue)
    },
    adjustDigit: function(pos, delta) {
      if (delta > 0) {
        this.digits.splice(pos, 1, (this.digits[pos] + 1) % 10)
      } else {
        this.digits.splice(pos, 1, (this.digits[pos] + 9) % 10)
      }
      
      var current = this.displayValue
      if (current > this.max) {
        this.setValue(this.max)
      } else if (current < this.min) {
        this.setValue(this.min)
      } else {
        this.$emit('input', this.displayValue)
        this.$emit('change', this.displayValue)
      }
    },
    startAdjust: function(pos, delta) {
      var self = this
      this.stopAdjust()
      setTimeout(function() {
        self.adjustTimer = setInterval(function() {
          self.adjustDigit(pos, delta)
        }, self.repeatInterval)
      }, 300)
    },
    stopAdjust: function() {
      if (this.adjustTimer) {
        clearInterval(this.adjustTimer)
        this.adjustTimer = null
      }
    },
    quickAdd: function(amount) {
      var newValue = this.displayValue + amount
      if (newValue >= this.min && newValue <= this.max) {
        this.setValue(newValue)
      }
    },
    handleReset: function() {
      var self = this
      this.$confirm('确定要清零吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function() {
        self.setValue(0)
        self.$message.success('已清零')
      }).catch(function() {})
    },
    handleConfirm: function() {
      this.$emit('confirm', this.displayValue)
    }
  },
  beforeDestroy: function() {
    this.stopAdjust()
  }
}
</script>

<style lang="scss" scoped>
.wheel-picker-container {
  @include card;
  padding: $space-xl;
  background: $color-surface;
}

.picker-header {
  @include flex-between;
  margin-bottom: $space-lg;
  
  .picker-title {
    font-family: $font-family-display;
    font-size: $font-size-lg;
    font-weight: 600;
    color: $color-primary;
  }
  
  .picker-unit {
    font-family: $font-family-mono;
    font-size: $font-size-md;
    color: $color-text-secondary;
    background: $color-bg;
    padding: $space-xs $space-sm;
    border-radius: $radius-sm;
  }
}

.wheel-display {
  text-align: center;
  padding: $space-lg;
  background: $color-bg;
  border-radius: $radius-lg;
  margin-bottom: $space-xl;
  
  .display-value {
    font-family: $font-family-mono;
    font-size: $font-size-display;
    font-weight: 700;
    color: $color-text-muted;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;
    transition: color $transition-fast;
    
    &.has-value {
      color: $color-primary;
    }
  }
  
  .display-label {
    font-size: $font-size-sm;
    color: $color-text-secondary;
    margin-top: $space-sm;
  }
}

.wheels-row {
  display: flex;
  justify-content: center;
  gap: $space-md;
  margin-bottom: $space-xl;
}

.wheel-group {
  text-align: center;
  
  .wheel-label {
    font-size: $font-size-xs;
    color: $color-text-muted;
    margin-bottom: $space-xs;
    min-height: 16px;
  }
}

.wheel-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-sm;
  
  &.decimal-point {
    justify-content: center;
    min-height: 160px;
  }
}

.wheel-btn {
  @include touch-button(56px);
  background: $color-bg;
  border: 2px solid $color-bg-dark;
  color: $color-primary;
  font-size: $font-size-xl;
  
  &:hover {
    border-color: $color-primary;
    background: rgba(74, 55, 40, 0.05);
  }
  
  &:active {
    background: $color-primary;
    color: #fff;
    transform: scale(0.95);
  }
  
  i {
    font-weight: bold;
  }
}

.wheel-digit {
  @include touch-button(56px);
  font-family: $font-family-mono;
  font-size: $font-size-2xl;
  font-weight: 700;
  color: $color-primary;
  background: $color-surface;
  border: 3px solid $color-primary;
  border-radius: $radius-md;
  display: flex;
  justify-content: center;
  align-items: center;
  font-variant-numeric: tabular-nums;
}

.decimal-dot {
  font-family: $font-family-mono;
  font-size: $font-size-2xl;
  font-weight: 700;
  color: $color-primary;
}

.quick-buttons {
  border-top: 1px solid $color-bg-dark;
  padding-top: $space-lg;
  margin-bottom: $space-lg;
}

.quick-section {
  .quick-label {
    display: block;
    font-size: $font-size-sm;
    color: $color-text-secondary;
    margin-bottom: $space-sm;
  }
}

.quick-btn-row {
  display: flex;
  gap: $space-sm;
  margin-bottom: $space-sm;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.quick-btn {
  @include touch-button(80px);
  min-height: 44px;
  background: $color-bg;
  border: 2px solid $color-bg-dark;
  color: $color-text-primary;
  font-size: $font-size-sm;
  font-weight: 500;
  border-radius: $radius-md;
  
  &:hover {
    border-color: $color-primary;
    background: rgba(74, 55, 40, 0.05);
  }
  
  &:active {
    background: $color-primary;
    color: #fff;
    transform: scale(0.95);
  }
}

.picker-actions {
  display: flex;
  gap: $space-md;
  justify-content: flex-end;
  
  .el-button {
    min-width: 120px;
    height: 48px;
    font-size: $font-size-md;
  }
}

@include mobile {
  .wheel-picker-container {
    padding: $space-lg;
  }
  
  .display-value {
    font-size: $font-size-2xl !important;
  }
  
  .wheel-btn,
  .wheel-digit {
    min-width: 48px;
    min-height: 48px;
  }
  
  .quick-btn {
    min-width: 64px;
    font-size: $font-size-xs;
  }
  
  .wheels-row {
    gap: $space-sm;
  }
}
</style>
