import { useState, useEffect } from 'react'
import { X, Plus, Save } from 'lucide-react'
import { usePourStore } from '@/store/usePourStore'
import type { PourRecord, CubeSample } from '@/types'
import { generateId } from '@/utils/calc'

interface Props {
  record?: PourRecord | null
  onClose: () => void
}

const defaultValues = {
  truckNo: '',
  batchNo: '',
  arriveTime: '',
  startPourTime: '',
  endPourTime: '',
  position: '',
  component: '',
  grade: 'C30',
  volume: 10,
  slump: 180,
  slumpUnit: 'mm',
  temperature: 25,
  hasPhoto: true,
  gradeMatch: true,
  inspector: '',
  supervisor: '',
  remark: ''
}

export default function PourForm({ record, onClose }: Props) {
  const addRecord = usePourStore((s) => s.addRecord)
  const updateRecord = usePourStore((s) => s.updateRecord)

  const [form, setForm] = useState(defaultValues)
  const [samples, setSamples] = useState<Array<Omit<CubeSample, 'id' | 'recordId'>>>([])
  const [sampleType, setSampleType] = useState<CubeSample['type']>('标准养护')
  const [sampleGroup, setSampleGroup] = useState('')
  const [sampleCount, setSampleCount] = useState(3)
  const [sampleMadeTime, setSampleMadeTime] = useState('')
  const [sampleRemark, setSampleRemark] = useState('')

  const isEdit = !!record

  useEffect(() => {
    if (record) {
      setForm({
        truckNo: record.truckNo,
        batchNo: record.batchNo,
        arriveTime: record.arriveTime.slice(0, 16),
        startPourTime: record.startPourTime?.slice(0, 16) || '',
        endPourTime: record.endPourTime?.slice(0, 16) || '',
        position: record.position,
        component: record.component,
        grade: record.grade,
        volume: record.volume,
        slump: record.slump,
        slumpUnit: record.slumpUnit,
        temperature: record.temperature || 25,
        hasPhoto: record.hasPhoto,
        gradeMatch: record.gradeMatch,
        inspector: record.inspector,
        supervisor: record.supervisor || '',
        remark: record.remark || ''
      })
      setSamples(
        record.samples.map((s) => ({
          type: s.type,
          groupNo: s.groupNo,
          count: s.count,
          madeTime: s.madeTime,
          remark: s.remark
        }))
      )
    }
  }, [record])

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function addSample() {
    if (!sampleGroup.trim()) return
    setSamples((prev) => [
      ...prev,
      {
        type: sampleType,
        groupNo: sampleGroup,
        count: sampleCount,
        madeTime: sampleMadeTime || form.arriveTime,
        remark: sampleRemark
      }
    ])
    setSampleGroup('')
    setSampleRemark('')
  }

  function removeSample(idx: number) {
    setSamples((prev) => prev.filter((_, i) => i !== idx))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const recordData = {
      ...form,
      arriveTime: form.arriveTime + ':00',
      startPourTime: form.startPourTime ? form.startPourTime + ':00' : undefined,
      endPourTime: form.endPourTime ? form.endPourTime + ':00' : undefined,
      temperature: form.temperature,
      samples: samples as CubeSample[]
    }

    if (isEdit && record) {
      updateRecord(record.id, recordData as any)
    } else {
      addRecord(recordData as any)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-concrete-200 flex-shrink-0">
          <h3 className="font-semibold text-concrete-900 text-lg">
            {isEdit ? '编辑浇筑记录' : '新增浇筑记录'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-concrete-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-concrete-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-concrete-700 mb-1.5">
                车号 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.truckNo}
                onChange={(e) => updateField('truckNo', e.target.value)}
                placeholder="如：沪A·12345"
                className="w-full px-3 py-2 text-sm border border-concrete-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-concrete-700 mb-1.5">
                批次号
              </label>
              <input
                type="text"
                value={form.batchNo}
                onChange={(e) => updateField('batchNo', e.target.value)}
                placeholder="如：B20240608-001"
                className="w-full px-3 py-2 text-sm border border-concrete-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-concrete-700 mb-1.5">
              到场时间 <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={form.arriveTime}
              onChange={(e) => updateField('arriveTime', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-concrete-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-concrete-700 mb-1.5">
                开始浇筑
              </label>
              <input
                type="datetime-local"
                value={form.startPourTime}
                onChange={(e) => updateField('startPourTime', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-concrete-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-concrete-700 mb-1.5">
                浇筑完成
              </label>
              <input
                type="datetime-local"
                value={form.endPourTime}
                onChange={(e) => updateField('endPourTime', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-concrete-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-concrete-700 mb-1.5">
                部位 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.position}
                onChange={(e) => updateField('position', e.target.value)}
                placeholder="如：2号楼"
                className="w-full px-3 py-2 text-sm border border-concrete-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-concrete-700 mb-1.5">
                构件 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.component}
                onChange={(e) => updateField('component', e.target.value)}
                placeholder="如：三层梁板"
                className="w-full px-3 py-2 text-sm border border-concrete-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-concrete-700 mb-1.5">
                标号 <span className="text-red-500">*</span>
              </label>
              <select
                value={form.grade}
                onChange={(e) => updateField('grade', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-concrete-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              >
                <option value="C20">C20</option>
                <option value="C25">C25</option>
                <option value="C30">C30</option>
                <option value="C35">C35</option>
                <option value="C40">C40</option>
                <option value="C45">C45</option>
                <option value="C50">C50</option>
                <option value="C30P8">C30P8</option>
                <option value="C35P8">C35P8</option>
                <option value="C40P10">C40P10</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-concrete-700 mb-1.5">
                方量(m³) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={form.volume}
                onChange={(e) => updateField('volume', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-concrete-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-concrete-700 mb-1.5">
                坍落度(mm) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={form.slump}
                onChange={(e) => updateField('slump', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-concrete-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-concrete-700 mb-1.5">
                入模温度(℃)
              </label>
              <input
                type="number"
                value={form.temperature}
                onChange={(e) => updateField('temperature', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-concrete-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-concrete-700 mb-1.5">
                检查项
              </label>
              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.hasPhoto}
                    onChange={(e) => updateField('hasPhoto', e.target.checked)}
                    className="w-4 h-4 text-accent rounded focus:ring-accent"
                  />
                  <span className="text-sm text-concrete-700">有照片</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.gradeMatch}
                    onChange={(e) => updateField('gradeMatch', e.target.checked)}
                    className="w-4 h-4 text-accent rounded focus:ring-accent"
                  />
                  <span className="text-sm text-concrete-700">标号匹配</span>
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-concrete-700 mb-1.5">
                试验员
              </label>
              <input
                type="text"
                value={form.inspector}
                onChange={(e) => updateField('inspector', e.target.value)}
                placeholder="如：王试验"
                className="w-full px-3 py-2 text-sm border border-concrete-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-concrete-700 mb-1.5">
                监理
              </label>
              <input
                type="text"
                value={form.supervisor}
                onChange={(e) => updateField('supervisor', e.target.value)}
                placeholder="如：李监理"
                className="w-full px-3 py-2 text-sm border border-concrete-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-concrete-700 mb-1.5">
              旁站备注
            </label>
            <textarea
              value={form.remark}
              onChange={(e) => updateField('remark', e.target.value)}
              rows={2}
              placeholder="记录浇筑过程中的特殊情况..."
              className="w-full px-3 py-2 text-sm border border-concrete-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
            />
          </div>

          <div className="border-t border-concrete-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-concrete-900">
                试块留置 <span className="text-concrete-400 font-normal">({samples.length} 组)</span>
              </h4>
            </div>

            <div className="bg-concrete-50 rounded-lg p-3 space-y-3">
              <div className="grid grid-cols-5 gap-2 items-end">
                <div>
                  <label className="block text-xs text-concrete-500 mb-1">类型</label>
                  <select
                    value={sampleType}
                    onChange={(e) => setSampleType(e.target.value as CubeSample['type'])}
                    className="w-full px-2 py-1.5 text-xs border border-concrete-200 rounded focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="标准养护">标准养护</option>
                    <option value="同条件养护">同条件养护</option>
                    <option value="拆模">拆模</option>
                    <option value="抗渗">抗渗</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-concrete-500 mb-1">组号</label>
                  <input
                    type="text"
                    value={sampleGroup}
                    onChange={(e) => setSampleGroup(e.target.value)}
                    placeholder="组号"
                    className="w-full px-2 py-1.5 text-xs border border-concrete-200 rounded focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-concrete-500 mb-1">数量</label>
                  <input
                    type="number"
                    min="1"
                    value={sampleCount}
                    onChange={(e) => setSampleCount(parseInt(e.target.value) || 1)}
                    className="w-full px-2 py-1.5 text-xs border border-concrete-200 rounded focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-concrete-500 mb-1">制作时间</label>
                  <input
                    type="datetime-local"
                    value={sampleMadeTime}
                    onChange={(e) => setSampleMadeTime(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-concrete-200 rounded focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <button
                  type="button"
                  onClick={addSample}
                  className="px-2 py-1.5 text-xs bg-accent text-white rounded hover:bg-accent-dark transition-colors flex items-center gap-1 justify-center"
                >
                  <Plus className="w-3 h-3" />
                  添加
                </button>
              </div>

              {samples.length > 0 ? (
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {samples.map((s, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-white border border-concrete-200 rounded px-3 py-1.5 text-xs"
                    >
                      <span className="font-medium text-concrete-700">
                        {s.type} · {s.groupNo}
                      </span>
                      <span className="text-concrete-500">{s.count} 组</span>
                      <button
                        type="button"
                        onClick={() => removeSample(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-concrete-400 text-center py-2">暂无试块记录</p>
              )}
            </div>
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-concrete-200 bg-concrete-50 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-concrete-600 hover:bg-concrete-200 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-5 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isEdit ? '保存修改' : '新增记录'}
          </button>
        </div>
      </div>
    </div>
  )
}
