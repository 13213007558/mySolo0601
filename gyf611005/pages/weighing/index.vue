<template>
  <div class="weighing-page">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <i class="el-icon-balance-scale"></i>
          善本毛毡称重台
        </h1>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>称重作业</el-breadcrumb-item>
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
          icon="el-icon-user"
          @click="goToReview"
          type="success"
        >
          复核作业
        </el-button>
      </div>
    </div>

    <div class="session-start" v-if="!currentSession">
      <el-card class="start-card">
        <div slot="header" class="card-header">
          <span><i class="el-icon-edit"></i> 开始称重会话</span>
        </div>
        <el-form :model="startForm" :rules="startRules" ref="startForm" label-width="100px">
          <el-form-item label="善本编号" prop="rareBookNo">
            <el-input
              v-model="startForm.rareBookNo"
              placeholder="请输入善本编号"
              size="large"
              maxlength="50"
            >
              <i slot="prefix" class="el-icon-collection"></i>
            </el-input>
          </el-form-item>
          <el-form-item label="页码" prop="pageNo">
            <el-input-number
              v-model="startForm.pageNo"
              :min="1"
              :max="9999"
              size="large"
              controls-position="right"
              style="width: 100%;"
            ></el-input-number>
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              @click="startSession"
              :loading="starting"
              style="width: 100%; height: 56px; font-size: 18px;"
            >
              <i class="el-icon-play"></i>
              开始称重
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <div class="weighing-workspace" v-else>
      <div class="workspace-header">
        <div class="session-info">
          <el-tag type="primary" size="medium">
            <i class="el-icon-collection"></i>
            {{ currentSession.rare_book_no }}
          </el-tag>
          <el-tag size="medium">
            <i class="el-icon-document"></i>
            第 {{ currentSession.page_no }} 页
          </el-tag>
          <el-tag v-if="reweighCount > 0" type="warning" size="medium">
            <i class="el-icon-refresh"></i>
            已复称 {{ reweighCount }} 次
          </el-tag>
        </div>
        <div class="session-actions">
          <el-button
            size="large"
            type="danger"
            icon="el-icon-close"
            @click="cancelSession"
          >
            取消会话
          </el-button>
        </div>
      </div>

      <div class="workspace-body">
        <div class="left-panel">
          <probe-status-card
            :temperature="currentTemperature"
            :humidity="currentHumidity"
            :online="isProbeOnline"
            :location="probeLocation"
            :probe-id="probeId"
            :show-bind-button="!humidityBound"
            :bound-time="boundHumidityTime"
            :bind-hint="bindHint"
            @refresh="refreshProbe"
            @bind="bindHumidity"
          />

          <div class="step-indicator">
            <div class="step" :class="{ active: step >= 1, completed: step > 1 }">
              <div class="step-icon">1</div>
              <span class="step-label">绑定温湿度</span>
            </div>
            <div class="step-line"></div>
            <div class="step" :class="{ active: step >= 2, completed: step > 2 }">
              <div class="step-icon">2</div>
              <span class="step-label">三次称重</span>
            </div>
            <div class="step-line"></div>
            <div class="step" :class="{ active: step >= 3, completed: step > 3 }">
              <div class="step-icon">3</div>
              <span class="step-label">复核确认</span>
            </div>
          </div>

          <deviation-gauge
            v-if="currentDeviation !== null"
            :value="currentDeviation"
            :threshold="MAX_DEVIATION_THRESHOLD"
          />

          <weighing-trend-chart
            :data="trendChartData"
            :labels="trendChartLabels"
            :threshold="MAX_DEVIATION_THRESHOLD"
            :height="100"
            title="称重趋势"
          />
        </div>

        <div class="center-panel">
          <div class="weighing-input-section">
            <div class="section-header">
              <h3>
                <i class="el-icon-scale"></i>
                第 {{ currentAttemptIndex + 1 }} 次称重
              </h3>
              <span class="reading-progress">
                读数 {{ completedReadings }}/3
              </span>
            </div>

            <div class="reading-tabs">
              <div
                class="tab"
                v-for="i in 3"
                :key="i"
                :class="{ 
                  active: currentReadingIndex === i - 1,
                  completed: currentAttemptWeights[i - 1] !== null
                }"
                @click="setReadingIndex(i - 1)"
              >
                <span class="tab-number">{{ i }}</span>
                <span class="tab-label">读数{{ i }}</span>
                <span class="tab-value mono-number" v-if="currentAttemptWeights[i - 1] !== null">
                  {{ formatWeight(currentAttemptWeights[i - 1]) }}g
                </span>
              </div>
            </div>

            <wheel-number-picker
              :title="'读数 ' + (currentReadingIndex + 1)"
              :label="'请输入第 ' + (currentReadingIndex + 1) + ' 次称重值'"
              :initial-value="currentAttemptWeights[currentReadingIndex]"
              :min="0.001"
              :max="100"
              :show-actions="false"
              @input="onWeightInput"
              @confirm="onWeightConfirm"
            />

            <div class="reading-navigation">
              <el-button
                size="large"
                :disabled="currentReadingIndex === 0"
                @click="prevReading"
                icon="el-icon-arrow-left"
              >
                上一个
              </el-button>
              <el-button
                size="large"
                type="primary"
                :disabled="currentAttemptWeights[currentReadingIndex] === null"
                @click="nextReading"
                icon="el-icon-arrow-right"
              >
                {{ currentReadingIndex === 2 ? '完成称重' : '下一个' }}
              </el-button>
            </div>
          </div>

          <div class="attempts-history" v-if="previousAttempts.length > 0">
            <div class="section-header">
              <h3>
                <i class="el-icon-time"></i>
                称重历史
              </h3>
            </div>
            <div class="attempts-grid">
              <weighing-card
                v-for="(attempt, index) in previousAttempts"
                :key="attempt.id"
                :index="index"
                :weights="[attempt.weight_1, attempt.weight_2, attempt.weight_3]"
                :median="attempt.calculated_median"
                :deviation="attempt.deviation"
                :status="getAttemptStatus(attempt, index)"
                :time="attempt.created_at"
                :has-photo="hasPhotoForAttempt(index)"
                :threshold="MAX_DEVIATION_THRESHOLD"
              />
            </div>
          </div>
        </div>

        <div class="right-panel">
          <div class="current-result-card" v-if="currentMedian !== null">
            <div class="result-header">
              <span>当前称重结果</span>
            </div>
            <div class="result-display">
              <div class="result-row">
                <span class="result-label">中值</span>
                <span class="result-value mono-number primary">
                  {{ formatWeight(currentMedian) }} g
                </span>
              </div>
              <div class="result-row">
                <span class="result-label">偏差</span>
                <span class="result-value mono-number" :class="deviationLevelClass">
                  {{ formatWeight(currentDeviation) }} g
                </span>
              </div>
              <div class="result-row">
                <span class="result-label">状态</span>
                <el-tag :type="deviationTagType" size="medium">
                  {{ deviationStatusText }}
                </el-tag>
              </div>
            </div>
          </div>

          <photo-capture
            v-if="showPhotoCapture"
            title="复称拍照留档"
            :photos="sessionPhotos"
            :required="needsPhoto"
            :max-photos="5"
            :default-type="'reweigh'"
            @add="onPhotoAdd"
            @remove="onPhotoRemove"
            @clear="onPhotosClear"
          />

          <div class="submit-section">
            <el-alert
              v-if="submitMessage"
              :type="submitMessageType"
              :title="submitMessage"
              show-icon
              :closable="false"
              class="submit-alert"
            />

            <el-button
              size="large"
              type="primary"
              icon="el-icon-check"
              @click="submitAttempt"
              :disabled="!canSubmitAttempt"
              :loading="submitting"
              class="submit-btn"
            >
              {{ submitButtonText }}
            </el-button>

            <el-button
              size="large"
              type="warning"
              icon="el-icon-refresh"
              @click="startReweigh"
              v-if="canReweigh && showReweighButton"
              :disabled="submitting"
              class="reweigh-btn"
            >
              重新称重
            </el-button>
          </div>

          <div class="rules-reminder">
            <div class="reminder-title">
              <i class="el-icon-info"></i>
              合规规则
            </div>
            <ul>
              <li>三次称重取中值，偏差超过 {{ MAX_DEVIATION_THRESHOLD }}g 需复称</li>
              <li>复称最多 {{ MAX_REWEIGH_COUNT }} 次，仍超阈须启动封存流程</li>
              <li>复称流程必须拍照留档，每笔记录保存 {{ ARCHIVE_YEARS }} 年</li>
              <li>双人复核差异超过 {{ REVIEW_DIFF_THRESHOLD }}g 需重新复核</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <el-dialog
      v-if="currentSession"
      title="封存阅览流程"
      :visible.sync="sealDialogVisible"
      width="640px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="seal-dialog-content">
        <el-alert
          title="复称两次仍超阈值，必须启动封存阅览流程"
          type="error"
          show-icon
          :closable="false"
        />
        <div class="seal-reason">
          <p><strong>善本编号：</strong>{{ currentSession.rare_book_no }}</p>
          <p><strong>页码：</strong>第 {{ currentSession.page_no }} 页</p>
          <p><strong>最大偏差：</strong>{{ formatWeight(maxDeviation) }} g</p>
          <p><strong>复称次数：</strong>{{ reweighCount }} 次</p>
        </div>
        <el-form :model="sealForm" label-width="100px">
          <el-form-item label="封存原因">
            <el-input
              type="textarea"
              v-model="sealForm.reason"
              :rows="3"
              placeholder="请输入封存原因"
              maxlength="500"
              show-word-limit
            ></el-input>
          </el-form-item>
        </el-form>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button size="large" @click="goToSealProcess">
          启动封存流程
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import WheelNumberPicker from '~/components/weighing/WheelNumberPicker.vue'
import WeighingCard from '~/components/weighing/WeighingCard.vue'
import DeviationGauge from '~/components/weighing/DeviationGauge.vue'
import ProbeStatusCard from '~/components/weighing/ProbeStatusCard.vue'
import WeighingTrendChart from '~/components/weighing/WeighingTrendChart.vue'
import PhotoCapture from '~/components/weighing/PhotoCapture.vue'

