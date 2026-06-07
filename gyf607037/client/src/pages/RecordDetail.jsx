import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import http, { getCurrentUser } from '../http.js'

const STATUS_NAME = { draft: '草稿', reviewing: '复核中', returned: '退回补充', archived: '已归档' }

export default function RecordDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [data, setData] = useState(null)
  const [classes, setClasses] = useState([])
  const [tab, setTab] = useState('timeline')
  const [err, setErr] = useState('')
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [showNote, setShowNote] = useState(false)
  const [noteForm, setNoteForm] = useState({ content: '', is_promise: false })
  const [showReturn, setShowReturn] = useState(false)
  const [returnForm, setReturnForm] = useState({ reason: '', required_fields: '' })
  const [showTransfer, setShowTransfer] = useState(false)
  const [transferClass, setTransferClass] = useState('')
  const [msg, setMsg] = useState('')

  async function load() {
    try {
      const { data: rd } = await http.get(`/records/${id}`)
      setData(rd)
      setEditForm({ title: rd.record.title, sleep_quality: rd.record.sleep_quality || '', sleep_duration: rd.record.sleep_duration || '', environment: rd.record.environment || '', materials: rd.record.materials || '' })
      const { data: cd } = await http.get('/classes')
      setClasses(cd.classes)
    } catch (e) {
      setErr(e.response?.data?.error || '加载失败')
    }
  }
  useEffect(() => { load() }, [id])

  async function saveEdit() {
    try {
      await http.put(`/records/${id}`, editForm)
      setEditing(false)
      setMsg('已保存修改')
      setTimeout(() => setMsg(''), 1500)
      load()
    } catch (e) {
      setMsg(e.response?.data?.error || '保存失败')
    }
  }

  async function submitReview() {
    const comment = prompt('提交复核意见（可选）：') || '提交复核'
    try {
      await http.post(`/records/${id}/submit`, { comment })
      setMsg('已提交复核')
      setTimeout(() => setMsg(''), 1500)
      load()
    } catch (e) { alert(e.response?.data?.error || '操作失败') }
  }

  async function archive() {
    if (!confirm('确认复核通过并归档？归档后不可修改。')) return
    try {
      await http.post(`/records/${id}/archive`, {})
      setMsg('已归档')
      setTimeout(() => setMsg(''), 1500)
      load()
    } catch (e) { alert(e.response?.data?.error || '操作失败') }
  }

  async function doReturn() {
    try {
      await http.post(`/records/${id}/return`, returnForm)
      setShowReturn(false)
      setReturnForm({ reason: '', required_fields: '' })
      setMsg('已退回补充')
      setTimeout(() => setMsg(''), 1500)
      load()
    } catch (e) { alert(e.response?.data?.error || '操作失败') }
  }

  async function addNote() {
    if (!noteForm.content) return
    try {
      await http.post(`/records/${id}/notes`, noteForm)
      setShowNote(false)
      setNoteForm({ content: '', is_promise: false })
      load()
    } catch (e) { alert(e.response?.data?.error || '操作失败') }
  }

  async function doTransfer() {
    if (!transferClass) return
    try {
      const r = await http.post(`/records/${id}/transfer`, { to_class_id: Number(transferClass), record_id: Number(id) })
      setShowTransfer(false)
      setTransferClass('')
      alert(r.data.partial_success ? '换班部分成功，请核查原班级状态' : '换班成功')
      load()
    } catch (e) { alert(e.response?.data?.error || '操作失败') }
  }

  if (err) return <div className="container"><div className="card"><div className="alert error">{err}</div><button className="btn secondary" onClick={() => navigate(-1)}>返回</button></div></div>
  if (!data) return <div className="container"><div className="card">加载中...</div></div>

  const { record, timeline, notes, returns } = data
  const canEdit = user.role === 'consultant' && record.consultant_id === user.id && record.current_status !== 'archived'
  const canSubmit = canEdit && (record.current_status === 'draft' || record.current_status === 'returned')
  const canReturn = (user.role === 'consultant' || user.role === 'supervisor') && record.current_status === 'reviewing'
  const canArchive = (user.role === 'consultant' || user.role === 'supervisor') && record.current_status === 'reviewing'
  const canTransfer = (user.role === 'consultant' || user.role === 'supervisor') && record.current_status !== 'archived'
  const isParentView = user.role === 'parent'

  return (
    <div className="container">
      <button className="btn secondary" style={{ marginBottom: 14 }} onClick={() => navigate(-1)}>← 返回</button>
      {msg && <div className="alert success">{msg}</div>}

      <div className="card">
        <div className="toolbar">
          <h2 style={{ margin: 0 }}>{record.title} <span className={`badge ${record.current_status}`}>{STATUS_NAME[record.current_status]}</span></h2>
          <div className="filters">
            {!isParentView && canEdit && <button className="btn secondary" onClick={() => setEditing(!editing)}>{editing ? '取消编辑' : '编辑内容'}</button>}
            {!isParentView && canSubmit && <button className="btn" onClick={submitReview}>提交复核</button>}
            {!isParentView && canReturn && <button className="btn warning" onClick={() => setShowReturn(true)}>退回补充</button>}
            {!isParentView && canArchive && <button className="btn success" onClick={archive}>复核通过并归档</button>}
            {!isParentView && canTransfer && <button className="btn secondary" onClick={() => setShowTransfer(true)}>换班</button>}
            {!isParentView && <button className="btn secondary" onClick={() => setShowNote(true)}>+ 备注/承诺</button>}
          </div>
        </div>

        {editing ? (
          <div>
            <div className="form-row"><label>标题</label><input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} /></div>
            <div className="grid-2">
              <div className="form-row"><label>睡眠质量</label>
                <select value={editForm.sleep_quality} onChange={e => setEditForm({ ...editForm, sleep_quality: e.target.value })}>
                  <option value="">请选择</option><option>优秀</option><option>良好</option><option>一般</option><option>较差</option>
                </select>
              </div>
              <div className="form-row"><label>睡眠时长</label><input value={editForm.sleep_duration} onChange={e => setEditForm({ ...editForm, sleep_duration: e.target.value })} /></div>
            </div>
            <div className="form-row"><label>睡眠环境</label><input value={editForm.environment} onChange={e => setEditForm({ ...editForm, environment: e.target.value })} /></div>
            <div className="form-row"><label>材料</label><textarea value={editForm.materials} onChange={e => setEditForm({ ...editForm, materials: e.target.value })} /></div>
            <button className="btn" onClick={saveEdit}>保存修改</button>
          </div>
        ) : (
          <div className="record-info">
            <div className="grid-2">
              <p><strong>宝宝：</strong>{record.baby_name}（{record.gender || '-'}，{record.birthday || '-'}）</p>
              <p><strong>家长：</strong>{record.parent_name || '-'}</p>
              <p><strong>班级：</strong>{record.class_name}（{record.enrollment_status === 'active' ? '在读' : record.enrollment_status === 'transferred' ? '已转班' : '已退班'}）</p>
              <p><strong>顾问：</strong>{record.consultant_name}</p>
              <p><strong>睡眠质量：</strong>{record.sleep_quality || '-'}</p>
              <p><strong>睡眠时长：</strong>{record.sleep_duration || '-'}</p>
              <p><strong>睡眠环境：</strong>{record.environment || '-'}</p>
              <p><strong>创建时间：</strong>{record.created_at}</p>
            </div>
            <p style={{ marginTop: 10 }}><strong>已录入材料：</strong><br />{record.materials || '-'}</p>
          </div>
        )}
      </div>

      {!isParentView && (
        <div className="tabs">
          <button className={tab === 'timeline' ? 'active' : ''} onClick={() => setTab('timeline')}>时间线（{timeline.length}）</button>
          <button className={tab === 'notes' ? 'active' : ''} onClick={() => setTab('notes')}>承诺/备注（{notes.length}）</button>
          {returns.length > 0 && <button className={tab === 'returns' ? 'active' : ''} onClick={() => setTab('returns')}>退回记录（{returns.length}）</button>}
        </div>
      )}

      {(tab === 'timeline' || isParentView) && (
        <div className="card">
          <div className="section-title">处理时间线 {isParentView && <span style={{ fontSize: 12, color: '#b2bec3', marginLeft: 8 }}>（家长端仅展示最终结果）</span>}</div>
          <div className="timeline">
            {(isParentView ? timeline.filter(t => t.action === 'archive') : timeline).map(t => (
              <div key={t.id} className={`timeline-item ${t.action === 'note_add' && t.content.includes('承诺') ? 'promise' : t.action === 'note_add' ? 'note' : ''}`}>
                <div className="time">{t.created_at}</div>
                <div className="actor">{t.actor_name}（{t.actor_role === 'consultant' ? '顾问' : t.actor_role === 'supervisor' ? '主管' : '家长'}）</div>
                <div className="content">
                  {t.action === 'create' && '📝 '}
                  {t.action === 'edit' && '✏️ '}
                  {t.action === 'submit' && '➡️ '}
                  {t.action === 'return' && '↩️ '}
                  {t.action === 'archive' && '✅ '}
                  {t.action === 'transfer' && '🔄 '}
                  {t.action === 'note_add' && (t.content.includes('承诺') ? '🔴 ' : '💬 ')}
                  {t.content}
                  {(t.from_status || t.to_status) && !isParentView && (
                    <div style={{ marginTop: 4, fontSize: 12, color: '#b2bec3' }}>
                      状态：{t.from_status ? STATUS_NAME[t.from_status] : '-'} → {STATUS_NAME[t.to_status]}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {timeline.length === 0 && <div className="empty">暂无时间线记录</div>}
          </div>
        </div>
      )}

      {tab === 'notes' && !isParentView && (
        <div className="card">
          <div className="section-title">承诺与备注（承诺不可覆盖，永久留痕）</div>
          {notes.length === 0 ? <div className="empty">暂无记录</div> :
            notes.map(n => (
              <div key={n.id} className="note-item">
                <div className="meta">
                  {n.is_promise && <span className="promise-tag">承诺</span>}
                  {n.author_name}（{n.author_role === 'consultant' ? '顾问' : '主管'}） · {n.created_at}
                </div>
                <div style={{ fontSize: 14 }}>{n.content}</div>
              </div>
            ))
          }
        </div>
      )}

      {tab === 'returns' && !isParentView && (
        <div className="card">
          <div className="section-title">退回补充记录</div>
          {returns.map(r => (
            <div key={r.id} className="note-item">
              <div className="meta">{r.requester_name} · {r.created_at}</div>
              <div style={{ fontSize: 14, marginBottom: 6 }}><strong>原因：</strong>{r.reason}</div>
              {r.required_fields && <div style={{ fontSize: 13, color: '#636e72' }}><strong>需补充：</strong>{r.required_fields}</div>}
            </div>
          ))}
        </div>
      )}

      {showNote && (
        <div className="modal-mask" onClick={() => setShowNote(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>新增备注 / 承诺</h3>
            <div className="alert info" style={{ fontSize: 13 }}>提示：承诺会被标记并永久留痕，后续状态变更不会覆盖。家长临时改口时请新建备注，原来的承诺保留在历史中。</div>
            <div className="form-row"><label>内容 *</label>
              <textarea value={noteForm.content} onChange={e => setNoteForm({ ...noteForm, content: e.target.value })} placeholder="例如：家长临时改口：本周先不调整作息..." required />
            </div>
            <div className="form-row" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="is_promise" checked={noteForm.is_promise} onChange={e => setNoteForm({ ...noteForm, is_promise: e.target.checked })} />
              <label htmlFor="is_promise" style={{ margin: 0 }}>标记为承诺（永久留痕）</label>
            </div>
            <div className="modal-actions">
              <button className="btn secondary" onClick={() => setShowNote(false)}>取消</button>
              <button className="btn" onClick={addNote}>添加</button>
            </div>
          </div>
        </div>
      )}

      {showReturn && (
        <div className="modal-mask" onClick={() => setShowReturn(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>退回补充</h3>
            <div className="form-row"><label>退回原因 *</label>
              <textarea value={returnForm.reason} onChange={e => setReturnForm({ ...returnForm, reason: e.target.value })} required placeholder="例如：缺少详细的睡眠观察记录表" />
            </div>
            <div className="form-row"><label>需补充字段（可选）</label>
              <input value={returnForm.required_fields} onChange={e => setReturnForm({ ...returnForm, required_fields: e.target.value })} placeholder="例如：睡眠质量、睡眠环境照片、家长签字扫描件" />
            </div>
            <div className="modal-actions">
              <button className="btn secondary" onClick={() => setShowReturn(false)}>取消</button>
              <button className="btn danger" onClick={doReturn}>确认退回</button>
            </div>
          </div>
        </div>
      )}

      {showTransfer && (
        <div className="modal-mask" onClick={() => setShowTransfer(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>跨班换班</h3>
            <div className="alert info" style={{ fontSize: 13 }}>同一宝宝跨班时允许部分成功，系统会保留原班级关联，异常情况需主管核查。</div>
            <div className="form-row"><label>目标班级</label>
              <select value={transferClass} onChange={e => setTransferClass(e.target.value)}>
                <option value="">请选择</option>
                {classes.filter(c => c.id !== record.class_id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn secondary" onClick={() => setShowTransfer(false)}>取消</button>
              <button className="btn" onClick={doTransfer}>确认换班</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
