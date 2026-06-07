import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import http from '../http.js'

export default function SupervisorDashboard() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('records')
  const [records, setRecords] = useState([])
  const [logs, setLogs] = useState([])

  async function load() {
    const { data: rd } = await http.get('/records')
    setRecords(rd.records)
    const { data: ad } = await http.get('/audit-logs')
    setLogs(ad.logs)
  }
  useEffect(() => { load() }, [])

  const STATUS_NAME = { draft: '草稿', reviewing: '复核中', returned: '退回补充', archived: '已归档' }

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
      alert('导出失败')
    }
  }

  return (
    <div className="container">
      <div className="tabs">
        <button className={tab === 'records' ? 'active' : ''} onClick={() => setTab('records')}>全部观察记录（{records.length}）</button>
        <button className={tab === 'audit' ? 'active' : ''} onClick={() => setTab('audit')}>审计日志（{logs.length}）</button>
        <button style={{ marginLeft: 'auto' }} className="btn secondary" onClick={doExport}>导出全部 Excel</button>
      </div>

      {tab === 'records' && (
        <div className="card">
          <table>
            <thead><tr><th>ID</th><th>标题</th><th>宝宝</th><th>班级</th><th>顾问</th><th>状态</th><th>更新时间</th><th>操作</th></tr></thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id}>
                  <td>{r.id}</td><td>{r.title}</td><td>{r.baby_name}</td><td>{r.class_name}</td>
                  <td>{r.consultant_name}</td>
                  <td><span className={`badge ${r.current_status}`}>{STATUS_NAME[r.current_status]}</span></td>
                  <td>{r.updated_at}</td>
                  <td><span className="link-btn" onClick={() => navigate(`/records/${r.id}`)}>查看时间线 →</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'audit' && (
        <div className="card">
          <p style={{ fontSize: 13, color: '#636e72', marginBottom: 12 }}>越权查看、数据访问、修改、导出等操作均自动记录。普通用户越权查看会被标记，方便主管复查。</p>
          <table className="audit-table">
            <thead>
              <tr><th>时间</th><th>用户</th><th>角色</th><th>操作</th><th>目标类型</th><th>目标ID</th><th>详情</th><th>IP</th></tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id}>
                  <td>{l.created_at}</td>
                  <td>{l.user_name}（{l.username}）</td>
                  <td>{l.role === 'consultant' ? '顾问' : l.role === 'parent' ? '家长' : '主管'}</td>
                  <td className={l.action.includes('unauthorized') ? 'action-unauth' : ''}>
                    {l.action.includes('unauthorized') ? '⚠️ ' : ''}
                    {l.action}
                  </td>
                  <td>{l.target_type}</td>
                  <td>{l.target_id}</td>
                  <td style={{ maxWidth: 300 }}>{l.detail || '-'}</td>
                  <td>{l.ip || '-'}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan="8" className="empty">暂无审计日志</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
