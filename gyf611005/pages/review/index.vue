<template>
  <div class="review-page">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <i class="el-icon-user-solid"></i>
          双人复核作业
        </h1>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>复核作业</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="header-right">
        <el-button
          size="large"
          icon="el-icon-document"
          @click="goToHistory"
        >
          历史记录
        </el-button>
        <el-button
          size="large"
          icon="el-icon-balance-scale"
          @click="goToWeighing"
          type="primary"
        >
          称重作业
        </el-button>
      </div>
    </div>

    <div class="page-body">
      <div class="pending-list" v-if="!selectedRecord">
        <el-card class="list-card">
          <div slot="header" class="card-header">
            <span><i class="el-icon-document-checked"></i> 待复核记录</span>
            <el-tag type="warning" size="small">{{ pendingRecords.length }} 条待复核</el-tag>
          </div>

          <el-table
            :data="pendingRecords"
            style="width: 100%"
            v-loading="loading"
            @row-click="selectRecord"
            highlight-current-row
            stripe
          >
            <el-table-column prop="rare_book_no" label="善本编号" width="180">
              <template slot-scope="scope">
                <span class="mono-number">{{ scope.row.rare_book_no }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="page_no" label="页码" width="100">
              <template slot-scope="scope">
                第 {{ scope.row.page_no }} 页
              </template>
            </el-table-column>
            <el-table-column prop="median_value" label="称重中值(g)" width="140">
              <template slot-scope="scope">
                <span class="mono-number">{{ formatWeight(scope.row.median_value) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="max_deviation" label="最大偏差(g)" width="140">
              <template slot-scope="scope">
                <span class="mono-number" :class="getDeviationClass(scope.row.max_deviation)">
                  {{ formatWeight(scope.row.max_deviation) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="operator_name" label="操作员" width="120" />
            <el-table-column prop="created_at" label="称重时间" width="180">
              <template slot-scope="scope">
                <span class="mono-number">{{ formatTime(scope.row.created_at) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template slot-scope="scope">
                <el-tag size="small" :type="getStatusType(scope.row.status)">
                  {{ getStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template slot-scope="scope">
                <el-button
                  type="primary"
                  size="small"
                  icon="el-icon-edit"
                  @click.stop="selectRecord(scope.row)"
                >
                  复核
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-empty
            v-if="pendingRecords.length === 0 && !loading"
            description="暂无待复核记录"
            :image-size="100"
          >
            <el-button type="primary" @click="goToWeighing">前往称重</el-button>
          </el-empty>
        </el-card>
      </div>

      <div class="review-detail" v-else>
        <div class="detail-header">
          <el-button
            size="large"
            icon="el-icon-arrow-left"
            @click="backToList"
          >
            返回列表
          </el-button>
          <div class="record-info">
            <el-tag type="primary" size="medium">
              <i class="el-icon-collection"></i>
              {{ selectedRecord.rare_book_no }}
            </el-tag>
            <el-tag size="medium">
              <i class="el-icon-document"></i>
              第 {{ selectedRecord.page_no }} 页
            </el-tag>
          </div>
        </div>

        <div class="detail-body">
          <div class="record-summary">
            <el-card>
              <div slot="header" class="card-header">
                <span><i class="el-icon-document"></i> 原始称重记录</span>
              </div>
              <div class="summary-grid">
                <div class="summary-item">
                  <span class="item-label">操作员</span>
                  <span class="item-value">{{ selectedRecord.operator_name }}</span>
                </div>
                <div class="summary-item">
                  <span class="item-label">称重时间</span>
                  <span class="item-value mono-number">{{ formatTime(selectedRecord.created_at) }}</span>
                </div>
                <div class="summary-item">
                  <span class="item-label">复称次数</span>
                  <span class="item-value">{{ selectedRecord.reweigh_count || 0 }} 次</span>
                </div>
                <div class="summary-item">
                  <span class="item-label">温湿度</span>
                  <span class="item-value mono-number">
                    {{ selectedRecord.humidity_data ? selectedRecord.humidity_data.temperature : '--' }}°C / 
                    {{ selectedRecord.humidity_data ? selectedRecord.humidity_data.humidity : '--' }}%RH
                  </span>
                </div>
              </div>

              <div class="weights-summary" v-if="selectedRecord.attempts && selectedRecord.attempts.length > 0">
                <h4>称重明细</h4>
                <div class="attempts-list">
                  <div
                    class="attempt-item"
                    v-for="(attempt, index) in selectedRecord.attempts"
                    :key="attempt.id"
                  >
                    <div class="attempt-header">
                      <span class="attempt-title">第 {{ index + 1 }} 次称重</span>
                      <el-tag size="small" :type="attempt.deviation > 0.3 ? 'warning' : 'success'">
                        偏差 {{ formatWeight(attempt.deviation) }}g
                      </el-tag>
                    </div>
                    <div class="attempt-weights">
                      <span class="weight mono-number">{{ formatWeight(attempt.weight_1) }}g</span>
                      <span class="weight mono-number">{{ formatWeight(attempt.weight_2) }}g</span>
                      <span class="weight mono-number">{{ formatWeight(attempt.weight_3) }}g</span>
                      <span class="arrow">→</span>
                      <span class="median mono-number">中值 {{ formatWeight(attempt.calculated_median) }}g</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="workorder-info" v-if="selectedRecord.work_order">
                <el-alert
                  :title="'已自动生成脱酸工单：' + selectedRecord.work_order.notes"
                  type="warning"
                  show-icon
                  :closable="false"
                />
              </div>
            </el-card>
          </div>

          <div class="review-panel">
            <dual-compare-panel
              :original-median="selectedRecord.median_value"
              :original-weights="getOriginalWeights(selectedRecord)"
              :record-info="selectedRecord"
              :status="reviewStatus"
              :threshold="REVIEW_DIFF_THRESHOLD"
              :is-completed="isReviewCompleted"
              :reviewer-name="currentUserName"
              :initial-review-value="initialReviewValue"
              @submit="handleReviewSubmit"
              @reject="handleReviewReject"
            />
          </div>

          <div class="photos-section" v-if="selectedRecord.photos && selectedRecord.photos.length > 0">
            <el-card>
              <div slot="header" class="card-header">
                <span><i class="el-icon-picture"></i> 留档照片 ({{ selectedRecord.photos.length }})</span>
              </div>
              <div class="photos-grid">
                <div
                  class="photo-item"
                  v-for="(photo, index) in selectedRecord.photos"
                  :key="photo.id || index"
                  @click="previewPhoto(photo)"
                >
                  <img :src="photo.file_path || photo.dataUrl" :alt="'照片 ' + (index + 1)" />
                  <div class="photo-meta">
                    <span class="photo-type">{{ getPhotoTypeText(photo.photo_type) }}</span>
                    <span class="photo-time mono-number">{{ formatTime(photo.taken_at) }}</span>
                  </div>
                </div>
              </div>
            </el-card>
          </div>
        </div>
      </div>
    </div>

    <el-dialog
      title="照片预览"
      :visible.sync="previewVisible"
      width="80%"
      center
    >
      <div class="preview-dialog">
        <img :src="previewPhotoUrl" alt="照片预览" class="preview-image" />
        <div class="preview-info" v-if="previewPhotoData">
          <p>类型: {{ getPhotoTypeText(previewPhotoData.photo_type) }}</p>
          <p>拍摄时间: {{ formatTime(previewPhotoData.taken_at) }}</p>
          <p>拍摄人: {{ previewPhotoData.taken_by || '未知' }}</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import DualComparePanel from '~/components/weighing/DualComparePanel.vue'
import { formatWeight } from '~/utils/weighing'
import { formatWeighingTime } from '~/utils/dayjs'
import { BUSINESS_RULES } from '~/utils/validator'

export default {
  name: 'ReviewIndexPage',
  components: {
    DualComparePanel
  },
  data: function() {
    return {
      loading: false,
      selectedRecord: null,
      reviewStatus: 'pending',
      initialReviewValue: null,
      previewVisible: false,
      previewPhotoUrl: '',
      previewPhotoData: null
    }
  },
  computed: {
    REVIEW_DIFF_THRESHOLD: function() { return BUSINESS_RULES.REVIEW_DIFF_THRESHOLD },

    pendingRecords: function() {
      return this.$store.getters['weighing/recordsForReview']
    },
    allRecords: function() {
      return this.$store.getters['weighing/records']
    },
    currentUserName: function() {
      var user = this.$store.getters['user/currentUser']
      return user ? user.name : ''
    },
    isReviewCompleted: function() {
      return this.selectedRecord && 
             this.selectedRecord.review_record && 
             this.selectedRecord.review_record.is_match
    }
  },
  mounted: function() {
    this.loadRecords()
    
    var recordId = this.$route.query.recordId
    if (recordId) {
      this.findAndSelectRecord(recordId)
    }
  },
  methods: {
    formatWeight: formatWeight,
    formatTime: formatWeighingTime,

    loadRecords: function() {
      var self = this
      this.loading = true
      this.$store.dispatch('weighing/init').then(function() {
        self.loading = false
      })
    },

    findAndSelectRecord: function(recordId) {
      var self = this
      this.$store.dispatch('weighing/getRecordById', recordId).then(function(record) {
        if (record) {
          self.selectRecord(record)
        }
      })
    },

    selectRecord: function(record) {
      this.selectedRecord = record
      this.reviewStatus = 'pending'
      this.initialReviewValue = null
      
      if (record.review_record) {
        this.initialReviewValue = record.review_record.review_value
        this.reviewStatus = record.review_record.is_match ? 'completed' : 'mismatch'
      }
    },

    backToList: function() {
      this.selectedRecord = null
      this.reviewStatus = 'pending'
      this.$router.push({ path: '/review' })
    },

    getDeviationClass: function(deviation) {
      if (deviation <= 0.18) return 'text-success'
      if (deviation <= 0.3) return 'text-warning'
      return 'text-danger'
    },

    getStatusType: function(status) {
      var typeMap = {
        normal: 'info',
        pending: 'warning',
        reviewed: 'success',
        sealed: 'danger'
      }
      return typeMap[status] || 'info'
    },

    getStatusText: function(status) {
      var textMap = {
        normal: '待复核',
        pending: '待复核',
        reviewed: '已复核',
        sealed: '已封存'
      }
      return textMap[status] || status
    },

    getOriginalWeights: function(record) {
      if (!record.attempts || record.attempts.length === 0) {
        return [null, null, null]
      }
      var lastAttempt = record.attempts[record.attempts.length - 1]
      return [lastAttempt.weight_1, lastAttempt.weight_2, lastAttempt.weight_3]
    },

    getPhotoTypeText: function(type) {
      var textMap = {
        reweigh: '复称现场',
        paper: '纸张状态',
        environment: '环境照片',
        other: '其他'
      }
      return textMap[type] || type || '未分类'
    },

    handleReviewSubmit: function(data) {
      var self = this
      
      this.$store.dispatch('weighing/submitReview', {
        recordId: this.selectedRecord.id,
        reviewValue: data.reviewValue,
        notes: data.notes
      }).then(function(result) {
        if (result.success) {
          self.reviewStatus = 'matched'
          self.$message.success(result.message)
          
          setTimeout(function() {
            self.$message.success('复核完成，记录已保存')
            self.backToList()
          }, 1000)
        } else {
          self.reviewStatus = 'mismatch'
          self.$message.error(result.message)
        }
      })
    },

    handleReviewReject: function(data) {
      var self = this
      this.$confirm('确定要退回重称吗？操作员需要重新进行称重流程。', '确认退回', {
        confirmButtonText: '确定退回',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function() {
        self.$message.info('已退回重称：' + (data.notes || '无备注'))
        self.backToList()
      }).catch(function() {})
    },

    previewPhoto: function(photo) {
      this.previewPhotoUrl = photo.file_path || photo.dataUrl
      this.previewPhotoData = photo
      this.previewVisible = true
    },

    goToHistory: function() {
      this.$router.push('/history')
    },

    goToWeighing: function() {
      this.$router.push('/weighing')
    }
  }
}
</script>

<style lang="scss" scoped>
.review-page {
  min-height: 100vh;
  background: $color-bg;
}

.page-header {
  @include flex-between;
  padding: $space-xl $space-xxl;
  background: $color-surface;
  border-bottom: 1px solid $color-bg-dark;
  margin-bottom: $space-xl;

  .header-left {
    .page-title {
      display: flex;
      align-items: center;
      gap: $space-sm;
      font-family: $font-family-display;
      font-size: $font-size-2xl;
      font-weight: 700;
      color: $color-primary;
      margin: 0 0 $space-sm 0;

      i {
        font-size: $font-size-3xl;
      }
    }
  }

  .header-right {
    display: flex;
    gap: $space-md;

    .el-button {
      height: 48px;
      min-width: 140px;
      font-size: $font-size-md;
    }
  }
}

.page-body {
  padding: 0 $space-xxl $space-xxl;
}

.list-card {
  .card-header {
    @include flex-between;
    font-family: $font-family-display;
    font-size: $font-size-lg;
    font-weight: 600;
    color: $color-primary;
  }

  .el-table {
    .mono-number {
      font-family: $font-family-mono;
    }

    .text-success { color: $color-success; }
    .text-warning { color: $color-warning; }
    .text-danger { color: $color-danger; }
  }
}

.detail-header {
  display: flex;
  align-items: center;
  gap: $space-xl;
  margin-bottom: $space-xl;

  .record-info {
    display: flex;
    gap: $space-md;

    .el-tag {
      height: 36px;
      line-height: 34px;
      font-size: $font-size-md;
      padding: 0 $space-lg;

      i {
        margin-right: $space-xs;
      }
    }
  }
}

.detail-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-xl;
}

.record-summary {
  grid-column: 1 / 2;

  .card-header {
    font-family: $font-family-display;
    font-size: $font-size-lg;
    font-weight: 600;
    color: $color-primary;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $space-md;
    margin-bottom: $space-lg;

    .summary-item {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .item-label {
        font-size: $font-size-xs;
        color: $color-text-muted;
      }

      .item-value {
        font-size: $font-size-md;
        font-weight: 500;
        color: $color-text-primary;
      }
    }
  }

  .weights-summary {
    h4 {
      font-size: $font-size-md;
      font-weight: 600;
      color: $color-primary;
      margin: 0 0 $space-md 0;
      padding-top: $space-md;
      border-top: 1px solid $color-bg-dark;
    }

    .attempts-list {
      display: flex;
      flex-direction: column;
      gap: $space-md;
    }

    .attempt-item {
      padding: $space-md;
      background: $color-bg;
      border-radius: $radius-md;

      .attempt-header {
        @include flex-between;
        margin-bottom: $space-sm;

        .attempt-title {
          font-weight: 500;
          color: $color-text-primary;
        }
      }

      .attempt-weights {
        display: flex;
        align-items: center;
        gap: $space-sm;
        flex-wrap: wrap;

        .weight {
          font-family: $font-family-mono;
          font-size: $font-size-sm;
          padding: $space-xs $space-sm;
          background: $color-surface;
          border-radius: $radius-sm;
        }

        .arrow {
          color: $color-text-muted;
        }

        .median {
          font-family: $font-family-mono;
          font-size: $font-size-sm;
          font-weight: 600;
          color: $color-primary;
          padding: $space-xs $space-sm;
          background: rgba(74, 55, 40, 0.1);
          border-radius: $radius-sm;
        }
      }
    }
  }

  .workorder-info {
    margin-top: $space-lg;
  }
}

.review-panel {
  grid-column: 2 / 3;
}

.photos-section {
  grid-column: 1 / -1;

  .card-header {
    font-family: $font-family-display;
    font-size: $font-size-lg;
    font-weight: 600;
    color: $color-primary;
  }

  .photos-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: $space-md;
  }

  .photo-item {
    cursor: pointer;
    border-radius: $radius-md;
    overflow: hidden;
    border: 1px solid $color-bg-dark;
    transition: all $transition-fast;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    img {
      width: 100%;
      height: 150px;
      object-fit: cover;
      display: block;
    }

    .photo-meta {
      padding: $space-sm;
      background: $color-bg;

      .photo-type {
        display: block;
        font-size: $font-size-sm;
        font-weight: 500;
        color: $color-text-primary;
        margin-bottom: 2px;
      }

      .photo-time {
        display: block;
        font-size: $font-size-xs;
        color: $color-text-muted;
      }
    }
  }
}

.preview-dialog {
  text-align: center;

  .preview-image {
    max-width: 100%;
    max-height: 60vh;
    border-radius: $radius-md;
  }

  .preview-info {
    margin-top: $space-md;
    text-align: left;
    padding: $space-md;
    background: $color-bg;
    border-radius: $radius-md;

    p {
      margin: $space-xs 0;
      font-size: $font-size-sm;
      color: $color-text-secondary;
    }
  }
}

@include mobile {
  .page-header {
    flex-direction: column;
    gap: $space-md;
    padding: $space-lg;
    align-items: flex-start;

    .header-right {
      width: 100%;

      .el-button {
        flex: 1;
      }
    }
  }

  .page-body {
    padding: 0 $space-lg $space-lg;
  }

  .detail-body {
    grid-template-columns: 1fr;
  }

  .record-summary, .review-panel {
    grid-column: 1 / -1;
  }

  .photos-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)) !important;
  }
}
</style>
