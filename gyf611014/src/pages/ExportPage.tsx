import { useState } from 'react'
import { css } from '../../styled-system/css'
import { PageHeader, PageContent } from '@/components/layout/AppLayout'
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAppStore } from '@/store/appStore'
import { 
  FileSpreadsheet, 
  Download, 
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  Filter,
  Search,
  ChevronDown,
  FileCheck,
  ExternalLink,
  Settings,
  Printer
} from 'lucide-react'

type ExportFormat = 'excel' | 'pdf' | 'csv'

export function ExportPage() {
  const { batches, images } = useAppStore()
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([])
  const [exportFormat, setExportFormat] = useState<ExportFormat>('excel')
  const [searchQuery, setSearchQuery] = useState('')

  const completedBatches = batches.filter(b => b.status === 'completed' || b.confirmedCount > 0)
  const filteredBatches = completedBatches.filter(b =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.farm.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleBatchSelection = (batchId: string) => {
    setSelectedBatchIds(prev => 
      prev.includes(batchId)
        ? prev.filter(id => id !== batchId)
        : [...prev, batchId]
    )
  }

  const selectAll = () => {
    if (selectedBatchIds.length === filteredBatches.length) {
      setSelectedBatchIds([])
    } else {
      setSelectedBatchIds(filteredBatches.map(b => b.id))
    }
  }

  const totalSamples = selectedBatchIds.reduce((sum, batchId) => {
    const batch = batches.find(b => b.id === batchId)
    return sum + (batch?.confirmedCount || 0)
  }, 0)

  const totalAmount = selectedBatchIds.length * 5000

  const formatOptions: { id: ExportFormat; label: string; icon: typeof FileSpreadsheet; desc: string }[] = [
    { id: 'excel', label: 'Excel 格式', icon: FileSpreadsheet, desc: '.xlsx 标准表格格式' },
    { id: 'pdf', label: 'PDF 格式', icon: FileText, desc: '.pdf 打印存档格式' },
    { id: 'csv', label: 'CSV 格式', icon: FileText, desc: '.csv 数据交换格式' },
  ]

  const handleExport = () => {
    alert(`正在导出 ${selectedBatchIds.length} 个批次的数据...\n格式: ${exportFormat.toUpperCase()}`)
  }

  return (
    <>
      <PageHeader
        title="补贴申报导出"
        subtitle="生成符合协会规范的补贴申报文件"
      >
        <div className={css({ display: 'flex', gap: '3' })}>
          <Badge variant="success">
            <CheckCircle2 size={12} />
            合规格式
          </Badge>
        </div>
      </PageHeader>

      <PageContent>
        <div className={css({ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '6' })}>
          <div className={css({ display: 'flex', flexDirection: 'column', gap: '6' })}>
            <Card variant="default" padding="md">
              <CardHeader>
                <div className={css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' })}>
                  <CardTitle>选择批次</CardTitle>
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
                        placeholder="搜索批次..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
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
              <CardBody>
                <div className={css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '3' })}>
                  <button
                    onClick={selectAll}
                    className={css({
                      fontSize: 'sm',
                      color: 'primary',
                      bg: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      _hover: { textDecoration: 'underline' },
                    })}
                  >
                    {selectedBatchIds.length === filteredBatches.length ? '取消全选' : '全选'}
                  </button>
                  <span className={css({ fontSize: 'sm', color: 'text.muted' })}>
                    已选择 {selectedBatchIds.length} 个批次
                  </span>
                </div>

                <div className={css({ display: 'flex', flexDirection: 'column', gap: '2' })}>
                  {filteredBatches.map((batch) => {
                    const isSelected = selectedBatchIds.includes(batch.id)
                    const progress = (batch.confirmedCount / batch.totalCount) * 100
                    const isEligible = batch.confirmedCount > 0
                    
                    return (
                      <div
                        key={batch.id}
                        onClick={() => isEligible && toggleBatchSelection(batch.id)}
                        className={css({
                          p: '4',
                          borderRadius: 'lg',
                          border: '2px solid',
                          borderColor: isSelected ? 'primary' : 'border',
                          bg: isSelected ? 'primary/5' : 'surface',
                          cursor: isEligible ? 'pointer' : 'not-allowed',
                          opacity: isEligible ? 1 : 0.5,
                          transition: 'all 0.2s',
                          _hover: {
                            borderColor: isEligible ? (isSelected ? 'primary' : 'border-strong') : 'border',
                          },
                        })}
                      >
                        <div className={css({ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' })}>
                          <div className={css({ display: 'flex', gap: '3', alignItems: 'flex-start' })}>
                            <div className={css({
                              width: '20px',
                              height: '20px',
                              borderRadius: '4px',
                              border: '2px solid',
                              borderColor: isSelected ? 'primary' : 'border',
                              bg: isSelected ? 'primary' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              flexShrink: 0,
                              mt: '1px',
                            })}>
                              {isSelected && <CheckCircle2 size={14} />}
                            </div>
                            <div>
                              <h4 className={css({ fontSize: 'sm', fontWeight: '600', color: 'text.primary', m: 0, mb: '1' })}>
                                {batch.name}
                              </h4>
                              <div className={css({ display: 'flex', gap: '3', fontSize: 'xs', color: 'text.muted' })}>
                                <span>{batch.farm}</span>
                                <span>·</span>
                                <span>{batch.breed}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className={css({ textAlign: 'right' })}>
                            <div className={css({ display: 'flex', gap: '2', mb: '1', justifyContent: 'flex-end' })}>
                              {isEligible ? (
                                <Badge variant="success">
                                  <CheckCircle2 size={10} />
                                  可申报
                                </Badge>
                              ) : (
                                <Badge variant="warning">
                                  <Clock size={10} />
                                  未完成
                                </Badge>
                              )}
                              {batch.status === 'completed' && (
                                <Badge variant="primary">已完成</Badge>
                              )}
                            </div>
                            <p className={css({ fontSize: 'xs', color: 'text.muted', m: 0 })}>
                              预计补贴: ¥{batch.confirmedCount * 50}
                            </p>
                          </div>
                        </div>

                        <div className={css({ mt: '3', ml: '8' })}>
                          <div className={css({ display: 'flex', justifyContent: 'space-between', mb: '1', fontSize: 'xs', color: 'text.muted' })}>
                            <span>完成进度</span>
                            <span>{batch.confirmedCount}/{batch.totalCount} 样本</span>
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
                                bg: isEligible ? 'primary' : 'text.muted',
                                borderRadius: 'full',
                              })}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        <div className={css({ display: 'flex', gap: '4', mt: '3', ml: '8', pt: '3', borderTop: '1px dashed', borderColor: 'border' })}>
                          <div>
                            <p className={css({ fontSize: 'xs', color: 'text.muted', m: 0, mb: '1' })}>平均环数</p>
                            <p className={css({ fontSize: 'md', fontWeight: '600', color: 'text.primary', m: 0 })}>
                              {batch.averageRingCount || '-'}
                            </p>
                          </div>
                          <div>
                            <p className={css({ fontSize: 'xs', color: 'text.muted', m: 0, mb: '1' })}>月增长率</p>
                            <p className={css({ fontSize: 'md', fontWeight: '600', color: 'success', m: 0 })}>
                              {batch.averageGrowthRate || '-'} mm
                            </p>
                          </div>
                          <div>
                            <p className={css({ fontSize: 'xs', color: 'text.muted', m: 0, mb: '1' })}>起始日期</p>
                            <p className={css({ fontSize: 'md', fontWeight: '600', color: 'text.primary', m: 0 })}>
                              {batch.startDate}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardBody>
            </Card>
          </div>

          <div className={css({ display: 'flex', flexDirection: 'column', gap: '6' })}>
            <Card variant="default" padding="md">
              <CardHeader>
                <CardTitle>导出格式</CardTitle>
              </CardHeader>
              <CardBody>
                <div className={css({ display: 'flex', flexDirection: 'column', gap: '2' })}>
                  {formatOptions.map((format) => {
                    const Icon = format.icon
                    const isSelected = exportFormat === format.id
                    return (
                      <div
                        key={format.id}
                        onClick={() => setExportFormat(format.id)}
                        className={css({
                          p: '3',
                          borderRadius: 'lg',
                          border: '2px solid',
                          borderColor: isSelected ? 'primary' : 'border',
                          bg: isSelected ? 'primary/5' : 'surface',
                          cursor: 'pointer',
                          display: 'flex',
                          gap: '3',
                          alignItems: 'center',
                          transition: 'all 0.2s',
                          _hover: {
                            borderColor: isSelected ? 'primary' : 'border-strong',
                          },
                        })}
                      >
                        <div className={css({
                          width: '40px',
                          height: '40px',
                          borderRadius: 'lg',
                          bg: isSelected ? 'primary/10' : 'surface-muted',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isSelected ? 'primary' : 'text.muted',
                          flexShrink: 0,
                        })}>
                          <Icon size={20} />
                        </div>
                        <div className={css({ flex: 1 })}>
                          <p className={css({ fontSize: 'sm', fontWeight: '500', color: 'text.primary', m: 0 })}>
                            {format.label}
                          </p>
                          <p className={css({ fontSize: 'xs', color: 'text.muted', m: 0, mt: '1' })}>
                            {format.desc}
                          </p>
                        </div>
                        <div className={css({
                          width: '18px',
                          height: '18px',
                          borderRadius: 'full',
                          border: '2px solid',
                          borderColor: isSelected ? 'primary' : 'border',
                          bg: isSelected ? 'primary' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                        })}>
                          {isSelected && <CheckCircle2 size={12} />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardBody>
            </Card>

            <Card variant="elevated" padding="md" className={css({ borderColor: 'primary/30' })}>
              <CardHeader>
                <div className={css({ display: 'flex', alignItems: 'center', gap: '2' })}>
                  <div className={css({
                    width: '32px',
                    height: '32px',
                    borderRadius: 'lg',
                    bg: 'primary/10',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'primary',
                  })}>
                    <FileCheck size={18} />
                  </div>
                  <CardTitle>导出汇总</CardTitle>
                </div>
              </CardHeader>
              <CardBody>
                <div className={css({ display: 'flex', flexDirection: 'column', gap: '3' })}>
                  <div className={css({ display: 'flex', justifyContent: 'space-between' })}>
                    <span className={css({ fontSize: 'sm', color: 'text.secondary' })}>选中部次</span>
                    <span className={css({ fontSize: 'sm', fontWeight: '600', color: 'text.primary' })}>
                      {selectedBatchIds.length} 个
                    </span>
                  </div>
                  <div className={css({ display: 'flex', justifyContent: 'space-between' })}>
                    <span className={css({ fontSize: 'sm', color: 'text.secondary' })}>样本总数</span>
                    <span className={css({ fontSize: 'sm', fontWeight: '600', color: 'text.primary' })}>
                      {totalSamples} 份
                    </span>
                  </div>
                  <div className={css({ display: 'flex', justifyContent: 'space-between' })}>
                    <span className={css({ fontSize: 'sm', color: 'text.secondary' })}>导出格式</span>
                    <span className={css({ fontSize: 'sm', fontWeight: '600', color: 'text.primary' })}>
                      {exportFormat.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className={css({
                    my: '2',
                    h: '1px',
                    bg: 'border',
                  })} />
                  
                  <div className={css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' })}>
                    <span className={css({ fontSize: 'sm', color: 'text.secondary' })}>预计补贴金额</span>
                    <span className={css({ fontSize: 'xl', fontWeight: '700', color: 'primary' })}>
                      ¥{totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardBody>
              <CardFooter>
                <Button 
                  variant="secondary" 
                  className={css({ flex: 1 })}
                  leftIcon={<Settings size={16} />}
                >
                  导出设置
                </Button>
                <Button 
                  className={css({ flex: 1 })}
                  leftIcon={<Download size={16} />}
                  onClick={handleExport}
                  disabled={selectedBatchIds.length === 0}
                >
                  导出文件
                </Button>
              </CardFooter>
            </Card>

            <Card variant="default" padding="md">
              <CardHeader>
                <CardTitle>申报须知</CardTitle>
              </CardHeader>
              <CardBody>
                <div className={css({ display: 'flex', flexDirection: 'column', gap: '3' })}>
                  <div className={css({ display: 'flex', gap: '3' })}>
                    <div className={css({
                      width: '28px',
                      height: '28px',
                      borderRadius: 'md',
                      bg: 'primary/10',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'primary',
                      flexShrink: 0,
                      fontSize: 'xs',
                      fontWeight: '600',
                    })}>
                      1
                    </div>
                    <p className={css({ fontSize: 'xs', color: 'text.secondary', m: 0, lineHeight: '1.6' })}>
                      <strong>壳环计数必须经人工确认</strong>，AI识别结果不得直接用于申报。
                    </p>
                  </div>
                  <div className={css({ display: 'flex', gap: '3' })}>
                    <div className={css({
                      width: '28px',
                      height: '28px',
                      borderRadius: 'md',
                      bg: 'primary/10',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'primary',
                      flexShrink: 0,
                      fontSize: 'xs',
                      fontWeight: '600',
                    })}>
                      2
                    </div>
                    <p className={css({ fontSize: 'xs', color: 'text.secondary', m: 0, lineHeight: '1.6' })}>
                      <strong>同批次须使用同一光照预设</strong>，确保数据一致性与可比性。
                    </p>
                  </div>
                  <div className={css({ display: 'flex', gap: '3' })}>
                    <div className={css({
                      width: '28px',
                      height: '28px',
                      borderRadius: 'md',
                      bg: 'primary/10',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'primary',
                      flexShrink: 0,
                      fontSize: 'xs',
                      fontWeight: '600',
                    })}>
                      3
                    </div>
                    <p className={css({ fontSize: 'xs', color: 'text.secondary', m: 0, lineHeight: '1.6' })}>
                      <strong>异常标记样本须送检</strong>，检验报告附后方可申报。
                    </p>
                  </div>
                  <div className={css({ display: 'flex', gap: '3' })}>
                    <div className={css({
                      width: '28px',
                      height: '28px',
                      borderRadius: 'md',
                      bg: 'primary/10',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'primary',
                      flexShrink: 0,
                      fontSize: 'xs',
                      fontWeight: '600',
                    })}>
                      4
                    </div>
                    <p className={css({ fontSize: 'xs', color: 'text.secondary', m: 0, lineHeight: '1.6' })}>
                      <strong>基线影像对比</strong>可作为生长率计算的辅助依据。
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </PageContent>
    </>
  )
}
