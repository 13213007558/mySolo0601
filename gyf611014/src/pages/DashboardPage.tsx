import { css } from '../../styled-system/css'
import { PageHeader, PageContent } from '@/components/layout/AppLayout'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useAppStore } from '@/store/appStore'
import { 
  Shell, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  Users,
  Calendar,
  ArrowUpRight,
  Activity
} from 'lucide-react'

export function DashboardPage() {
  const { images, batches, inspectionOrders } = useAppStore()

  const totalImages = images.length
  const confirmedImages = images.filter(img => img.status === 'confirmed').length
  const processingImages = images.filter(img => img.status === 'processing' || img.status === 'reviewing').length
  const abnormalImages = images.filter(img => img.isAbnormal).length
  const activeBatches = batches.filter(b => b.status === 'active').length
  const pendingInspections = inspectionOrders.filter(o => o.status === 'pending').length

  const stats = [
    { label: '总样本数', value: totalImages, icon: Shell, color: 'primary' },
    { label: '已确认计数', value: confirmedImages, icon: CheckCircle2, color: 'success' },
    { label: '处理中', value: processingImages, icon: Clock, color: 'warning' },
    { label: '异常标记', value: abnormalImages, icon: AlertTriangle, color: 'danger' },
  ]

  return (
    <>
      <PageHeader
        title="数据概览"
        subtitle="实时监控壳环计数工作进度与质量指标"
      >
        <Badge variant="success">
          <Activity size={12} />
          系统运行正常
        </Badge>
      </PageHeader>
      <PageContent>
        <div className={css({ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6', mb: '6' })}>
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} variant="elevated" padding="md">
                <div className={css({ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' })}>
                  <div>
                    <p className={css({ fontSize: 'sm', color: 'text.muted', mb: '2', m: 0 })}>{stat.label}</p>
                    <p className={css({ fontSize: '3xl', fontWeight: '700', color: 'text.primary', m: 0 })}>{stat.value}</p>
                  </div>
                  <div className={css({
                    width: '44px',
                    height: '44px',
                    borderRadius: 'lg',
                    bg: stat.color === 'primary' ? 'primary/10' : 
                        stat.color === 'success' ? 'success/10' :
                        stat.color === 'warning' ? 'warning/10' : 'danger/10',
                    color: stat.color === 'primary' ? 'primary' : 
                           stat.color === 'success' ? 'success' :
                           stat.color === 'warning' ? 'warning' : 'danger',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  })}>
                    <Icon size={22} />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        <div className={css({ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '6', mb: '6' })}>
          <Card variant="default" padding="md">
            <CardHeader>
              <CardTitle>养殖批次进度</CardTitle>
            </CardHeader>
            <CardBody>
              <div className={css({ display: 'flex', flexDirection: 'column', gap: '4' })}>
                {batches.map((batch) => {
                  const progress = (batch.confirmedCount / batch.totalCount) * 100
                  return (
                    <div key={batch.id}>
                      <div className={css({ display: 'flex', justifyContent: 'space-between', mb: '2' })}>
                        <div>
                          <span className={css({ fontSize: 'sm', fontWeight: '500', color: 'text.primary' })}>{batch.name}</span>
                          <span className={css({ fontSize: 'xs', color: 'text.muted', ml: '2' })}>{batch.farm}</span>
                        </div>
                        <span className={css({ fontSize: 'sm', fontWeight: '600', color: 'primary' })}>
                          {batch.confirmedCount}/{batch.totalCount}
                        </span>
                      </div>
                      <div className={css({
                        width: 'full',
                        height: '8px',
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
                          })}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardBody>
          </Card>

          <Card variant="default" padding="md">
            <CardHeader>
              <CardTitle>快速统计</CardTitle>
            </CardHeader>
            <CardBody>
              <div className={css({ display: 'flex', flexDirection: 'column', gap: '4' })}>
                <div className={css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' })}>
                  <div className={css({ display: 'flex', alignItems: 'center', gap: '2' })}>
                    <Users size={16} className={css({ color: 'text.muted' })} />
                    <span className={css({ fontSize: 'sm', color: 'text.secondary' })}>活跃批次</span>
                  </div>
                  <span className={css({ fontSize: 'sm', fontWeight: '600', color: 'text.primary' })}>{activeBatches}</span>
                </div>
                <div className={css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' })}>
                  <div className={css({ display: 'flex', alignItems: 'center', gap: '2' })}>
                    <AlertTriangle size={16} className={css({ color: 'warning' })} />
                    <span className={css({ fontSize: 'sm', color: 'text.secondary' })}>待检工单</span>
                  </div>
                  <span className={css({ fontSize: 'sm', fontWeight: '600', color: 'warning' })}>{pendingInspections}</span>
                </div>
                <div className={css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' })}>
                  <div className={css({ display: 'flex', alignItems: 'center', gap: '2' })}>
                    <TrendingUp size={16} className={css({ color: 'success' })} />
                    <span className={css({ fontSize: 'sm', color: 'text.secondary' })}>平均生长率</span>
                  </div>
                  <span className={css({ fontSize: 'sm', fontWeight: '600', color: 'success' })}>0.92 mm/月</span>
                </div>
                <div className={css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' })}>
                  <div className={css({ display: 'flex', alignItems: 'center', gap: '2' })}>
                    <Calendar size={16} className={css({ color: 'text.muted' })} />
                    <span className={css({ fontSize: 'sm', color: 'text.secondary' })}>本月处理</span>
                  </div>
                  <span className={css({ fontSize: 'sm', fontWeight: '600', color: 'text.primary' })}>156 张</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className={css({ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6' })}>
          <Card variant="default" padding="md">
            <CardHeader>
              <div className={css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' })}>
                <CardTitle>最近上传</CardTitle>
                <button className={css({
                  fontSize: 'sm',
                  color: 'primary',
                  bg: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1',
                })}>
                  查看全部 <ArrowUpRight size={14} />
                </button>
              </div>
            </CardHeader>
            <CardBody>
              <div className={css({ display: 'flex', flexDirection: 'column', gap: '3' })}>
                {images.slice(0, 5).map((img) => {
                  const batch = batches.find(b => b.id === img.batchId)
                  const statusConfig = {
                    pending: { label: '待处理', variant: 'subtle' as const },
                    processing: { label: '处理中', variant: 'warning' as const },
                    reviewing: { label: '待审核', variant: 'info' as const },
                    confirmed: { label: '已确认', variant: 'success' as const },
                    rejected: { label: '已驳回', variant: 'danger' as const },
                  }
                  const status = statusConfig[img.status]
                  
                  return (
                    <div key={img.id} className={css({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3',
                      p: '2',
                      borderRadius: 'md',
                      _hover: { bg: 'surface-hover' },
                      cursor: 'pointer',
                      transition: 'bg 0.15s',
                    })}>
                      <div className={css({
                        width: '44px',
                        height: '44px',
                        borderRadius: 'md',
                        bg: 'surface-muted',
                        overflow: 'hidden',
                        flexShrink: 0,
                      })}>
                        <img src={img.url} alt="" className={css({ width: 'full', height: 'full', objectFit: 'cover' })} />
                      </div>
                      <div className={css({ flex: 1, minWidth: 0 })}>
                        <p className={css({ fontSize: 'sm', fontWeight: '500', color: 'text.primary', m: 0, truncate: true })}>{img.name}</p>
                        <p className={css({ fontSize: 'xs', color: 'text.muted', m: 0, mt: '1' })}>
                          {batch?.name} · {img.uploadTime}
                        </p>
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                  )
                })}
              </div>
            </CardBody>
          </Card>

          <Card variant="default" padding="md">
            <CardHeader>
              <div className={css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' })}>
                <CardTitle>待检工单</CardTitle>
                <button className={css({
                  fontSize: 'sm',
                  color: 'primary',
                  bg: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1',
                })}>
                  查看全部 <ArrowUpRight size={14} />
                </button>
              </div>
            </CardHeader>
            <CardBody>
              <div className={css({ display: 'flex', flexDirection: 'column', gap: '3' })}>
                {inspectionOrders.slice(0, 4).map((order) => {
                  const statusConfig = {
                    pending: { label: '待处理', variant: 'warning' as const },
                    processing: { label: '处理中', variant: 'info' as const },
                    completed: { label: '已完成', variant: 'success' as const },
                  }
                  const status = statusConfig[order.status]
                  
                  return (
                    <div key={order.id} className={css({
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '3',
                      p: '3',
                      borderRadius: 'md',
                      bg: 'surface-muted/50',
                    })}>
                      <div className={css({
                        width: '32px',
                        height: '32px',
                        borderRadius: 'md',
                        bg: order.status === 'pending' ? 'warning/10' : 
                            order.status === 'processing' ? 'info/10' : 'success/10',
                        color: order.status === 'pending' ? 'warning' : 
                               order.status === 'processing' ? 'info' : 'success',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      })}>
                        <AlertTriangle size={16} />
                      </div>
                      <div className={css({ flex: 1, minWidth: 0 })}>
                        <div className={css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '1' })}>
                          <span className={css({ fontSize: 'sm', fontWeight: '500', color: 'text.primary' })}>
                            {order.imageId}
                          </span>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        <p className={css({ fontSize: 'xs', color: 'text.secondary', m: 0, lineClamp: 1 })}>
                          {order.reason}
                        </p>
                        <p className={css({ fontSize: 'xs', color: 'text.muted', m: '1', mt: '2' })}>
                          {order.createTime}
                        </p>
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
