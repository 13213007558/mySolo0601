<template>
  <div class="app-container">
    <el-header class="app-header">
      <div class="header-left">
        <h1 class="app-title">善本毛毡称重台</h1>
        <span class="app-subtitle">高精度纸张湿度测量系统 v1.0</span>
      </div>
      <div class="header-right">
        <ProbeStatusCard class="probe-status-mini" />
        <div class="user-info" v-if="currentUser">
          <span class="user-name">{{ currentUser.name }}</span>
          <el-tag size="small" :type="userRoleTagType">{{ userRoleText }}</el-tag>
          <el-button size="small" @click="handleLogout" class="logout-btn">退出</el-button>
        </div>
      </div>
    </el-header>
    
    <el-container class="main-container">
      <el-aside width="220px" class="app-sidebar">
        <el-menu
          :default-active="activeMenu"
          class="sidebar-menu"
          background-color="#4A3728"
          text-color="#F5F0E8"
          active-text-color="#FFFFFF"
          router>
          <el-menu-item index="/">
            <i class="el-icon-s-home"></i>
            <span>称重台主页</span>
          </el-menu-item>
          <el-menu-item index="/weighing">
            <i class="el-icon-s-platform"></i>
            <span>毛毡称重</span>
          </el-menu-item>
          <el-menu-item index="/review" v-if="hasPermission('review')">
            <i class="el-icon-s-check"></i>
            <span>双人复核</span>
          </el-menu-item>
          <el-menu-item index="/seal" v-if="hasPermission('seal')">
            <i class="el-icon-lock"></i>
            <span>封存流程</span>
          </el-menu-item>
          <el-menu-item index="/history">
            <i class="el-icon-document"></i>
            <span>历史记录</span>
          </el-menu-item>
          <el-menu-item index="/workorder" v-if="hasPermission('seal')">
            <i class="el-icon-s-claim"></i>
            <span>脱酸工单</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      
      <el-main class="app-main">
        <nuxt />
      </el-main>
    </el-container>
    
    <el-footer class="app-footer">
      <span>© 2024 省图书馆数字化部 | 称重记录保存期限不少于30年 | 系统版本 v1.0</span>
    </el-footer>
  </div>
</template>

<script>
import ProbeStatusCard from '~/components/weighing/ProbeStatusCard.vue'

export default {
  name: 'DefaultLayout',
  components: {
    ProbeStatusCard
  },
  computed: {
    currentUser: function() {
      return this.$store.getters['user/currentUser']
    },
    userRoleText: function() {
      var roleMap = {
        operator: '操作员',
        reviewer: '复核员',
        admin: '管理员'
      }
      return roleMap[this.currentUser?.role] || '未知'
    },
    userRoleTagType: function() {
      var typeMap = {
        operator: 'success',
        reviewer: 'info',
        admin: 'danger'
      }
      return typeMap[this.currentUser?.role] || 'info'
    },
    activeMenu: function() {
      var path = this.$route.path
      if (path.startsWith('/review')) return '/review'
      if (path.startsWith('/seal')) return '/seal'
      if (path.startsWith('/weighing')) return '/weighing'
      if (path.startsWith('/history')) return '/history'
      if (path.startsWith('/workorder')) return '/workorder'
      return '/'
    }
  },
  methods: {
    hasPermission: function(permission) {
      return this.$store.getters['user/hasPermission'](permission)
    },
    handleLogout: function() {
      var self = this
      this.$confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function() {
        self.$store.dispatch('user/logout').then(function() {
          self.$router.push('/login')
        })
      }).catch(function() {})
    }
  }
}
</script>

<style lang="scss" scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: $color-bg;
}

.app-header {
  background: $color-primary;
  color: #fff;
  padding: 0 $space-xl;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 72px;
  box-shadow: $shadow-md;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: $space-md;
  
  .app-title {
    font-family: $font-family-display;
    font-size: $font-size-xl;
    color: #fff;
    margin: 0;
  }
  
  .app-subtitle {
    font-size: $font-size-sm;
    opacity: 0.7;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: $space-lg;
  
  .probe-status-mini {
    background: rgba(255, 255, 255, 0.1);
    border-radius: $radius-md;
    padding: $space-sm $space-md;
    
    :deep(.probe-value) {
      color: #fff;
      font-size: $font-size-sm;
    }
    
    :deep(.status-text) {
      color: rgba(255, 255, 255, 0.7);
      font-size: $font-size-xs;
    }
  }
  
  .user-info {
    display: flex;
    align-items: center;
    gap: $space-sm;
    
    .user-name {
      font-size: $font-size-md;
      font-weight: 500;
    }
    
    .logout-btn {
      background: rgba(255, 255, 255, 0.15);
      border: none;
      color: #fff;
      
      &:hover {
        background: rgba(255, 255, 255, 0.25);
      }
    }
  }
}

.main-container {
  flex: 1;
  min-height: 0;
}

.app-sidebar {
  background: $color-primary;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  
  :deep(.el-menu) {
    border-right: none;
    height: 100%;
    
    .el-menu-item {
      font-size: $font-size-md;
      height: 64px;
      line-height: 64px;
      transition: all $transition-fast;
      
      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      
      &.is-active {
        background: $color-primary-light;
      }
      
      i {
        font-size: 20px;
        margin-right: $space-sm;
      }
    }
  }
}

.app-main {
  background: $color-bg;
  padding: $space-xl;
  overflow-y: auto;
}

.app-footer {
  background: $color-bg-dark;
  color: $color-text-secondary;
  text-align: center;
  padding: $space-md;
  font-size: $font-size-xs;
  border-top: 1px solid rgba(74, 55, 40, 0.1);
}

@include tablet {
  .app-header {
    padding: 0 $space-lg;
    height: 64px;
    
    .app-title {
      font-size: $font-size-lg;
    }
    
    .app-subtitle {
      display: none;
    }
  }
  
  .app-main {
    padding: $space-lg;
  }
  
  .app-sidebar {
    width: 180px;
  }
}

@include mobile {
  .app-header {
    padding: 0 $space-md;
    height: 56px;
    
    .app-title {
      font-size: $font-size-md;
    }
    
    .header-right {
      gap: $space-sm;
      
      .probe-status-mini {
        display: none;
      }
      
      .user-name {
        display: none;
      }
    }
  }
  
  .app-sidebar {
    width: 60px;
    
    :deep(.el-menu-item) {
      span {
        display: none;
      }
      
      i {
        margin-right: 0;
      }
    }
  }
}
</style>
