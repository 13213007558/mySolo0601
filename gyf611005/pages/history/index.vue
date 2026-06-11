<template>
  <div class="history-page">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <i class="el-icon-document"></i>
          历史记录查询
        </h1>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>历史记录</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="header-right">
        <csv-export-button
          :records="filteredRecords"
          :all-records="records"
          :selected-records="selectedRecords"
          @export="handleExport"
          @query-by-date="handleQueryByDate"
        />
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
      <el-card class="filter-card">
        <el-form :inline="true" :model="filterForm" class="filter-form">
          <el-form-item label="善本编号">
            <el-input
              v-model="filterForm.rareBookNo"
              placeholder="请输入善本编号"
              clearable
              size="large"
              style="width: 200px;"
            ></el-input>
          </el-form-item>
          <el-form-item label="状态">
            <el-select
              v-model="filterForm.status"
              placeholder="全部状态"
              clearable
              size="large"
              style="width: 160px;"
            >
              <el-option label="正常" value="normal"></el-option>
              <el-option label="已复核" value="reviewed"></el-option>
              <el-option label="已封存" value="sealed"></el-option>
              <el-option label="待处理" value="pending"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="日期范围">
            <el-date-picker
              v-model="filterForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              size="large"
              style="width: 320px;"
            ></el-date-picker>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="large" icon="el-icon-search" @click="applyFilter">
              查询
            </el-button>
            <el-button size="large" icon="el-icon-refresh" @click="resetFilter">
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-card class="table-card">
        <div slot="header" class="card-header">
          <span><i class="el-icon-menu"></i> 称重记录列表</span>
          <div class="header-info">
            <el-tag size="small">共 {{ filteredRecords.length }} 条记录</el-tag>
            <el-tag v-if="selectedRecords.length > 0" type="primary" size="small">
              已选 {{ selectedRecords.length }} 条
            </el-tag>
          </div>
        </div>

        <el-table
          :data="paginatedRecords"
          style="width: 100%"
          v-loading="loading"
          @selection-change="handleSelectionChange"
          stripe
          border
        >
          <el-table-column type="selection" width="55"></el-table-column>
          <el-table-column prop="rare_book_no" label="善本编号" width="160" fixed="left">
            <template slot-scope="scope">
              <span class="mono-number link" @click="viewDetail(scope.row)">
                {{ scope.row.rare_book_no }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="page_no" label="页码" width="80">
            <template slot-scope="scope">
              第 {{ scope.row.page_no }} 页
            </template>
          </el-table-column>
          <el-table-column prop="median_value" label="中值(g)" width="110">
            <template slot-scope="scope">
              <span class="mono-number">{{ formatWeight(scope.row.median_value) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="max_deviation" label="偏差(g)" width="110">
            <template slot-scope="scope">
              <span class="mono-number" :class="getDeviationClass(scope.row.max_deviation)">
                {{ formatWeight(scope.row.max_deviation) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="reweigh_count" label="复称次数" width="100">
            <template slot-scope="scope">
              <el-tag v-if="scope.row.reweigh_count > 0" type="warning" size="small">
                {{ scope.row.reweigh_count }} 次
              </el-tag>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          <el-table-column label="温湿度" width="160">
            <template slot-scope="scope">
              <span class="mono-number" v-if="scope.row.humidity_data">
                {{ scope.row.humidity_data.temperature }}°C / 
                {{ scope.row.humidity_data.humidity }}%
              </span>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="operator_name" label="操作员" width="100" />
          <el-table-column label="复核员" width="100">
            <template slot-scope="scope">
              <span v-if="scope.row.review_record">{{ scope.row.review_record.reviewer_name }}</span>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template slot-scope="scope">
              <el-tag size="small" :type="getStatusType(scope.row.status)">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="脱酸工单" width="100">
            <template slot-scope="scope">
              <el-tag v-if="scope.row.work_order" type="warning" size="small">
                <i class="el-icon-setting"></i>
              </el-tag>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="称重时间" width="170">
            <template slot-scope="scope">
              <span class="mono-number">{{ formatTime(scope.row.created_at) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="数据完整性" width="110">
            <template slot-scope="scope">
              <el-tooltip
                v-if="scope.row.data_hash"
                content="数据已通过哈希校验，不可篡改"
                placement="top"
              >
                <i class="el-icon-circle-check success-icon"></i>
              </el-tooltip>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template slot-scope="scope">
              <el-button
                type="text"
                size="small"
                icon="el-icon-view"
                @click="viewDetail(scope.row)"
              >
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          v-if="filteredRecords.length > pageSize"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="currentPage"
          :page-sizes="[20, 50, 100]"
          :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredRecords.length"
          class="pagination"
        >
        </el-pagination>
      </el-card>
    </div>

    <el-dialog
      title="记录详情"
      :visible.sync="detailVisible"
      width="900px"
      center
    >
      <div class="detail-dialog" v-if="detailRecord">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="善本编号">
            <span class="mono-number">{{ detailRecord.rare_book_no }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="页码">
            第 {{ detailRecord.page_no }} 页
          </el-descriptions-item>
          <el-descriptions-item label="称重中值">
            <span class="mono-number">{{ formatWeight(detailRecord.median_value) }} g</span>
          </el-descriptions-item>
          <el-descriptions-item label="最大偏差">
            <span class="mono-number" :class="getDeviationClass(detailRecord.max_deviation)">
              {{ formatWeight(detailRecord.max_deviation) }} g
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="复称次数">
            {{ detailRecord.reweigh_count || 0 }} 次
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(detailRecord.status)" size="small">
              {{ getStatusText(detailRecord.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="温湿度" :span="2">
            <span class="mono-number" v-if="detailRecord.humidity_data">
              温度 {{ detailRecord.humidity_data.temperature }}°C，
              湿度 {{ detailRecord.humidity_data.humidity }}%RH，
              探针 {{ detailRecord.humidity_data.probe_id }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="操作员">
            {{ detailRecord.operator_name }}
          </el-descriptions-item>
          <el-descriptions-item label="称重时间">
            <span class="mono-number">{{ formatTime(detailRecord.created_at) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="复核员" v-if="detailRecord.review_record">
            {{ detailRecord.review_record.reviewer_name }}
          </el-descriptions-item>
          <el-descriptions-item label="复核值" v-if="detailRecord.review_record">
            <span class="mono-number">{{ formatWeight(detailRecord.review_record.review_value) }} g</span>
          </el-descriptions-item>
          <el-descriptions-item label="数据哈希" :span="2">
            <span class="mono-number hash-text">{{ detailRecord.data_hash }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="上一条哈希" :span="2" v-if="detailRecord.previous_hash">
            <span class="mono-number hash-text">{{ detailRecord.previous_hash }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <div class="detail-section" v-if="detailRecord.attempts && detailRecord.attempts.length > 0">
          <h4><i class="el-icon-time"></i> 称重明细</h4>
          <el-table :data="detailRecord.attempts" size="small" border>
            <el-table-column label="序号" type="index" width="60" />
            <el-table-column label="称重1(g)">
              <template slot-scope="scope">
                <span class="mono-number">{{ formatWeight(scope.row.weight_1) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="称重2(g)">
              <template slot-scope="scope">
                <span class="mono-number">{{ formatWeight(scope.row.weight_2) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="称重3(g)">
              <template slot-scope="scope">
                <span class="mono-number">{{ formatWeight(scope.row.weight_3) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="中值(g)">
              <template slot-scope="scope">
                <span class="mono-number primary">{{ formatWeight(scope.row.calculated_median) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="偏差(g)">
              <template slot-scope="scope">
                <span class="mono-number" :class="getDeviationClass(scope.row.deviation)">
                  {{ formatWeight(scope.row.deviation) }}
                </span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="detail-section" v-if="detailRecord.work_order">
          <h4><i class="el-icon-setting"></i> 脱酸工单</h4>
          <el-alert
            :title="detailRecord.work_order.notes"
            type="warning"
            show-icon
            :closable="false"
          />
        </div>

        <div class="detail-section" v-if="detailRecord.seal_process">
          <h4><i class="el-icon-lock"></i> 封存记录</h4>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="封存原因">
              {{ detailRecord.seal_process.reason }}
            </el-descriptions-item>
            <el-descriptions-item label="审批人">
              {{ detailRecord.seal_process.approver_name }}
            </el-descriptions-item>
            <el-descriptions-item label="审批意见" :span="2">
              {{ detailRecord.seal_process.approval_opinion }}
            </el-descriptions-item>
            <el-descriptions-item label="封存时间" :span="2">
              <span class="mono-number">{{ formatTime(detailRecord.seal_process.approved_at) }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section" v-if="detailRecord.photos && detailRecord.photos.length > 0">
          <h4><i class="el-icon-picture"></i> 留档照片 ({{ detailRecord.photos.length }})</h4>
          <div class="photos-preview">
            <img
              v-for="(photo, index) in detailRecord.photos"
              :key="photo.id || index"
              :src="photo.file_path || photo.dataUrl"
              :alt="'照片 ' + (index + 1)"
              class="preview-thumb"
            />
          </div>
        </div>

        <div class="detail-section hash-verify">
          <el-button
            type="primary"
            size="large"
            icon="el-icon-key"
            @click="verifyHash"
            :loading="verifying"
          >
            验证数据完整性
          </el-button>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button size="large" @click="detailVisible = false">关闭</el-button>
        <csv-export-button
          :records="detailRecord ? [detailRecord] : []"
          button-text="导出单条"
          size="large"
          :show-current="false"
          :show-all="false"
          :show-selected="false"
          @export="handleExportSingle"
        />
      </span>
    </el-dialog>
  </div>
</template>

<script>
import CsvExportButton from '~/components/weighing/CsvExportButton.vue'
import { formatWeight } from '~/utils/weighing'
import { formatWeighingTime } from '~/utils/dayjs'
import { verifyRecordHash } from '~/utils/crypto'

export default {
  name: 'HistoryIndexPage',
  components: {
    CsvExportButton
  },
  data: function() {
    return {
      loading: false,
      verifying: false,
      currentPage: 1,
      pageSize: 20,
      selectedRecords: [],
      detailVisible: false,
      detailRecord: null,
      filterForm: {
        rareBookNo: '',
        status: '',
        dateRange: []
      }
    }
  },
  computed: {
    records: function() {
      return this.$store.getters['weighing/records']
    },
    filteredRecords: function() {
      var self = this
      return this.records.filter(function(record) {
        if (self.filterForm.rareBookNo) {
          if (!record.rare_book_no.toLowerCase().includes(self.filterForm.rareBookNo.toLowerCase())) {
            return false
          }
        }
        if (self.filterForm.status) {
          if (record.status !== self.filterForm.status) {
            return false
          }
        }
        if (self.filterForm.dateRange && self.filterForm.dateRange.length === 2) {
          var recordDate = new Date(record.created_at)
          var startDate = new Date(self.filterForm.dateRange[0])
          var endDate = new Date(self.filterForm.dateRange[1])
          endDate.setHours(23, 59, 59, 999)
          if (recordDate < startDate || recordDate > endDate) {
            return false
          }
        }
        return true
      })
    },
    paginatedRecords: function() {
      var start = (this.currentPage - 1) * this.pageSize
      var end = start + this.pageSize
      return this.filteredRecords.slice(start, end)
    }
  },
  mounted: function() {
    this.loadRecords()
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

    applyFilter: function() {
      this.currentPage = 1
      this.$message.info('查询条件已应用，共 ' + this.filteredRecords.length + ' 条记录')
    },

    resetFilter: function() {
      this.filterForm = {
        rareBookNo: '',
        status: '',
        dateRange: []
      }
      this.currentPage = 1
    },

    handleSelectionChange: function(selection) {
      this.selectedRecords = selection
    },

    handleSizeChange: function(val) {
      this.pageSize = val
    },

    handleCurrentChange: function(val) {
      this.currentPage = val
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
        normal: '正常',
        pending: '待复核',
        reviewed: '已复核',
        sealed: '已封存'
      }
      return textMap[status] || status
    },

    viewDetail: function(record) {
      this.detailRecord = record
      this.detailVisible = true
    },

    verifyHash: function() {
      var self = this
      this.verifying = true
      
      setTimeout(function() {
        var isValid = verifyRecordHash(self.detailRecord)
        if (isValid) {
          self.$message.success('数据完整性验证通过，记录未被篡改')
        } else {
          self.$message.error('数据完整性验证失败，记录可能已被篡改！')
        }
        self.verifying = false
      }, 1000)
    },

    handleExport: function(data) {
      this.$message.success('导出 ' + data.count + ' 条记录')
    },

    handleExportSingle: function(data) {
      this.$message.success('导出成功')
    },

    handleQueryByDate: function(params, callback) {
      var self = this
      this.$store.dispatch('weighing/loadRecordsByDate', params).then(function(records) {
        callback(records)
      })
    },

    goToWeighing: function() {
      this.$router.push('/weighing')
    }
  }
}
</script>

<style lang="scss" scoped>
.history-page {
  min-height: 100vh;
  background: $color-bg;
  padding-bottom: $space-2xl;
}

.page-header {
  @include flex-between;
  padding: $space-xl $space-xxl;
  background: $color-surface;
  border-bottom: 1px solid $color-bg-dark;
  margin-bottom: $space-lg;
}

.header-left {
  .page-title {
    font-family: $font-family-display;
    font-size: $font-size-xl;
    color: $color-primary;
    margin: 0 0 $space-xs 0;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: $space-md;
}

.page-body {
  padding: 0 $space-xxl;
}

.filter-card {
  margin-bottom: $space-lg;
  
  .filter-form {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
  }
}

.table-card {
  .card-header {
    @include flex-between;
    
    .header-info {
      display: flex;
      align-items: center;
      gap: $space-sm;
    }
  }
}

.link {
  color: $color-info;
  cursor: pointer;
  text-decoration: underline;
  
  &:hover {
    color: $color-primary;
  }
}

.text-success {
  color: $color-success;
  font-weight: 600;
}

.text-warning {
  color: $color-warning;
  font-weight: 600;
}

.text-danger {
  color: $color-danger;
  font-weight: 600;
  animation: pulse-danger 1.5s infinite;
}

.text-muted {
  color: $color-text-muted;
}

.pagination {
  margin-top: $space-lg;
  text-align: right;
}

.detail-dialog {
  .detail-section {
    margin-top: $space-xl;
    
    h4 {
      font-family: $font-family-display;
      font-size: $font-size-md;
      color: $color-primary;
      margin: 0 0 $space-md 0;
      padding-bottom: $space-sm;
      border-bottom: 1px solid $color-bg-dark;
      
      i {
        margin-right: $space-sm;
      }
    }
  }
  
  .photos-preview {
    display: flex;
    flex-wrap: wrap;
    gap: $space-md;
    
    .preview-thumb {
      width: 120px;
      height: 120px;
      object-fit: cover;
      border-radius: $radius-md;
      border: 1px solid $color-bg-dark;
      cursor: pointer;
      transition: transform $transition-fast;
      
      &:hover {
        transform: scale(1.05);
      }
    }
  }
  
  .hash-verify {
    text-align: center;
    padding: $space-lg 0;
    border-top: 1px solid $color-bg-dark;
  }
}

.hash-text {
  font-size: $font-size-xs;
  word-break: break-all;
  color: $color-text-muted;
}

.success-icon {
  color: $color-success;
  font-size: 18px;
}

@include tablet {
  .page-header {
    padding: $space-lg $space-xl;
  }
  
  .page-body {
    padding: 0 $space-xl;
  }
}

@include mobile {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    padding: $space-md $space-lg;
    gap: $space-sm;
    
    .header-right {
      width: 100%;
      justify-content: flex-end;
    }
  }
  
  .page-body {
    padding: 0 $space-md;
  }
  
  .filter-form {
    :deep(.el-form-item) {
      margin-bottom: $space-sm;
      margin-right: $space-sm;
    }
  }
}
</style>