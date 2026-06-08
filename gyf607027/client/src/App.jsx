import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const STATUS_LABELS = {
  draft: '草稿',
  reviewing: '复核中',
  supplementing: '补充中',
  closed: '已关闭'
}

const MATERIAL_TYPE_LABELS = {
  sleep_log: '睡眠日志',
  consultation_note: '咨询记录',
  photo: '照片资料',
  assessment_form: '评估表',
  supplement_note: '补充说明',
  additional_photo: '附加照片',
  followup_record: '随访记录',
  other: '其他'
}

const EVENT_TYPE_LABELS = {
  create: '创建',
  add_material: '录入材料',
  submit: '提交复核',
  reject: '退回补充',
  resubmit: '再次提交',
  close: '关闭归档'
}

function App() {
  const [cases, setCases] = useState([])
  const [selectedCase, setSelectedCase] = useState(null)
  const [caseDetail, setCaseDetail] = useState(null)
  const [phoneFilter, setPhoneFilter] = useState('')
  const [message, setMessage] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)

  const [newCase, setNewCase] = useState({
    baby_name: '',
    baby_age_months: '',
    parent_phone: '',
    store_name: '',
    operator_name: ''
  })

  const [newMaterials, setNewMaterials] = useState([
    { material_type: 'sleep_log', title: '', content: '', file_name: '' }
  ])
  const [materialOperatorName, setMaterialOperatorName] = useState('')
  const [materialResults, setMaterialResults] = useState(null)

  const [rejectReason, setRejectReason] = useState('')
  const [rejectOperatorName, setRejectOperatorName] = useState('')

  const [closeConclusion, setCloseConclusion] = useState('')
  const [closeOperatorName, setCloseOperatorName] = useState('')

  const showMessage = useCallback((type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }, [])

  const fetchCases = useCallback(async () => {
    try {
      const res = await axios.get('/api/cases', { params: { phone: phoneFilter } })
      setCases(res.data)
    } catch (err) {
      showMessage('error', '加载案例列表失败')
    }
  }, [phoneFilter, showMessage])

  const fetchCaseDetail = useCallback(async (id) => {
    try {
      const res = await axios.get('/api/cases/' + id)
      setCaseDetail(res.data)
    } catch (err) {
      showMessage('error', '加载案例详情失败')
    }
  }, [showMessage])

  useEffect(() => {
    if (!selectedCase) {
      fetchCases()
    }
  }, [selectedCase, phoneFilter, fetchCases])

  useEffect(() => {
    if (selectedCase) {
      fetchCaseDetail(selectedCase)
    }
  }, [selectedCase, fetchCaseDetail])

  const handleCreateCase = async () => {
    if (!newCase.baby_name || !newCase.parent_phone) {
      showMessage('error', '宝宝姓名和家长手机号必填')
      return
    }
    try {
      await axios.post('/api/cases', {
        ...newCase,
        operator_id: null,
        operator_name: newCase.operator_name || null
      })
      showMessage('success', '案例创建成功')
      setShowCreateModal(false)
      setNewCase({ baby_name: '', baby_age_months: '', parent_phone: '', store_name: '', operator_name: '' })
      fetchCases()
    } catch (err) {
      showMessage('error', (err.response && err.response.data && err.response.data.error) || '创建失败')
    }
  }

  const handleAddMaterial = async () => {
    const validMaterials = newMaterials.filter(m => m.material_type && m.title.trim())
    if (validMaterials.length === 0) {
      showMessage('error', '至少填写一份有效的材料（类型+标题）')
      return
    }
    try {
      const res = await axios.post('/api/cases/' + selectedCase + '/materials', {
        materials: validMaterials,
        operator_id: null,
        operator_name: materialOperatorName || null
      })
      setMaterialResults(res.data)
      const okCount = res.data.success_count
      if (okCount > 0) {
        showMessage(
          res.data.partial_success ? 'warning' : 'success',
          '材料提交完成：成功 ' + okCount + ' / ' + res.data.total + (res.data.partial_success ? '（部分类型已关闭案例允许追加）' : '')
        )
      } else {
        showMessage('error', '材料全部提交失败')
      }
      setNewMaterials([{ material_type: 'sleep_log', title: '', content: '', file_name: '' }])
      setMaterialOperatorName('')
      fetchCaseDetail(selectedCase)
      fetchCases()
    } catch (err) {
      showMessage('error', (err.response && err.response.data && err.response.data.error) || '提交材料失败')
    }
  }

  const handleSubmit = async () => {
    if (!window.confirm('确认提交复核？提交后进入复核中状态。')) return
    try {
      await axios.post('/api/cases/' + selectedCase + '/submit', { operator_name: '' })
      showMessage('success', '已提交复核')
      fetchCaseDetail(selectedCase)
      fetchCases()
    } catch (err) {
      showMessage('error', (err.response && err.response.data && err.response.data.error) || '提交失败')
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      showMessage('error', '退回原因必填')
      return
    }
    try {
      await axios.post('/api/cases/' + selectedCase + '/reject', {
        reason: rejectReason,
        operator_name: rejectOperatorName || null
      })
      showMessage('success', '已退回补充')
      setShowRejectModal(false)
      setRejectReason('')
      setRejectOperatorName('')
      fetchCaseDetail(selectedCase)
      fetchCases()
    } catch (err) {
      showMessage('error', (err.response && err.response.data && err.response.data.error) || '退回失败')
    }
  }

  const handleResubmit = async () => {
    if (!window.confirm('确认重新提交复核？')) return
    try {
      await axios.post('/api/cases/' + selectedCase + '/resubmit', { operator_name: '' })
      showMessage('success', '已再次提交复核')
      fetchCaseDetail(selectedCase)
      fetchCases()
    } catch (err) {
      showMessage('error', (err.response && err.response.data && err.response.data.error) || '提交失败')
    }
  }

  const handleClose = async () => {
    try {
      await axios.post('/api/cases/' + selectedCase + '/close', {
        conclusion: closeConclusion,
        operator_name: closeOperatorName || null
      })
      showMessage('success', '案例已关闭归档')
      setShowCloseModal(false)
      setCloseConclusion('')
      setCloseOperatorName('')
      fetchCaseDetail(selectedCase)
      fetchCases()
    } catch (err) {
      showMessage('error', (err.response && err.response.data && err.response.data.error) || '关闭失败')
    }
  }

  const handleExport = () => {
    const url = phoneFilter ? '/api/export?phone=' + encodeURIComponent(phoneFilter) : '/api/export'
    window.open(url, '_blank')
    showMessage('info', '正在导出 ' + cases.length + ' 条记录，数量与列表一致')
  }

  const addMaterialEntry = () => {
    setNewMaterials([...newMaterials, { material_type: 'sleep_log', title: '', content: '', file_name: '' }])
  }

  const removeMaterialEntry = (idx) => {
    if (newMaterials.length === 1) return
    setNewMaterials(newMaterials.filter((_, i) => i !== idx))
  }

  const updateMaterialEntry = (idx, field, value) => {
    const updated = [...newMaterials]
    updated[idx][field] = value
    setNewMaterials(updated)
  }

  const renderList = () => (
    <>
      <div className="toolbar">
        <input
          className="input filter-phone"
          placeholder="按家长手机号筛选（如 13800138001）"
          value={phoneFilter}
          onChange={(e) => setPhoneFilter(e.target.value)}
        />
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + 新建案例
        </button>
        <button className="btn btn-success" onClick={handleExport}>
          导出 CSV
        </button>
        <span className="count-badge">共 {cases.length} 条</span>
      </div>

      {cases.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-text">暂无案例数据，点击"新建案例"或先导入样例数据</div>
        </div>
      ) : (
        <div className="case-list">
          {cases.map(c => (
            <div key={c.id} className={'case-card status-' + c.current_status} onClick={() => setSelectedCase(c.id)} style={{ cursor: 'pointer' }}>
              <div className="case-header">
                <div>
                  <div className="case-no">{c.case_no}</div>
                  <div style={{ fontSize: '17px', fontWeight: '600', marginTop: '4px' }}>{c.baby_name}</div>
                </div>
                <span className={'status-tag status-' + c.current_status}>{STATUS_LABELS[c.current_status]}</span>
              </div>
              <div className="case-info">
                <div className="row"><span className="label">手机号:</span><span className="value">{c.parent_phone}</span></div>
                <div className="row"><span className="label">月龄:</span><span className="value">{c.baby_age_months ? (c.baby_age_months + ' 个月') : '-'}</span></div>
                <div className="row"><span className="label">门店:</span><span className="value">{c.store_name || '-'}</span></div>
              </div>
              <div className="case-meta">
                <span>{c.material_count} 份材料</span>
                <span>{c.event_count} 条事件</span>
                <span>{c.created_at && c.created_at.slice(0, 16)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )

  const renderDetail = () => {
    if (!caseDetail) return null
    const c = caseDetail
    const isClosed = c.current_status === 'closed'

    return (
      <>
        <button className="back-btn" onClick={() => { setSelectedCase(null); setCaseDetail(null); setMaterialResults(null) }}>
          ← 返回案例列表
        </button>

        <div className="detail-view">
          <div className="detail-header">
            <div>
              <h2>{c.baby_name} <span className="case-no" style={{ fontSize: '14px', fontWeight: 'normal' }}>（{c.case_no}）</span></h2>
              <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>
                创建于 {c.created_at && c.created_at.slice(0, 16)}
                {c.closed_at && (' · 关闭于 ' + c.closed_at.slice(0, 16) + (c.closed_by ? (' · 操作人: ' + c.closed_by) : ''))}
              </p>
            </div>
            <span className={'status-tag status-' + c.current_status} style={{ fontSize: '14px', padding: '6px 14px' }}>
              {STATUS_LABELS[c.current_status]}
            </span>
          </div>

          <div className="detail-info-grid">
            <div className="detail-info-item"><div className="label">家长手机号</div><div className="value">{c.parent_phone}</div></div>
            <div className="detail-info-item"><div className="label">宝宝月龄</div><div className="value">{c.baby_age_months ? (c.baby_age_months + ' 个月') : '-'}</div></div>
            <div className="detail-info-item"><div className="label">门店</div><div className="value">{c.store_name || '-'}</div></div>
            <div className="detail-info-item"><div className="label">材料数</div><div className="value">{(c.materials && c.materials.length) || 0} 份</div></div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-sm" onClick={() => { setShowAddMaterialModal(true); setMaterialResults(null) }}>
              + 录入材料
            </button>
            {c.current_status === 'draft' && (
              <button className="btn btn-warning btn-sm" onClick={handleSubmit}>提交复核</button>
            )}
            {c.current_status === 'reviewing' && (
              <button className="btn btn-danger btn-sm" onClick={() => setShowRejectModal(true)}>退回补充</button>
            )}
            {c.current_status === 'supplementing' && (
              <button className="btn btn-warning btn-sm" onClick={handleResubmit}>再次提交复核</button>
            )}
            {(c.current_status === 'reviewing' || c.current_status === 'supplementing') && (
              <button className="btn btn-secondary btn-sm" onClick={() => setShowCloseModal(true)}>关闭归档</button>
            )}
            {isClosed && (
              <span style={{ fontSize: '13px', color: '#6b7280', alignSelf: 'center' }}>
                案例已关闭，仅允许追加：补充说明 / 附加照片 / 随访记录（部分成功机制）
              </span>
            )}
          </div>

          {materialResults && (
            <div className={'alert ' + (materialResults.success_count === materialResults.total ? 'alert-success' : (materialResults.success_count > 0 ? 'alert-warning' : 'alert-error'))}>
              <strong>材料提交结果：</strong> 成功 {materialResults.success_count} / 共 {materialResults.total}
              {materialResults.partial_success && ' （案例已关闭，部分类型允许追加）'}
              <div style={{ marginTop: '8px' }}>
                {materialResults.results.map((r, i) => (
                  <div key={i} className={'material-result ' + (r.success ? 'success' : 'fail')}>
                    {r.success ? 'OK' : 'FAIL'} {r.title}{!r.success && (' - ' + r.error)}
                  </div>
                ))}
              </div>
            </div>
          )}

          <h3 className="section-title">材料列表 ({(c.materials && c.materials.length) || 0})</h3>
          <div className="materials-list">
            {(!c.materials || c.materials.length === 0) ? (
              <div style={{ color: '#9ca3af', fontSize: '14px', gridColumn: '1 / -1', padding: '20px' }}>暂无材料</div>
            ) : (
              c.materials.map(m => (
                <div key={m.id} className={'material-item ' + (m.part_of_closed_case ? 'partial-closed' : '')}>
                  <span className="material-type-tag">{MATERIAL_TYPE_LABELS[m.material_type] || m.material_type}</span>
                  <div className="material-title">{m.title}</div>
                  {m.content && <div style={{ fontSize: '13px', color: '#4b5563' }}>{m.content}</div>}
                  {m.file_name && <div style={{ fontSize: '12px', color: '#667eea', marginTop: '4px' }}> {m.file_name}</div>}
                  <div className="material-meta">
                    <span>{m.uploaded_by || '未记录操作人'}</span>
                    <span>{m.created_at && m.created_at.slice(0, 16)}</span>
                  </div>
                  {m.part_of_closed_case === 1 && (
                    <div style={{ fontSize: '11px', color: '#d97706', marginTop: '6px' }}>已关闭后追加</div>
                  )}
                </div>
              ))
            )}
          </div>

          <h3 className="section-title">时间线 ({(c.events && c.events.length) || 0})</h3>
          <div className="timeline">
            {(!c.events || c.events.length === 0) ? (
              <div style={{ color: '#9ca3af', fontSize: '14px' }}>暂无时间线记录</div>
            ) : (
              c.events.map(e => (
                <div key={e.id} className={'timeline-item type-' + e.event_type}>
                  <div className="timeline-content">
                    <div className="timeline-title">
                      <span>{(EVENT_TYPE_LABELS[e.event_type] || e.event_type) + '：' + e.event_title}</span>
                      <span className="timeline-time">{e.created_at && e.created_at.slice(0, 16)}</span>
                    </div>
                    {e.description && <div className="timeline-desc">{e.description}</div>}
                    <div className="timeline-operator">
                      <span>{e.operator_name || '未记录操作人'}</span>
                      {e.status_before && e.status_after && (
                        <span style={{ color: '#9ca3af' }}>
                          {STATUS_LABELS[e.status_before] + ' -> ' + STATUS_LABELS[e.status_after]}
                        </span>
                      )}
                      {e.operator_missing === 1 && (
                        <span className="operator-missing">操作人缺失（主管复查）</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="audit-section">
            <h3 className="section-title">审计记录 ({(c.audits && c.audits.length) || 0})
              <span style={{ fontSize: '13px', fontWeight: 'normal', marginLeft: '10px', color: '#6b7280' }}>
                即使找不到处理人，审计记录也会保留，方便主管复查
              </span>
            </h3>
            {(!c.audits || c.audits.length === 0) ? (
              <div style={{ color: '#9ca3af', fontSize: '14px' }}>暂无审计记录</div>
            ) : (
              c.audits.map(a => (
                <div key={a.id} className={'audit-item ' + (a.operator_missing === 1 ? 'missing-op' : '')}>
                  <div>
                    <strong>{EVENT_TYPE_LABELS[a.action] || a.action}</strong>
                    {a.detail && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '3px' }}>{a.detail}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {a.operator_name || a.operator_id || (a.operator_missing === 1 ? '操作人缺失' : '-')}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '3px' }}>{a.created_at && a.created_at.slice(0, 16)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </>
    )
  }

  const renderCreateModal = () => (
    <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>新建睡眠观察案例</h3>

        <div className="form-row">
          <div className="form-group">
            <label>宝宝姓名*</label>
            <input className="input" value={newCase.baby_name} onChange={e => setNewCase({ ...newCase, baby_name: e.target.value })} placeholder="如：小宝" />
          </div>
          <div className="form-group">
            <label>月龄</label>
            <input className="input" type="number" value={newCase.baby_age_months} onChange={e => setNewCase({ ...newCase, baby_age_months: e.target.value })} placeholder="如：6" />
          </div>
        </div>

        <div className="form-group">
          <label>家长手机号*</label>
          <input className="input" value={newCase.parent_phone} onChange={e => setNewCase({ ...newCase, parent_phone: e.target.value })} placeholder="如：13800138001" />
        </div>

        <div className="form-group">
          <label>门店</label>
          <input className="input" value={newCase.store_name} onChange={e => setNewCase({ ...newCase, store_name: e.target.value })} placeholder="如：爱婴坊朝阳店" />
        </div>

        <div className="form-group">
          <label>操作人姓名（可不填触发无处理人审计）</label>
          <input className="input" value={newCase.operator_name} onChange={e => setNewCase({ ...newCase, operator_name: e.target.value })} placeholder="留空则记录为操作人缺失" />
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>取消</button>
          <button className="btn btn-primary" onClick={handleCreateCase}>创建案例</button>
        </div>
      </div>
    </div>
  )

  const renderAddMaterialModal = () => (
    <div className="modal-overlay" onClick={() => setShowAddMaterialModal(false)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>录入材料</h3>

        {caseDetail && caseDetail.current_status === 'closed' && (
          <div className="alert alert-warning">
            当前案例已关闭，仅允许追加：补充说明 / 附加照片 / 随访记录，其他类型会被拒绝（部分成功机制）
          </div>
        )}

        {newMaterials.map((m, idx) => (
          <div key={idx} className="material-entry">
            <div className="material-entry-header">
              <strong>材料 {idx + 1}</strong>
              {newMaterials.length > 1 && (
                <button className="btn btn-danger btn-sm" onClick={() => removeMaterialEntry(idx)}>删除</button>
              )}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>类型*</label>
                <select className="select" value={m.material_type} onChange={e => updateMaterialEntry(idx, 'material_type', e.target.value)}>
                  {Object.entries(MATERIAL_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>标题*</label>
                <input className="input" value={m.title} onChange={e => updateMaterialEntry(idx, 'title', e.target.value)} placeholder="材料标题" />
              </div>
            </div>
            <div className="form-group">
              <label>内容</label>
              <textarea className="textarea" value={m.content} onChange={e => updateMaterialEntry(idx, 'content', e.target.value)} placeholder="材料详细内容" />
            </div>
            <div className="form-group">
              <label>文件名（可选）</label>
              <input className="input" value={m.file_name} onChange={e => updateMaterialEntry(idx, 'file_name', e.target.value)} placeholder="如：sleep_log_001.pdf" />
            </div>
          </div>
        ))}

        <button className="add-material-btn" onClick={addMaterialEntry}>+ 再添加一份材料</button>

        <div className="form-group" style={{ marginTop: '16px' }}>
          <label>操作人姓名（可不填触发无处理人审计）</label>
          <input className="input" value={materialOperatorName} onChange={e => setMaterialOperatorName(e.target.value)} placeholder="留空则记录为操作人缺失" />
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={() => { setShowAddMaterialModal(false); setMaterialResults(null) }}>取消</button>
          <button className="btn btn-primary" onClick={handleAddMaterial}>提交材料</button>
        </div>
      </div>
    </div>
  )

  const renderRejectModal = () => (
    <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>退回补充</h3>

        <div className="form-group">
          <label>退回原因*</label>
          <textarea className="textarea" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="请详细说明需要补充的内容..." />
        </div>

        <div className="form-group">
          <label>操作人姓名（可不填触发无处理人审计）</label>
          <input className="input" value={rejectOperatorName} onChange={e => setRejectOperatorName(e.target.value)} placeholder="留空则记录为操作人缺失" />
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={() => setShowRejectModal(false)}>取消</button>
          <button className="btn btn-danger" onClick={handleReject}>确认退回</button>
        </div>
      </div>
    </div>
  )

  const renderCloseModal = () => (
    <div className="modal-overlay" onClick={() => setShowCloseModal(false)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>关闭归档</h3>

        <div className="form-group">
          <label>处理结论</label>
          <textarea className="textarea" value={closeConclusion} onChange={e => setCloseConclusion(e.target.value)} placeholder="简要说明处理结论和跟进建议（可选）" />
        </div>

        <div className="form-group">
          <label>操作人姓名（可不填触发无处理人审计）</label>
          <input className="input" value={closeOperatorName} onChange={e => setCloseOperatorName(e.target.value)} placeholder="留空则记录为操作人缺失" />
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={() => setShowCloseModal(false)}>取消</button>
          <button className="btn btn-success" onClick={handleClose}>确认关闭归档</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="app">
      <div className="header">
        <h1>婴幼儿睡眠观察复核墙</h1>
        <p>门店售后版 - 时间线贯穿：录入材料 -> 提交复核 -> 退回补充 -> 关闭归档 -> 导出</p>
      </div>

      {message && (
        <div className={'alert alert-' + message.type}>{message.text}</div>
      )}

      {!selectedCase ? renderList() : renderDetail()}

      {showCreateModal && renderCreateModal()}
      {showAddMaterialModal && renderAddMaterialModal()}
      {showRejectModal && renderRejectModal()}
      {showCloseModal && renderCloseModal()}
    </div>
  )
}

export default App
