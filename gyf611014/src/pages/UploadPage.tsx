import { useState, useRef, useCallback } from 'react'
import { css } from '../../styled-system/css'
import { PageHeader, PageContent } from '@/components/layout/AppLayout'
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAppStore } from '@/store/appStore'
import type { OysterImage } from '@/types'
import { 
  Upload, 
  Camera, 
  Image as ImageIcon, 
  Sun, 
  Layers,
  X,
  Plus,
  CheckCircle2,
  AlertCircle,
  Settings2,
  ChevronDown,
  FolderUp
} from 'lucide-react'

export function UploadPage() {
  const { 
    batches, 
    lightingPresets, 
    currentLightingPresetId, 
    setCurrentLightingPresetId,
    addImage,
    setCurrentPage
  } = useAppStore()
  
  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id || '')
  const [previewImages, setPreviewImages] = useState<{ file: File; url: string; id: string }[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [showPresetDropdown, setShowPresetDropdown] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const selectedPreset = lightingPresets.find(p => p.id === currentLightingPresetId)
  const selectedBatch = batches.find(b => b.id === selectedBatchId)

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return
    
    const newImages: { file: File; url: string; id: string }[] = []
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const id = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        newImages.push({
          file,
          url: URL.createObjectURL(file),
          id,
        })
      }
    })
    
    setPreviewImages(prev => [...prev, ...newImages])
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const removeImage = (id: string) => {
    setPreviewImages(prev => {
      const img = prev.find(i => i.id === id)
      if (img) URL.revokeObjectURL(img.url)
      return prev.filter(i => i.id !== id)
    })
  }

  const handleUpload = () => {
    if (!selectedBatchId || previewImages.length === 0) return

    previewImages.forEach((img, index) => {
      const newImage: OysterImage = {
        id: `img-${Date.now()}-${index}`,
        url: img.url,
        name: img.file.name,
        batchId: selectedBatchId,
        uploadTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
        lightingPreset: currentLightingPresetId,
        status: 'pending',
      }
      addImage(newImage)
    })

    setPreviewImages([])
    setCurrentPage('annotation')
  }

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const openCamera = () => {
    cameraInputRef.current?.click()
  }

  return (
    <>
      <PageHeader
        title="显微拍照上传"
        subtitle="上传牡蛎壳显微照片，选择批次与光照预设"
      >
        <div className={css({ display: 'flex', gap: '3' })}>
          <Badge variant="subtle">
            <Layers size={12} />
            当前批次：{selectedBatch?.name || '未选择'}
          </Badge>
          <Badge variant="info">
            <Sun size={12} />
            {selectedPreset?.name || '标准白光'}
          </Badge>
        </div>
      </PageHeader>
      
      <PageContent>
        <div className={css({ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '6' })}>
          <div className={css({ display: 'flex', flexDirection: 'column', gap: '6' })}>
            <Card variant="default" padding="md">
              <CardHeader>
                <CardTitle>上传图像</CardTitle>
              </CardHeader>
              <CardBody>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={css({
                    border: '2px dashed',
                    borderColor: isDragging ? 'primary' : 'border',
                    borderRadius: 'xl',
                    p: '10',
                    textAlign: 'center',
                    bg: isDragging ? 'primary/5' : 'surface-muted/50',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    _hover: {
                      borderColor: 'primary',
                      bg: 'primary/5',
                    },
                  })}
                  onClick={openFilePicker}
                >
                  <div className={css({
                    width: '64px',
                    height: '64px',
                    mx: 'auto',
                    mb: '4',
                    borderRadius: 'full',
                    bg: 'primary/10',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'primary',
                  })}>
                    <Upload size={28} />
                  </div>
                  <p className={css({ fontSize: 'md', fontWeight: '500', color: 'text.primary', m: 0, mb: '2' })}>
                    拖拽图片到此处，或点击上传
                  </p>
                  <p className={css({ fontSize: 'sm', color: 'text.muted', m: 0 })}>
                    支持 JPG、PNG、TIFF 格式，单张最大 20MB
                  </p>
                  
                  <div className={css({ display: 'flex', gap: '3', justifyContent: 'center', mt: '6' })}>
                    <Button variant="secondary" size="sm" leftIcon={<Camera size={16} />} onClick={(e) => { e.stopPropagation(); openCamera() }}>
                      显微拍照
                    </Button>
                    <Button variant="outline" size="sm" leftIcon={<FolderUp size={16} />} onClick={(e) => { e.stopPropagation(); openFilePicker() }}>
                      选择文件
                    </Button>
                  </div>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className={css({ display: 'none' })}
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className={css({ display: 'none' })}
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </CardBody>
            </Card>

            {previewImages.length > 0 && (
              <Card variant="default" padding="md">
                <CardHeader>
                  <div className={css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' })}>
                    <CardTitle>待上传预览 ({previewImages.length}张)</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setPreviewImages([])}
                    >
                      清空全部
                    </Button>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className={css({ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(4, 1fr)', 
                    gap: '4' 
                  })}>
                    {previewImages.map((img) => (
                      <div key={img.id} className={css({
                        position: 'relative',
                        aspectRatio: '1',
                        borderRadius: 'lg',
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: 'border',
                        bg: 'surface-muted',
                      })}>
                        <img 
                          src={img.url} 
                          alt={img.file.name}
                          className={css({ width: 'full', height: 'full', objectFit: 'cover' })}
                        />
                        <button
                          onClick={() => removeImage(img.id)}
                          className={css({
                            position: 'absolute',
                            top: '2',
                            right: '2',
                            width: '24px',
                            height: '24px',
                            borderRadius: 'full',
                            bg: 'black/60',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            _hover: { bg: 'black/80' },
                          })}
                        >
                          <X size={14} />
                        </button>
                        <div className={css({
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          p: '2',
                          bg: 'linear-gradient(to top, black/70%, transparent)',
                          color: 'white',
                          fontSize: 'xs',
                          truncate: true,
                        })}>
                          {img.file.name}
                        </div>
                      </div>
                    ))}
                    
                    <button
                      onClick={openFilePicker}
                      className={css({
                        aspectRatio: '1',
                        borderRadius: 'lg',
                        border: '2px dashed',
                        borderColor: 'border',
                        bg: 'surface-muted/50',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '2',
                        color: 'text.muted',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        _hover: {
                          borderColor: 'primary',
                          color: 'primary',
                          bg: 'primary/5',
                        },
                      })}
                    >
                      <Plus size={24} />
                      <span className={css({ fontSize: 'xs' })}>添加图片</span>
                    </button>
                  </div>
                </CardBody>
                <CardFooter>
                  <Button variant="secondary" onClick={() => setPreviewImages([])}>
                    取消
                  </Button>
                  <Button 
                    onClick={handleUpload}
                    disabled={!selectedBatchId || previewImages.length === 0}
                  >
                    确认上传并进入圈选
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>

          <div className={css({ display: 'flex', flexDirection: 'column', gap: '6' })}>
            <Card variant="default" padding="md">
              <CardHeader>
                <CardTitle>选择批次</CardTitle>
              </CardHeader>
              <CardBody>
                <div className={css({ display: 'flex', flexDirection: 'column', gap: '2' })}>
                  {batches.filter(b => b.status === 'active').map((batch) => (
                    <button
                      key={batch.id}
                      onClick={() => setSelectedBatchId(batch.id)}
                      className={css({
                        p: '3',
                        textAlign: 'left',
                        borderRadius: 'lg',
                        border: '1px solid',
                        borderColor: selectedBatchId === batch.id ? 'primary' : 'border',
                        bg: selectedBatchId === batch.id ? 'primary/5' : 'surface',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        _hover: {
                          borderColor: 'primary',
                        },
                      })}
                    >
                      <div className={css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '1' })}>
                        <span className={css({ fontSize: 'sm', fontWeight: '500', color: 'text.primary' })}>
                          {batch.name}
                        </span>
                        {selectedBatchId === batch.id && (
                          <CheckCircle2 size={16} className={css({ color: 'primary' })} />
                        )}
                      </div>
                      <p className={css({ fontSize: 'xs', color: 'text.muted', m: 0 })}>{batch.farm}</p>
                      <div className={css({ display: 'flex', gap: '2', mt: '2' })}>
                        <Badge variant="subtle">{batch.breed}</Badge>
                        <Badge variant="primary">{batch.confirmedCount}/{batch.totalCount}</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </CardBody>
            </Card>

            <Card variant="default" padding="md">
              <CardHeader>
                <CardTitle>光照预设</CardTitle>
              </CardHeader>
              <CardBody>
                <div className={css({ mb: '4' })}>
                  <div 
                    className={css({
                      position: 'relative',
                      p: '3',
                      borderRadius: 'lg',
                      border: '1px solid',
                      borderColor: 'border',
                      bg: 'surface',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      _hover: { borderColor: 'primary' },
                    })}
                    onClick={() => setShowPresetDropdown(!showPresetDropdown)}
                  >
                    <div className={css({ display: 'flex', alignItems: 'center', gap: '3' })}>
                      <div className={css({
                        width: '32px',
                        height: '32px',
                        borderRadius: 'md',
                        bg: `linear-gradient(135deg, 
                          hsl(${selectedPreset ? selectedPreset.temperature * 0.05 : 200}, 60%, 70%), 
                          hsl(${selectedPreset ? selectedPreset.temperature * 0.03 : 60}, 40%, 85%))`,
                        flexShrink: 0,
                      })} />
                      <div>
                        <p className={css({ fontSize: 'sm', fontWeight: '500', color: 'text.primary', m: 0 })}>
                          {selectedPreset?.name || '选择预设'}
                        </p>
                        <p className={css({ fontSize: 'xs', color: 'text.muted', m: '1', mt: 0 })}>
                          亮度 {selectedPreset?.brightness}% · 对比度 {selectedPreset?.contrast}%
                        </p>
                      </div>
                    </div>
                    <ChevronDown size={18} className={css({ 
                      color: 'text.muted',
                      transform: showPresetDropdown ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s',
                    })} />
                  </div>
                  
                  {showPresetDropdown && (
                    <div className={css({
                      mt: '2',
                      borderRadius: 'lg',
                      border: '1px solid',
                      borderColor: 'border',
                      bg: 'surface',
                      boxShadow: 'md',
                      overflow: 'hidden',
                    })}>
                      {lightingPresets.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => {
                            setCurrentLightingPresetId(preset.id)
                            setShowPresetDropdown(false)
                          }}
                          className={css({
                            width: 'full',
                            p: '3',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3',
                            border: 'none',
                            bg: currentLightingPresetId === preset.id ? 'primary/5' : 'transparent',
                            cursor: 'pointer',
                            textAlign: 'left',
                            _hover: { bg: 'surface-hover' },
                          })}
                        >
                          <div className={css({
                            width: '28px',
                            height: '28px',
                            borderRadius: 'md',
                            bg: `linear-gradient(135deg, 
                              hsl(${preset.temperature * 0.05}, 60%, 70%), 
                              hsl(${preset.temperature * 0.03}, 40%, 85%))`,
                            flexShrink: 0,
                          })} />
                          <span className={css({ fontSize: 'sm', color: 'text.primary', flex: 1 })}>
                            {preset.name}
                          </span>
                          {currentLightingPresetId === preset.id && (
                            <CheckCircle2 size={16} className={css({ color: 'primary' })} />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className={css({
                  p: '4',
                  borderRadius: 'lg',
                  bg: 'surface-muted',
                  border: '1px solid',
                  borderColor: 'border',
                })}>
                  <div className={css({ display: 'flex', alignItems: 'center', gap: '2', mb: '3' })}>
                    <Settings2 size={16} className={css({ color: 'text.muted' })} />
                    <span className={css({ fontSize: 'sm', fontWeight: '500', color: 'text.secondary' })}>参数预览</span>
                  </div>
                  <div className={css({ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3' })}>
                    <div>
                      <p className={css({ fontSize: 'xs', color: 'text.muted', m: 0, mb: '1' })}>亮度</p>
                      <div className={css({
                        width: 'full',
                        height: '6px',
                        bg: 'border',
                        borderRadius: 'full',
                        overflow: 'hidden',
                      })}>
                        <div 
                          className={css({ height: 'full', bg: 'primary', borderRadius: 'full' })}
                          style={{ width: `${selectedPreset?.brightness || 0}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <p className={css({ fontSize: 'xs', color: 'text.muted', m: 0, mb: '1' })}>对比度</p>
                      <div className={css({
                        width: 'full',
                        height: '6px',
                        bg: 'border',
                        borderRadius: 'full',
                        overflow: 'hidden',
                      })}>
                        <div 
                          className={css({ height: 'full', bg: 'primary', borderRadius: 'full' })}
                          style={{ width: `${selectedPreset?.contrast || 0}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <p className={css({ fontSize: 'xs', color: 'text.muted', m: 0, mb: '1' })}>饱和度</p>
                      <div className={css({
                        width: 'full',
                        height: '6px',
                        bg: 'border',
                        borderRadius: 'full',
                        overflow: 'hidden',
                      })}>
                        <div 
                          className={css({ height: 'full', bg: 'accent', borderRadius: 'full' })}
                          style={{ width: `${selectedPreset?.saturation || 0}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <p className={css({ fontSize: 'xs', color: 'text.muted', m: 0, mb: '1' })}>色温</p>
                      <div className={css({
                        width: 'full',
                        height: '6px',
                        bg: 'border',
                        borderRadius: 'full',
                        overflow: 'hidden',
                        background: 'linear-gradient(to right, #FFD89B, #B8D8FF)',
                      })}>
                        <div 
                          className={css({ 
                            height: 'full', 
                            borderRadius: 'full',
                            position: 'relative',
                          })}
                          style={{ 
                            width: '3px',
                            marginLeft: `${((selectedPreset?.temperature || 5000) - 3000) / 50}%`,
                            boxShadow: '0 0 0 2px white, 0 0 0 3px #94A3B8',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className={css({
                  mt: '4',
                  p: '3',
                  borderRadius: 'lg',
                  bg: 'warning/10',
                  border: '1px solid',
                  borderColor: 'warning/20',
                  display: 'flex',
                  gap: '2',
                })}>
                  <AlertCircle size={16} className={css({ color: 'warning', flexShrink: 0, mt: '1px' })} />
                  <p className={css({ fontSize: 'xs', color: 'text.secondary', m: 0, lineHeight: '1.5' })}>
                    <strong>同批次照片须使用同一光照预设</strong>，以确保生长纹识别的一致性与可比性。
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </PageContent>
    </>
  )
}
