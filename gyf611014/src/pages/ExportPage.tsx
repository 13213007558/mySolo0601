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
  const { batches, images, lightingPresets } = useAppStore()
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
    if (selectedBatchIds.length === 0) return

    const exportBatchData = selectedBatchIds.map(batchId => {
      const batch = batches.find(b => b.id === batchId)
      const batchImages = images.filter(img => img.batchId === batchId && img.status === 'confirmed')
      return {
        batch,
        images: batchImages,
      }
    })

    const now = new Date().toISOString().replace(/[:T]/g, '-').substring(0, 19)
    const filename = `牡蛎养殖补贴申报_${now}`

    if (exportFormat === 'csv') {
      const headers = [
        '批次编号', '批次名称', '养殖场', '品种', '起始日期',
        '样本编号', '样本名称', '上传时间', '光照预设',
        '壳环计数', '增长率(%)', '基线影像ID', '是否异常',
      ]
      const rows: string[] = [headers.join(',')]

      exportBatchData.forEach(({ batch, images: imgs }) => {
        if (imgs.length === 0) {
          rows.push([
            batch?.id || '',
            batch?.name || '',
            batch?.farm || '',
            batch?.breed || '',
            batch?.startDate || '',
            '', '', '', '', '', '', '', '',
          ].map(v => `"${v}"`).join(','))
        } else {
          imgs.forEach(img => {
            rows.push([
              batch?.id || '',
              batch?.name || '',
              batch?.farm || '',
              batch?.breed || '',
              batch?.startDate || '',
              img.id,
              img.name,
              img.uploadTime,
              img.lightingPreset,
              img.ringCount || '',
              img.growthRate?.toFixed(2) || '',
              img.baselineImageId || '',
              img.isAbnormal ? '是' : '否',
            ].map(v => `"${v}"`).join(','))
          })
        }
      })

      const csvContent = '\ufeff' + rows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      triggerDownload(blob, `${filename}.csv`)

    } else if (exportFormat === 'excel') {
      let xml = '<?xml version="1.0" encoding="UTF-8"?>'
      xml += '<?mso-application progid="Excel.Sheet"?>'
      xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" '
      xml += 'xmlns:o="urn:schemas-microsoft-com:office:office" '
      xml += 'xmlns:x="urn:schemas-microsoft-com:office:excel" '
      xml += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">'
      xml += '<Worksheet ss:Name="补贴申报数据">'
      xml += '<Table>'

      const headers = ['批次编号','批次名称','养殖场','品种','起始日期','样本编号','样本名称','上传时间','光照预设','壳环计数','增长率(%)','基线影像ID','是否异常']
      xml += '<Row>' + headers.map(h => `<Cell><Data ss:Type="String">${h}</Data></Cell>`).join('') + '</Row>'

      exportBatchData.forEach(({ batch, images: imgs }) => {
        if (imgs.length === 0) return
        imgs.forEach(img => {
          const cells = [
            batch?.id || '', batch?.name || '', batch?.farm || '', batch?.breed || '', batch?.startDate || '',
            img.id, img.name, img.uploadTime, img.lightingPreset,
            String(img.ringCount || ''), img.growthRate?.toFixed(2) || '',
            img.baselineImageId || '', img.isAbnormal ? '是' : '否'
          ]
          xml += '<Row>' + cells.map(c => `<Cell><Data ss:Type="String">${c}</Data></Cell>`).join('') + '</Row>'
        })
      })

      xml += '</Table></Worksheet>'

      xml += '<Worksheet ss:Name="汇总">'
      xml += '<Table>'
      const sumHeaders = ['批次名称','养殖场','确认样本数','平均环数','平均增长率(mm)','预计补贴(元)','完成状态']
      xml += '<Row>' + sumHeaders.map(h => `<Cell><Data ss:Type="String">${h}</Data></Cell>`).join('') + '</Row>'
      exportBatchData.forEach(({ batch }) => {
        const b = batch!
        const eligible = b.confirmedCount > 0
        const cells = [
          b.name, b.farm, String(b.confirmedCount),
          b.averageRingCount?.toString() || '-',
          b.averageGrowthRate?.toString() || '-',
          String(b.confirmedCount * 50),
          eligible ? (b.status === 'completed' ? '已完成' : '部分完成') : '未完成'
        ]
        xml += '<Row>' + cells.map(c => `<Cell><Data ss:Type="String">${c}</Data></Cell>`).join('') + '</Row>'
      })
      xml += '</Table></Worksheet>'
      xml += '</Workbook>'

      const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' })
      triggerDownload(blob, `${filename}.xls`)

    } else {
      let html = `<!DOCTYPE html><html><head><meta charset="UTF-8">`
      html += `<title>牡蛎养殖补贴申报</title>`
      html += `<style>
        body { font-family: 'SimSun', serif; padding: 40px; color: #1a1a1a; }
        h1 { text-align: center; font-size: 24px; margin-bottom: 8px; }
        .subtitle { text-align: center; color: #666; margin-bottom: 32px; font-size: 14px; }
        .stamp-box { border: 3px double #d97706; padding: 8px 16px; display: inline-block; color: #d97706; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
        th, td { border: 1px solid #ccc; padding: 10px 8px; text-align: left; }
        th { background: #f1f5f9; font-weight: 600; }
        .summary { margin-top: 40px; }
        .meta { display: flex; justify-content: space-between; margin-top: 40px; font-size: 13px; color: #555; }
        .footer-signature { margin-top: 60px; display: flex; justify-content: space-between; font-size: 14px; }
        .sign-block { width: 250px; }
        .sign-line { border-bottom: 1px solid #333; height: 40px; display: flex; align-items: flex-end; padding-bottom: 4px; }
        .header-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
      </style></head><body>`

      html += `<div class="header-bar">
        <div class="stamp-box">协会合规 · 补贴专用</div>
        <div>导出时间：${new Date().toLocaleString('zh-CN')}</div>
      </div>`
      html += `<h1>牡蛎养殖壳环计数补贴申报表</h1>`
      html += `<p class="subtitle">依据《牡蛎养殖协会壳环计数替代人工估龄管理规定》生成</p>`

      html += `<h3>一、申报批次汇总</h3>`
      html += `<table><thead><tr>`
      const sumCols = ['序号','批次名称','养殖场','品种','起始日期','确认样本数','平均环数','平均增长率(mm)','预计补贴(元)','完成状态']
      html += sumCols.map(c => `<th>${c}</th>`).join('')
      html += `</tr></thead><tbody>`
      exportBatchData.forEach(({ batch }, idx) => {
        const b = batch!
        const eligible = b.confirmedCount > 0
        html += `<tr>
          <td>${idx + 1}</td>
          <td>${b.name}</td>
          <td>${b.farm}</td>
          <td>${b.breed}</td>
          <td>${b.startDate}</td>
          <td style="text-align:center;">${b.confirmedCount}/${b.totalCount}</td>
          <td style="text-align:center;">${b.averageRingCount || '-'}</td>
          <td style="text-align:center;">${b.averageGrowthRate || '-'}</td>
          <td style="text-align:center; font-weight:bold;">¥${b.confirmedCount * 50}</td>
          <td>${eligible ? (b.status === 'completed' ? '✅ 已完成' : '⏳ 部分完成') : '⚠️ 未完成'}</td>
        </tr>`
      })
      const totalSubsidy = exportBatchData.reduce((s, d) => s + (d.batch?.confirmedCount || 0) * 50, 0)
      const totalSamples = exportBatchData.reduce((s, d) => s + (d.batch?.confirmedCount || 0), 0)
      html += `<tr style="font-weight:bold; background:#fef3c7;">
        <td colspan="5" style="text-align:right;">合计</td>
        <td style="text-align:center;">${totalSamples}</td>
        <td colspan="2"></td>
        <td style="text-align:center; color:#d97706;">¥${totalSubsidy.toLocaleString()}</td>
        <td></td>
      </tr>`
      html += `</tbody></table>`

      html += `<h3 class="summary">二、明细数据</h3>`
      exportBatchData.forEach(({ batch, images: imgs }) => {
        const b = batch!
        html += `<h4 style="margin-top:24px; margin-bottom:8px;">批次：${b.name}（${b.farm}）</h4>`
        if (imgs.length === 0) {
          html += `<p style="color:#94a3b8; font-size:13px;">该批次暂无已确认样本数据</p>`
          return
        }
        html += `<table><thead><tr>`
        const detailCols = ['样本编号','图片名称','上传时间','光照预设','壳环计数','增长率(%)','基线影像ID','异常标记']
        html += detailCols.map(c => `<th>${c}</th>`).join('')
        html += `</tr></thead><tbody>`
        imgs.forEach(img => {
          html += `<tr>
            <td>${img.id}</td>
            <td>${img.name}</td>
            <td>${img.uploadTime}</td>
            <td>${lightingPresets.find(p => p.id === img.lightingPreset)?.name || img.lightingPreset}</td>
            <td style="text-align:center;">${img.ringCount}</td>
            <td style="text-align:center;">${img.growthRate?.toFixed(2) || '-'}</td>
            <td>${img.baselineImageId || '-'}</td>
            <td style="text-align:center;">${img.isAbnormal ? '🔴 ' + (img.abnormalReason || '异常') : '✅ 正常'}</td>
          </tr>`
        })
        html += `</tbody></table>`
      })

      html += `<div class="footer-signature">
        <div class="sign-block">
          <div class="sign-line">操作员签字：</div>
          <div style="margin-top:8px; font-size:12px; color:#888;">日期：___________</div>
        </div>
        <div class="sign-block">
          <div class="sign-line">技术负责人：</div>
          <div style="margin-top:8px; font-size:12px; color:#888;">日期：___________</div>
        </div>
        <div class="sign-block">
          <div class="sign-line" style="justify-content:center;">（协会盖章处）</div>
          <div style="margin-top:8px; font-size:12px; color:#888; text-align:center;">日期：___________</div>
        </div>
      </div>`

      html += `</body></html>`

      const blob = new Blob([html], { type: 'application/pdf;charset=utf-8;' })
      triggerDownload(blob, `${filename}.html`, true)
    }
  }

  const triggerDownload = (blob: Blob, filename: string, openInNewTab = false) => {
    const url = URL.createObjectURL(blob)
    if (openInNewTab) {
      const w = window.open(url, '_blank')
      if (!w) {
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    } else {
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
    setTimeout(() => URL.revokeObjectURL(url), 5000)
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
