import { useState } from 'react'
import { X, Truck, MapPin, Droplets, Thermometer, Camera, User, FileText, FlaskConical, AlertTriangle, CheckCircle, Edit3 } from 'lucide-react'
import { usePourStore } from '@/store/usePourStore'
import { RECORD_STATUS_LABELS, RECORD_STATUS_COLORS } from '@/types'
import { formatDateTime, calcDuration, formatDuration, isOvernight } from '@/utils/calc'
import HandleAbnormalForm from './HandleAbnormalForm'

export default function DetailPanel() {
  const showDetail = usePourStore((s) => s.showDetail)
  const setShowDetail = usePourStore((s) => s.setShowDetail)
  const selectedId = usePourStore((s) => s.selectedId)
  const records = usePourStore((s) => s.records)
  const setShowForm = usePourStore((s) => s.setShowForm)

  const [handlingAbnormal, setHandlingAbnormal] = useState<string | null>(null)

  const record = records.find((r) => r.id === selectedId)

  if (!showDetail || !record) return null

  const overnight = record.endPourTime ? isOvernight(record.arriveTime, record.endPourTime) : false
  const duration = record.startPourTime && record.endPourTime
    ? calcDuration(record.startPourTime, record.endPourTime)
    : null

  const unhandledAbnormals = record.abnormals.filter((a) => !a.handled)
  const handledAbnormals = record.abnormals.filter((a) => a.handled)

  const severityStyles = {
    low: 'bg-amber-50 border-amber-200 text-amber-700',
    medium: 'bg-orange-50 border-orange-300 text-orange-700',
    high: 'bg-red-50 border-red-300 text-red-700'
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black bg-opacity-30"
        onClick={() => setShowDetail(false)}
      />
      <div className="relative w-[480px] bg-white shadow-2xl h-full overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-concrete-200 px-5 py-4 flex items-center justify-between z-10">
          <h3 className="font-semibold text-concrete-900 text-lg">浇筑详情</h3>
          <button
            onClick={() => setShowDetail(false)}
            className="p-1.5 hover:bg-concrete-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-concrete-500" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-concrete-400 mb-1">状态</p>
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: RECORD_STATUS_COLORS[record.status] }}
              >
                {RECORD_STATUS_LABELS[record.status]}
              </span>
            </div>
            <button
              onClick={() => setShowForm(true, record)}
              className="text-xs text-concrete-500 hover:text-accent flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              编辑
            </button>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-concrete-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-concrete-400" />
              车辆信息
            </h4>
            <div className="grid grid-cols-2 gap-3 bg-concrete-50 rounded-lg p-3">
              <div>
                <p className="text-xs text-concrete-400">车号</p>
                <p className="text-sm font-mono font-medium text-concrete-900">{record.truckNo}</p>
              </div>
              <div>
                <p className="text-xs text-concrete-400">批次号</p>
                <p className="text-sm font-mono text-concrete-900">{record.batchNo}</p>
              </div>
              <div>
                <p className="text-xs text-concrete-400">到场时间</p>
                <p className="text-sm text-concrete-900">{formatDateTime(record.arriveTime)}</p>
              </div>
              {record.startPourTime && (
                <div>
                  <p className="text-xs text-concrete-400">开始浇筑</p>
                  <p className="text-sm text-concrete-900">{formatDateTime(record.startPourTime)}</p>
                </div>
              )}
              {record.endPourTime && (
                <div>
                  <p className="text-xs text-concrete-400">浇筑完成</p>
                  <p className="text-sm text-concrete-900">{formatDateTime(record.endPourTime)}</p>
                </div>
              )}
              {duration !== null && (
                <div>
                  <p className="text-xs text-concrete-400">浇筑时长</p>
                  <p className="text-sm text-concrete-900">
                    {formatDuration(duration)}
                    {overnight && <span className="ml-1 text-amber-600 text-xs">(跨天)</span>}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-concrete-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-concrete-400" />
              浇筑部位
            </h4>
            <div className="grid grid-cols-2 gap-3 bg-concrete-50 rounded-lg p-3">
              <div>
                <p className="text-xs text-concrete-400">楼栋/区域</p>
                <p className="text-sm font-medium text-concrete-900">{record.position}</p>
              </div>
              <div>
                <p className="text-xs text-concrete-400">构件</p>
                <p className="text-sm text-concrete-900">{record.component}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-concrete-900 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-concrete-400" />
              混凝土参数
            </h4>
            <div className="grid grid-cols-2 gap-3 bg-concrete-50 rounded-lg p-3">
              <div>
                <p className="text-xs text-concrete-400">标号</p>
                <p className="text-sm font-medium text-sky-600">{record.grade}</p>
              </div>
              <div>
                <p className="text-xs text-concrete-400">方量</p>
                <p className="text-sm font-medium text-concrete-900">{record.volume} m³</p>
              </div>
              <div>
                <p className="text-xs text-concrete-400">坍落度</p>
                <p className={`text-sm font-medium ${
                  record.slump < 120 || record.slump > 220 ? 'text-red-600' : 'text-concrete-900'
                }`}>
                  {record.slump} {record.slumpUnit}
                </p>
              </div>
              {record.temperature !== undefined && record.temperature !== null && (
                <div className="flex items-start gap-2">
                  <Thermometer className="w-4 h-4 text-concrete-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-concrete-400">入模温度</p>
                    <p className="text-sm text-concrete-900">{record.temperature} ℃</p>
                  </div>
                </div>
              )}
              <div className="col-span-2">
                <p className="text-xs text-concrete-400">标号匹配</p>
                <p className={`text-sm ${record.gradeMatch ? 'text-green-600' : 'text-red-600'}`}>
                  {record.gradeMatch ? '是 - 与设计一致' : '否 - 与设计不符'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-concrete-900 flex items-center gap-2">
              <Camera className="w-4 h-4 text-concrete-400" />
              现场照片
            </h4>
            <div className="bg-concrete-50 rounded-lg p-4">
              {record.hasPhoto ? (
                <div className="aspect-video bg-concrete-200 rounded-lg flex items-center justify-center">
                  <p className="text-sm text-concrete-500">照片已上传</p>
                </div>
              ) : (
                <div className="aspect-video border-2 border-dashed border-purple-300 bg-purple-50 rounded-lg flex flex-col items-center justify-center">
                  <FileText className="w-8 h-8 text-purple-400 mb-2" />
                  <p className="text-sm text-purple-600 font-medium">缺照片</p>
                  <p className="text-xs text-purple-400 mt-1">请补拍后上传</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-concrete-900 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-concrete-400" />
              试块留置
              <span className="text-xs text-concrete-400 font-normal">({record.samples.length} 组)</span>
            </h4>
            <div className="space-y-2">
              {record.samples.map((s) => (
                <div key={s.id} className="bg-sky-50 border border-sky-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-sky-700">{s.type}</span>
                    <span className="text-xs text-sky-500">{s.groupNo}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-sky-600">
                    <span>{s.count} 组试件</span>
                    <span>制作：{formatDateTime(s.madeTime)}</span>
                  </div>
                  {s.remark && <p className="text-xs text-sky-500 mt-1">{s.remark}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-concrete-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              异常记录
              {unhandledAbnormals.length > 0 && (
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                  {unhandledAbnormals.length} 待处理
                </span>
              )}
            </h4>

            {record.abnormals.length === 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <p className="text-sm text-green-700">无异常记录</p>
              </div>
            ) : (
              <div className="space-y-2">
                {unhandledAbnormals.map((a) => (
                  <div
                    key={a.id}
                    className={`border rounded-lg p-3 ${severityStyles[a.severity]}`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-sm font-medium">{a.typeLabel}</span>
                      <span className="text-xs opacity-75">
                        {a.severity === 'high' ? '严重' : a.severity === 'medium' ? '中等' : '轻微'}
                      </span>
                    </div>
                    <p className="text-xs opacity-80">{a.description}</p>
                    <button
                      onClick={() => setHandlingAbnormal(a.id)}
                      className="mt-2 text-xs font-medium underline underline-offset-2 hover:opacity-80"
                    >
                      处理此异常
                    </button>
                  </div>
                ))}
                {handledAbnormals.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs text-concrete-400 mb-2">已处理</p>
                    {handledAbnormals.map((a) => (
                      <div
                        key={a.id}
                        className="bg-concrete-50 border border-concrete-200 rounded-lg p-3 mb-2 opacity-70"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                          <span className="text-sm font-medium text-concrete-700">{a.typeLabel}</span>
                        </div>
                        <p className="text-xs text-concrete-500">{a.description}</p>
                        <div className="mt-2 pt-2 border-t border-concrete-200">
                          <p className="text-xs text-concrete-600">
                            <span className="font-medium">处理：</span>{a.handleReason}
                          </p>
                          <p className="text-xs text-concrete-400 mt-0.5">
                            {a.handler} · {a.handleTime}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {record.manualCorrection && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-concrete-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-purple-500" />
                人工更正
              </h4>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-sm text-purple-700">{record.manualCorrection}</p>
                <p className="text-xs text-purple-500 mt-2">
                  {record.correctedBy} · {formatDateTime(record.correctedAt || '')}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-concrete-900 flex items-center gap-2">
              <User className="w-4 h-4 text-concrete-400" />
              人员
            </h4>
            <div className="grid grid-cols-2 gap-3 bg-concrete-50 rounded-lg p-3">
              <div>
                <p className="text-xs text-concrete-400">试验员</p>
                <p className="text-sm text-concrete-900">{record.inspector || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-concrete-400">监理</p>
                <p className="text-sm text-concrete-900">{record.supervisor || '-'}</p>
              </div>
            </div>
          </div>

          {record.remark && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-concrete-900">旁站备注</h4>
              <p className="text-sm text-concrete-600 bg-concrete-50 rounded-lg p-3">
                {record.remark}
              </p>
            </div>
          )}
        </div>

        {handlingAbnormal && (
          <HandleAbnormalForm
            recordId={record.id}
            abnormalId={handlingAbnormal}
            onClose={() => setHandlingAbnormal(null)}
          />
        )}
      </div>
    </div>
  )
}
