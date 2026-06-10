import { useState } from 'react'
import { X } from 'lucide-react'
import { usePourStore } from '@/store/usePourStore'

interface Props {
  recordId: string
  abnormalId: string
  onClose: () => void
}

export default function HandleAbnormalForm({ recordId, abnormalId, onClose }: Props) {
  const handleAbnormal = usePourStore((s) => s.handleAbnormal)
  const records = usePourStore((s) => s.records)

  const record = records.find((r) => r.id === recordId)
  const abnormal = record?.abnormals.find((a) => a.id === abnormalId)

  const [reason, setReason] = useState('')
  const [handler, setHandler] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason.trim() || !handler.trim()) return
    handleAbnormal(recordId, abnormalId, reason, handler)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-[400px] p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-concrete-900">处理异常</h4>
          <button
            onClick={onClose}
            className="p-1 hover:bg-concrete-100 rounded transition-colors"
          >
            <X className="w-4 h-4 text-concrete-500" />
          </button>
        </div>

        {abnormal && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <p className="text-sm font-medium text-amber-800">{abnormal.typeLabel}</p>
            <p className="text-xs text-amber-600 mt-1">{abnormal.description}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-concrete-700 mb-1.5">
              处理方式
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="请说明处理方式和结果..."
              className="w-full px-3 py-2 text-sm border border-concrete-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-concrete-700 mb-1.5">
              处理人
            </label>
            <input
              type="text"
              value={handler}
              onChange={(e) => setHandler(e.target.value)}
              placeholder="请输入处理人姓名"
              className="w-full px-3 py-2 text-sm border border-concrete-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-concrete-600 hover:bg-concrete-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors"
            >
              确认处理
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