import { formatWeight } from '~/utils/weighing'
import { BUSINESS_RULES, validatePhotoArchive } from '~/utils/validator'

export default {
  name: 'WeighingIndexPage',
  components: {
    WheelNumberPicker,
    WeighingCard,
    DeviationGauge,
    ProbeStatusCard,
    WeighingTrendChart,
    PhotoCapture
  },
  data: function() {
    return {
      starting: false,
      submitting: false,
      step: 1,
      currentReadingIndex: 0,
      startForm: {
        rareBookNo: '',
        pageNo: 1
      },
      startRules: {
        rareBookNo: [
          { required: true, message: '请输入善本编号', trigger: 'blur' },
          { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
        ],
        pageNo: [
          { required: true, message: '请输入页码', trigger: 'blur' },
          { type: 'number', min: 1, message: '页码必须大于 0', trigger: 'blur' }
        ]
      },
      humidityBound: false,
      boundHumidityTime: null,
      bindHint: '',
      submitMessage: '',
      submitMessageType: 'info',
      sealDialogVisible: false,
      sealForm: {
        reason: ''
      }
    }
  },
  computed: {
    MAX_DEVIATION_THRESHOLD: function() { return BUSINESS_RULES.MAX_DEVIATION_THRESHOLD },
    MAX_REWEIGH_COUNT: function() { return BUSINESS_RULES.MAX_REWEIGH_COUNT },
    REVIEW_DIFF_THRESHOLD: function() { return BUSINESS_RULES.REVIEW_DIFF_THRESHOLD },
    ARCHIVE_YEARS: function() { return BUSINESS_RULES.ARCHIVE_YEARS },

    currentSession: function() {
      return this.$store.getters['weighing/currentSession']
    },
    currentAttempt: function() {
      return this.$store.getters['weighing/currentAttempt']
    },
    currentAttemptWeights: function() {
      return this.currentAttempt ? this.currentAttempt.weights : [null, null, null]
    },
    currentAttemptIndex: function() {
      return this.currentSession ? this.currentSession.attempts.length : 0
    },
    previousAttempts: function() {
      return this.currentSession ? this.currentSession.attempts : []
    },
    currentMedian: function() {
      return this.$store.getters['weighing/currentMedian']
    },
    currentDeviation: function() {
      return this.$store.getters['weighing/currentDeviation']
    },
    deviationLevel: function() {
      return this.$store.getters['weighing/deviationLevel']
    },
    reweighCount: function() {
      return this.$store.getters['weighing/reweighCount']
    },
    canReweigh: function() {
      return this.$store.getters['weighing/canReweigh']
    },
    needsSeal: function() {
      return this.$store.getters['weighing/needsSeal']
    },
    sessionPhotos: function() {
      return this.currentSession ? this.currentSession.photos : []
    },
    currentTemperature: function() {
      return this.$store.getters['humidity/temperature']
    },
    currentHumidity: function() {
      return this.$store.getters['humidity/humidity']
    },
    isProbeOnline: function() {
      return this.$store.getters['humidity/isProbeOnline']
    },
    probeLocation: function() {
      return this.$store.getters['humidity/probeLocation']
    },
    probeId: function() {
      return this.$store.getters['humidity/currentReading'] 
        ? this.$store.getters['humidity/currentReading'].probe_id 
        : ''
    },
    completedReadings: function() {
      return this.currentAttemptWeights.filter(function(w) { return w !== null }).length
    },
    allReadingsComplete: function() {
      return this.completedReadings === 3
    },
    canSubmitAttempt: function() {
      return this.allReadingsComplete && 
             this.humidityBound && 
             !this.submitting
    },
    showReweighButton: function() {
      return this.currentDeviation !== null && 
             this.currentDeviation > this.MAX_DEVIATION_THRESHOLD &&
             this.reweighCount < this.MAX_REWEIGH_COUNT
    },
    showPhotoCapture: function() {
      return this.reweighCount > 0 || this.currentDeviation > this.MAX_DEVIATION_THRESHOLD
    },
    needsPhoto: function() {
      return this.reweighCount > 0
    },
    deviationLevelClass: function() {
      var level = this.deviationLevel
      var classMap = {
        safe: 'deviation-safe',
        warning: 'deviation-warning',
        danger: 'deviation-danger',
        unknown: ''
      }
      return classMap[level] || ''
    },
    deviationTagType: function() {
      var level = this.deviationLevel
      var typeMap = {
        safe: 'success',
        warning: 'warning',
        danger: 'danger',
        unknown: 'info'
      }
      return typeMap[level] || 'info'
    },
    deviationStatusText: function() {
      var level = this.deviationLevel
      var textMap = {
        safe: '偏差正常',
        warning: '接近阈值',
        danger: '偏差超限',
        unknown: '待称重'
      }
      return textMap[level] || ''
    },
    submitButtonText: function() {
      if (this.currentDeviation > this.MAX_DEVIATION_THRESHOLD) {
        if (this.reweighCount >= this.MAX_REWEIGH_COUNT) {
          return '提交并启动封存流程'
        }
        return '提交并进入复称'
      }
      return '提交并进入复核'
    },
    trendChartData: function() {
      return this.$store.getters['humidity/currentWeighingChartData'].data
    },
    trendChartLabels: function() {
      return this.$store.getters['humidity/currentWeighingChartData'].labels
    },
    maxDeviation: function() {
      if (!this.currentSession || !this.currentSession.attempts) return 0
      return Math.max.apply(null, this.currentSession.attempts.map(function(a) { return a.deviation }))
    }
  },
  mounted: function() {
    this.$store.dispatch('humidity/init')
  },
  beforeDestroy: function() {
    this.$store.dispatch('humidity/cleanup')
  },
  methods: {
    formatWeight: formatWeight,

    startSession: function() {
      var self = this
      this.$refs.startForm.validate(function(valid) {
        if (valid) {
          self.starting = true
          self.$store.dispatch('weighing/startSession', {
            rareBookNo: self.startForm.rareBookNo,
            pageNo: self.startForm.pageNo
          }).then(function(result) {
            self.starting = false
            if (result.success) {
              self.step = 1
              self.currentReadingIndex = 0
              self.humidityBound = false
              self.boundHumidityTime = null
              self.submitMessage = ''
              self.$message.success('称重会话已开始，请先绑定温湿度数据')
            } else {
              self.$message.error(result.message)
            }
          })
        }
      })
    },

    cancelSession: function() {
      var self = this
      this.$confirm('确定要取消当前称重会话吗？所有未保存数据将丢失。', '确认取消', {
        confirmButtonText: '确定取消',
        cancelButtonText: '继续称重',
        type: 'warning'
      }).then(function() {
        self.$store.dispatch('weighing/clearSession')
        self.step = 1
        self.currentReadingIndex = 0
        self.humidityBound = false
        self.boundHumidityTime = null
        self.submitMessage = ''
        self.startForm = { rareBookNo: '', pageNo: 1 }
        self.$message.info('已取消称重会话')
      }).catch(function() {})
    },

    refreshProbe: function() {
      this.$store.dispatch('humidity/refreshReading')
    },

    bindHumidity: function() {
      var self = this
      this.$store.dispatch('weighing/bindHumidityData').then(function(result) {
        if (result.success) {
          self.humidityBound = true
          self.boundHumidityTime = result.data.measured_at
          self.step = 2
          self.submitMessage = '温湿度数据已绑定，请开始称重'
          self.submitMessageType = 'success'
          
          if (result.warning) {
            self.bindHint = result.warning
            self.$message.warning(result.warning)
          } else {
            self.$message.success('温湿度数据绑定成功')
          }
        } else {
          self.$message.error(result.message)
        }
      })
    },

    setReadingIndex: function(index) {
      this.currentReadingIndex = index
    },

    prevReading: function() {
      if (this.currentReadingIndex > 0) {
        this.currentReadingIndex--
      }
    },

    nextReading: function() {
      if (this.currentReadingIndex < 2) {
        this.currentReadingIndex++
      } else {
        this.$message.success('三次称重已完成，请确认后提交')
      }
    },

    onWeightInput: function(value) {
      this.$store.dispatch('weighing/setWeightValue', {
        index: this.currentReadingIndex,
        value: value
      })
    },

    onWeightConfirm: function(value) {
      this.onWeightInput(value)
      if (this.currentReadingIndex < 2) {
        this.currentReadingIndex++
      }
    },

    getAttemptStatus: function(attempt, index) {
      if (attempt.deviation > this.MAX_DEVIATION_THRESHOLD) {
        if (index < this.previousAttempts.length - 1) {
          return 'invalid'
        }
        return 'reweigh'
      }
      return 'valid'
    },

    hasPhotoForAttempt: function(index) {
      return this.sessionPhotos.length > index
    },

    startReweigh: function() {
      var self = this
      
      var photoValidation = validatePhotoArchive(this.sessionPhotos)
      if (!photoValidation.valid) {
        this.$message.warning(photoValidation.message)
        return
      }

      this.$confirm('确定要开始复称吗？将保留当前称重记录。', '确认复称', {
        confirmButtonText: '开始复称',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function() {
        self.$store.dispatch('weighing/resetAttempt')
        self.currentReadingIndex = 0
        self.humidityBound = false
        self.boundHumidityTime = null
        self.step = 1
        self.submitMessage = ''
        self.$message.info('请先绑定温湿度数据，然后开始复称')
      }).catch(function() {})
    },

    submitAttempt: function() {
      var self = this

      if (this.needsPhoto) {
        var photoValidation = validatePhotoArchive(this.sessionPhotos)
        if (!photoValidation.valid) {
          this.$message.warning(photoValidation.message)
          return
        }
      }

      this.submitting = true
      this.submitMessage = ''

      this.$store.dispatch('weighing/submitCurrentAttempt').then(function(result) {
        self.submitting = false
        
        if (!result.success) {
          self.submitMessage = result.message
          self.submitMessageType = 'error'
          self.$message.error(result.message)
          return
        }

        if (result.action === 'seal') {
          self.submitMessage = result.message
          self.submitMessageType = 'error'
          self.sealDialogVisible = true
          return
        }

        if (result.action === 'reweigh') {
          self.submitMessage = result.message
          self.submitMessageType = 'warning'
          
          setTimeout(function() {
            self.$store.dispatch('weighing/resetAttempt')
            self.currentReadingIndex = 0
            self.humidityBound = false
            self.boundHumidityTime = null
            self.step = 1
            self.$message.warning(result.message)
          }, 1500)
          return
        }

        if (result.action === 'review') {
          self.submitMessage = result.message
          self.submitMessageType = 'success'
          
          self.$store.dispatch('weighing/saveCompleteRecord', {}).then(function(saveResult) {
            if (saveResult.success) {
              self.step = 3
              
              setTimeout(function() {
                if (saveResult.record.work_order) {
                  self.$message.success('称重完成，已自动生成脱酸工单，正在进入复核流程...')
                } else {
                  self.$message.success('称重完成，正在进入复核流程...')
                }
                self.$router.push({
                  path: '/review',
                  query: { recordId: saveResult.record.id }
                })
              }, 1000)
            }
          })
        }
      })
    },

    onPhotoAdd: function(photo) {
      this.$store.dispatch('weighing/addPhoto', photo)
    },

    onPhotoRemove: function(index) {
      if (this.currentSession) {
        this.currentSession.photos.splice(index, 1)
      }
    },

    onPhotosClear: function() {
      if (this.currentSession) {
        this.currentSession.photos = []
      }
    },

    goToHistory: function() {
      this.$router.push('/history')
    },

    goToReview: function() {
      this.$router.push('/review')
    },

    goToSealProcess: function() {
      var self = this
      this.$store.dispatch('weighing/startSealProcess', {
        recordId: this.currentSession.rare_book_no + '-' + Date.now(),
        reason: this.sealForm.reason || '复称两次仍超阈值'
      }).then(function(result) {
        if (result.success) {
          self.sealDialogVisible = false
          self.$router.push({
            path: '/seal',
            query: { processId: result.process.id }
          })
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.weighing-page {
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

.session-start {
  max-width: 500px;
  margin: 0 auto;
  padding: 0 $space-xl;

  .start-card {
    .card-header {
      font-family: $font-family-display;
      font-size: $font-size-lg;
      font-weight: 600;
      color: $color-primary;
    }

    .el-form-item {
      margin-bottom: $space-xl;
    }

    .el-input, .el-input-number {
      height: 48px;
    }
  }
}

.workspace-header {
  @include flex-between;
  padding: 0 $space-xxl $space-xl;

  .session-info {
    display: flex;
    gap: $space-md;
    flex-wrap: wrap;

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

.workspace-body {
  display: grid;
  grid-template-columns: 320px 1fr 340px;
  gap: $space-xl;
  padding: 0 $space-xxl $space-xxl;
}

.left-panel, .right-panel {
  display: flex;
  flex-direction: column;
  gap: $space-lg;
}

.center-panel {
  display: flex;
  flex-direction: column;
  gap: $space-lg;
}

.step-indicator {
  @include card;
  padding: $space-lg;
  display: flex;
  align-items: center;
  justify-content: center;

  .step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $space-xs;

    .step-icon {
      @include flex-center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: $color-bg-dark;
      color: $color-text-muted;
      font-weight: 700;
      font-size: $font-size-md;
      transition: all $transition-fast;
    }

    .step-label {
      font-size: $font-size-xs;
      color: $color-text-muted;
    }

    &.active .step-icon {
      background: $color-primary;
      color: #fff;
    }

    &.active .step-label {
      color: $color-primary;
      font-weight: 500;
    }

    &.completed .step-icon {
      background: $color-success;
      color: #fff;
    }

    &.completed .step-label {
      color: $color-success;
    }
  }

  .step-line {
    flex: 1;
    height: 2px;
    background: $color-bg-dark;
    margin: 0 $space-sm;
    max-width: 60px;
    margin-bottom: 20px;
  }
}

.weighing-input-section {
  @include card;
  padding: $space-xl;

  .section-header {
    @include flex-between;
    margin-bottom: $space-lg;

    h3 {
      display: flex;
      align-items: center;
      gap: $space-sm;
      font-family: $font-family-display;
      font-size: $font-size-lg;
      font-weight: 600;
      color: $color-primary;
      margin: 0;

      i {
        font-size: $font-size-xl;
      }
    }

    .reading-progress {
      font-family: $font-family-mono;
      font-size: $font-size-md;
      font-weight: 600;
      color: $color-text-secondary;
      background: $color-bg;
      padding: $space-xs $space-md;
      border-radius: $radius-sm;
    }
  }
}

.reading-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-md;
  margin-bottom: $space-xl;

  .tab {
    @include flex-center;
    flex-direction: column;
    gap: $space-xs;
    padding: $space-md;
    background: $color-bg;
    border: 2px solid $color-bg-dark;
    border-radius: $radius-md;
    cursor: pointer;
    transition: all $transition-fast;
    min-height: 80px;

    .tab-number {
      @include flex-center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: $color-text-muted;
      color: #fff;
      font-weight: 700;
      font-size: $font-size-sm;
    }

    .tab-label {
      font-size: $font-size-sm;
      color: $color-text-secondary;
    }

    .tab-value {
      font-family: $font-family-mono;
      font-size: $font-size-md;
      font-weight: 600;
      color: $color-primary;
      font-variant-numeric: tabular-nums;
    }

    &:hover {
      border-color: $color-primary;
    }

    &.active {
      border-color: $color-primary;
      background: rgba(74, 55, 40, 0.05);

      .tab-number {
        background: $color-primary;
      }
    }

    &.completed {
      .tab-number {
        background: $color-success;
      }
    }
  }
}

.reading-navigation {
  display: flex;
  gap: $space-md;
  justify-content: space-between;
  margin-top: $space-xl;

  .el-button {
    flex: 1;
    height: 52px;
    font-size: $font-size-md;
  }
}

.attempts-history {
  .section-header {
    margin-bottom: $space-md;

    h3 {
      display: flex;
      align-items: center;
      gap: $space-sm;
      font-family: $font-family-display;
      font-size: $font-size-lg;
      font-weight: 600;
      color: $color-primary;
      margin: 0;

      i {
        font-size: $font-size-xl;
      }
    }
  }

  .attempts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: $space-md;
  }
}

.current-result-card {
  @include card;
  padding: $space-lg;

  .result-header {
    font-family: $font-family-display;
    font-size: $font-size-md;
    font-weight: 600;
    color: $color-primary;
    margin-bottom: $space-md;
    padding-bottom: $space-sm;
    border-bottom: 1px solid $color-bg-dark;
  }

  .result-display {
    .result-row {
      @include flex-between;
      padding: $space-sm 0;
      border-bottom: 1px dashed $color-bg-dark;

      &:last-child {
        border-bottom: none;
      }

      .result-label {
        font-size: $font-size-sm;
        color: $color-text-secondary;
      }

      .result-value {
        font-family: $font-family-mono;
        font-size: $font-size-xl;
        font-weight: 700;
        font-variant-numeric: tabular-nums;

        &.primary {
          color: $color-primary;
          font-size: $font-size-2xl;
        }

        &.deviation-safe { color: $color-success; }
        &.deviation-warning { color: $color-warning; }
        &.deviation-danger { color: $color-danger; }
      }
    }
  }
}

.submit-section {
  .submit-alert {
    margin-bottom: $space-md;
  }

  .submit-btn, .reweigh-btn {
    width: 100%;
    height: 56px;
    font-size: $font-size-lg;
    margin-bottom: $space-md;
  }
}

.rules-reminder {
  @include card;
  padding: $space-lg;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.05) 0%, rgba(64, 158, 255, 0.02) 100%);

  .reminder-title {
    display: flex;
    align-items: center;
    gap: $space-xs;
    font-weight: 600;
    color: $color-info;
    margin-bottom: $space-md;
  }

  ul {
    margin: 0;
    padding-left: $space-lg;

    li {
      font-size: $font-size-xs;
      color: $color-text-secondary;
      margin-bottom: $space-xs;
      line-height: 1.6;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

.seal-dialog-content {
  .seal-reason {
    padding: $space-lg;
    background: $color-bg;
    border-radius: $radius-md;
    margin: $space-lg 0;

    p {
      margin: $space-sm 0;
      font-size: $font-size-md;
      color: $color-text-primary;

      strong {
        color: $color-text-secondary;
        font-weight: 500;
        margin-right: $space-xs;
      }
    }
  }

  .dialog-footer {
    .el-button {
      min-width: 160px;
      height: 48px;
      font-size: $font-size-md;
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

  .workspace-header {
    flex-direction: column;
    gap: $space-md;
    padding: 0 $space-lg $space-lg;
    align-items: flex-start;
  }

  .workspace-body {
    grid-template-columns: 1fr;
    padding: 0 $space-lg $space-lg;
  }

  .step-indicator {
    .step-line {
      max-width: 30px;
    }
  }

  .reading-tabs {
    grid-template-columns: 1fr;
  }
}
</style>
