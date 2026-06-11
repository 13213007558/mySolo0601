import { useState, useEffect } from 'react'
import { css } from '../../styled-system/css'
import { PageHeader, PageContent } from '@/components/layout/AppLayout'
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAppStore } from '@/store/appStore'
import { 
  ListTodo, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Loader2,
  Play,
  Pause,
  X,
  Upload,
  Settings,
  ChevronDown,
  RefreshCw,
  Trash2
} from 'lucide-react'

export function QueuePage() {
  const { queueItems, updateQueueItem, images, batches } = useAppStore()
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    if (!isRunning) return

    const processingItem = queueItems.find(item => item.status === 'processing')
    if (!processingItem) {
      const nextItem = queueItems.find(item => item.status === 'queued')
      if (nextItem) {
        updateQueueItem(nextItem.id, { status: 'processing', progress: 0 })
      } else {
        setIsRunning(false)
      }
      return
    }

    const timer = setInterval(() => {
      if (processingItem.progress >= 100) {
        updateQueueItem(processingItem.id, { status: 'completed', progress: 100 })
        
        const nextItem = queueItems.find(item => item.status === 'queued')
        if (nextItem) {
          setTimeout(() => {
            updateQueueItem(nextItem.id, { status: 'processing', progress: 0 })
          }, 300)
        } else {
          setIsRunning(false)
        }
      } else {
        updateQueueItem(processingItem.id, { 
          progress: Math.min(processingItem.progress + Math.random() * 15, 100) 
        })
      }
    }, 400)

    return () => clearInterval(timer)
  }, [isRunning, queueItems, updateQueueItem])

  const queuedCount = queueItems.filter(i => i.status === 'queued').length
  const processingCount = queueItems.filter(i => i.status === 'processing').length
  const completedCount = queueItems.filter(i => i.status === 'completed').length
  const failedCount = queueItems.filter(i => i.status === 'failed').length

  const statusConfig = {
    queued: { label: '排队中', variant: 'subtle' as const, icon: Clock, color: 'text.muted' },
    processing: { label: '处理中', variant: 'info' as const, icon: Loader2, color: 'info' },
    completed: { label: '已完成', variant: 'success' as const, icon: CheckCircle2, color: 'success' },
    failed: { label: '失败', variant: 'danger' as const, icon: XCircle, color: 'danger' },
  }

  const toggleRun = () => {
    if (isRunning) {
      setIsRunning(false)
    } else {
      const hasQueued = queueItems.some(i => i.status === 'queued')
      const hasProcessing = queueItems.some(i => i.status === 'processing')
      if (hasQueued || hasProcessing) {
        setIsRunning(true)
      }
    }
  }

  const clearCompleted = () => {
    // 在实际应用中会清除已完成的任务
  }

  const totalProgress = queueItems.length > 0
    ? Math.round((completedCount / queueItems.length) * 100)
    : 0

  return (
    <>
      <PageHeader
        title="批量处理"
        subtitle="批量进行AI生长纹识别与处理"
      >
        <div className={css({ display: 'flex', gap: '3' })}>
          <Button 
            variant={isRunning ? 'secondary' : 'primary'} 
            leftIcon={isRunning ? <Pause size={16} /> : <Play size={16} />}
            onClick={toggleRun}
            disabled={queuedCount === 0 && processingCount === 0}
          >
            {isRunning ? '暂停处理' : '开始处理'}
          </Button>
        </div>
      </PageHeader>

      <PageContent>
        <div className={css({ display: 'flex', flexDirection: 'column', gap: '6' })}>
          <div className={css({ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4' })}>
            <div className={css({
              p: '4',
              borderRadius: 'xl',
              bg: 'surface',
              border: '1px solid',
              borderColor: 'border',
            })}>
              <div className={css({ display: 'flex', alignItems: 'center', gap: '3', mb: '2' })}>
                <div className={css({
                  width: '36px',
                  height: '36px',
                  borderRadius: 'lg',
                  bg: 'surface-muted',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'text.muted',
                })}>
                  <Clock size={18} />
                </div>
                <span className={css({ fontSize: 'sm', color: 'text.secondary' })}>排队中</span>
              </div>
              <p className={css({ fontSize: '2xl', fontWeight: '700', color: 'text.primary', m: 0 })}>
                {queuedCount}
              </p>
            </div>

            <div className={css({
              p: '4',
              borderRadius: 'xl',
              bg: 'info/5',
              border: '1px solid',
              borderColor: 'info/20',
            })}>
              <div className={css({ display: 'flex', alignItems: 'center', gap: '3', mb: '2' })}>
                <div className={css({
                  width: '36px',
                  height: '36px',
                  borderRadius: 'lg',
                  bg: 'info/10',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'info',
                })}>
                  <Loader2 size={18} className={css({ animation: isRunning ? 'spin 1s linear infinite' : 'none' })} />
                </div>
                <span className={css({ fontSize: 'sm', color: 'text.secondary' })}>处理中</span>
              </div>
              <p className={css({ fontSize: '2xl', fontWeight: '700', color: 'info', m: 0 })}>
                {processingCount}
              </p>
            </div>

            <div className={css({
              p: '4',
              borderRadius: 'xl',
              bg: 'success/5',
              border: '1px solid',
              borderColor: 'success/20',
            })}>
              <div className={css({ display: 'flex', alignItems: 'center', gap: '3', mb: '2' })}>
                <div className={css({
                  width: '36px',
                  height: '36px',
                  borderRadius: 'lg',
                  bg: 'success/10',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'success',
                })}>
                  <CheckCircle2 size={18} />
                </div>
                <span className={css({ fontSize: 'sm', color: 'text.secondary' })}>已完成</span>
              </div>
              <p className={css({ fontSize: '2xl', fontWeight: '700', color: 'success', m: 0 })}>
                {completedCount}
              </p>
            </div>

            <div className={css({
              p: '4',
              borderRadius: 'xl',
              bg: 'danger/5',
              border: '1px solid',
              borderColor: 'danger/20',
            })}>
              <div className={css({ display: 'flex', alignItems: 'center', gap: '3', mb: '2' })}>
                <div className={css({
                  width: '36px',
                  height: '36px',
                  borderRadius: 'lg',
                  bg: 'danger/10',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'danger',
                })}>
                  <XCircle size={18} />
                </div>
                <span className={css({ fontSize: 'sm', color: 'text.secondary' })}>失败</span>
              </div>
              <p className={css({ fontSize: '2xl', fontWeight: '700', color: 'danger', m: 0 })}>
                {failedCount}
              </p>
            </div>
          </div>

          <Card variant="default" padding="md">
            <CardHeader>
              <div className={css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' })}>
                <div>
                  <CardTitle>总体进度</CardTitle>
                  <p className={css({ fontSize: 'sm', color: 'text.muted', mt: '1', m: 0 })}>
                    共 {queueItems.length} 个任务
                  </p>
                </div>
                <div className={css({ display: 'flex', gap: '2' })}>
                  <Button variant="secondary" size="sm" leftIcon={<RefreshCw size={14} />}>
                    刷新
                  </Button>
                  <Button variant="ghost" size="sm" leftIcon={<Trash2 size={14} />} onClick={clearCompleted}>
                    清除已完成
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <div className={css({
                width: 'full',
                height: '12px',
                bg: 'surface-muted',
                borderRadius: 'full',
                overflow: 'hidden',
              })}>
                <div
                  className={css({
                    height: 'full',
                    bg: 'primary',
                    borderRadius: 'full',
                    transition: 'width 0.5s ease',
                    background: 'linear-gradient(90deg, #0D9488, #14B8A6)',
                  })}
                  style={{ width: `${totalProgress}%` }}
                />
              </div>
              <div className={css({ display: 'flex', justifyContent: 'space-between', mt: '2', fontSize: 'sm', color: 'text.muted' })}>
                <span>{totalProgress}% 完成</span>
                <span>预计剩余时间: {queuedCount * 2} 分钟</span>
              </div>
            </CardBody>
          </Card>

          <Card variant="default" padding="none">
            <CardHeader>
              <div className={css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' })}>
                <CardTitle>任务队列</CardTitle>
                <div className={css({ display: 'flex', gap: '2' })}>
                  <Button variant="secondary" size="sm" leftIcon={<Upload size={14} />}>
                    添加任务
                  </Button>
                  <div className={css({ position: 'relative' })}>
                    <Button variant="ghost" size="sm" rightIcon={<ChevronDown size={14} />}>
                      排序
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardBody className={css({ p: 0 })}>
              <div className={css({
                display: 'grid',
                gridTemplateColumns: '60px 1fr 100px 120px 100px 80px',
                px: '4',
                py: '2',
                bg: 'surface-muted',
                borderBottom: '1px solid',
                borderColor: 'border',
                fontSize: 'xs',
                fontWeight: '500',
                color: 'text.muted',
              })}>
                <span>状态</span>
                <span>样本名称</span>
                <span>批次</span>
                <span>进度</span>
                <span>操作</span>
              </div>

              <div className={css({ maxHeight: '400px', overflowY: 'auto' })}>
                {queueItems.map((item) => {
                  const status = statusConfig[item.status]
                  const StatusIcon = status.icon
                  const batch = batches.find(b => b.id === item.batchId)
                  const image = images.find(img => img.id === item.imageId)

                  return (
                    <div
                      key={item.id}
                      className={css({
                        display: 'grid',
                        gridTemplateColumns: '60px 1fr 100px 120px 100px 80px',
                        alignItems: 'center',
                        px: '4',
                        py: '3',
                        borderBottom: '1px solid',
                        borderColor: 'border',
                        _hover: { bg: 'surface-hover' },
                        transition: 'bg 0.15s',
                      })}
                    >
                      <div className={css({
                        width: '36px',
                        height: '36px',
                        borderRadius: 'lg',
                        bg: item.status === 'queued' ? 'surface-muted' :
                            item.status === 'processing' ? 'info/10' :
                            item.status === 'completed' ? 'success/10' : 'danger/10',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: status.color,
                      })}>
                        <StatusIcon size={16} className={css({
                          animation: item.status === 'processing' && isRunning ? 'spin 1s linear infinite' : 'none',
                        })} />
                      </div>

                      <div className={css({ display: 'flex', alignItems: 'center', gap: '3', minWidth: 0 })}>
                        {image && (
                          <div className={css({
                            width: '40px',
                            height: '40px',
                            borderRadius: 'md',
                            overflow: 'hidden',
                            border: '1px solid',
                            borderColor: 'border',
                            flexShrink: 0,
                          })}>
                            <img 
                              src={image.url} 
                              alt=""
                              className={css({ width: 'full', height: 'full', objectFit: 'cover' })}
                            />
                          </div>
                        )}
                        <div className={css({ minWidth: 0 })}>
                          <p className={css({ fontSize: 'sm', fontWeight: '500', color: 'text.primary', m: 0, truncate: true })}>
                            {item.imageName}
                          </p>
                          <p className={css({ fontSize: 'xs', color: 'text.muted', m: 0, mt: '1' })}>
                            {status.label}
                          </p>
                        </div>
                      </div>

                      <div className={css({ fontSize: 'xs', color: 'text.secondary' })}>
                        {batch?.name || item.batchId}
                      </div>

                      <div>
                        <div className={css({
                          width: 'full',
                          height: '6px',
                          bg: 'surface-muted',
                          borderRadius: 'full',
                          overflow: 'hidden',
                          mb: '1',
                        })}>
                          <div
                            className={css({
                              height: 'full',
                              bg: item.status === 'failed' ? 'danger' : 'primary',
                              borderRadius: 'full',
                              transition: 'width 0.3s ease',
                            })}
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <span className={css({ fontSize: 'xs', color: 'text.muted' })}>
                          {Math.round(item.progress)}%
                        </span>
                      </div>

                      <div className={css({ display: 'flex', gap: '1' })}>
                        <button className={css({
                          width: '28px',
                          height: '28px',
                          borderRadius: 'md',
                          border: 'none',
                          bg: 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'text.muted',
                          _hover: { bg: 'surface-hover', color: 'text.primary' },
                        })}>
                          <Settings size={14} />
                        </button>
                        {item.status === 'queued' && (
                          <button className={css({
                            width: '28px',
                            height: '28px',
                            borderRadius: 'md',
                            border: 'none',
                            bg: 'transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'text.muted',
                            _hover: { bg: 'danger/10', color: 'danger' },
                          })}>
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardBody>
          </Card>
        </div>
      </PageContent>
    </>
  )
}
