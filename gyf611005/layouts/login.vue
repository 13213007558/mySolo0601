<template>
  <div class="login-container">
    <div class="login-bg"></div>
    <div class="login-card">
      <div class="login-header">
        <div class="logo-icon">📜</div>
        <h1 class="login-title">善本毛毡称重台</h1>
        <p class="login-subtitle">省图书馆 · 高精度纸张湿度测量系统</p>
      </div>
      
      <el-form
        ref="loginForm"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @keyup.enter.native="handleLogin">
        <el-form-item prop="userId">
          <el-input
            v-model="loginForm.userId"
            placeholder="请输入工号"
            size="large"
            prefix-icon="el-icon-user">
          </el-input>
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            prefix-icon="el-icon-lock"
            show-password>
          </el-input>
        </el-form-item>
        
        <el-button
          type="primary"
          size="large"
          class="login-btn"
          :loading="loading"
          @click="handleLogin">
          登录系统
        </el-button>
      </el-form>
      
      <div class="login-footer">
        <p class="demo-tip">演示账号：OP001 / RV001 / AD001，密码：123456</p>
        <p class="compliance-text">本系统所有操作均有审计日志，记录保存期限不少于30年</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoginLayout',
  data: function() {
    return {
      loginForm: {
        userId: '',
        password: ''
      },
      loginRules: {
        userId: [
          { required: true, message: '请输入工号', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
        ]
      },
      loading: false
    }
  },
  methods: {
    handleLogin: function() {
      var self = this
      this.$refs.loginForm.validate(function(valid) {
        if (!valid) return
        
        self.loading = true
        self.$store.dispatch('user/login', {
          userId: self.loginForm.userId,
          password: self.loginForm.password
        }).then(function(result) {
          self.loading = false
          if (result.success) {
            self.$message.success('登录成功，欢迎 ' + result.user.name)
            self.$router.push('/')
          } else {
            self.$message.error(result.message)
          }
        }).catch(function(err) {
          self.loading = false
          self.$message.error('登录失败，请重试')
          console.error(err)
        })
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.login-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(ellipse at top, rgba(74, 55, 40, 0.15), transparent 50%),
    radial-gradient(ellipse at bottom, rgba(44, 95, 124, 0.1), transparent 50%),
    $color-bg;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      linear-gradient(rgba(74, 55, 40, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(74, 55, 40, 0.03) 1px, transparent 1px);
    background-size: 40px 40px;
  }
}

.login-card {
  position: relative;
  width: 440px;
  background: $color-surface;
  border-radius: $radius-xl;
  box-shadow: $shadow-lg;
  padding: $space-2xl;
  z-index: 10;
}

.login-header {
  text-align: center;
  margin-bottom: $space-2xl;
  
  .logo-icon {
    font-size: 64px;
    margin-bottom: $space-md;
  }
  
  .login-title {
    font-family: $font-family-display;
    font-size: $font-size-2xl;
    color: $color-primary;
    margin: 0 0 $space-sm 0;
  }
  
  .login-subtitle {
    font-size: $font-size-sm;
    color: $color-text-secondary;
    margin: 0;
  }
}

.login-form {
  :deep(.el-form-item) {
    margin-bottom: $space-lg;
  }
  
  :deep(.el-input__inner) {
    height: 52px;
    font-size: $font-size-md;
    border-radius: $radius-md;
  }
}

.login-btn {
  width: 100%;
  height: 52px;
  font-size: $font-size-lg;
  font-weight: 600;
  border-radius: $radius-md;
  margin-top: $space-md;
  background: $color-primary;
  border-color: $color-primary;
  
  &:hover {
    background: $color-primary-light;
    border-color: $color-primary-light;
  }
}

.login-footer {
  margin-top: $space-xl;
  text-align: center;
  
  .demo-tip {
    font-size: $font-size-sm;
    color: $color-text-muted;
    margin: 0 0 $space-sm 0;
    padding: $space-sm;
    background: $color-bg;
    border-radius: $radius-sm;
  }
  
  .compliance-text {
    font-size: $font-size-xs;
    color: $color-text-muted;
    margin: 0;
    line-height: 1.5;
  }
}

@include mobile {
  .login-card {
    width: 90%;
    padding: $space-xl;
  }
}
</style>
