<template>
  <div class="home-page">
    <div class="welcome-section">
      <div class="welcome-text">
        <h1 class="welcome-title">善本毛毡称重台</h1>
        <p class="welcome-desc">高精度纸张湿度测量系统 · 毛毡垫称重法</p>
        <p class="welcome-rule">三次称重取中值 · 偏差超0.3g强制复称 · 双人复核 · 记录保存≥30年</p>
      </div>
      <div class="welcome-actions">
        <el-button
          type="primary"
          size="large"
          icon="el-icon-s-platform"
          class="action-btn"
          @click="goToWeighing"
        >
          开始称重作业
        </el-button>
        <el-button
          size="large"
          icon="el-icon-s-check"
          class="action-btn"
          @click="goToReview"
          v-if="hasPermission('review')"
        >
          双人复核
        </el-button>
      </div>
    </div>

    <el-row :gutter="24" class="stats-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon"><i class="el-icon-s-data"></i></div>
          <div class="stat-value">{{ stats.totalRecords }}</div>
          <div class="stat-label">今日称重</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card warning">
          <div class="stat-icon"><i class="el-icon-warning"></i></div>
          <div class="stat-value">{{ stats.pendingReview }}</div>
          <div class="stat-label">待复核</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card danger">
          <div class="stat-icon"><i class="el-icon-lock"></i></div>
          <div class="stat-value">{{ stats.sealedCount }}</div>
          <div class="stat-label">已封存</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card info">
          <div class="stat-icon"><i class="el-icon-s-claim"></i></div>
          <div class="stat-value">{{ stats.workOrders }}</div>
          <div class="stat-label">脱酸工单</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="24" class="main-row">
      <el-col :span="14">
        <el-card class="trend-card">
          <div slot="header" class="card-header">
            <span><i class="el-icon-data-line"></i> 7日称重趋势</span>
            <el-radio-group v-model="trendType" size="small">
              <el-radio-button label="weight">称重值</el-radio-button>
              <el-radio-button label="humidity">温湿度</el-radio-button>
            </el-radio-group>
          </div>
          <WeighingTrendChart
            v-if="trendType === 'weight'"
            :data="weightChartData.data"
            :labels="weightChartData.labels"
            :height="280"
          />
          <HumidityTrendChart
            v-else
            :temperature-data="humidityChartData.temperature"
            :humidity-data="humidityChartData.humidity"
            :labels="humidityChartData.labels"
            :height="280"
          />
        </el-card>

        <el-card class="probe-card">
          <div slot="header" class="card-header">
            <span><i class="el-icon-aim"></i> 库房探针实时状态</span>
            <el-button
              size="small"
              icon="el-icon-refresh"
              @click="refreshProbe"
            >
              刷新
            </el-button>
          </div>
          <ProbeStatusCard :compact="false" />
        </el-card>
      </el-col>

      <el-col :span="10">
        <el-card class="quick-card">
          <div slot="header" class="card-header">
            <span><i class="el-icon-s-operation"></i> 快捷操作</span>
          </div>
          <div class="quick-actions">
            <div class="quick-item" @click="goToWeighing">
              <div class="quick-icon primary"><i class="el-icon-s-platform"></i></div>
              <div class="quick-text">
                <div class="quick-title">毛毡称重</div>
                <div class="quick-desc">开始新的称重作业</div>
              </div>
              <i class="el-icon-arrow-right"></i>
            </div>
            <div class="quick-item" @click="goToReview" v-if="hasPermission('review')">
              <div class="quick-icon success"><i class="el-icon-s-check"></i></div>
              <div class="quick-text">
                <div class="quick-title">双人复核</div>
                <div class="quick-desc">待复核 {{ stats.pendingReview }} 条</div>
              </div>
              <i class="el-icon-arrow-right"></i>
            </div>
            <div class="quick-item" @click="goToSeal" v-if="hasPermission('seal')">
              <div class="quick-icon danger"><i class="el-icon-lock"></i></div>
              <div class="quick-text">
                <div class="quick-title">封存流程</div>
                <div class="quick-desc">异常善本封存审批</div>
              </div>
              <i class="el-icon-arrow-right"></i>
            </div>
            <div class="quick-item" @click="goToHistory">
              <div class="quick-icon info"><i class="el-icon-document"></i></div>
              <div class="quick-text">
                <div class="quick-title">历史记录</div>
                <div class="quick-desc">查询与导出</div>
              </div>
              <i class="el-icon-arrow-right"></i>
            </div>
            <div class="quick-item" @click="goToWorkOrders" v-if="hasPermission('seal')">
              <div class="quick-icon warning"><i class="el-icon-s-claim"></i></div>
              <div class="quick-text">
                <div class="quick-title">脱酸工单</div>
                <div class="quick-desc">异常页脱酸处理</div>
              </div>
              <i class="el-icon-arrow-right"></i>
            </div>
          </div>
        </el-card>

        <el-card class="compliance-card">
          <div slot="header" class="card-header">
            <span><i class="el-icon-s-flag"></i> 合规提示</span>
          </div>
          <div class="compliance-list">
            <div class="compliance-item">
              <i class="el-icon-check"></i>
              三次称重取中值，偏差超0.3g强制复称
            </div>
            <div class="compliance-item">
              <i class="el-icon-check"></i>
              复称两次仍超阈值启动封存阅览流程
            </div>
            <div class="compliance-item">
              <i class="el-icon-check"></i>
              双人复核差异超0.1g需重新复核
            </div>
            <div class="compliance-item">
              <i class="el-icon-check"></i>
              称重记录保存期限不少于30年
            </div>
            <div class="compliance-item danger">
              <i class="el-icon-warning"></i>
              所有数据不可篡改，SHA-256哈希链保护
            </div>
          </div>
        </el-card>

        <el-card class="recent-card">
          <div slot="header" class="card-header">
            <span><i class="el-icon-time"></i> 最近称重</span>
            <el-button type="text" size="small" @click="goToHistory">
              查看全部
            </el-button>
          </div>
          <div class="recent-list" v-if="recentRecords.length > 0">
            <div
              v-for="record in recentRecords.slice(0, 5)"
              :key="record.id"
              class="recent-item"
              @click="viewRecord(record)"
            >
              <div class="recent-left">
                <span class="recent-book">{{ record.rare_book_no }}</span>
                <span class="recent-page">第{{ record.page_no }}页</span>
              </div>
              <div class="recent-right">
                <span class="mono-number">{{ formatWeight(record.median_value) }}g</span>
                <el-tag
                  size="mini"
                  :type="getStatusType(record.status)"
                >
                  {{ getStatusText(record.status) }}
                </el-tag>
              </div>
            </div>
          </div>
          <div class="empty-tip" v-else>
            <i class="el-icon-document"></i>
            <p>暂无称重记录</p>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import WeighingTrendChart from '~/components/weighing/WeighingTrendChart.vue'
