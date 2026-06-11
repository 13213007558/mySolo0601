<template>
  <div class="csv-export-button">
    <el-dropdown @command="handleCommand" trigger="click" :disabled="disabled">
      <el-button
        :type="type"
        :size="size"
        :icon="icon"
        :loading="loading"
        :disabled="disabled"
      >
        {{ buttonText }}
        <i class="el-icon-arrow-down el-icon--right"></i>
      </el-button>
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item command="export_current" v-if="showCurrent">
          <i class="el-icon-document"></i>
          导出当前筛选结果
          <span class="count-hint" v-if="currentCount > 0">({{ currentCount }} 条)</span>
        </el-dropdown-item>
        <el-dropdown-item command="export_all" v-if="showAll">
          <i class="el-icon-folder-opened"></i>
          导出全部记录
          <span class="count-hint" v-if="totalCount > 0">({{ totalCount }} 条)</span>
        </el-dropdown-item>
        <el-dropdown-item command="export_selected" v-if="showSelected && selectedCount > 0">
          <i class="el-icon-check"></i>
          导出已选中
          <span class="count-hint">({{ selectedCount }} 条)</span>
        </el-dropdown-item>
        <el-dropdown-item divided command="export_date">
          <i class="el-icon-date"></i>
          按日期范围导出...
        </el-dropdown-item>
        <el-dropdown-item command="download_format">
          <i class="el-icon-download"></i>
          下载格式说明
        </el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>

    <el-dialog
      title="按日期范围导出"
      :visible.sync="dateDialogVisible"
      width="480px"
      center
    >
      <div class="date-range-form">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :picker-options="pickerOptions"
          size="large"
          style="width: 100%;"
        >
        </el-date-picker>
        <p class="form-hint">
          <i class="el-icon-info"></i>
          最多可导出最近 30 天的数据，如需更长时间请联系管理员
        </p>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dateDialogVisible = false" size="large">取消</el-button>
        <el-button type="primary" @click="handleDateExport" size="large" :loading="exporting">
          开始导出
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { exportWeighingRecordsToCsv, exportFormatDoc } from '~/utils/csv'

export default {
  name: 'CsvExportButton',
  props: {
    buttonText: {
      type: String,
      default: '导出 CSV'
    },
    type: {
      type: String,
      default: 'primary'
    },
    size: {
      type: String,
      default: 'large'
    },
    icon: {
      type: String,
      default: 'el-icon-download'
    },
    disabled: {
      type: Boolean,
      default: false
    },
    records: {
      type: Array,
      default: function() { return [] }
    },
    allRecords: {
      type: Array,
      default: function() { return [] }
    },
    selectedRecords: {
      type: Array,
      default: function() { return [] }
    },
    showCurrent: {
      type: Boolean,
      default: true
    },
    showAll: {
      type: Boolean,
      default: true
    },
    showSelected: {
      type: Boolean,
      default: true
    },
    maxExportDays: {
      type: Number,
      default: 30
    }
  },
  data: function() {
    return {
      loading: false,
      exporting: false,
      dateDialogVisible: false,
      dateRange: [],
      pickerOptions: {
        disabledDate: this.disabledDate
      }
    }
  },
  computed: {
    currentCount: function() {
      return this.records.length
    },
    totalCount: function() {
      return this.allRecords.length
    },
    selectedCount: function() {
      return this.selectedRecords.length
    }
  },
  methods: {
    disabledDate: function(time) {
      var now = new Date()
      var maxPast = new Date()
      maxPast.setDate(maxPast.getDate() - this.maxExportDays)
      return time.getTime() > Date.now() || time.getTime() < maxPast.getTime()
    },
    handleCommand: function(command) {
      switch (command) {
        case 'export_current':
          this.exportRecords(this.records, '当前筛选')
          break
        case 'export_all':
          this.exportRecords(this.allRecords, '全部')
          break
        case 'export_selected':
          this.exportRecords(this.selectedRecords, '已选中')
          break
        case 'export_date':
          this.dateDialogVisible = true
          break
        case 'download_format':
          this.downloadFormatDoc()
          break
      }
    },
    exportRecords: function(records, type) {
      var self = this
      
      if (!records || records.length === 0) {
        this.$message.warning('没有可导出的记录')
        return
      }

      this.loading = true

      try {
        exportWeighingRecordsToCsv(records, '称重记录_' + type)
        this.$message.success('成功导出 ' + records.length + ' 条记录')
        this.$emit('export', { type: type, count: records.length })
      } catch (e) {
        console.error('导出失败:', e)
        this.$message.error('导出失败: ' + e.message)
      } finally {
        setTimeout(function() {
          self.loading = false
        }, 500)
      }
    },
    handleDateExport: function() {
      var self = this
      
      if (!this.dateRange || this.dateRange.length !== 2) {
        this.$message.warning('请选择日期范围')
        return
      }

      this.exporting = true

      this.$emit('query-by-date', {
        startDate: this.dateRange[0],
        endDate: this.dateRange[1]
      }, function(records) {
        if (records && records.length > 0) {
          try {
            var fileName = '称重记录_' + self.formatDate(self.dateRange[0]) + '_' + self.formatDate(self.dateRange[1])
            exportWeighingRecordsToCsv(records, fileName)
            self.$message.success('成功导出 ' + records.length + ' 条记录')
            self.$emit('export', { type: 'date', count: records.length })
          } catch (e) {
            console.error('导出失败:', e)
            self.$message.error('导出失败: ' + e.message)
          }
        } else {
          self.$message.warning('该日期范围内没有记录')
        }
        
        self.exporting = false
        self.dateDialogVisible = false
      })
    },
    downloadFormatDoc: function() {
      try {
        exportFormatDoc()
        this.$message.success('格式说明文档已下载')
      } catch (e) {
        console.error('下载失败:', e)
        this.$message.error('下载失败')
      }
    },
    formatDate: function(date) {
      var d = new Date(date)
      var year = d.getFullYear()
      var month = String(d.getMonth() + 1).padStart(2, '0')
      var day = String(d.getDate()).padStart(2, '0')
      return year + month + day
    }
  }
}
</script>

<style lang="scss" scoped>
.csv-export-button {
  display: inline-block;

  .count-hint {
    color: $color-text-muted;
    margin-left: $space-xs;
    font-size: $font-size-xs;
  }
}

.date-range-form {
  padding: $space-lg 0;

  .form-hint {
    display: flex;
    align-items: center;
    gap: $space-xs;
    margin-top: $space-md;
    font-size: $font-size-xs;
    color: $color-text-muted;

    i {
      color: $color-info;
    }
  }
}

.dialog-footer {
  .el-button {
    min-width: 100px;
    height: 40px;
  }
}
</style>
