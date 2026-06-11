import { useState, useRef, useEffect, useCallback } from 'react'
import { css } from '../../styled-system/css'
import { PageHeader, PageContent } from '@/components/layout/AppLayout'
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAppStore, loadImageForAnnotation } from '@/store/appStore'
import type { GrowthRing } from '@/types'
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Plus, 
  Minus,
  Move,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react'

type ToolType = 'select' | 'add' | 'delete'

export function AnnotationPage() {
  const { 
    images, 
    batches,
    growthRings, 
    setGrowthRings,
    updateGrowthRing,
    removeGrowthRing,
    addGrowthRing,
    confirmImageRings,
    aiProcessing,
    setAiProcessing,
    isConfirmed,
    setIsConfirmed,
    setCurrentPage
  } = useAppStore()

  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [zoom, setZoom] = useState(100)
  const [tool, setTool] = useState<ToolType>('select')
  const [selectedRingId, setSelectedRingId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragType, setDragType] = useState<'move' | 'resize' | null>(null)
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 })
  const [dragStartRing, setDragStartRing] = useState<GrowthRing | null>(null)
  const [showRings, setShowRings] = useState(true)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  const pendingImages = images.filter(img => 
    img.status === 'pending' || img.status === 'reviewing' || img.status === 'processing'
  )
  const currentImage = pendingImages[currentImageIndex]
  const currentBatch = batches.find(b => b.id === currentImage?.batchId)

  useEffect(() => {
    if (currentImage && canvasRef.current) {
      const canvas = canvasRef.current
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        imageRef.current = img
        const container = containerRef.current
        if (container) {
          const maxWidth = container.clientWidth - 40
          const maxHeight = container.clientHeight - 40
          const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1)
          canvas.width = img.width * scale
          canvas.height = img.height * scale
          
          const centerX = canvas.width / 2
          const centerY = canvas.height / 2
          loadImageForAnnotation(currentImage.id, centerX, centerY)
        }
        drawCanvas()
      }
      img.src = currentImage.url
    }
  }, [currentImage?.id])

  useEffect(() => {
    drawCanvas()
  }, [growthRings, selectedRingId, showRings, zoom])

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (imageRef.current) {
      ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height)
    }

    if (!showRings) return

    growthRings.forEach((ring, index) => {
      const isSelected = ring.id === selectedRingId
      
      ctx.beginPath()
      ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2)
      
      if (isSelected) {
        ctx.strokeStyle = '#F59E0B'
        ctx.lineWidth = 2.5
        ctx.setLineDash([])
      } else if (ring.isArtificial) {
        ctx.strokeStyle = '#EF4444'
        ctx.lineWidth = 1.5
        ctx.setLineDash([4, 4])
      } else {
        ctx.strokeStyle = '#0D9488'
        ctx.lineWidth = 1.5
        ctx.setLineDash([])
      }
      
      ctx.stroke()
      
      if (isSelected) {
        ctx.fillStyle = '#F59E0B'
        const handleRadius = 6
        ctx.beginPath()
        ctx.arc(ring.x + ring.radius, ring.y, handleRadius, 0, Math.PI * 2)
        ctx.fill()
        
        ctx.fillStyle = 'white'
        ctx.beginPath()
        ctx.arc(ring.x, ring.y, 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#F59E0B'
        ctx.lineWidth = 2
        ctx.stroke()
      }

      ctx.fillStyle = isSelected ? '#F59E0B' : (ring.isArtificial ? '#EF4444' : '#0D9488')
      ctx.font = 'bold 11px Inter, sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      
      const labelX = ring.x + ring.radius + 8
      const labelY = ring.y - ring.radius
      ctx.fillText(`#${index + 1}`, labelX, labelY)
    })
  }, [growthRings, selectedRingId, showRings])

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) return
    
    const pos = getMousePos(e)

    if (tool === 'add') {
      const newRing: GrowthRing = {
        id: `ring-${Date.now()}`,
        x: pos.x,
        y: pos.y,
        radius: 30,
        isArtificial: true,
      }
      addGrowthRing(newRing)
      setSelectedRingId(newRing.id)
      setTool('select')
      setIsConfirmed(false)
      return
    }

    if (tool === 'select') {
      let clickedRing: GrowthRing | null = null
      
      for (let i = growthRings.length - 1; i >= 0; i--) {
        const ring = growthRings[i]
        const dist = Math.sqrt((pos.x - ring.x) ** 2 + (pos.y - ring.y) ** 2)
        
        const resizeHandleDist = Math.sqrt(
          (pos.x - (ring.x + ring.radius)) ** 2 + 
          (pos.y - ring.y) ** 2
        )
        
        if (resizeHandleDist < 12 || Math.abs(dist - ring.radius) < 10) {
          clickedRing = ring
          break
        }
      }
      
      setSelectedRingId(clickedRing?.id || null)
    }

    if (tool === 'delete') {
      for (let i = growthRings.length - 1; i >= 0; i--) {
        const ring = growthRings[i]
        const dist = Math.sqrt((pos.x - ring.x) ** 2 + (pos.y - ring.y) ** 2)
        if (Math.abs(dist - ring.radius) < 15) {
          removeGrowthRing(ring.id)
          setIsConfirmed(false)
          break
        }
      }
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool !== 'select' || !selectedRingId) return
    
    const pos = getMousePos(e)
    const ring = growthRings.find(r => r.id === selectedRingId)
    if (!ring) return

    const resizeHandleDist = Math.sqrt(
      (pos.x - (ring.x + ring.radius)) ** 2 + 
      (pos.y - ring.y) ** 2
    )

    if (resizeHandleDist < 15) {
      setDragType('resize')
      setIsDragging(true)
      setDragStartPos(pos)
      setDragStartRing(ring)
      return
    }

    const centerDist = Math.sqrt((pos.x - ring.x) ** 2 + (pos.y - ring.y) ** 2)
    if (centerDist < ring.radius) {
      setDragType('move')
      setIsDragging(true)
      setDragStartPos(pos)
      setDragStartRing(ring)
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStartRing || dragType === null) return
    
    const pos = getMousePos(e)
    const dx = pos.x - dragStartPos.x
    const dy = pos.y - dragStartPos.y

    if (dragType === 'move') {
      updateGrowthRing(selectedRingId!, {
        x: dragStartRing.x + dx,
        y: dragStartRing.y + dy,
      })
    } else if (dragType === 'resize') {
      const newRadius = Math.max(10, dragStartRing.radius + dx)
      updateGrowthRing(selectedRingId!, {
        radius: newRadius,
      })
    }
    
    setIsConfirmed(false)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setDragType(null)
    setDragStartRing(null)
  }

  const runAIDetection = () => {
    if (!currentImage) return
    
    setAiProcessing(true)
    setSelectedRingId(null)
    
    setTimeout(() => {
      if (canvasRef.current) {
        const centerX = canvasRef.current.width / 2
        const centerY = canvasRef.current.height / 2
        const count = currentImage.aiRingCount || 12
        
        const newRings: GrowthRing[] = []
        for (let i = 0; i < count; i++) {
          newRings.push({
            id: `ring-ai-${i}`,
            x: centerX + (Math.random() - 0.5) * 15,
            y: centerY + (Math.random() - 0.5) * 15,
            radius: 25 + i * 16 + Math.random() * 6,
            isArtificial: false,
          })
        }
        setGrowthRings(newRings)
        setIsConfirmed(false)
      }
      setAiProcessing(false)
    }, 1500)
  }

  const handleConfirm = () => {
    if (growthRings.length === 0 || isConfirmed) return
    setShowConfirmDialog(true)
  }

  const submitConfirmation = () => {
    if (currentImage) {
      confirmImageRings(currentImage.id, growthRings.length)
      setIsConfirmed(true)
      setShowConfirmDialog(false)
      
      setTimeout(() => {
        if (currentImageIndex < pendingImages.length - 1) {
          setCurrentImageIndex(prev => prev + 1)
        } else {
          setCurrentPage('batches')
        }
      }, 800)
    }
  }

  const aiRingCount = currentImage?.aiRingCount || 0
  const manualAdjusted = growthRings.filter(r => r.isArtificial).length
  const totalRings = growthRings.length

  const tools: { id: ToolType; icon: typeof Move; label: string }[] = [
    { id: 'select', icon: Move, label: '选择/移动' },
    { id: 'add', icon: Plus, label: '添加生长纹' },
    { id: 'delete', icon: Trash2, label: '删除生长纹' },
  ]

  if (!currentImage) {
    return (
      <>
        <PageHeader title="生长纹圈选" subtitle="对智能识别的生长纹进行人工修正确认" />
        <PageContent>
          <Card variant="default" padding="lg">
            <div className={css({ textAlign: 'center', py: '12' })}>
              <div className={css({
                width: '80px',
                height: '80px',
                mx: 'auto',
                mb: '4',
                borderRadius: 'full',
                bg: 'success/10',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'success',
              })}>
                <CheckCircle2 size={40} />
              </div>
              <h3 className={css({ fontSize: 'lg', fontWeight: '600', color: 'text.primary', mb: '2' })}>
                所有待处理图片已完成圈选
              </h3>
              <p className={css({ fontSize: 'sm', color: 'text.muted', mb: '6' })}>
                暂无需要圈选的样本图片
              </p>
              <Button onClick={() => setCurrentPage('upload')}>上传新图片</Button>
            </div>
          </Card>
        </PageContent>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="生长纹圈选"
        subtitle={`${currentImageIndex + 1} / ${pendingImages.length} · ${currentImage.name}`}
      >
        <div className={css({ display: 'flex', gap: '3' })}>
          <Badge variant="subtle">
            <ImageIcon size={12} />
            {currentBatch?.name}
          </Badge>
          {currentImage.isAbnormal && (
            <Badge variant="danger">
              <AlertTriangle size={12} />
              异常标记
            </Badge>
          )}
        </div>
      </PageHeader>

      <PageContent className={css({ p: 0, display: 'flex', flexDirection: 'column' })}>
        <div className={css({ 
          flex: 1, 
          display: 'flex',
          minHeight: 0,
        })}>
          <div className={css({
            width: '64px',
            bg: 'white',
            borderRight: '1px solid',
            borderColor: 'border',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            py: '4',
            gap: '2',
          })}>
            {tools.map((t) => {
              const Icon = t.icon
              const isActive = tool === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTool(t.id)}
                  className={css({
                    width: '44px',
                    height: '44px',
                    borderRadius: 'lg',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    border: 'none',
                    bg: isActive ? 'primary' : 'transparent',
                    color: isActive ? 'white' : 'text.secondary',
                    _hover: {
                      bg: isActive ? 'primary' : 'surface-hover',
                      color: isActive ? 'white' : 'text.primary',
                    },
                  })}
                  title={t.label}
                >
                  <Icon size={20} />
                </button>
              )
            })}
            
            <div className={css({ width: '32px', height: '1px', bg: 'border', my: '2' })} />
            
            <button
              onClick={() => setShowRings(!showRings)}
              className={css({
                width: '44px',
                height: '44px',
                borderRadius: 'lg',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s',
                border: 'none',
                bg: 'transparent',
                color: showRings ? 'primary' : 'text.muted',
                _hover: { bg: 'surface-hover' },
              })}
              title={showRings ? '隐藏生长纹' : '显示生长纹'}
            >
              {showRings ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
            
            <button
              onClick={runAIDetection}
              disabled={aiProcessing}
              className={css({
                width: '44px',
                height: '44px',
                borderRadius: 'lg',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: aiProcessing ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
                border: 'none',
                bg: 'transparent',
                color: aiProcessing ? 'text.muted' : 'primary',
                _hover: { bg: 'primary/10' },
              })}
              title="AI 智能识别"
            >
              <Sparkles size={20} className={css({
                animation: aiProcessing ? 'spin 1s linear infinite' : 'none',
              })} />
            </button>

            <div className={css({ width: '32px', height: '1px', bg: 'border', my: '2' })} />

            <button
              onClick={() => setZoom(z => Math.min(z + 25, 300))}
              className={css({
                width: '44px',
                height: '44px',
                borderRadius: 'lg',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s',
                border: 'none',
                bg: 'transparent',
                color: 'text.secondary',
                _hover: { bg: 'surface-hover', color: 'text.primary' },
              })}
            >
              <ZoomIn size={20} />
            </button>
            <button
              onClick={() => setZoom(z => Math.max(z - 25, 50))}
              className={css({
                width: '44px',
                height: '44px',
                borderRadius: 'lg',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s',
                border: 'none',
                bg: 'transparent',
                color: 'text.secondary',
                _hover: { bg: 'surface-hover', color: 'text.primary' },
              })}
            >
              <ZoomOut size={20} />
            </button>
            <button
              onClick={() => setZoom(100)}
              className={css({
                width: '44px',
                height: '44px',
                borderRadius: 'lg',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s',
                border: 'none',
                bg: 'transparent',
                color: 'text.secondary',
                _hover: { bg: 'surface-hover', color: 'text.primary' },
              })}
            >
              <RotateCcw size={20} />
            </button>
            <div className={css({
              fontSize: 'xs',
              color: 'text.muted',
              mt: '1',
              textAlign: 'center',
            })}>
              {zoom}%
            </div>
          </div>

          <div 
            ref={containerRef}
            className={css({
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bg: '#1a1a2e',
              position: 'relative',
              overflow: 'auto',
            })}
          >
            <div 
              className={css({
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'center center',
                boxShadow: 'xl',
                borderRadius: 'lg',
                overflow: 'hidden',
              })}
            >
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className={css({
                  display: 'block',
                  cursor: tool === 'add' ? 'crosshair' : 
                          tool === 'delete' ? 'not-allowed' :
                          isDragging ? 'grabbing' : 'default',
                })}
              />
            </div>

            {aiProcessing && (
              <div className={css({
                position: 'absolute',
                top: '1/2',
                left: '1/2',
                transform: 'translate(-50%, -50%)',
                bg: 'black/80',
                color: 'white',
                px: '6',
                py: '5',
                borderRadius: 'xl',
                display: 'flex',
                alignItems: 'center',
                gap: '3',
                backdropFilter: 'blur(8px)',
              })}>
                <RefreshCw size={24} className={css({ animation: 'spin 1s linear infinite' })} />
                <span className={css({ fontSize: 'sm', fontWeight: '500' })}>AI 正在识别生长纹...</span>
              </div>
            )}

            {isConfirmed && (
              <div className={css({
                position: 'absolute',
                top: '6',
                right: '6',
                bg: 'success',
                color: 'white',
                px: '4',
                py: '2.5',
                borderRadius: 'lg',
                display: 'flex',
                alignItems: 'center',
                gap: '2',
                boxShadow: 'lg',
              })}>
                <CheckCircle2 size={18} />
                <span className={css({ fontSize: 'sm', fontWeight: '500' })}>已确认提交</span>
              </div>
            )}
          </div>

          <div className={css({
            width: '300px',
            bg: 'white',
            borderLeft: '1px solid',
            borderColor: 'border',
            display: 'flex',
            flexDirection: 'column',
          })}>
            <div className={css({
              p: '5',
              borderBottom: '1px solid',
              borderColor: 'border',
            })}>
              <h3 className={css({ fontSize: 'md', fontWeight: '600', color: 'text.primary', m: 0, mb: '1' })}>
                计数统计
              </h3>
              <p className={css({ fontSize: 'xs', color: 'text.muted', m: 0 })}>
                共 {totalRings} 条生长纹
              </p>
            </div>

            <div className={css({ p: '5', borderBottom: '1px solid', borderColor: 'border' })}>
              <div className={css({ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4' })}>
                <div className={css({
                  p: '3',
                  borderRadius: 'lg',
                  bg: 'primary/5',
                  textAlign: 'center',
                })}>
                  <p className={css({ fontSize: '2xl', fontWeight: '700', color: 'primary', m: 0 })}>
                    {totalRings}
                  </p>
                  <p className={css({ fontSize: 'xs', color: 'text.muted', mt: '1', m: 0 })}>总计数</p>
                </div>
                <div className={css({
                  p: '3',
                  borderRadius: 'lg',
                  bg: 'accent/10',
                  textAlign: 'center',
                })}>
                  <p className={css({ fontSize: '2xl', fontWeight: '700', color: 'accent-dark', m: 0 })}>
                    {manualAdjusted}
                  </p>
                  <p className={css({ fontSize: 'xs', color: 'text.muted', mt: '1', m: 0 })}>人工修正</p>
                </div>
              </div>
            </div>

            <div className={css({ p: '5', borderBottom: '1px solid', borderColor: 'border' })}>
              <div className={css({ display: 'flex', justifyContent: 'space-between', mb: '3' })}>
                <span className={css({ fontSize: 'sm', color: 'text.secondary' })}>AI 识别数量</span>
                <span className={css({ fontSize: 'sm', fontWeight: '500', color: 'text.primary' })}>
                  {aiRingCount} 条
                </span>
              </div>
              <div className={css({ display: 'flex', justifyContent: 'space-between', mb: '3' })}>
                <span className={css({ fontSize: 'sm', color: 'text.secondary' })}>人工调整</span>
                <span className={css({ fontSize: 'sm', fontWeight: '500', color: totalRings !== aiRingCount ? 'warning' : 'success' })}>
                  {totalRings > aiRingCount ? `+${totalRings - aiRingCount}` : totalRings - aiRingCount} 条
                </span>
              </div>
              <div className={css({ display: 'flex', justifyContent: 'space-between' })}>
                <span className={css({ fontSize: 'sm', color: 'text.secondary' })}>最终计数</span>
                <span className={css({ fontSize: 'sm', fontWeight: '600', color: 'primary' })}>
                  {totalRings} 条
                </span>
              </div>
            </div>

            <div className={css({ p: '5', flex: 1, overflowY: 'auto' })}>
              <h4 className={css({ fontSize: 'sm', fontWeight: '600', color: 'text.primary', m: 0, mb: '3' })}>
                生长纹列表
              </h4>
              <div className={css({ display: 'flex', flexDirection: 'column', gap: '2' })}>
                {growthRings.map((ring, index) => (
                  <div
                    key={ring.id}
                    onClick={() => setSelectedRingId(ring.id)}
                    className={css({
                      p: '2.5',
                      borderRadius: 'md',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      bg: selectedRingId === ring.id ? 'primary/10' : 'surface-muted/50',
                      border: '1px solid',
                      borderColor: selectedRingId === ring.id ? 'primary' : 'transparent',
                      _hover: {
                        bg: selectedRingId === ring.id ? 'primary/15' : 'surface-hover',
                      },
                    })}
                  >
                    <div className={css({ display: 'flex', alignItems: 'center', gap: '2' })}>
                      <div className={css({
                        width: '8px',
                        height: '8px',
                        borderRadius: 'full',
                        bg: ring.isArtificial ? 'danger' : 'primary',
                      })} />
                      <span className={css({ fontSize: 'sm', color: 'text.primary' })}>
                        生长纹 #{index + 1}
                      </span>
                    </div>
                    <span className={css({ fontSize: 'xs', color: 'text.muted' })}>
                      r = {Math.round(ring.radius)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className={css({
              p: '5',
              borderTop: '1px solid',
              borderColor: 'border',
              display: 'flex',
              flexDirection: 'column',
              gap: '3',
            })}>
              <div className={css({
                p: '3',
                borderRadius: 'lg',
                bg: isConfirmed ? 'success/10' : 'warning/10',
                border: '1px solid',
                borderColor: isConfirmed ? 'success/20' : 'warning/20',
                display: 'flex',
                gap: '2',
              })}>
                {isConfirmed ? (
                  <CheckCircle2 size={16} className={css({ color: 'success', flexShrink: 0, mt: '1px' })} />
                ) : (
                  <AlertTriangle size={16} className={css({ color: 'warning', flexShrink: 0, mt: '1px' })} />
                )}
                <p className={css({ fontSize: 'xs', color: 'text.secondary', m: 0, lineHeight: '1.5' })}>
                  {isConfirmed 
                    ? '已确认并写入批次档案' 
                    : '智能圈选结果须经人工确认后方可提交'}
                </p>
              </div>
              
              <div className={css({ display: 'flex', gap: '3' })}>
                <Button 
                  variant="secondary" 
                  className={css({ flex: 1 })}
                  onClick={() => setCurrentImageIndex(i => Math.max(0, i - 1))}
                  disabled={currentImageIndex === 0}
                >
                  <ChevronLeft size={16} />
                  上一张
                </Button>
                <Button 
                  className={css({ flex: 1 })}
                  onClick={handleConfirm}
                  disabled={totalRings === 0 || isConfirmed || aiProcessing}
                >
                  {isConfirmed ? '已确认' : '确认提交'}
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className={css({
          height: '56px',
          bg: 'white',
          borderTop: '1px solid',
          borderColor: 'border',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: '6',
        })}>
          <div className={css({ display: 'flex', alignItems: 'center', gap: '4' })}>
            <span className={css({ fontSize: 'sm', color: 'text.muted' })}>
              待处理：{pendingImages.length} 张
            </span>
            <span className={css({ fontSize: 'sm', color: 'text.muted' })}>
              已确认：{images.filter(i => i.status === 'confirmed').length} 张
            </span>
          </div>
          <div className={css({ display: 'flex', gap: '3' })}>
            <Button variant="ghost" size="sm" onClick={() => setCurrentPage('upload')}>
              返回上传
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage('batches')}>
              查看批次
            </Button>
          </div>
        </div>
      </PageContent>

      {showConfirmDialog && (
        <div className={css({
          position: 'fixed',
          inset: 0,
          bg: 'black/50',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
        })}>
          <div className={css({
            width: '400px',
            bg: 'white',
            borderRadius: 'xl',
            boxShadow: 'xl',
            overflow: 'hidden',
          })}>
            <div className={css({ p: '6', pb: '4' })}>
              <div className={css({
                width: '48px',
                height: '48px',
                borderRadius: 'full',
                bg: 'warning/10',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'warning',
                mb: '4',
              })}>
                <AlertTriangle size={24} />
              </div>
              <h3 className={css({ fontSize: 'lg', fontWeight: '600', color: 'text.primary', m: 0, mb: '2' })}>
                确认提交生长纹计数
              </h3>
              <p className={css({ fontSize: 'sm', color: 'text.secondary', m: 0, lineHeight: '1.6' })}>
                确认后将把 <strong>{totalRings} 条</strong> 生长纹计数写入 
                <strong>{currentBatch?.name}</strong> 批次档案。
                <br />
                此操作将作为补贴申报的依据，请仔细核对。
              </p>
            </div>
            <div className={css({
              p: '5',
              bg: 'surface-muted',
              borderTop: '1px solid',
              borderColor: 'border',
              display: 'flex',
              gap: '3',
              justifyContent: 'flex-end',
            })}>
              <Button variant="secondary" onClick={() => setShowConfirmDialog(false)}>
                取消
              </Button>
              <Button onClick={submitConfirmation}>
                <CheckCircle2 size={16} />
                确认提交
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
