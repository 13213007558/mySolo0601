<template>
  <div class="workorder-page">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <i class="el-icon-s-claim"></i>
          脱酸工单管理
        </h1>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>脱酸工单</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="header-right">
        <el-button
          size="large"
          type="primary"
          icon="el-icon-plus"
          @click="showCreateDialog"
        >
          新建工单
        </el-button>
      </div>
    </div>

    <div class="page-body">
      <el-card class="filter-card">
        <el-form :inline="true" :model="filterForm" class="filter-form">
          <el-form-item label="状态">
            <el-select
              v-model="filterForm.status"
              placeholder="全部状态"
              clearable
              size="large"
              style="width: 160px;"
            >
              <el-option label="待处理" value="pending"></el-option>
              <el-option label="处理中" value="processing"></el-option>
              <el-option label="已完成" value="completed"></el-option>
              <el-option label="已取消" value="cancelled"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="类型">
            <el-select
              v-model="filterForm.type"
              placeholder="全部类型"
              clearable
              size="large"
              style="width: 160px;"
            >
              <el-option label="脱酸处理" value="deacidification"></el-option>
              <el-option label="干燥处理" value="drying"></el-option>
              <el-option label="熏蒸处理" value="fumigation"></el-option>
            </el-select>
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
          <span><i class="el-icon-menu"></i> 工单列表</span>
          <el-tag size="small">共 {{ filteredOrders.length }} 条工单</el-tag>
        </div>

        <el-table
          :data="paginatedOrders"
          style="width: 100%"
          v-loading="loading"
          stripe
          border
        >
          <el-table-column prop="id" label="工单号" width="180">
            <template slot-scope="scope">
              <span class="mono-number link" @click="viewOrder(scope.row)">
                {{ scope.row.id }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="类型" width="120">
            <template slot-scope="scope">
              <el-tag size="small" :type="getTypeTagType(scope.row.type)">
                {{ getTypeText(scope.row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="rare_book_no" label="善本编号" width="160">
            <template slot-scope="scope">
              <span class="mono-number">{{ scope.row.rare_book_no }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="page_no" label="页码" width="80">
            <template slot-scope="scope">
              第 {{ scope.row.page_no }} 页
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template slot-scope="scope">
              <el-tag size="small" :type="getStatusTagType(scope.row.status)">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="priority" label="优先级" width="100">
            <template slot-scope="scope">
              <el-tag size="mini" :type="getPriorityTagType(scope.row.priority)">
                {{ getPriorityText(scope.row.priority) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="assignee" label="负责人" width="100" />
          <el-table-column prop="created_at" label="创建时间" width="170">
            <template slot-scope="scope">
              <span class="mono-number">{{ formatTime(scope.row.created_at) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template slot-scope="scope">
              <el-button
                v-if="scope.row.status === 'pending'"
                type="text"
                size="small"
                icon="el-icon-check"
                @click="startProcess(scope.row)"
              >
                开始处理
              </el-button>
              <el-button
                v-if="scope.row.status === 'processing'"
                type="text"
                size="small"
                icon="el-icon-circle-check"
                @click="completeOrder(scope.row)"
              >
                完成
              </el-button>
              <el-button
                type="text"
                size="small"
                icon="el-icon-view"
                @click="viewOrder(scope.row)"
              >
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          v-if="filteredOrders.length > pageSize"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="currentPage"
          :page-sizes="[20, 50, 100]"
          :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredOrders.length"
          class="pagination"
        ></el-pagination>
      </el-card>
    </div>

    <el-dialog
      title="新建脱酸工单"
      :visible.sync="createDialogVisible"
      width="600px"
      center
    >
      <el-form
        ref="createForm"
        :model="createForm"
        :rules="createRules"
        label-width="100px"
      >
        <el-form-item label="善本编号" prop="rare_book_no">
          <el-input v-model="createForm.rare_book_no" placeholder="请输入善本编号"></el-input>
        </el-form-item>
        <el-form-item label="页码" prop="page_no">
          <el-input-number v-model="createForm.page_no" :min="1" :max="9999"></el-input-number>
        </el-form-item>
        <el-form-item label="工单类型" prop="type">
          <el-select v-model="createForm.type" placeholder="请选择类型" style="width: 100%;">
            <el-option label="脱酸处理" value="deacidification"></el-option>
            <el-option label="干燥处理" value="drying"></el-option>
            <el-option label="熏蒸处理" value="fumigation"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-radio-group v-model="createForm.priority">
            <el-radio-button label="low">低</el-radio-button>
            <el-radio-button label="medium">中</el-radio-button>
            <el-radio-button label="high">高</el-radio-button>
            <el-radio-button label="urgent">紧急</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="负责人" prop="assignee">
          <el-input v-model="createForm.assignee" placeholder="请输入负责人姓名"></el-input>
        </el-form-item>
        <el-form-item label="备注" prop="notes">
          <el-input
            v-model="createForm.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入工单备注信息"
          ></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button size="large" @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" size="large" @click="handleCreate">创建工单</el-button>
      </span>
    </el-dialog>

    <el-dialog
      title="工单详情"
      :visible.sync="detailVisible"
      width="700px"
      center
    >
      <div class="order-detail" v-if="detailOrder">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="工单号">
            <span class="mono-number">{{ detailOrder.id }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="类型">
            <el-tag size="small" :type="getTypeTagType(detailOrder.type)">
              {{ getTypeText(detailOrder.type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="善本编号">
            <span class="mono-number">{{ detailOrder.rare_book_no }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="页码">
            第 {{ detailOrder.page_no }} 页
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTagType(detailOrder.status)" size="small">
              {{ getStatusText(detailOrder.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag :type="getPriorityTagType(detailOrder.priority)" size="mini">
              {{ getPriorityText(detailOrder.priority) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="负责人">
            {{ detailOrder.assignee || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            <span class="mono-number">{{ formatTime(detailOrder.created_at) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">
            {{ detailOrder.notes || '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="order-timeline" v-if="detailOrder.timeline && detailOrder.timeline.length > 0">
          <h4><i class="el-icon-time"></i> 处理记录</h4>
          <el-timeline>
            <el-timeline-item
              v-for="(item, index) in detailOrder.timeline"
              :key="index"
              :timestamp="formatTime(item.time)"
              :type="item.type || 'primary'"
              placement="top"
            >
              {{ item.content }}
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { formatWeighingTime } from '~/utils/dayjs'

export default {
  name: 'WorkOrderPage',
  data: function() {
    return {
      loading: false,
      currentPage: 1,
      pageSize: 20,
      detailVisible: false,
      detailOrder: null,
      createDialogVisible: false,
      filterForm: {
        status: '',
        type: ''
      },
      createForm: {
        rare_book_no: '',
        page_no: 1,
        type: 'deacidification',
        priority: 'medium',
        assignee: '',
        notes: ''
      },
      createRules: {
        rare_book_no: [
          { required: true, message: '请输入善本编号', trigger: 'blur' }
        ],
        type: [
          { required: true, message: '请选择工单类型', trigger: 'change' }
        ],
        priority: [
          { required: true, message: '请选择优先级', trigger: 'change' }
        ]
      }
    }
  },
  computed: {
    orders: function() {
      return this.$store.getters['workorder/orders']
    },
    filteredOrders: function() {
      var self = this
      return this.orders.filter(function(order) {
        if (self.filterForm.status && order.status !== self.filterForm.status) {
          return false
        }
        if (self.filterForm.type && order.type !== self.filterForm.type) {
          return false
        }
        return true
      })
    },
    paginatedOrders: function() {
      var start = (this.currentPage - 1) * this.pageSize
      var end = start + this.pageSize
      return this.filteredOrders.slice(start, end)
    }
  },
  mounted: function() {
    this.loadOrders()
  },
  methods: {
    formatTime: formatWeighingTime,

    loadOrders: function() {
      var self = this
      this.loading = true
      this.$store.dispatch('workorder/init').then(function() {
        self.loading = false
      })
    },

    applyFilter: function() {
      this.currentPage = 1
    },

    resetFilter: function() {
      this.filterForm = { status: '', type: '' }
      this.currentPage = 1
    },

    handleSizeChange: function(val) {
      this.pageSize = val
    },

    handleCurrentChange: function(val) {
      this.currentPage = val
    },

    getTypeTagType: function(type) {
      var map = {
        deacidification: 'warning',
        drying: 'info',
        fumigation: 'danger'
      }
      return map[type] || 'info'
    },

    getTypeText: function(type) {
      var map = {
        deacidification: '脱酸处理',
        drying: '干燥处理',
        fumigation: '熏蒸处理'
      }
      return map[type] || type
    },

    getStatusTagType: function(status) {
      var map = {
        pending: 'warning',
        processing: 'primary',
        completed: 'success',
        cancelled: 'info'
      }
      return map[status] || 'info'
    },

    getStatusText: function(status) {
      var map = {
        pending: '待处理',
        processing: '处理中',
        completed: '已完成',
        cancelled: '已取消'
      }
      return map[status] || status
    },

    getPriorityTagType: function(priority) {
      var map = {
        low: 'info',
        medium: '',
        high: 'warning',
        urgent: 'danger'
      }
      return map[priority] || ''
    },

    getPriorityText: function(priority) {
      var map = {
        low: '低',
        medium: '中',
        high: '高',
        urgent: '紧急'
      }
      return map[priority] || priority
    },

    showCreateDialog: function() {
      this.createForm = {
        rare_book_no: '',
        page_no: 1,
        type: 'deacidification',
        priority: 'medium',
        assignee: '',
        notes: ''
      }
      this.createDialogVisible = true
    },

    handleCreate: function() {
      var self = this
      this.$refs.createForm.validate(function(valid) {
        if (!valid) return
        self.$store.dispatch('workorder/createOrder', self.createForm).then(function() {
          self.$message.success('工单创建成功')
          self.createDialogVisible = false
        })
      })
    },

    viewOrder: function(order) {
      this.detailOrder = order
      this.detailVisible = true
    },

    startProcess: function(order) {
      var self = this
      this.$confirm('确认开始处理工单 ' + order.id + '？', '确认', {
        type: 'info'
      }).then(function() {
        self.$store.dispatch('workorder/updateStatus', {
          orderId: order.id,
          status: 'processing'
        }).then(function() {
          self.$message.success('工单已开始处理')
        })
      }).catch(function() {})
    },

    completeOrder: function(order) {
      var self = this
      this.$confirm('确认完成工单 ' + order.id + '？', '确认', {
        type: 'success'
      }).then(function() {
        self.$store.dispatch('workorder/updateStatus', {
          orderId: order.id,
          status: 'completed'
        }).then(function() {
          self.$message.success('工单已完成')
        })
      }).catch(function() {})
    }
  }
}
</script>

<style lang="scss" scoped>
.workorder-page {
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

.page-body {
  padding: 0 $space-xxl;
}

.filter-card {
  margin-bottom: $space-lg;
}

.table-card {
  .card-header {
    @include flex-between;
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

.pagination {
  margin-top: $space-lg;
  text-align: right;
}

.order-detail {
  .order-timeline {
    margin-top: $space-xl;

    h4 {
      font-family: $font-family-display;
      color: $color-primary;
      margin: 0 0 $space-md 0;
      padding-bottom: $space-sm;
      border-bottom: 1px solid $color-bg-dark;

      i {
        margin-right: $space-sm;
      }
    }
  }
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
    }
  }

  .page-body {
    padding: 0 $space-md;
  }
}
</style>
