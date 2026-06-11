<template>
  <div class="photo-capture">
    <div class="capture-header">
      <span class="header-title">
        <i class="el-icon-camera"></i>
        {{ title }}
      </span>
      <el-tag v-if="required" type="danger" size="small">必拍</el-tag>
    </div>

    <div class="capture-body">
      <div class="camera-preview" v-if="showCamera">
        <video ref="videoElement" autoplay playsinline class="video-feed"></video>
        <canvas ref="canvasElement" class="hidden-canvas"></canvas>
        
        <div class="camera-overlay">
          <div class="overlay-frame"></div>
        </div>

        <div class="camera-controls">
          <el-button
            type="primary"
            size="large"
            icon="el-icon-camera"
            @click="capturePhoto"
            class="capture-btn"
            :disabled="capturing"
            :loading="capturing"
          >
            拍照
          </el-button>
          <el-button
            size="large"
            icon="el-icon-refresh-left"
            @click="stopCamera"
            class="cancel-btn"
          >
            取消
          </el-button>
        </div>
      </div>

      <div class="photo-upload" v-else>
        <el-upload
          ref="uploader"
          class="upload-area"
          :show-file-list="false"
          :before-upload="handleBeforeUpload"
          :http-request="handleFileUpload"
          accept="image/*"
          :disabled="disabled || maxReached"
        >
          <div class="upload-placeholder" :class="{ 'is-disabled': disabled || maxReached }">
            <i class="el-icon-plus"></i>
            <span v-if="maxReached">已达到最大数量 ({{ maxPhotos }})</span>
            <span v-else-if="disabled">请先完成称重</span>
            <span v-else>点击拍照或上传照片</span>
          </div>
        </el-upload>

        <div class="upload-options">
          <el-button
            size="small"
            icon="el-icon-camera"
            @click="startCamera"
            :disabled="disabled || maxReached"
          >
            调用摄像头
          </el-button>
          <span class="option-hint">支持 JPG、PNG 格式，单张不超过 5MB</span>
        </div>
      </div>

      <div class="photos-list" v-if="photos.length > 0">
        <div class="list-header">
          <span>已拍照 ({{ photos.length }}/{{ maxPhotos }})</span>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="clearAll"
            v-if="!disabled && photos.length > 0"
          >
            清空全部
          </el-button>
        </div>
        <div class="photos-grid">
          <div class="photo-item" v-for="(photo, index) in photos" :key="photo.id || index">
            <div class="photo-preview">
              <img :src="photo.file_path || photo.dataUrl" :alt="'照片 ' + (index + 1)" />
              <div class="photo-type-tag" :type="getPhotoTypeTag(photo.photo_type)">
                {{ getPhotoTypeText(photo.photo_type) }}
              </div>
            </div>
            <div class="photo-info">
              <div class="photo-time">{{ formatTime(photo.taken_at) }}</div>
              <div class="photo-actions" v-if="!disabled">
                <el-button
                  size="mini"
                  type="text"
                  icon="el-icon-view"
                  @click="previewPhoto(photo)"
                >
                  查看
                </el-button>
                <el-button
                  size="mini"
                  type="text"
                  icon="el-icon-delete"
                  @click="removePhoto(index)"
                >
                  删除
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="type-selector" v-if="showTypeSelector && !showCamera">
      <span class="selector-label">照片类型:</span>
      <el-radio-group v-model="currentPhotoType" size="small">
        <el-radio-button label="reweigh">复称现场</el-radio-button>
        <el-radio-button label="paper">纸张状态</el-radio-button>
        <el-radio-button label="environment">环境照片</el-radio-button>
        <el-radio-button label="other">其他</el-radio-button>
      </el-radio-group>
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
import { formatWeighingTime } from '~/utils/dayjs'

