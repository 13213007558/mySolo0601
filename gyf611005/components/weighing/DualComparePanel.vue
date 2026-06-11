<template>
  <div class="dual-compare-panel">
    <div class="panel-header">
      <div class="header-title">
        <i class="el-icon-user-solid"></i>
        双人复核流程
      </div>
      <el-tag v-if="status" :type="statusTagType" size="medium">
        {{ statusText }}
      </el-tag>
    </div>

    <div class="compare-info" v-if="recordInfo">
      <div class="info-row">
        <span class="info-label">善本编号</span>
        <span class="info-value mono-number">{{ recordInfo.rare_book_no }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">页码</span>
        <span class="info-value mono-number">第 {{ recordInfo.page_no }} 页</span>
      </div>
      <div class="info-row">
        <span class="info-label">操作员</span>
        <span class="info-value">{{ recordInfo.operator_name }}</span>
      </div>
    </div>

    <div class="compare-grid">
      <div class="compare-column original">
        <div class="column-header">
          <i class="el-icon-document"></i>
          原始称重数据
        </div>
        <div class="weights-display">
          <div class="weight-row" v-for="(w, i) in originalWeights" :key="i">
            <span class="weight-label">读数{{ i + 1 }}</span>
            <span class="weight-value mono-number">{{ formatWeight(w) }} g</span>
          </div>
          <div class="result-row median">
            <span class="result-label">中值</span>
            <span class="result-value mono-number">{{ formatWeight(originalMedian) }} g</span>
          </div>
        </div>
        <div class="column-footer">
          <span class="time-text">{{ formatTime(recordInfo && recordInfo.created_at) }}</span>
        </div>
      </div>

      <div class="compare-divider">
        <div class="divider-icon">
          <i class="el-icon-sort"></i>
        </div>
        <div class="divider-text" v-if="difference !== null">
          差异
          <span class="diff-value mono-number" :class="diffClass">
            {{ formatWeight(difference) }} g
          </span>
        </div>
        <div class="divider-text" v-else>
          等待复核
        </div>
      </div>

      <div class="compare-column review">
        <div class="column-header">
          <i class="el-icon-edit"></i>
          复核员独立输入
        </div>
        <div class="review-picker" v-if="!isCompleted">
          <wheel-number-picker
            title="复核称重"
            label="请独立称重并输入中值"
            :initial-value="reviewValue"
            @input="handleReviewInput"
            @confirm="handleReviewConfirm"
            :show-actions="true"
          />
        </div>
        <div class="review-result" v-else>
          <div class="result-row median">
            <span class="result-label">复核中值</span>
            <span class="result-value mono-number">{{ formatWeight(reviewValue) }} g</span>
          </div>
          <div class="reviewer-info">
            <i class="el-icon-user"></i>
            复核员: {{ reviewerName }}
          </div>
        </div>
        <div class="column-footer" v-if="reviewTime">
          <span class="time-text">{{ formatTime(reviewTime) }}</span>
        </div>
      </div>
    </div>

    <div class="notes-section" v-if="showNotes">
      <el-input
        type="textarea"
        :rows="2"
        placeholder="请输入复核备注（可选）"
        v-model="reviewNotes"
        maxlength="200"
        show-word-limit
      >
      </el-input>
    </div>

    <div class="panel-actions">
      <el-button
        size="large"
        type="danger"
        icon="el-icon-close"
        @click="handleReject"
        :disabled="isCompleted || isLocked"
        v-if="allowReject"
      >
        退回重称
      </el-button>
      <el-button
        size="large"
        type="primary"
        icon="el-icon-check"
        @click="handleSubmit"
        :disabled="!canSubmit || isCompleted || isLocked"
        :loading="submitting"
      >
        {{ isCompleted ? '复核完成' : '确认复核' }}
      </el-button>
    </div>

    <div class="rules-hint">
      <i class="el-icon-info"></i>
      复核规则：独立称重输入中值，与原值差异超过 {{ threshold }}g 需重新复核
    </div>
  </div>
</template>

<script>
import WheelNumberPicker from './WheelNumberPicker.vue'
import { formatWeight } from '~/utils/weighing'
import { formatWeighingTime } from '~/utils/dayjs'
import { BUSINESS_RULES } from '~/utils/validator'

export default {
  name: 'DualComparePanel',
  components: {
    WheelNumberPicker
  },
  props: {
    originalMedian: {
      type: Number,
      required: true
    },
    originalWeights: {
      type: Array,
      default: function() { return [null, null, null] }
    },
    recordInfo: {
      type: Object,
      default: null
    },
    status: {
      type: String,
      default: null
    },
    threshold: {
      type: Number,
      default: BUSINESS_RULES.REVIEW_DIFF_THRESHOLD
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    isLocked: {
      type: Boolean,
      default: false
    },
    reviewerName: {
      type: String,
      default: ''
    },
    reviewTime: {
      type: String,
      default: null
    },
    initialReviewValue: {
      type: Number,
      default: null
    },
    allowReject: {
      type: Boolean,
      default: true
    },
    showNotes: {
      type: Boolean,
      default: true
    }
  },
  data: function() {
    return {
      reviewValue: null,
      reviewNotes: '',
      submitting: false
    }
  },
  computed: {
    difference: function() {
      if (this.reviewValue === null || this.originalMedian === null) return null
      return Math.abs(parseFloat(this.reviewValue) - parseFloat(this.originalMedian))
    },
    diffClass: function() {
      if (this.difference === null) return ''
      return this.difference <= this.threshold ? 'match' : 'mismatch'
    },
    canSubmit: function() {
      return this.reviewValue !== null && 
             this.difference !== null && 
             this.difference <= this.threshold
    },
    statusTagType: function() {
      var typeMap = {
        pending: 'warning',
        matched: 'success',
        mismatch: 'danger',
        completed: 'success',
        rejected: 'danger'
      }
      return typeMap[this.status] || 'info'
    },
    statusText: function() {
      var textMap = {
        pending: '待复核',
        matched: '复核通过',
        mismatch: '差异超限',
        completed: '已完成',
        rejected: '已退回'
      }
      return textMap[this.status] || ''
    }
  },
  watch: {
    initialReviewValue: {
      immediate: true,
      handler: function(val) {
        if (val !== null && val !== undefined) {
          this.reviewValue = val
        }
      }
    }
  },
  methods: {
    formatWeight: formatWeight,
    formatTime: formatWeighingTime,
    handleReviewInput: function(value) {
      this.reviewValue = value
      this.$emit('input', value)
    },
    handleReviewConfirm: function(value) {
      this.reviewValue = value
    },
    handleSubmit: function() {
      var self = this
      this.submitting = true
      
      this.$emit('submit', {
        reviewValue: this.reviewValue,
        difference: this.difference,
        notes: this.reviewNotes,
        isMatch: this.canSubmit
      })

      setTimeout(function() {
        self.submitting = false
      }, 1000)
    },
    handleReject: function() {
      var self = this
      this.$confirm('确定要退回重称吗？此操作将记录日志。', '确认退回', {
        confirmButtonText: '确定退回',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function() {
        self.$emit('reject', {
          notes: self.reviewNotes
        })
      }).catch(function() {})
    }
  }
}
</script>

<style lang="scss" scoped>
.dual-compare-panel {
  @include card;
  padding: $space-xl;
}

.panel-header {
  @include flex-between;
  margin-bottom: $space-xl;
  padding-bottom: $space-lg;
  border-bottom: 2px solid $color-bg-dark;

  .header-title {
    display: flex;
    align-items: center;
    gap: $space-sm;
    font-family: $font-family-display;
    font-size: $font-size-lg;
    font-weight: 600;
    color: $color-primary;

    i {
      font-size: $font-size-xl;
    }
  }
}

.compare-info {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-md;
  margin-bottom: $space-xl;
  padding: $space-md;
  background: $color-bg;
  border-radius: $radius-md;

  .info-row {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .info-label {
      font-size: $font-size-xs;
      color: $color-text-muted;
    }

    .info-value {
      font-size: $font-size-md;
      font-weight: 600;
      color: $color-text-primary;
    }
  }
}

.compare-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: $space-lg;
  margin-bottom: $space-xl;
  align-items: stretch;
}

.compare-column {
  @include card;
  padding: $space-lg;
  display: flex;
  flex-direction: column;
  background: $color-bg;

  &.original {
    border: 2px solid rgba(74, 55, 40, 0.2);
  }

  &.review {
    border: 2px solid rgba(61, 107, 79, 0.3);
  }

  .column-header {
    display: flex;
    align-items: center;
    gap: $space-xs;
    font-weight: 600;
    font-size: $font-size-md;
    color: $color-primary;
    margin-bottom: $space-md;
    padding-bottom: $space-sm;
    border-bottom: 1px solid $color-bg-dark;
  }
}

.weights-display {
  flex: 1;
  margin-bottom: $space-md;
}

.weight-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-sm $space-xs;
  border-bottom: 1px dashed $color-bg-dark;

  &:last-child {
    border-bottom: none;
  }

  .weight-label {
    font-size: $font-size-sm;
    color: $color-text-secondary;
  }

  .weight-value {
    font-family: $font-family-mono;
    font-size: $font-size-md;
    font-weight: 600;
    color: $color-text-primary;
    font-variant-numeric: tabular-nums;
  }
}

.result-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-md $space-xs;
  margin-top: $space-sm;
  background: rgba(74, 55, 40, 0.05);
  border-radius: $radius-sm;

  &.median {
    background: rgba(74, 55, 40, 0.1);

    .result-value {
      color: $color-primary;
      font-size: $font-size-lg;
    }
  }

  .result-label {
    font-size: $font-size-sm;
    font-weight: 500;
    color: $color-text-secondary;
  }

  .result-value {
    font-family: $font-family-mono;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
}

.column-footer {
  padding-top: $space-sm;
  border-top: 1px solid $color-bg-dark;
  text-align: center;

  .time-text {
    font-size: $font-size-xs;
    color: $color-text-muted;
    font-family: $font-family-mono;
  }
}

.compare-divider {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 $space-sm;

  .divider-icon {
    @include flex-center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: $color-primary;
    color: #fff;
    font-size: $font-size-lg;
    margin-bottom: $space-md;
  }

  .divider-text {
    text-align: center;
    font-size: $font-size-sm;
    color: $color-text-secondary;

    .diff-value {
      display: block;
      font-family: $font-family-mono;
      font-size: $font-size-xl;
      font-weight: 700;
      margin-top: $space-xs;
      font-variant-numeric: tabular-nums;

      &.match {
        color: $color-success;
      }

      &.mismatch {
        color: $color-danger;
      }
    }
  }
}

.review-picker {
  flex: 1;
}

.review-result {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;

  .reviewer-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $space-xs;
    margin-top: $space-md;
    padding-top: $space-md;
    border-top: 1px dashed $color-bg-dark;
    font-size: $font-size-sm;
    color: $color-text-secondary;
  }
}

.notes-section {
  margin-bottom: $space-lg;
}

.panel-actions {
  display: flex;
  gap: $space-md;
  justify-content: flex-end;
  margin-bottom: $space-md;

  .el-button {
    min-width: 140px;
    height: 48px;
    font-size: $font-size-md;
  }
}

.rules-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-xs;
  padding: $space-sm;
  background: rgba(64, 158, 255, 0.05);
  border-radius: $radius-sm;
  font-size: $font-size-xs;
  color: $color-info;

  i {
    font-size: $font-size-sm;
  }
}

@include mobile {
  .compare-grid {
    grid-template-columns: 1fr;
    gap: $space-md;
  }

  .compare-divider {
    flex-direction: row;
    gap: $space-md;
    padding: $space-sm 0;

    .divider-icon {
      margin-bottom: 0;
      width: 36px;
      height: 36px;
    }
  }

  .compare-info {
    grid-template-columns: 1fr;
  }

  .panel-actions {
    flex-direction: column;

    .el-button {
      width: 100%;
    }
  }
}
</style>
