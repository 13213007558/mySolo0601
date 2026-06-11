import { useState } from 'react'
import { css } from '../../styled-system/css'
import { PageHeader, PageContent } from '@/components/layout/AppLayout'
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAppStore } from '@/store/appStore'
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  User,
  Calendar,
  Filter,
  Search,
  Plus,
  Send,
  X,
  Eye,
  MessageSquare
} from 'lucide-react'

export function InspectionPage() {
  const { inspectionOrders, batches, images, updateInspectionStatus } = useAppStore()
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedImageId, setSelectedImageId] = useState('')
  const [reason, setReason] = useState('')

  const filteredOrders = inspectionOrders.filter(order => 
    filterStatus === 'all' || order.status === filterStatus
  )

  const statusConfig = {
    pending: { label: '待处理', variant: 'warning' as const, icon: Clock },
    processing: { label: '处理中', variant: 'info' as const, icon: Clock },
    completed: { label: '已完成', variant: 'success' as const, icon: CheckCircle2 },
  }

  const pendingCount = inspectionOrders.filter(o => o.status === 'pending').length
  const processingCount = inspectionOrders.filter(o => o.status === 'processing').length
  const completedCount = inspectionOrders.filter(o => o.status === 'completed').length

  const statusFilters = [
    { id: 'all', label: '全部', count: inspectionOrders.length },
    { id: 'pending', label: '待处理', count: pendingCount },
    { id: 'processing', label: '处理中', count: processingCount },
    { id: 'completed', label: '已完成', count: completedCount },
  ]

  const abnormalImages = images.filter(img => img.isAbnormal)

  const handleCreateOrder = () => {
    if (!selectedImageId || !reason) return
    
    const img = images.find(i => i.id === selectedImageId)
    if (img) {
      useAppStore.getState().addInspectionOrder({
        imageId: img.id,
        batchId: img.batchId,
        reason,
        status: 'pending',
      })
    }
    
    setShowCreateDialog(false)
    setSelectedImageId('')
    setReason('')
  }

  return (
    <>
      <PageHeader
        title="送检工单"
        subtitle="管理异常壳形标记与专家送检工单"
      >
        <Button leftIcon={<Plus size={16} />} onClick={() => setShowCreateDialog(true)}>
          创建工单
        </Button>
      </PageHeader>

      <PageContent>
        <div className={css({ display: 'flex', flexDirection: 'column', gap: '6' })}>
          <div className={css({ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4' })}>
            {statusFilters.map((filter) => {
              const isActive = filterStatus === filter.id
              return (
                <div
                  key={filter.id}
                  onClick={() => setFilterStatus(filter.id)}
                  className={css({
                    p: '4',
                    borderRadius: 'xl',
                    border: '1px solid',
                    borderColor: isActive ? 'primary' : 'border',
                    bg: isActive ? 'primary/5' : 'surface',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    _hover: {
                      borderColor: isActive ? 'primary' : 'border-strong',
                    },
                  })}
                >
                  <p className={css({ fontSize: 'sm', color: isActive ? 'primary' : 'text.secondary', mb: '2', m: 0 })}>
                    {filter.label}
                  </p>
                  <p className={css({ fontSize: '2xl', fontWeight: '700', color: isActive ? 'primary' : 'text.primary', m: 0 })}>
                    {filter.count}
                  </p>
                </div>
              )
            })}
          </div>

          <Card variant="default" padding="none">
            <CardHeader>
              <div className={css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' })}>
                <CardTitle>工单列表</CardTitle>
                <div className={css({ display: 'flex', gap: '2' })}>
                  <div className={css({ position: 'relative' })}>
                    <Search size={14} className={css({
                      position: 'absolute',
                      left: '2.5',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'text.muted',
                    })} />
                    <input
                      type="text"
                      placeholder="搜索工单..."
                      className={css({
                        width: '200px',
                        height: '8',
                        pl: '7',
                        pr: '3',
                        fontSize: 'xs',
                        borderRadius: 'md',
                        border: '1px solid',
                        borderColor: 'border',
                        bg: 'surface',
                        outline: 'none',
                        _focus: {
                          borderColor: 'primary',
                        },
                      })}
                    />
                  </div>
                  <Button variant="secondary" size="sm" leftIcon={<Filter size={14} />}>
                    筛选
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardBody className={css({ p: 0 })}>
              <div className={css({ display: 'flex', flexDirection: 'column' })}>
                {filteredOrders.map((order) => {
                  const status = statusConfig[order.status]
                  const StatusIcon = status.icon
                  const batch = batches.find(b => b.id === order.batchId)
                  const image = images.find(img => img.id === order.imageId)

                  return (
                    <div
                      key={order.id}
                      className={css({
                        p: '4',
                        borderBottom: '1px solid',
                        borderColor: 'border',
                        display: 'flex',
                        gap: '4',
                        transition: 'bg 0.15s',
                        _hover: { bg: 'surface-hover' },
                        _last: { borderBottom: 'none' },
                      })}
                    >
                      <div className={css({
                        width: '44px',
                        height: '44px',
                        borderRadius: 'lg',
                        bg: order.status === 'pending' ? 'warning/10' :
                            order.status === 'processing' ? 'info/10' : 'success/10',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: order.status === 'pending' ? 'warning' :
                               order.status === 'processing' ? 'info' : 'success',
                        flexShrink: 0,
                      })}>
                        <AlertTriangle size={20} />
                      </div>

                      <div className={css({ flex: 1, minWidth: 0 })}>
                        <div className={css({ display: 'flex', justifyContent: 'space-between', mb: '2' })}>
                          <div className={css({ display: 'flex', alignItems: 'center', gap: '3' })}>
                            <h4 className={css({ fontSize: 'sm', fontWeight: '600', color: 'text.primary', m: 0 })}>
                              {order.imageId}
                            </h4>
                            <Badge variant={status.variant}>
                              <StatusIcon size={12} />
                              {status.label}
                            </Badge>
                          </div>
                          <div className={css({ display: 'flex', gap: '2' })}>
                            <Button variant="ghost" size="sm">
                              <Eye size={14} />
                              查看
                            </Button>
                            {order.status === 'pending' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => updateInspectionStatus(order.id, 'processing')}
                              >
                                <Send size={14} />
                                接单
                              </Button>
                            )}
                            {order.status === 'processing' && (
                              <Button 
                                size="sm"
                                onClick={() => updateInspectionStatus(order.id, 'completed')}
                              >
                                <CheckCircle2 size={14} />
                                完成
                              </Button>
                            )}
                          </div>
                        </div>

                        <p className={css({ fontSize: 'sm', color: 'text.secondary', m: 0, mb: '2', lineClamp: 2 })}>
                          {order.reason}
                        </p>

                        <div className={css({ display: 'flex', gap: '4', fontSize: 'xs', color: 'text.muted' })}>
                          <span className={css({ display: 'flex', alignItems: 'center', gap: '1' })}>
                            <Calendar size={12} />
                            {order.createTime}
                          </span>
                          {batch && (
                            <span className={css({ display: 'flex', alignItems: 'center', gap: '1' })}>
                              批次：{batch.name}
                            </span>
                          )}
                          {order.assignee && (
                            <span className={css({ display: 'flex', alignItems: 'center', gap: '1' })}>
                              <User size={12} />
                              {order.assignee}
                            </span>
                          )}
                        </div>
                      </div>

                      {image && (
                        <div className={css({
                          width: '64px',
                          height: '64px',
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
                    </div>
                  )
                })}
              </div>
            </CardBody>
          </Card>

          {abnormalImages.length > 0 && (
            <Card variant="default" padding="md">
              <CardHeader>
                <CardTitle>待标记异常样本</CardTitle>
              </CardHeader>
              <CardBody>
                <div className={css({ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4' })}>
                  {abnormalImages.slice(0, 6).map((img) => {
                    const batch = batches.find(b => b.id === img.batchId)
                    return (
                      <div key={img.id} className={css({
                        borderRadius: 'lg',
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: 'border',
                      })}>
                        <div className={css({ aspectRatio: '1', position: 'relative' })}>
                          <img 
                            src={img.url} 
                            alt={img.name}
                            className={css({ width: 'full', height: 'full', objectFit: 'cover' })}
                          />
                          <div className={css({
                            position: 'absolute',
                            top: '2',
                            right: '2',
                          })}>
                            <Badge variant="danger">异常</Badge>
                          </div>
                        </div>
                        <div className={css({ p: '2' })}>
                          <p className={css({ fontSize: 'xs', fontWeight: '500', color: 'text.primary', m: 0, truncate: true })}>
                            {img.name}
                          </p>
                          <p className={css({ fontSize: '10px', color: 'text.muted', m: 0, mt: '1', truncate: true })}>
                            {batch?.name}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </PageContent>

      {showCreateDialog && (
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
            width: '480px',
            bg: 'white',
            borderRadius: 'xl',
            boxShadow: 'xl',
            overflow: 'hidden',
          })}>
            <div className={css({
              p: '5',
              borderBottom: '1px solid',
              borderColor: 'border',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            })}>
              <h3 className={css({ fontSize: 'lg', fontWeight: '600', color: 'text.primary', m: 0 })}>
                创建送检工单
              </h3>
              <button
                onClick={() => setShowCreateDialog(false)}
                className={css({
                  width: '32px',
                  height: '32px',
                  borderRadius: 'md',
                  border: 'none',
                  bg: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'text.muted',
                  _hover: { bg: 'surface-hover', color: 'text.primary' },
                })}
              >
                <X size={18} />
              </button>
            </div>

            <div className={css({ p: '5' })}>
              <div className={css({ mb: '4' })}>
                <label className={css({ fontSize: 'sm', fontWeight: '500', color: 'text.primary', mb: '2', display: 'block' })}>
                  选择样本
                </label>
                <select
                  value={selectedImageId}
                  onChange={(e) => setSelectedImageId(e.target.value)}
                  className={css({
                    width: 'full',
                    height: '10',
                    px: '3',
                    fontSize: 'sm',
                    borderRadius: 'md',
                    border: '1px solid',
                    borderColor: 'border',
                    bg: 'surface',
                    outline: 'none',
                    _focus: {
                      borderColor: 'primary',
                    },
                  })}
                >
                  <option value="">请选择异常样本</option>
                  {abnormalImages.map(img => (
                    <option key={img.id} value={img.id}>{img.name} - {img.abnormalReason}</option>
                  ))}
                </select>
              </div>

              <div className={css({ mb: '4' })}>
                <label className={css({ fontSize: 'sm', fontWeight: '500', color: 'text.primary', mb: '2', display: 'block' })}>
                  送检原因
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="请详细描述异常情况..."
                  rows={4}
                  className={css({
                    width: 'full',
                    p: '3',
                    fontSize: 'sm',
                    borderRadius: 'md',
                    border: '1px solid',
                    borderColor: 'border',
                    bg: 'surface',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    _focus: {
                      borderColor: 'primary',
                    },
                  })}
                />
              </div>

              <div className={css({
                p: '3',
                borderRadius: 'lg',
                bg: 'info/5',
                border: '1px solid',
                borderColor: 'info/20',
                display: 'flex',
                gap: '2',
              })}>
                <MessageSquare size={16} className={css({ color: 'info', flexShrink: 0, mt: '1px' })} />
                <p className={css({ fontSize: 'xs', color: 'text.secondary', m: 0, lineHeight: '1.5' })}>
                  提交后将自动通知相关检验人员。异常壳形标记后，该样本将不参与批次平均计数统计。
                </p>
              </div>
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
              <Button variant="secondary" onClick={() => setShowCreateDialog(false)}>
                取消
              </Button>
              <Button 
                onClick={handleCreateOrder}
                disabled={!selectedImageId || !reason}
              >
                <Send size={16} />
                提交工单
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
