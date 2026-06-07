import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import http from '../http.js'

const STATUS_NAME = { draft: '草稿', reviewing: '复核中', returned: '退回补充', archived: '已归档' }

export default function ConsultantDashboard() {
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [babies, setBabies] = useState([])
  const [classes, setClasses] = useState([])
  const [filterStatus, setFilterStatus] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ baby_id: '', class_id: '', title: '', sleep_quality: '', sleep_duration: '', environment: '', materials: '' })
  const [msg, setMsg] = useState('')

  async function load() {
    const { data: rd } = await http.get('/records')
    setRecords(rd.records)
    const { data: bd } = await http.get('/babies')
    setBabies(bd.babies)
    const { data: cd } = await http.get('/classes')
    setClasses(cd.classes)
  }
  useEffect(() => { load() }, [])

  async function doExport() {
    try {
      const res = await http.get('/export', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `睡眠观察记录_${Date.now()}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      alert('导出失败：' + (e.response?.data?.error || e.message))
    }
  }

  async function createRecord(e) {
    e.preventDefault()
    try {
      const babyClass = await http.get('/baby-classes', { params: { baby_id: form.baby_id } })
      let bc = babyClass.data.baby_classes.find(bc => bc.class_id == form.class_id && bc.status === 'active')
      if (!bc) {
        const r = await http.post('/baby-classes', { baby_id: form.baby_id, class_id: form.class_id })
        bc = { id: r.data.id }
      }
      await http.post('/records', { ...form, baby_class_id: bc.id })
      setShowCreate(false)
      setForm({ baby_id: '', class_id: '', title: '', sleep_quality: '', sleep_duration: '', environment: '', materials: '' })
      setMsg('创建成功')
      setTimeout(() => setMsg(''), 2000)
      load()
    } catch (e) {
      setMsg(e.response?.data?.error || '创建失败')
    }
  }

  const filtered = records.filter(r => !filterStatus || r.current_status === filterStatus)

  return (
    <div className="container">
      <div className="card">
        <div className="toolbar">
          <h2 style={{ margin: 0 }}>观察记录列表</h2>
          <div className="filters">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">全部状态</option>
              {Object.entries(STATUS_NAME).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <button className="btn secondary" onClick={doExport}>导出 Excel</button>
            <button className="btn" onClick={() => setShowCreate(true)}>+ 新建记录</button>
          </div>
        </div>
        {msg && <div className="alert success">{msg}</div>}
        <table>
          <thead>
            <tr>
              <th>ID</th><th>标题</th><th>宝宝</th><th>班级</th><th>顾问</th><th>状态</th><th>更新时间</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? <tr><td colSpan="8" className="empty">暂无数据</td></tr> :
              filtered.map(r => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.title}</td>
                  <td>{r.baby_name}</td>
                  <td>{r.class_name}</td>
                  <td>{r.consultant_name}</td>
                  <td><span className={`badge ${r.current_status}`}>{STATUS_NAME[r.current_status]}</span></td>
                  <td>{r.updated_at}</td>
                  <td><span className="link-btn" onClick={() => navigate(`/records/${r.id}`)}>查看时间线 →</span></td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="modal-mask" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>新建观察记录</h3>
            <form onSubmit={createRecord}>
              <div className="form-row">
                <label>宝宝 *</label>
                <select value={form.baby_id} onChange={e => setForm({ ...form, baby_id: e.target.value })} required>
                  <option value="">请选择</option>
                  {babies.map(b => <option key={b.id} value={b.id}>{b.name}（{b.parent_name || '未绑定家长'}）</option>)}
                </select>
              </div>
              <div className="form-row">
                <label>班级 *</label>
                <select value={form.class_id} onChange={e => setForm({ ...form, class_id: e.target.value })} required>
                  <option value="">请选择</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-row"><label>观察标题 *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="如：小宝第1次睡眠观察" />
              </div>
              <div className="grid-2">
                <div className="form-row"><label>睡眠质量</label>
                  <select value={form.sleep_quality} onChange={e => setForm({ ...form, sleep_quality: e.target.value })}>
                    <option value="">请选择</option><option>优秀</option><option>良好</option><option>一般</option><option>较差</option>
                  </select>
                </div>
                <div className="form-row"><label>睡眠时长</label>
                  <input value={form.sleep_duration} onChange={e => setForm({ ...form, sleep_duration: e.target.value })} placeholder="如：每日14小时" />
                </div>
              </div>
              <div className="form-row"><label>睡眠环境</label>
                <input value={form.environment} onChange={e => setForm({ ...form, environment: e.target.value })} placeholder="如：安静、昏暗、温度适宜" />
              </div>
              <div className="form-row"><label>已录入材料</label>
                <textarea value={form.materials} onChange={e => setForm({ ...form, materials: e.target.value })} placeholder="材料名称、附件描述等" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn secondary" onClick={() => setShowCreate(false)}>取消</button>
                <button type="submit" className="btn">创建（草稿）</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
