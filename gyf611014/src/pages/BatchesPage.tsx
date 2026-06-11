import { useState } from 'react'
import { css } from '../../styled-system/css'
import { PageHeader, PageContent } from '@/components/layout/AppLayout'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAppStore } from '@/store/appStore'
import { 
  Layers, 
  Calendar, 
  MapPin, 
  Fish,
  TrendingUp,
  Shell,
  ChevronRight,
  Search,
  Filter,
  Eye,
  Download,
  MoreHorizontal,
  BarChart3
} from 'lucide-react'

export function BatchesPage() {
  const { batches, images, setCurrentPage, setSelectedImageId } = useAppStore()
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredBatches = batches.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.farm.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedBatch = batches.find(b => b.id === selectedBatchId)
  const batchImages = selectedBatch 
    ? images.filter(img => img.batchId === selectedBatch.id)
    : []

  const confirmedImages = batchImages.filter(img => img.status === 'confirmed')
  const avgRingCount = confirmedImages.length > 0
    ? (confirmedImages.reduce((sum, img) => sum + (img.ringCount || 0), 0) / confirmedImages.length).toFixed(1)
    : '-'
  
  const avgGrowthRate = confirmedImages.length > 0 && confirmedImages[0]?.growthRate
    ? (confirmedImages.reduce((sum, img) => sum + (img.growthRate || 0), 0) / confirmedImages.length).toFixed(2)
    : '-'

  return (
    <>
      <PageHeader
        title="批次档案"
        subtitle="管理养殖批次，查看生长纹计数与增长率统计"
      >
        <Button onClick={() => setCurrentPage('upload')}>
          <Layers size={16} />
          新建批次
        </Button>
      </PageHeader>

      <PageContent>
        <div className={css({ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '6', height: '100%' })}>
          <Card variant="default" padding="none" className={css({ overflow: 'hidden' })}>
            <div className={css({ p: '4', borderBottom: '1px solid', borderColor: 'border' })}>
              <div className={css({
                position: 'relative',
                mb: '3',
              })}>
                <Search size={16} className={css({
                  position: 'absolute',
                  left: '3',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'text.muted',
                })} />
                <input
                  type="text"
                  placeholder="搜索批次名称..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={css({
                    width: 'full',
                    height: '9',
                    pl: '8',
                    pr: '3',
                    fontSize: 'sm',
                    borderRadius: 'md',
                    border: '1px solid',
                    borderColor: 'border',
                    bg: 'surface',
                    outline: 'none',
                    _focus: {
                      borderColor: 'primary',
                      boxShadow: '0 0 0 3px rgb(13 148 136 / 0.1)',
                    },
                  })}
                />
              </div>
              <div className={css({ display: 'flex', gap: '2' })}>
                <Button variant="secondary" size="sm" leftIcon={<Filter size={14} />}>
                  筛选
                </Button>
                <Button variant="ghost" size="sm">
                  全部
                </Button>
              </div>
            </div>

            <div className={css({ 
              overflowY: 'auto',
              maxHeight: 'calc(100vh - 220px)',
            })}>
              {filteredBatches.map((batch) => {
                const progress = (batch.confirmedCount / batch.totalCount) * 100
                const isActive = selectedBatchId === batch.id
                return (
                  <div
                    key={batch.id}
                    onClick={() => setSelectedBatchId(batch.id)}
                    className={css({
                      p: '4',
                      cursor: 'pointer',
                      borderBottom: '1px solid',
                      borderColor: 'border',
                      bg: isActive ? 'primary/5' : 'transparent',
                      transition: 'bg 0.15s',
                      _hover: { bg: 'surface-hover' },
                    })}
                  >
                    <div className={css({ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: '2' })}>
                      <div>
                        <h4 className={css({ fontSize: 'sm', fontWeight: '600', color: 'text.primary', m: 0, mb: '1' })}>
                          {batch.name}
                        </h4>
                        <div className={css({ display: 'flex', alignItems: 'center', gap: '1.5', fontSize: 'xs', color: 'text.muted' })}>
                          <MapPin size={12} />
                          {batch.farm}
                        </div>
                      </div>
                      <Badge variant={batch.status === 'active' ? 'primary' : 'subtle'}>
                        {batch.status === 'active' ? '进行中' : '已完成'}
                      </Badge>
                    </div>

                    <div className={css({ display: 'flex', gap: '3', mb: '2', fontSize: 'xs', color: 'text.muted' })}>
                      <span className={css({ display: 'flex', alignItems: 'center', gap: '1' })}>
                        <Fish size={12} />
                        {batch.breed}
                      </span>
                      <span className={css({ display: 'flex', alignItems: 'center', gap: '1' })}>
                        <Calendar size={12} />
                        {batch.startDate}
                      </span>
                    </div>

                    <div className={css({ mb: '1' })}>
                      <div className={css({ display: 'flex', justifyContent: 'space-between', mb: '1', fontSize: 'xs', color: 'text.muted' })}>
                        <span>完成进度</span>
                        <span className={css({ fontWeight: '500', color: 'text.secondary' })}>
                          {batch.confirmedCount}/{batch.totalCount}
                        </span>
                      </div>
                      <div className={css({
                        width: 'full',
                        height: '6px',
                        bg: 'surface-muted',
                        borderRadius: 'full',
                        overflow: 'hidden',
                      })}>
                        <div
                          className={css({
                            height: 'full',
                            bg: 'primary',
                            borderRadius: 'full',
                          })}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <div className={css({ display: 'flex', flexDirection: 'column', gap: '6' })}>
            {selectedBatch ? (
              <>
                <Card variant="default" padding="md">
                  <CardHeader>
                    <div className={css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' })}>
                      <div>
                        <CardTitle>{selectedBatch.name}</CardTitle>
                        <p className={css({ fontSize: 'sm', color: 'text.muted', mt: '1', m: 0 })}>
                          {selectedBatch.farm} · {selectedBatch.breed}
                        </p>
                      </div>
                      <div className={css({ display: 'flex', gap: '2' })}>
                        <Button variant="secondary" size="sm" leftIcon={<Download size={14} />}>
                          导出报告
                        </Button>
                        <Button size="sm" leftIcon={<BarChart3 size={14} />}>
                          数据分析
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <div className={css({ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4' })}>
                      <div className={css({
                        p: '4',
                        borderRadius: 'lg',
                        bg: 'primary/5',
                        textAlign: 'center',
                      })}>
                        <div className={css({
                          width: '40px',
                          height: '40px',
                          mx: 'auto',
                          mb: '2',
                          borderRadius: 'lg',
                          bg: 'primary/10',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'primary',
                        })}>
                          <Shell size={20} />
                        </div>
                        <p className={css({ fontSize: '2xl', fontWeight: '700', color: 'primary', m: 0 })}>
                          {selectedBatch.totalCount}
                        </p>
                        <p className={css({ fontSize: 'xs', color: 'text.muted', mt: '1', m: 0 })}>样本总数</p>
                      </div>
                      <div className={css({
                        p: '4',
                        borderRadius: 'lg',
                        bg: 'success/5',
                        textAlign: 'center',
                      })}>
                        <div className={css({
                          width: '40px',
                          height: '40px',
                          mx: 'auto',
                          mb: '2',
                          borderRadius: 'lg',
                          bg: 'success/10',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'success',
                        })}>
                          <Eye size={20} />
                        </div>
                        <p className={css({ fontSize: '2xl', fontWeight: '700', color: 'success', m: 0 })}>
                          {selectedBatch.confirmedCount}
                        </p>
                        <p className={css({ fontSize: 'xs', color: 'text.muted', mt: '1', m: 0 })}>已确认</p>
                      </div>
                      <div className={css({
                        p: '4',
                        borderRadius: 'lg',
                        bg: 'accent/10',
                        textAlign: 'center',
                      })}>
                        <div className={css({
                          width: '40px',
                          height: '40px',
                          mx: 'auto',
                          mb: '2',
                          borderRadius: 'lg',
                          bg: 'accent/20',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'accent-dark',
                        })}>
                          <Layers size={20} />
                        </div>
                        <p className={css({ fontSize: '2xl', fontWeight: '700', color: 'accent-dark', m: 0 })}>
                          {avgRingCount}
                        </p>
                        <p className={css({ fontSize: 'xs', color: 'text.muted', mt: '1', m: 0 })}>平均环数</p>
                      </div>
                      <div className={css({
                        p: '4',
                        borderRadius: 'lg',
                        bg: 'info/10',
                        textAlign: 'center',
                      })}>
                        <div className={css({
                          width: '40px',
                          height: '40px',
                          mx: 'auto',
                          mb: '2',
                          borderRadius: 'lg',
                          bg: 'info/20',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'info',
                        })}>
                          <TrendingUp size={20} />
                        </div>
                        <p className={css({ fontSize: '2xl', fontWeight: '700', color: 'info', m: 0 })}>
                          {avgGrowthRate}
                        </p>
                        <p className={css({ fontSize: 'xs', color: 'text.muted', mt: '1', m: 0 })}>月增长率(mm)</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card variant="default" padding="md" className={css({ flex: 1, display: 'flex', flexDirection: 'column' })}>
                  <CardHeader>
                    <div className={css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' })}>
                      <CardTitle>样本列表</CardTitle>
                      <div className={css({ display: 'flex', gap: '2' })}>
                        <Badge variant="success">已确认 {confirmedImages.length}</Badge>
                        <Badge variant="subtle">共 {batchImages.length}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardBody className={css({ flex: 1, overflowY: 'auto' })}>
                    <div className={css({ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(4, 1fr)', 
                      gap: '4' 
                    })}>
                      {batchImages.map((img) => {
                        const statusConfig = {
                          pending: { label: '待处理', variant: 'subtle' as const },
                          processing: { label: '处理中', variant: 'warning' as const },
                          reviewing: { label: '待审核', variant: 'info' as const },
                          confirmed: { label: '已确认', variant: 'success' as const },
                          rejected: { label: '已驳回', variant: 'danger' as const },
                        }
                        const status = statusConfig[img.status]
                        
                        return (
                          <div
                            key={img.id}
                            className={css({
                              borderRadius: 'lg',
                              border: '1px solid',
                              borderColor: 'border',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              _hover: {
                                boxShadow: 'md',
                                borderColor: 'primary',
                              },
                            })}
                            onClick={() => {
                              setSelectedImageId(img.id)
                              setCurrentPage('annotation')
                            }}
                          >
                            <div className={css({
                              aspectRatio: '1',
                              bg: 'surface-muted',
                              position: 'relative',
                            })}>
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
                                <Badge variant={status.variant}>{status.label}</Badge>
                              </div>
                              {img.isAbnormal && (
                                <div className={css({
                                  position: 'absolute',
                                  top: '2',
                                  left: '2',
                                })}>
                                  <Badge variant="danger">异常</Badge>
                                </div>
                              )}
                            </div>
                            <div className={css({ p: '3' })}>
                              <p className={css({ fontSize: 'sm', fontWeight: '500', color: 'text.primary', m: 0, truncate: true })}>
                                {img.name}
                              </p>
                              <div className={css({ display: 'flex', justifyContent: 'space-between', mt: '2', fontSize: 'xs', color: 'text.muted' })}>
                                <span>环数: {img.ringCount || img.aiRingCount || '-'}</span>
                                <span>
                                  <ChevronRight size={12} className={css({ display: 'inline', verticalAlign: 'middle' })} />
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardBody>
                </Card>
              </>
            ) : (
              <Card variant="default" padding="lg">
                <div className={css({ textAlign: 'center', py: '12' })}>
                  <div className={css({
                    width: '72px',
                    height: '72px',
                    mx: 'auto',
                    mb: '4',
                    borderRadius: 'full',
                    bg: 'surface-muted',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'text.muted',
                  })}>
                    <Layers size={32} />
                  </div>
                  <h3 className={css({ fontSize: 'lg', fontWeight: '600', color: 'text.primary', mb: '2' })}>
                    选择批次查看详情
                  </h3>
                  <p className={css({ fontSize: 'sm', color: 'text.muted', mb: '6' })}>
                    从左侧列表选择一个养殖批次，查看详细的生长纹计数与统计数据
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </PageContent>
    </>
  )
}
