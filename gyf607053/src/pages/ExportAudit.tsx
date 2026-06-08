import { useEffect, useState } from 'react'
import {
  FileDown,
  ShieldCheck,
  AlertOctagon,
  Users,
  Upload,
  CheckCircle2,
  XCircle,
  Info,
} from 'lucide-react'
import { api } from '../lib/api'
import { useAppStore, ROLE_LABELS } from '../store/app'
import type { AuditLog } from '../../shared/types'

export default function ExportAudit() {
  const currentUser = useAppStore((s) => s.currentUser)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [importText, setImportText] = useState(
    [
      '小海豚,海豚班,138-0000-9999,海豚妈妈',
      '小企鹅,企鹅班,(138)0000-9998,企鹅爸爸',
      '小考拉,考拉班,138 0000 9997,考拉奶奶',
      '格式乱,海豚班,not-a-phone,乱填妈妈',
      '空号码,企鹅班,,无电话爷爷',
    ].join('\n'),
  )
  const [importResult, setImportResult] = useState<{
    imported: number
    total: number
    partial: boolean
    failed: Array<{ id: string; reason: string }>
  } | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    api.listAuditLogs(true).then(setLogs)
  }, [])

  const doExport = () => {
    api.exportRecords()
    setTimeout(() => {
      api.listAuditLogs(true).then(setLogs)
    }, 300)
  }

  const doBatchImport = async () => {
    setProcessing(true)
    const items = importText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, className, parentPhone, parentName] = line.split(/[,，]/)
        return { name, className, parentPhone: parentPhone || '', parentName: parentName || '' }
      })
    const r = await api.batchImportBabies(items)
    setImportResult({
      imported: r.data?.imported || 0,
      total: r.data?.total || items.length,
      partial: !!r.partialSuccess,
      failed: r.failedItems || [],
    })
    setProcessing(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">导出清单 & 隐私审计</h1>
        <p className="muted mt-1">
          当前身份：<span className="font-medium text-ink-700">{currentUser?.name}</span>（{ROLE_LABELS[currentUser?.role || 'waiter']}）
          ——手机号等隐私字段将按角色脱敏，同时对每次导出生成审计记录，方便主管复查。
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileDown size={18} className="text-brand-700" />
            <div className="section-title">导出借还记录清单</div>
          </div>
          <div className="muted mb-4 text-sm">
            CSV 将包含借还记录与宝宝信息；其中 <span className="font-medium text-ink-700">家长电话/处理人电话</span> 会根据您的角色进行脱敏，
            主管可见完整号码，店长仅见末 4 位，服务员/厨房仅见中间打码。
            所有访问在审计日志中留痕。
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <InfoRow label="您的角色" value={ROLE_LABELS[currentUser?.role || 'waiter']} />
            <InfoRow label="脱敏方式" value={getMaskDescription(currentUser?.role)} />
          </div>
          <button onClick={doExport} className="btn-primary w-full justify-center">
            <FileDown size={16} /> 立即导出 CSV
          </button>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users size={18} className="text-warm-600" />
            <div className="section-title">批量导入宝宝（手机号容错）</div>
          </div>
          <div className="muted mb-3 text-sm">
            每行一条：<span className="font-mono text-xs bg-ink-50 px-1.5 py-0.5 rounded">姓名,班级,家长电话,家长姓名</span>。
            格式混乱（空格、横杠、括号、甚至错误）的手机号将 <span className="font-medium text-rose-700">允许部分成功</span>，
            合法的正常导入，非法的单独列出原因。
          </div>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            className="input font-mono text-xs min-h-[140px]"
            spellCheck={false}
          />
          <button
            onClick={doBatchImport}
            disabled={processing}
            className="btn-primary w-full justify-center mt-3"
          >
            <Upload size={16} /> {processing ? '处理中...' : '开始导入'}
          </button>
          {importResult && (
            <div
              className={`mt-4 rounded-xl p-4 border ${
                importResult.failed.length === 0
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : importResult.partial
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {importResult.failed.length === 0 ? (
                  <CheckCircle2 size={16} />
                ) : importResult.partial ? (
                  <Info size={16} />
                ) : (
                  <XCircle size={16} />
                )}
                <span className="font-medium">
                  {importResult.failed.length === 0
                    ? '全部成功'
                    : importResult.partial
                      ? '部分成功'
                      : '全部失败'}
                  ：导入 {importResult.imported} / {importResult.total}
                </span>
              </div>
              {importResult.failed.length > 0 && (
                <ul className="text-xs space-y-1 mt-1.5">
                  {importResult.failed.map((f) => (
                    <li key={f.id} className="flex items-start gap-1.5">
                      <XCircle size={12} className="mt-0.5 shrink-0" />
                      <span>{f.id}：{f.reason}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck size={18} className="text-emerald-700" />
          <div className="section-title">隐私字段访问审计（导出相关）</div>
        </div>
        {logs.length === 0 ? (
          <div className="muted py-8 text-center">暂无审计记录，执行一次导出即可看到</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ink-50 text-xs text-ink-500">
                  <th className="text-left px-4 py-2.5 font-medium">时间</th>
                  <th className="text-left px-4 py-2.5 font-medium">操作人</th>
                  <th className="text-left px-4 py-2.5 font-medium">角色</th>
                  <th className="text-left px-4 py-2.5 font-medium">动作</th>
                  <th className="text-left px-4 py-2.5 font-medium">字段</th>
                  <th className="text-left px-4 py-2.5 font-medium">说明</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-ink-50/50">
                    <td className="px-4 py-2.5 text-xs text-ink-500 whitespace-nowrap">
                      {new Date(l.accessedAt).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-ink-900">{l.userName}</td>
                    <td className="px-4 py-2.5 text-xs text-ink-700">{ROLE_LABELS[l.userRole] || l.userRole}</td>
                    <td className="px-4 py-2.5">
                      <span className="chip bg-brand-50 text-brand-700 border-brand-200">{l.action}</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-ink-700">
                      {l.fieldName || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-ink-500 max-w-md">
                      {l.note}
                      {l.originalValue && (
                        <span className="ml-1 text-rose-600 font-mono">（原值示例：{l.originalValue}）</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {(currentUser?.role !== 'supervisor' && currentUser?.role !== 'manager') && (
          <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 flex items-start gap-2">
            <AlertOctagon size={14} className="mt-0.5 shrink-0" />
            <span>当前角色仅可看到导出后的脱敏数据；完整审计日志由店长/主管在后台查阅，防止隐私字段只在前端隐藏。</span>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-100 p-3">
      <div className="text-xs text-ink-500">{label}</div>
      <div className="text-sm font-medium text-ink-900 mt-1">{value}</div>
    </div>
  )
}

function getMaskDescription(role?: string): string {
  switch (role) {
    case 'supervisor':
      return '完整可见（需审计）'
    case 'manager':
      return '仅显示末 4 位（例 138****1001）'
    case 'waiter':
    case 'kitchen':
    default:
      return '中间打码（例 138****01）'
  }
}
