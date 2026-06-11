<template>
  <div class="seal-page">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <i class="el-icon-lock"></i>
          封存阅览流程
        </h1>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>封存流程</el-breadcrumb-item>
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
      <div class="process-flow" v-if="sealProcess">
        <el-steps :active="currentStep" finish-status="success" class="seal-steps">
          <el-step title="启动封存" icon="el-icon-lock" />
          <el-step title="主管审批" icon="el-icon-user" />
          <el-step title="封存登记" icon="el-icon-document-checked" />
          <el-step title="完成" icon="el-icon-circle-check" />
        </el-steps>

        <div class="process-content">
          <el-card v-if="currentStep === 0" class="step-card">
            <div slot="header" class="card-header">
              <span><i class="el-icon-warning"></i> 封存原因确认</span>
            </div>
            <el-alert
              title="复称两次仍超阈值，根据合规要求必须启动封存阅览流程"
              type="error"
              show-icon
              :closable="false"
            />
            <div class="record-info">
              <div class="info-row">
                <span class="info-label">善本编号</span>
                <span class="info-value mono-number">{{ sealProcess.record_id }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">启动人</span>
                <span class="info-value">{{ sealProcess.initiator_name }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">启动时间</span>
                <span class="info-value mono-number">{{ formatTime(sealProcess.initiated_at) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">封存原因</span>
                <span class="info-value">{{ sealProcess.reason }}</span>
              </div>
            </div>
            <div class="step-actions">
              <el-button
                type="primary"
                size="large"
                icon="el-icon-arrow-right"
                @click="goToApproval"
              >
                提交审批
              </el-button>
            </div>
          </el-card>

          <el-card v-if="currentStep === 1" class="step-card">
            <div slot="header" class="card-header">
              <span><i class="el-icon-user"></i> 主管审批</span>
            </div>
            <el-form :model="approvalForm" :rules="approvalRules" ref="approvalForm" label-width="100px">
              <el-form-item label="审批意见" prop="opinion">
                <el-input
                  type="textarea"
                  v-model="approvalForm.opinion"
                  :rows="4"
                  placeholder="请输入审批意见"
                  maxlength="500"
                  show-word-limit
                ></el-input>
              </el-form-item>
              <el-form-item label="审批结果" prop="result">
                <el-radio-group v-model="approvalForm.result" size="large">
                  <el-radio-button label="approve">
                    <i class="el-icon-check"></i> 同意封存
                  </el-radio-button>
                  <el-radio-button label="reject">
                    <i class="el-icon-close"></i> 驳回
                  </el-radio-button>
                </el-radio-group>
              </el-form-item>
            </el-form>
            <div class="step-actions">
              <el-button
                size="large"
                @click="prevStep"
                icon="el-icon-arrow-left"
              >
                上一步
              </el-button>
              <el-button
                type="primary"
                size="large"
                @click="submitApproval"
                :loading="submitting"
                icon="el-icon-check"
              >
                确认审批
              </el-button>
            </div>
          </el-card>

          <el-card v-if="currentStep === 2" class="step-card">
            <div slot="header" class="card-header">
              <span><i class="el-icon-document-checked"></i> 封存登记</span>
            </div>
            <el-alert
              v-if="sealProcess.status === 'approved'"
              title="审批已通过，请完成封存登记"
              type="success"
              show-icon
              :closable="false"
            />
            <el-alert
              v-else
              title="审批已驳回，封存流程终止"
              type="warning"
              show-icon
              :closable="false"
            />
            <div class="approval-info" v-if="sealProcess.approver_name">
              <div class="info-row">
                <span class="info-label">审批人</span>
                <span class="info-value">{{ sealProcess.approver_name }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">审批时间</span>
                <span class="info-value mono-number">{{ formatTime(sealProcess.approved_at) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">审批意见</span>
                <span class="info-value">{{ sealProcess.approval_opinion }}</span>
              </div>
            </div>
            <div class="step-actions" v-if="sealProcess.status === 'approved'">
              <el-button
                size="large"
                @click="prevStep"
                icon="el-icon-arrow-left"
              >
                上一步
              </el-button>
              <el-button
                type="primary"
                size="large"
                @click="completeSeal"
                icon="el-icon-circle-check"
              >
                完成封存
              </el-button>
            </div>
            <div class="step-actions" v-else>
              <el-button
                type="primary"
                size="large"
                @click="terminateProcess"
                icon="el-icon-close"
              >
                终止流程
              </el-button>
            </div>
          </el-card>

          <el-card v-if="currentStep === 3" class="step-card success-card">
            <div class="success-content">
              <div class="success-icon">
                <i class="el-icon-circle-check"></i>
              </div>
              <h2>封存流程已完成</h2>
              <p>该善本已进入封存阅览状态，如需查阅需经特别审批。</p>
              <div class="result-info">
                <div class="info-row">
                  <span class="info-label">封存编号</span>
                  <span class="info-value mono-number">{{ sealProcess.id }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">完成时间</span>
                  <span class="info-value mono-number">{{ formatTime(sealProcess.approved_at) }}</span>
                </div>
              </div>
              <div class="success-actions">
                <el-button
                  size="large"
                  @click="goToHistory"
                  icon="el-icon-document"
                >
                  查看历史记录
                </el-button>
                <el-button
                  type="primary"
                  size="large"
                  @click="goToWeighing"
                  icon="el-icon-balance-scale"
                >
                  返回称重作业
                </el-button>
              </div>
            </div>
          </el-card>
        </div>
      </div>

      <div class="no-process" v-else>
        <el-card>
          <el-empty
            description="暂无进行中的封存流程"
            :image-size="120"
          >
            <el-button type="primary" @click="goToWeighing">前往称重作业</el-button>
          </el-empty>
        </el-card>

        <el-card class="sealed-list" v-if="sealedRecords.length > 0" style="margin-top: $space-xl;">
          <div slot="header" class="card-header">
            <span><i class="el-icon-lock"></i> 已封存记录</span>
            <el-tag type="danger" size="small">{{ sealedRecords.length }} 条</el-tag>
          </div>
          <el-table :data="sealedRecords" style="width: 100%">
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
            <el-table-column prop="max_deviation" label="最大偏差(g)" width="140">
              <template slot-scope="scope">
                <span class="mono-number text-danger">{{ formatWeight(scope.row.max_deviation) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="封存时间" width="180">
              <template slot-scope="scope">
                <span class="mono-number" v-if="scope.row.seal_process">
                  {{ formatTime(scope.row.seal_process.approved_at) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="封存人" width="120">
              <template slot-scope="scope">
                <span v-if="scope.row.seal_process">
                  {{ scope.row.seal_process.approver_name }}
                </span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script>
import { formatWeight } from '~/utils/weighing'
import { formatWeighingTime } from '~/utils/dayjs'

export default {
  name: 'SealIndexPage',
  data: function() {
    return {
      currentStep: 0,
      submitting: false,
      approvalForm: {
        opinion: '',
        result: 'approve'
      },
      approvalRules: {
        opinion: [
          { required: true, message: '请输入审批意见', trigger: 'blur' },
          { min: 5, message: '审批意见至少5个字符', trigger: 'blur' }
        ],
        result: [
          { required: true, message: '请选择审批结果', trigger: 'change' }
        ]
      }
    }
  },
  computed: {
    sealProcess: function() {
      return this.$store.getters['weighing/activeSealProcess']
    },
    sealedRecords: function() {
      return this.$store.getters['weighing/sealedRecords']
    }
  },
  mounted: function() {
    this.$store.dispatch('weighing/init')
    
    var processId = this.$route.query.processId
    if (processId && this.sealProcess && this.sealProcess.id === processId) {
      this.currentStep = 1
    }
  },
  methods: {
    formatWeight: formatWeight,
    formatTime: formatWeighingTime,

    goToApproval: function() {
      this.currentStep = 1
    },

    prevStep: function() {
      if (this.currentStep > 0) {
        this.currentStep--
      }
    },

    submitApproval: function() {
      var self = this
      this.$refs.approvalForm.validate(function(valid) {
        if (valid) {
          self.submitting = true
          
          var action = self.approvalForm.result === 'approve' ? 'approveSeal' : 'rejectSeal'
          
          self.$store.dispatch('weighing/' + action, {
            processId: self.sealProcess.id,
            opinion: self.approvalForm.opinion
          }).then(function(result) {
            self.submitting = false
            if (result.success) {
              self.currentStep = 2
              if (self.approvalForm.result === 'approve') {
                self.$message.success('审批通过')
              } else {
                self.$message.warning('审批已驳回')
              }
            } else {
              self.$message.error(result.message)
            }
          })
        }
      })
    },

    completeSeal: function() {
      var self = this
      this.$confirm('确认完成封存？该操作不可撤销。', '确认封存', {
        confirmButtonText: '确认封存',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function() {
        self.currentStep = 3
        self.$message.success('封存流程已完成')
      }).catch(function() {})
    },

    terminateProcess: function() {
      var self = this
      this.$confirm('确认终止封存流程？', '确认终止', {
        confirmButtonText: '确认终止',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function() {
        self.$store.dispatch('weighing/clearSession')
        self.$router.push('/weighing')
        self.$message.info('封存流程已终止')
      }).catch(function() {})
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
.seal-page {
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
      color: $color-danger;
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

.seal-steps {
  background: $color-surface;
  padding: $space-xl;
  border-radius: $radius-lg;
  margin-bottom: $space-xl;

  >>> .el-step__title {
    font-size: $font-size-md;
    font-weight: 500;
  }
}

.step-card {
  max-width: 700px;
  margin: 0 auto;

  .card-header {
    font-family: $font-family-display;
    font-size: $font-size-lg;
    font-weight: 600;
    color: $color-primary;
  }

  .el-alert {
    margin-bottom: $space-xl;
  }

  .record-info, .approval-info {
    background: $color-bg;
    padding: $space-lg;
    border-radius: $radius-md;
    margin-bottom: $space-xl;

    .info-row {
      @include flex-between;
      padding: $space-sm 0;
      border-bottom: 1px dashed $color-bg-dark;

      &:last-child {
        border-bottom: none;
      }

      .info-label {
        font-size: $font-size-sm;
        color: $color-text-secondary;
      }

      .info-value {
        font-size: $font-size-md;
        font-weight: 500;
        color: $color-text-primary;
        text-align: right;
        max-width: 60%;
        word-break: break-all;
      }
    }
  }

  .step-actions {
    display: flex;
    justify-content: flex-end;
    gap: $space-md;

    .el-button {
      min-width: 140px;
      height: 48px;
      font-size: $font-size-md;
    }
  }
}

.success-card {
  text-align: center;
  border: 2px solid $color-success;

  .success-content {
    padding: $space-xxl;

    .success-icon {
      font-size: 80px;
      color: $color-success;
      margin-bottom: $space-lg;

      i {
        animation: pulse-success 2s infinite;
      }
    }

    h2 {
      font-family: $font-family-display;
      font-size: $font-size-2xl;
      font-weight: 700;
      color: $color-success;
      margin: 0 0 $space-md 0;
    }

    p {
      font-size: $font-size-md;
      color: $color-text-secondary;
      margin-bottom: $space-xl;
    }

    .result-info {
      background: $color-bg;
      padding: $space-lg;
      border-radius: $radius-md;
      margin-bottom: $space-xl;
      text-align: left;

      .info-row {
        @include flex-between;
        padding: $space-sm 0;

        .info-label {
          font-size: $font-size-sm;
          color: $color-text-secondary;
        }

        .info-value {
          font-family: $font-family-mono;
          font-size: $font-size-md;
          font-weight: 500;
          color: $color-text-primary;
        }
      }
    }

    .success-actions {
      display: flex;
      justify-content: center;
      gap: $space-md;

      .el-button {
        min-width: 160px;
        height: 48px;
        font-size: $font-size-md;
      }
    }
  }
}

.no-process {
  max-width: 900px;
  margin: 0 auto;

  .sealed-list {
    .card-header {
      @include flex-between;
      font-family: $font-family-display;
      font-size: $font-size-lg;
      font-weight: 600;
      color: $color-primary;
    }

    .text-danger {
      color: $color-danger;
    }
  }
}

@keyframes pulse-success {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
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

  .seal-steps {
    padding: $space-lg;
    margin-bottom: $space-lg;

    >>> .el-step__title {
      font-size: $font-size-xs;
    }
  }

  .step-actions {
    flex-direction: column;

    .el-button {
      width: 100%;
    }
  }

  .success-actions {
    flex-direction: column;

    .el-button {
      width: 100%;
    }
  }
}
</style>
