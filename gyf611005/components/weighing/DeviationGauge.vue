<template>
  <div class="deviation-gauge">
    <div class="gauge-header">
      <span class="gauge-title">偏差指示器</span>
      <span class="gauge-threshold">阈值: {{ threshold.toFixed(3) }}g</span>
    </div>
    
    <div class="gauge-body">
      <div class="gauge-scale">
        <div class="scale-marks">
          <span class="mark" v-for="m in 7" :key="m" :style="{ left: ((m-1) * 16.66) + '%' }">
            <span class="mark-line"></span>
            <span class="mark-value">{{ ((m-1) * threshold / 6).toFixed(2) }}</span>
          </span>
        </div>
        
        <div class="scale-track">
          <div class="track-safe"></div>
          <div class="track-warning"></div>
          <div class="track-danger"></div>
        </div>
        
        <div class="gauge-pointer" :style="pointerStyle" v-if="displayValue !== null">
          <div class="pointer-arrow"></div>
          <div class="pointer-value" :class="valueClass">
            {{ formatWeight(displayValue) }}g
          </div>
        </div>
      </div>
      
      <div class="gauge-zones">
        <div class="zone safe">
          <span class="zone-color"></span>
          <span class="zone-label">安全 (0 - {{ (threshold * 0.6).toFixed(2) }}g)</span>
        </div>
        <div class="zone warning">
          <span class="zone-color"></span>
          <span class="zone-label">注意 ({{ (threshold * 0.6).toFixed(2) }} - {{ threshold.toFixed(2) }}g)</span>
        </div>
        <div class="zone danger">
          <span class="zone-color"></span>
          <span class="zone-label">超限 (> {{ threshold.toFixed(2) }}g)</span>
        </div>
      </div>
    </div>
    
    <div class="gauge-status" v-if="statusText">
      <el-tag :type="statusTagType" size="large" effect="dark">
        {{ statusText }}
      </el-tag>
    </div>
  </div>
</template>

<script>
import { formatWeight } from '~/utils/weighing'

export default {
  name: 'DeviationGauge',
  props: {
    value: {
      type: Number,
      default: null
    },
    threshold: {
      type: Number,
      default: 0.3
    }
  },
  computed: {
    displayValue: function() {
      return this.value !== null && this.value !== undefined && !isNaN(this.value)
        ? Math.min(this.value, this.threshold * 1.5)
        : null
    },
    pointerPercent: function() {
      if (this.displayValue === null) return -10
      var maxVal = this.threshold * 1.5
      return Math.min(100, Math.max(0, (this.displayValue / maxVal) * 100))
    },
    pointerStyle: function() {
      return {
        left: 'calc(' + this.pointerPercent + '% - 60px)'
      }
    },
    valueClass: function() {
      if (this.value === null || this.value === undefined) return ''
      if (this.value <= this.threshold * 0.6) return 'safe'
      if (this.value <= this.threshold) return 'warning'
      return 'danger'
    },
    statusText: function() {
      if (this.value === null || this.value === undefined) return null
      if (this.value <= this.threshold * 0.6) return '偏差正常'
      if (this.value <= this.threshold) return '接近阈值，请注意'
      if (this.value <= this.threshold) return '偏差超过阈值'
      return '偏差超限，需复称'
    },
    statusTagType: function() {
      if (this.value === null || this.value === undefined) return 'info'
      if (this.value <= this.threshold * 0.6) return 'success'
      if (this.value <= this.threshold) return 'warning'
      return 'danger'
    }
  },
  methods: {
    formatWeight: formatWeight
  }
}
</script>

<style lang="scss" scoped>
.deviation-gauge {
  @include card;
  padding: $space-xl;
}

.gauge-header {
  @include flex-between;
  margin-bottom: $space-lg;
  
  .gauge-title {
    font-family: $font-family-display;
    font-size: $font-size-lg;
    font-weight: 600;
    color: $color-primary;
  }
  
  .gauge-threshold {
    font-family: $font-family-mono;
    font-size: $font-size-sm;
    color: $color-text-secondary;
    background: $color-bg;
    padding: $space-xs $space-sm;
    border-radius: $radius-sm;
  }
}

.gauge-body {
  margin-bottom: $space-lg;
}

.gauge-scale {
  position: relative;
  padding-top: $space-lg;
  padding-bottom: 80px;
  margin-bottom: $space-lg;
}

.scale-marks {
  position: relative;
  height: 30px;
  margin-bottom: $space-xs;
  
  .mark {
    position: absolute;
    transform: translateX(-50%);
    text-align: center;
    
    .mark-line {
      display: block;
      width: 2px;
      height: 12px;
      background: $color-bg-dark;
      margin: 0 auto $space-xs auto;
    }
    
    .mark-value {
      font-family: $font-family-mono;
      font-size: $font-size-xs;
      color: $color-text-muted;
    }
    
    &:first-child .mark-line,
    &:last-child .mark-line {
      height: 20px;
      background: $color-primary;
    }
  }
}

.scale-track {
  position: relative;
  height: 24px;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  
  .track-safe {
    width: 40%;
    background: linear-gradient(90deg, $color-success, lighten($color-success, 10%));
  }
  
  .track-warning {
    width: 26.67%;
    background: linear-gradient(90deg, lighten($color-warning, 10%), $color-warning);
  }
  
  .track-danger {
    flex: 1;
    background: linear-gradient(90deg, $color-danger, darken($color-danger, 10%));
  }
}

.gauge-pointer {
  position: absolute;
  bottom: 0;
  width: 120px;
  text-align: center;
  transition: left $transition-normal ease-out;
  
  .pointer-arrow {
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-bottom: 12px solid $color-primary;
    margin: 0 auto 4px auto;
  }
  
  .pointer-value {
    font-family: $font-family-mono;
    font-size: $font-size-lg;
    font-weight: 700;
    padding: $space-xs $space-md;
    border-radius: $radius-md;
    background: $color-surface;
    border: 2px solid;
    font-variant-numeric: tabular-nums;
    
    &.safe {
      color: $color-success;
      border-color: $color-success;
      box-shadow: 0 0 10px rgba(61, 107, 79, 0.3);
    }
    
    &.warning {
      color: $color-warning;
      border-color: $color-warning;
      box-shadow: 0 0 10px rgba(199, 139, 42, 0.3);
    }
    
    &.danger {
      color: $color-danger;
      border-color: $color-danger;
      box-shadow: 0 0 10px rgba(179, 58, 58, 0.3);
      animation: pulse-danger 1.5s infinite;
    }
  }
}

.gauge-zones {
  display: flex;
  justify-content: center;
  gap: $space-lg;
  flex-wrap: wrap;
}

.zone {
  display: flex;
  align-items: center;
  gap: $space-xs;
  
  .zone-color {
    width: 12px;
    height: 12px;
    border-radius: 3px;
  }
  
  &.safe .zone-color { background: $color-success; }
  &.warning .zone-color { background: $color-warning; }
  &.danger .zone-color { background: $color-danger; }
  
  .zone-label {
    font-size: $font-size-xs;
    color: $color-text-secondary;
  }
}

.gauge-status {
  text-align: center;
  padding-top: $space-md;
  border-top: 1px solid $color-bg-dark;
  
  .el-tag {
    font-size: $font-size-md;
    padding: $space-sm $space-lg;
    height: auto;
  }
}

@include mobile {
  .gauge-pointer {
    width: 100px;
    
    .pointer-value {
      font-size: $font-size-md;
    }
  }
  
  .gauge-zones {
    gap: $space-sm;
  }
  
  .zone-label {
    font-size: $font-size-xs !important;
  }
}
</style>