export default {
  name: 'PhotoCapture',
  props: {
    title: {
      type: String,
      default: '拍照留档'
    },
    photos: {
      type: Array,
      default: function() { return [] }
    },
    maxPhotos: {
      type: Number,
      default: 5
    },
    required: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    showTypeSelector: {
      type: Boolean,
      default: true
    },
    defaultType: {
      type: String,
      default: 'reweigh'
    }
  },
  data: function() {
    return {
      showCamera: false,
      capturing: false,
      currentPhotoType: this.defaultType,
      previewVisible: false,
      previewPhotoUrl: '',
      previewPhotoData: null,
      stream: null
    }
  },
  computed: {
    maxReached: function() {
      return this.photos.length >= this.maxPhotos
    }
  },
  methods: {
    formatTime: formatWeighingTime,
    getPhotoTypeTag: function(type) {
      var typeMap = {
        reweigh: 'danger',
        paper: 'warning',
        environment: 'info',
        other: ''
      }
      return typeMap[type] || ''
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
    async startCamera() {
      var self = this
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          this.stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false
          })
          
          this.$nextTick(function() {
            if (self.$refs.videoElement && self.stream) {
              self.$refs.videoElement.srcObject = self.stream
            }
          })
          
          this.showCamera = true
        } else {
          this.$message.warning('当前浏览器不支持摄像头调用，请使用上传方式')
        }
      } catch (e) {
        console.error('启动摄像头失败:', e)
        this.$message.error('无法访问摄像头，请检查权限设置')
      }
    },
    stopCamera: function() {
      if (this.stream) {
        this.stream.getTracks().forEach(function(track) {
          track.stop()
        })
        this.stream = null
      }
      this.showCamera = false
    },
    capturePhoto: function() {
      var self = this
      this.capturing = true

      setTimeout(function() {
        try {
          var video = self.$refs.videoElement
          var canvas = self.$refs.canvasElement
          
          if (video && canvas) {
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            
            var ctx = canvas.getContext('2d')
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            
            var dataUrl = canvas.toDataURL('image/jpeg', 0.9)
            self.addPhoto(dataUrl)
            
            self.stopCamera()
            self.$message.success('拍照成功')
          }
        } catch (e) {
          console.error('拍照失败:', e)
          self.$message.error('拍照失败，请重试')
        }
        
        self.capturing = false
      }, 500)
    },
    handleBeforeUpload: function(file) {
      var isImage = file.type.indexOf('image/') > -1
      if (!isImage) {
        this.$message.error('请选择图片文件')
        return false
      }
      
      var isLt5M = file.size / 1024 / 1024 < 5
      if (!isLt5M) {
        this.$message.error('图片大小不能超过 5MB')
        return false
      }
      
      return true
    },
    handleFileUpload: function(options) {
      var self = this
      var file = options.file
      var reader = new FileReader()
      
      reader.onload = function(e) {
        self.addPhoto(e.target.result)
        self.$message.success('上传成功')
      }
      
      reader.onerror = function() {
        self.$message.error('上传失败，请重试')
      }
      
      reader.readAsDataURL(file)
    },
    addPhoto: function(dataUrl) {
      var photo = {
        id: 'PHOTO-' + Date.now(),
        dataUrl: dataUrl,
        file_path: dataUrl,
        photo_type: this.currentPhotoType,
        taken_at: new Date().toISOString(),
        taken_by: this.$store.getters['user/currentUser'] 
          ? this.$store.getters['user/currentUser'].name 
          : '未知'
      }
      
      this.$emit('add', photo)
    },
    removePhoto: function(index) {
      var self = this
      this.$confirm('确定要删除这张照片吗？', '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function() {
        self.$emit('remove', index)
        self.$message.success('已删除')
      }).catch(function() {})
    },
    clearAll: function() {
      var self = this
      this.$confirm('确定要清空所有照片吗？', '确认清空', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function() {
        self.$emit('clear')
        self.$message.success('已清空')
      }).catch(function() {})
    },
    previewPhoto: function(photo) {
      this.previewPhotoUrl = photo.file_path || photo.dataUrl
      this.previewPhotoData = photo
      this.previewVisible = true
    }
  },
  beforeDestroy: function() {
    this.stopCamera()
  }
}
</script>