import HumidityTrendChart from '~/components/weighing/HumidityTrendChart.vue'
import ProbeStatusCard from '~/components/weighing/ProbeStatusCard.vue'
import { formatWeight } from '~/utils/weighing'
import { formatWeighingTime } from '~/utils/dayjs'

export default {
  name: 'HomePage',
  components: {
    WeighingTrendChart,
    HumidityTrendChart,
    ProbeStatusCard
  },
  data: function() {
    return {
      trendType: 'weight'
    }
  },
  computed: {
    currentUser: function() {
      return this.$store.getters['user/currentUser']
    },
    recentRecords: function() {
      return this.$store.getters['weighing/recentRecords']
    },
    weightChartData: function() {
      return this.$store.getters['humidity/currentWeighingChartData']
    },
    humidityChartData: function() {
      return this.$store.getters['humidity/chartData7Days']
    },
    stats: function() {
      var records = this.$store.getters['weighing/records']
      var today = new Date().toISOString().slice(0, 10)
      var todayRecords = records.filter(function(r) {
        return r.created_at && r.created_at.slice(0, 10) === today
      })
      var pendingReview = records.filter(function(r) {
        return r.status === 'pending' || (r.status !== 'reviewed' && !r.review_record)
      })
      var sealedCount = records.filter(function(r) { return r.status === 'sealed' })
      var workOrders = records.filter(function(r) { return r.work_order })

      return {
        totalRecords: todayRecords.length,
        pendingReview: pendingReview.length,
        sealedCount: sealedCount.length,
        workOrders: workOrders.length
      }
    }
  },
  mounted: function() {
    this.$store.dispatch('weighing/init')
    this.$store.dispatch('humidity/init')
  },
  methods: {
    formatWeight: formatWeight,
    formatTime: formatWeighingTime,

    hasPermission: function(permission) {
      return this.$store.getters['user/hasPermission'](permission)
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
        normal: '正常',
        pending: '待复核',
        reviewed: '已复核',
        sealed: '已封存'
      }
      return textMap[status] || status
    },

    refreshProbe: function() {
      this.$humidityProbe.refresh().then(function() {
        this.$message.success('探针数据已刷新')
      }.bind(this))
    },

    viewRecord: function(record) {
      this.$router.push('/history')
    },

    goToWeighing: function() {
      this.$router.push('/weighing')
    },
    goToReview: function() {
      this.$router.push('/review')
    },
    goToSeal: function() {
      this.$router.push('/seal')
    },
    goToHistory: function() {
      this.$router.push('/history')
    },
    goToWorkOrders: function() {
      this.$router.push('/workorder')
    }
  }
}
</script>

<style lang="scss" scoped>
.home-page {
  padding: $space-lg;
}

.welcome-section {
  @include flex-between;
  background: linear-gradient(135deg, $color-primary, $color-primary-light);
  border-radius: $radius-xl;
  padding: $space-2xl $space-2xl;
  margin-bottom: $space-xl;
  color: #fff;
}

.welcome-text {
  .welcome-title {
    font-family: $font-family-display;
    font-size: $font-size-2xl;
    color: #fff;
    margin: 0 0 $space-sm 0;
  }

  .welcome-desc {
    font-size: $font-size-md;
    opacity: 0.85;
    margin: 0 0 $space-xs 0;
  }

  .welcome-rule {
    font-size: $font-size-sm;
    opacity: 0.65;
    margin: 0;
  }
}

.welcome-actions {
  display: flex;
  gap: $space-md;

  .action-btn {
    min-height: 56px;
    min-width: 140px;
    font-size: $font-size-md;
    font-weight: 600;
    border-radius: $radius-md;
  }
}

.stats-row {
  margin-bottom: $space-xl;

  .stat-card {
    @include card;
    padding: $space-xl;
    text-align: center;
    transition: transform $transition-fast;

    &:hover {
      transform: translateY(-2px);
    }

    .stat-icon {
      font-size: 28px;
      color: $color-primary;
      margin-bottom: $space-sm;
    }

    .stat-value {
      font-family: $font-family-mono;
      font-size: $font-size-2xl;
      font-weight: 700;
      color: $color-text-primary;
      margin-bottom: $space-xs;
    }

    .stat-label {
      font-size: $font-size-sm;
      color: $color-text-secondary;
    }

    &.warning .stat-icon { color: $color-warning; }
    &.danger .stat-icon { color: $color-danger; }
    &.info .stat-icon { color: $color-info; }
  }
}

.main-row {
  .card-header {
    @include flex-between;
    font-family: $font-family-display;
    font-weight: 600;
  }
}

.trend-card {
  margin-bottom: $space-lg;
}

.probe-card {
  margin-bottom: $space-lg;
}

.quick-card {
  margin-bottom: $space-lg;

  .quick-actions {
    display: flex;
    flex-direction: column;
    gap: $space-sm;
  }

  .quick-item {
    display: flex;
    align-items: center;
    gap: $space-md;
    padding: $space-md;
    border-radius: $radius-md;
    cursor: pointer;
    transition: background $transition-fast;

    &:hover {
      background: $color-bg;
    }

    .quick-icon {
      @include flex-center;
      width: 48px;
      height: 48px;
      border-radius: $radius-md;
      font-size: 24px;
      color: #fff;

      &.primary { background: $color-primary; }
      &.success { background: $color-success; }
      &.danger { background: $color-danger; }
      &.info { background: $color-info; }
      &.warning { background: $color-warning; }
    }

    .quick-text {
      flex: 1;

      .quick-title {
        font-weight: 600;
        color: $color-text-primary;
      }

      .quick-desc {
        font-size: $font-size-sm;
        color: $color-text-muted;
      }
    }

    .el-icon-arrow-right {
      color: $color-text-muted;
    }
  }
}

.compliance-card {
  margin-bottom: $space-lg;

  .compliance-list {
    display: flex;
    flex-direction: column;
    gap: $space-sm;
  }

  .compliance-item {
    font-size: $font-size-sm;
    color: $color-text-secondary;
    line-height: 1.6;

    i {
      margin-right: $space-sm;
      color: $color-success;
    }

    &.danger i {
      color: $color-danger;
    }
  }
}

.recent-card {
  margin-bottom: $space-lg;

  .recent-list {
    display: flex;
    flex-direction: column;
    gap: $space-sm;
  }

  .recent-item {
    @include flex-between;
    padding: $space-sm $space-md;
    border-radius: $radius-sm;
    cursor: pointer;
    transition: background $transition-fast;

    &:hover {
      background: $color-bg;
    }

    .recent-left {
      display: flex;
      align-items: center;
      gap: $space-sm;

      .recent-book {
        font-weight: 600;
        font-family: $font-family-mono;
      }

      .recent-page {
        font-size: $font-size-sm;
        color: $color-text-muted;
      }
    }

    .recent-right {
      display: flex;
      align-items: center;
      gap: $space-sm;
    }
  }

  .empty-tip {
    text-align: center;
    padding: $space-2xl;
    color: $color-text-muted;

    i {
      font-size: 48px;
      margin-bottom: $space-md;
    }

    p {
      margin: 0;
    }
  }
}

@include tablet {
  .stats-row {
    .el-col {
      width: 50%;
      margin-bottom: $space-md;
    }
  }

  .main-row {
    .el-col {
      width: 100%;
    }
  }
}

@include mobile {
  .welcome-section {
    flex-direction: column;
    align-items: flex-start;
    padding: $space-xl;
    gap: $space-lg;

    .welcome-actions {
      width: 100%;

      .action-btn {
        flex: 1;
      }
    }
  }

  .stats-row {
    .el-col {
      width: 50%;
      margin-bottom: $space-sm;
    }

    .stat-card {
      padding: $space-md;
    }
  }

  .main-row {
    .el-col {
      width: 100%;
    }
  }
}
</style>