<style lang="scss" scoped>
.photo-capture {
  @include card;
  padding: $space-lg;
}

.capture-header {
  @include flex-between;
  margin-bottom: $space-lg;

  .header-title {
    display: flex;
    align-items: center;
    gap: $space-xs;
    font-family: $font-family-display;
    font-size: $font-size-md;
    font-weight: 600;
    color: $color-primary;

    i {
      font-size: $font-size-lg;
    }
  }
}

.capture-body {
  margin-bottom: $space-md;
}

.camera-preview {
  position: relative;
  width: 100%;
  background: #000;
  border-radius: $radius-md;
  overflow: hidden;
  margin-bottom: $space-md;

  .video-feed {
    width: 100%;
    display: block;
    min-height: 300px;
  }

  .camera-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 60px;
    pointer-events: none;

    .overlay-frame {
      position: absolute;
      top: 10%;
      left: 10%;
      right: 10%;
      bottom: 10%;
      border: 3px dashed rgba(255, 255, 255, 0.5);
      border-radius: $radius-md;
    }
  }

  .camera-controls {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    gap: $space-md;
    padding: $space-md;
    background: rgba(0, 0, 0, 0.8);

    .capture-btn {
      flex: 1;
      height: 48px;
      font-size: $font-size-md;
    }

    .cancel-btn {
      width: 100px;
      height: 48px;
      font-size: $font-size-md;
    }
  }
}

.hidden-canvas {
  display: none;
}

.photo-upload {
  margin-bottom: $space-md;
}

.upload-area {
  width: 100%;

  .upload-placeholder {
    @include flex-center;
    flex-direction: column;
    gap: $space-sm;
    height: 120px;
    border: 2px dashed $color-bg-dark;
    border-radius: $radius-md;
    background: $color-bg;
    cursor: pointer;
    transition: all $transition-fast;

    i {
      font-size: $font-size-2xl;
      color: $color-text-muted;
    }

    span {
      font-size: $font-size-sm;
      color: $color-text-secondary;
    }

    &:hover:not(.is-disabled) {
      border-color: $color-primary;
      background: rgba(74, 55, 40, 0.03);

      i, span {
        color: $color-primary;
      }
    }

    &.is-disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.upload-options {
  display: flex;
  align-items: center;
  gap: $space-md;
  margin-top: $space-sm;

  .option-hint {
    font-size: $font-size-xs;
    color: $color-text-muted;
  }
}

.photos-list {
  margin-top: $space-lg;

  .list-header {
    @include flex-between;
    margin-bottom: $space-sm;
    font-size: $font-size-sm;
    color: $color-text-secondary;
  }
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: $space-md;
}

.photo-item {
  background: $color-bg;
  border-radius: $radius-md;
  overflow: hidden;
  border: 1px solid $color-bg-dark;

  .photo-preview {
    position: relative;
    width: 100%;
    padding-top: 75%;

    img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .photo-type-tag {
      position: absolute;
      top: $space-xs;
      right: $space-xs;
      padding: 2px $space-xs;
      background: rgba(0, 0, 0, 0.7);
      color: #fff;
      font-size: $font-size-xs;
      border-radius: $radius-sm;
    }
  }

  .photo-info {
    padding: $space-xs $space-sm;

    .photo-time {
      font-family: $font-family-mono;
      font-size: $font-size-xs;
      color: $color-text-muted;
      margin-bottom: $space-xs;
    }

    .photo-actions {
      display: flex;
      gap: $space-xs;

      .el-button {
        padding: 2px $space-xs;
        font-size: $font-size-xs;
      }
    }
  }
}

.type-selector {
  display: flex;
  align-items: center;
  gap: $space-md;
  padding-top: $space-md;
  border-top: 1px solid $color-bg-dark;

  .selector-label {
    font-size: $font-size-sm;
    color: $color-text-secondary;
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
  .photos-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: $space-sm;
  }

  .camera-controls {
    flex-direction: column;

    .capture-btn, .cancel-btn {
      width: 100% !important;
    }
  }
}
</style>
